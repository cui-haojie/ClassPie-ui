<script setup lang="js" name="mainClass">
import {RouterView, useRoute, useRouter} from "vue-router";
import {storeToRefs} from "pinia";
import {useAccountStore} from "@/stores/account.js";
import {computed, onMounted, ref, watch} from "vue";
import request from "@/utils/request.js";
import UserAvatar from '@/components/UserAvatar.vue';
import {formatDateTime} from '@/utils/homeworkDeadline.js';

const accountStore = useAccountStore();
const {account, avatarUrl, name} = storeToRefs(accountStore);
const router = useRouter();
const route = useRoute();

const showNotifications = ref(false);
const showUserMenu = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);
const subPageTitle = ref('');
const parentCourseTitle = ref('');

const navItems = computed(() => {
  const items = [{ label: '我的课堂', name: 'mainInterface' }];
  if (route.name === 'userSetting') {
    items.push({ label: '个人设置', name: 'userSetting' });
  }
  return items;
});

function closePanels() {
  showNotifications.value = false;
  showUserMenu.value = false;
}

function openUserMenu() {
  showUserMenu.value = true;
  showNotifications.value = false;
}

function closeUserMenu() {
  showUserMenu.value = false;
}

function isNavActive(name) {
  if (name === 'mainInterface') {
    return ['mainInterface', 'courseContent', 'homeworkContent'].includes(route.name);
  }
  return route.name === name;
}

function goHome() {
  closePanels();
  if (route.name !== 'mainInterface') {
    router.push({ name: 'mainInterface' });
  }
}

function goUserSetting() {
  closePanels();
  router.push({ name: 'userSetting' });
}

function goNav(name) {
  closePanels();
  if (route.name !== name) {
    router.push({ name });
  }
}

function goCourseFromBreadcrumb() {
  closePanels();
  const classId = route.query.classId || route.query.id;
  if (!classId) {
    goHome();
    return;
  }
  router.push({ name: 'courseContent', query: { id: classId } });
}

function logout() {
  accountStore.logout();
  showUserMenu.value = false;
  sessionStorage.setItem('freshLogin', '1');
  router.push({ name: 'login' });
}

function loadNotificationCount() {
  if (!account.value) return;
  request.post('/editor/notificationCount', { account: account.value })
      .then(res => { unreadCount.value = res || 0; });
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value;
  showUserMenu.value = false;
  if (showNotifications.value) {
    request.post('/editor/notifications', { account: account.value })
        .then(res => {
          notifications.value = Array.isArray(res) ? res : [];
          loadNotificationCount();
        });
  }
}

function readNotification(item) {
  request.put('/editor/readNotification', { id: item.id, account: account.value })
      .then(() => {
        item.is_read = true;
        loadNotificationCount();
      });
}

function openNotification(item) {
  readNotification(item);
  if (item.homework_id && item.class_id) {
    closePanels();
    const target = {
      name: 'homeworkContent',
      params: { id: String(item.homework_id) },
      query: { classId: String(item.class_id) },
    };
    const sameHomework = route.name === 'homeworkContent'
        && String(route.params.id) === String(item.homework_id)
        && String(route.query.classId || '') === String(item.class_id);
    if (sameHomework) return;
    router.push(target).catch(() => {
      router.replace(target);
    });
    return;
  }
  if (item.class_id) {
    closePanels();
    const query = { id: String(item.class_id) };
    if (item.type === 'announcement') {
      query.section = 'announcement';
    }
    router.push({ name: 'courseContent', query });
  }
}

function loadSubPageTitles() {
  subPageTitle.value = '';
  parentCourseTitle.value = '';

  if (route.name === 'courseContent' && route.query.id) {
    request.post('/editor/getCourseById', { id: route.query.id })
        .then(res => {
          subPageTitle.value = res?.class_name || '课程详情';
        })
        .catch(() => {
          subPageTitle.value = '课程详情';
        });
    return;
  }

  if (route.name === 'homeworkContent') {
    const classId = route.query.classId;
    const homeworkId = route.params.id;
    if (classId) {
      request.post('/editor/getCourseById', { id: classId })
          .then(res => {
            parentCourseTitle.value = res?.class_name || '课程详情';
          })
          .catch(() => {
            parentCourseTitle.value = '课程详情';
          });
    }
    if (homeworkId) {
      request.post('/editor/getHomeworkById', { homework_id: Number(homeworkId) })
          .then(res => {
            subPageTitle.value = res?.name || '作业详情';
          })
          .catch(() => {
            subPageTitle.value = '作业详情';
          });
    }
  }
}

const breadcrumbs = computed(() => {
  if (route.name === 'courseContent') {
    return [{ label: subPageTitle.value || '课程详情', current: true }];
  }
  if (route.name === 'homeworkContent') {
    const items = [];
    if (parentCourseTitle.value) {
      items.push({ label: parentCourseTitle.value, action: goCourseFromBreadcrumb });
    }
    items.push({ label: subPageTitle.value || '作业详情', current: true });
    return items;
  }
  return [];
});

watch(
    () => [route.name, route.query.id, route.query.classId, route.params.id],
    loadSubPageTitles,
    { immediate: true }
);

onMounted(() => {
  loadNotificationCount();
  loadProfile();
});

function loadProfile() {
  if (!account.value) return;
  request.post('/editor/account', { account: account.value })
      .then(res => {
        if (res?.account) {
          accountStore.setAvatarUrl(res.avatar_url || null);
          accountStore.setName(res.name || null);
        }
      })
      .catch(() => {});
}
</script>

<template>
  <div class="main-class-page">
    <header class="leader">
      <img
          src="../assets/newClassPi.png"
          class="logo"
          alt="ClassPi"
          @click="goHome"
      >

      <nav class="nav-tabs">
        <button
            v-for="item in navItems"
            :key="item.name"
            type="button"
            class="nav-tab"
            :class="{ active: isNavActive(item.name) }"
            @click="goNav(item.name)"
        >
          {{ item.label }}
        </button>
      </nav>

      <nav v-if="breadcrumbs.length" class="breadcrumb" aria-label="页面路径">
        <template v-for="(crumb, index) in breadcrumbs" :key="index">
          <span v-if="index > 0" class="breadcrumb-sep">/</span>
          <button
              v-if="crumb.action"
              type="button"
              class="breadcrumb-link"
              @click="crumb.action"
          >
            {{ crumb.label }}
          </button>
          <span v-else class="breadcrumb-current">{{ crumb.label }}</span>
        </template>
      </nav>

      <div class="leader-spacer"></div>

      <div class="leader_container">
        <div class="content content-muted" style="width: 80px">AI工具集</div>
        <div class="content content-muted"><i class="iconfont icon-chazhong"></i>论文查重</div>
        <div class="content content-muted"><i class="iconfont icon-renwubiao"></i>任务管理</div>
        <div class="content notify-wrap" style="width: 30px;" @click="toggleNotifications">
          <i class="iconfont icon-lingdang-xianxing"></i>
          <span v-if="unreadCount > 0" class="notify-badge">{{ unreadCount }}</span>
        </div>
        <div
            class="avatar-menu-wrap"
            :class="{ 'is-open': showUserMenu }"
            @mouseenter="openUserMenu"
            @mouseleave="closeUserMenu"
        >
          <div class="avatar-wrap">
            <UserAvatar :avatar-url="avatarUrl" :name="name" :account="account" :size="40" />
          </div>
          <div v-show="showUserMenu" class="user-dropdown">
            <ul class="user-dropdown-list">
              <li>开通VIP</li>
              <li>账号容量</li>
              <li>机构用户认证</li>
              <li @click="goUserSetting">个人设置</li>
              <li @click="logout">退出登陆</li>
            </ul>
          </div>
        </div>
      </div>

      <div v-if="showNotifications" class="notify-panel">
        <div class="notify-title">消息通知</div>
        <div v-if="notifications.length === 0" class="notify-empty">暂无通知</div>
        <div
            v-for="item in notifications"
            :key="item.id"
            class="notify-item"
            :class="{ unread: !item.is_read, clickable: item.homework_id || item.class_id }"
            @click="openNotification(item)"
        >
          <div>{{ item.message }}</div>
          <div class="notify-time">
            {{ formatDateTime(item.create_time) }}
            <span v-if="item.homework_id" class="notify-link-hint">点击查看作业</span>
          </div>
        </div>
      </div>
    </header>

    <div class="main-content">
      <RouterView/>
    </div>
  </div>
</template>

<style scoped>
.logo {
  height: 37px;
  width: 147px;
  cursor: pointer;
  flex-shrink: 0;
}

.main-class-page {
  background-color: #FFFFFF;
  min-height: 100vh;
}

.main-content {
  padding-top: 83px;
}

.leader-spacer {
  flex: 1;
  min-width: 12px;
}

.nav-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 28px;
  flex-shrink: 0;
}

.nav-tab {
  height: 83px;
  padding: 0 18px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  font: 500 20px/83px Roboto, Helvetica, Arial, sans-serif;
  color: #303133;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
}

.nav-tab:hover {
  color: rgb(72, 138, 248);
}

.nav-tab.active {
  color: rgb(72, 138, 248);
  border-bottom-color: rgb(72, 138, 248);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 20px;
  min-width: 0;
  max-width: 360px;
  overflow: hidden;
  flex-shrink: 1;
}

.breadcrumb-sep {
  color: #c0c4cc;
  font-size: 14px;
}

.breadcrumb-link {
  border: none;
  background: none;
  padding: 0;
  font-size: 15px;
  color: rgb(72, 138, 248);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-current {
  font-size: 15px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.avatar-menu-wrap {
  position: relative;
  top: 15px;
  align-self: flex-start;
}

.avatar-menu-wrap.is-open::after {
  content: '';
  position: absolute;
  right: 0;
  top: 47px;
  width: 130px;
  height: 10px;
}

.avatar-wrap {
  cursor: pointer;
}

.avatar-img {
  width: 47px;
  height: 47px;
  border-radius: 50%;
  display: block;
}

.notify-wrap {
  position: relative;
}

.notify-badge {
  position: absolute;
  top: 18px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

.notify-panel {
  position: absolute;
  right: 70px;
  top: 55px;
  width: 320px;
  max-height: 420px;
  overflow-y: auto;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  z-index: 25;
  padding: 12px 0;
}

.notify-title {
  font-weight: 600;
  padding: 0 16px 12px;
  border-bottom: 1px solid #eee;
}

.notify-empty {
  padding: 24px 16px;
  color: #999;
}

.notify-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
}

.notify-item.unread {
  background: #f0f7ff;
}

.notify-item.clickable:hover {
  background: #eef2ff;
}

.notify-link-hint {
  margin-left: 8px;
  color: rgb(72, 138, 248);
}

.notify-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.user-dropdown {
  width: 130px;
  padding: 12px;
  position: absolute;
  right: 0;
  top: 57px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  background-color: #FFFFFF;
  z-index: 20;
  border-radius: 4px;
}

.user-dropdown-list {
  font-size: 14px;
  color: rgb(108, 110, 113);
  margin: 0;
  padding: 0;
}

.leader {
  display: flex;
  width: 100%;
  height: 83px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  align-items: center;
  position: fixed;
  z-index: 10;
  background-color: white;
  top: 0;
  left: 0;
  right: 0;
  padding: 0 calc(30px + 15px) 0 30px;
}

.leader_container {
  font-family: Roboto, Helvetica, Arial, sans-serif;
  height: 83px;
  font-size: 20px;
  line-height: 83px;
  display: flex;
  flex-shrink: 0;
}

.content {
  margin-right: 15px;
  cursor: pointer;
  width: 100px;
}

.content-muted {
  color: #909399;
  cursor: default;
}

.content:not(.content-muted):hover {
  color: rgb(72, 138, 248);
}

li {
  list-style-type: none;
  padding: 0 20px 0 12px;
  margin: 0 -12px;
  width: 128px;
  height: 30px;
  cursor: pointer;
  line-height: 30px;
}

li:hover {
  background-color: rgb(232, 240, 255);
}

@media (max-width: 1100px) {
  .content.content-muted {
    display: none;
  }

  .breadcrumb {
    max-width: 200px;
  }
}
</style>
