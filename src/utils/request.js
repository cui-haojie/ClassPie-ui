import axios from "axios"

const request = axios.create({
    baseURL: import.meta.env.DEV ? '/' : 'http://localhost:9090',
    timeout: 5000,
})

// request拦截器
// 可以自请求发送前对请求做一些处理
request.interceptors.request.use(config => {
    config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    return config;
}, error => {
    return Promise.reject(error);
});

//response 拦截器
//可以在接口响应后统一处理结果
request.interceptors.response.use(
    response => {
        let res = response.data;
        // 仅当响应是JSON字符串时才解析
        if (typeof res === 'string') {
            try {
                res = JSON.parse(res); // 尝试解析JSON
            } catch (e) {
                // 解析失败则保留原始字符串
                return res;
            }
        }
        return res;
    },
    error => {
        const status = error.response?.status
        if (status === 404) {
            alert('未找到请求接口')
            console.log("未找到请求接口")
        } else if (status === 500) {
            alert('系统异常，请检查后端控制台')
            console.log("系统异常，请检查后端控制台")
        } else if (!error.response) {
            alert('无法连接后端，请确认 ClassPiServer 已在 9090 端口启动')
            console.error(error)
        } else {
            console.error(error)
        }
        return Promise.reject(error);
    }
)

export default request;