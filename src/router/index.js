import { createRouter, createWebHistory } from 'vue-router'

import login from '@/views/login.vue'
import register from '@/views/register.vue'
import forget from '@/views/forget.vue'
import main from '@/views/main.vue'
import mainClass from "@/views/mainClass.vue";
import mainInterface from "@/views/mainInterface.vue";
import userSetting from "@/views/userSetting.vue"
import teacherClass from "@/views/teacherClass.vue";
import courseContent from "@/views/courseContent.vue";
import homeworkContent from "@/views/HomeworkContent.vue";
import ActivityContent from "@/views/ActivityContent.vue";
import {useAccountStore} from "@/stores/account.js";
import {unlockBodyScroll} from '@/utils/scrollLock.js';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'main',
      component: main,
    children: [{
      path: '/',
      name: 'login',
      component: login,
    },{
        path: '/forget',
        name: 'forget',
        component: forget,
      },{
        path: '/register',
        name: 'register',
        component: register,
    },{
        path: '/mainClass',
      name: 'mainClass',
      component: mainClass,
      children: [{
          path: '',
         name: 'mainInterface',
        component: mainInterface,
      },{
            path: '/userSetting',
            name: 'userSetting',
            component: userSetting,
      }
          ,{
              path:'/courseContent',
              name: 'courseContent',
              component: courseContent,
          },
          {
              path:'/homeworkContent/:id',
              name: 'homeworkContent',
              component: homeworkContent,
          },
          {
              path:'/activityContent/:id',
              name: 'activityContent',
              component: ActivityContent,
          }
      ]},
        {
            path:'/teacherClass',
            name: 'teacherClass',
            component: teacherClass,
        }
    ]
    },],
})

router.afterEach(() => {
  unlockBodyScroll()
})

router.beforeEach((to) => {
  const accountStore = useAccountStore()
  const publicPaths = ['login', 'register', 'forget', 'main']
  const needAuth = !publicPaths.includes(to.name)
  if (needAuth && !accountStore.account) {
    return { name: 'login' }
  }
  if ((to.name === 'login' || to.name === 'register' || to.name === 'forget') && accountStore.account) {
    return { name: 'mainClass' }
  }
})

export default router
