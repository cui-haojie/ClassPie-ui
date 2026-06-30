import axios from "axios"
import { toast } from '@/utils/toast.js'
import { useAccountStore } from '@/stores/account.js'
import router from '@/router/index.js'

const request = axios.create({
    baseURL: import.meta.env.DEV ? '/' : 'http://localhost:9090',
    timeout: 5000,
})

request.interceptors.request.use(config => {
    if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    }
    const accountStore = useAccountStore()
    const currentName = router.currentRoute.value.name
    const isPublicPage = ['homePage', 'login', 'register', 'forget'].includes(currentName)
    if (accountStore.token && !isPublicPage) {
        config.headers.Authorization = `Bearer ${accountStore.token}`
    }
    return config;
}, error => Promise.reject(error));

request.interceptors.response.use(
    response => {
        let res = response.data;
        if (typeof res === 'string') {
            try {
                res = JSON.parse(res);
            } catch (e) {
                return res;
            }
        }
        return res;
    },
    error => {
        const status = error.response?.status
        if (status === 401) {
            const accountStore = useAccountStore()
            const currentName = router.currentRoute.value.name
            const isPublicPage = ['homePage', 'login', 'register', 'forget'].includes(currentName)
            accountStore.logout()
            if (!isPublicPage) {
                toast.error('登录已过期，请重新登录')
                router.push({ name: 'login' })
            }
        } else if (status === 404) {
            const url = error.config?.url || ''
            if (url.includes('Prep') || url.includes('prep')) {
                toast.error('备课区接口未加载，请重启 ClassPiServer 后端后再试')
            } else {
                toast.error('未找到请求接口')
            }
        } else if (status === 500) {
            toast.error('系统异常，请检查后端控制台')
        } else if (!error.response) {
            toast.error('无法连接后端，请确认 ClassPiServer 已在 9090 端口启动')
        }
        return Promise.reject(error);
    }
)

export default request;
