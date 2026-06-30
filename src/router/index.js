import { createRouter, createWebHistory } from 'vue-router'

import login from '@/views/login.vue'
import register from '@/views/register.vue'
import forget from '@/views/forget.vue'
import mainClass from "@/views/mainClass.vue";
import mainInterface from "@/views/mainInterface.vue";
import userSetting from "@/views/userSetting.vue"
import teacherClass from "@/views/teacherClass.vue";
import courseContent from "@/views/courseContent.vue";
import homeworkContent from "@/views/HomeworkContent.vue";
import ActivityContent from "@/views/ActivityContent.vue";
import TestContent from "@/views/TestContent.vue";
import TestEditor from "@/views/TestEditor.vue";
import InteractionContent from "@/views/InteractionContent.vue";
import HomePage from '@/views/HomePage.vue';
import {useAccountStore} from "@/stores/account.js";
import {unlockBodyScroll} from '@/utils/scrollLock.js';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'homePage',
      component: HomePage,
    },
    {
      path: '/login',
      name: 'login',
      component: login,
    },
    {
      path: '/register',
      name: 'register',
      component: register,
    },
    {
      path: '/forget',
      name: 'forget',
      component: forget,
    },
    {
      path: '/mainClass',
      name: 'mainClass',
      component: mainClass,
      children: [{
        path: '',
        name: 'mainInterface',
        component: mainInterface,
      }, {
        path: '/userSetting',
        name: 'userSetting',
        component: userSetting,
      }, {
        path: '/courseContent',
        name: 'courseContent',
        component: courseContent,
      }, {
        path: '/homeworkContent/:id',
        name: 'homeworkContent',
        component: homeworkContent,
      }, {
        path: '/activityContent/:id',
        name: 'activityContent',
        component: ActivityContent,
      }, {
        path: '/testContent/:id',
        name: 'testContent',
        component: TestContent,
      }, {
        path: '/testEditor/:id',
        name: 'testEditor',
        component: TestEditor,
      }, {
        path: '/interactionContent/:id',
        name: 'interactionContent',
        component: InteractionContent,
      }, {
        path: '/liveClass',
        name: 'liveClass',
        component: () => import('@/views/LiveClass.vue'),
      }, {
        path: '/prepArea',
        name: 'prepArea',
        component: () => import('@/views/PrepArea.vue'),
      }],
    },
    {
      path: '/teacherClass',
      name: 'teacherClass',
      component: teacherClass,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'homePage' },
    },
  ],
})

router.afterEach(() => {
  unlockBodyScroll()
})

router.beforeEach((to) => {
  const accountStore = useAccountStore()
  const publicPaths = ['homePage', 'login', 'register', 'forget']
  const isLoggedIn = !!(accountStore.account && accountStore.token)
  const needAuth = !publicPaths.includes(to.name)
  if (needAuth && !isLoggedIn) {
    return { name: 'login' }
  }
  if (isLoggedIn && publicPaths.includes(to.name)) {
    return { name: 'mainClass' }
  }
})

export default router
