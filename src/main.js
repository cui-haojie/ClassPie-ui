

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/iconfont/iconfont.css'
import '@/iconfont/iconfont01.css'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';


import App from './App.vue'
import router from './router'
import '@/assets/modal.css'
import '@/assets/form.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate);

app.use(pinia)
app.use(router)

app.mount('#app')
