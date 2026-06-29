<script setup lang="js" name="mainClass">
import {RouterView, useRoute, useRouter} from "vue-router";
import {storeToRefs} from "pinia";
import {useAccountStore} from "@/stores/account.js";
import {computed, onMounted, onBeforeUnmount, ref, watch} from "vue";
import request from "@/utils/request.js";
import UserAvatar from '@/components/UserAvatar.vue';
import {formatDateTime} from '@/utils/homeworkDeadline.js';
import {toast} from '@/utils/toast.js';

const NOTIFY_TYPE_META = {
  homework: { label: '作业', icon: '作' },
  remind: { label: '催交', icon: '催' },
  announcement: { label: '公告', icon: '告' },
  topic: { label: '话题', icon: '话' },
  material: { label: '资料', icon: '资' },
  test: { label: '测试', icon: '测' },
  interaction: { label: '互动', icon: '互' },
  interaction_pick: { label: '点名', icon: '点' },
  attendance: { label: '签到', icon: '签' },
};

function isNotificationUnread(item) {
  return !item?.is_read || item.is_read === 0;
}

function notificationTypeMeta(item) {
  return NOTIFY_TYPE_META[item?.type] || { label: '通知', icon: '讯' };
}

function notificationLinkHint(item) {
  if (!item) return '';
  if (item.type === 'interaction' || item.type === 'interaction_pick') return '点击进入互动';
  if (item.type === 'attendance') return '点击去签到';
  if (item.type === 'test' && item.homework_id) return '点击进入测试';
  if ((item.type === 'announcement' || item.type === 'topic' || item.type === 'material') && item.homework_id) {
    return '点击查看详情';
  }
  if (item.homework_id) return '点击查看作业';
  if (item.class_id) return '点击进入课程';
  return '';
}

const accountStore = useAccountStore();
const {account, avatarUrl, name} = storeToRefs(accountStore);
const router = useRouter();
const route = useRoute();

const showNotifications = ref(false);
const showUserMenu = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);
let notificationPollTimer = null;
const subPageTitle = ref('');
const parentCourseTitle = ref('');

const hasUnreadNotifications = computed(() =>
    notifications.value.some(item => isNotificationUnread(item))
);


const isHomeActive = computed(() => route.name === 'mainInterface');

const headerCrumbs = computed(() => {
  if (route.name === 'userSetting') {
    return [{ label: '个人设置', current: true }];
  }
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
  if (route.name === 'activityContent') {
    const items = [];
    if (parentCourseTitle.value) {
      items.push({ label: parentCourseTitle.value, action: goCourseFromBreadcrumb });
    }
    items.push({ label: subPageTitle.value || '活动详情', current: true });
    return items;
  }
  if (route.name === 'testContent') {
    const items = [];
    if (parentCourseTitle.value) {
      items.push({ label: parentCourseTitle.value, action: goCourseFromBreadcrumb });
    }
    items.push({ label: subPageTitle.value || '测试答题', current: true });
    return items;
  }
  if (route.name === 'testEditor') {
    const items = [];
    if (parentCourseTitle.value) {
      items.push({ label: parentCourseTitle.value, action: goCourseFromBreadcrumb });
    }
    items.push({ label: subPageTitle.value || '编辑测试', current: true });
    return items;
  }
  if (route.name === 'interactionContent') {
    const items = [];
    if (parentCourseTitle.value) {
      items.push({ label: parentCourseTitle.value, action: goCourseFromBreadcrumb });
    }
    items.push({ label: subPageTitle.value || '课程互动', current: true });
    return items;
  }
  return [];
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

function goCourseFromBreadcrumb() {
  closePanels();
  const classId = route.query.classId || route.query.id;
  if (!classId) {
    goHome();
    return;
  }
  const query = { id: classId };
  if (route.name === 'activityContent' && route.query.type) {
    query.section = route.query.type;
  }
  if (route.name === 'testContent') {
    query.section = 'test';
  }
  if (route.name === 'testEditor') {
    query.section = 'test';
  }
  if (route.name === 'interactionContent') {
    query.section = 'interaction';
  }
  router.push({ name: 'courseContent', query });
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

function readNotification(item, options = {}) {
  const { silent = false } = options;
  if (!item?.id || !isNotificationUnread(item)) return Promise.resolve(true);
  return request.put('/editor/readNotification', { id: item.id, account: account.value })
      .then(ok => {
        if (ok) {
          item.is_read = 1;
          loadNotificationCount();
          if (!silent) toast.success('已标记为已读');
        }
        return ok;
      })
      .catch(() => {
        toast.error('标记已读失败');
        return false;
      });
}

function markAllNotificationsRead() {
  if (!hasUnreadNotifications.value) return;
  request.put('/editor/readAllNotifications', { account: account.value })
      .then(ok => {
        if (ok) {
          notifications.value.forEach(item => { item.is_read = 1; });
          unreadCount.value = 0;
          toast.success('已全部标记为已读');
        } else {
          toast.error('操作失败');
        }
      })
      .catch(() => toast.error('操作失败'));
}

function openNotification(item) {
  readNotification(item, { silent: true });
  if (item.homework_id && item.class_id && (item.type === 'interaction' || item.type === 'interaction_pick')) {
    closePanels();
    const target = {
      name: 'interactionContent',
      params: { id: String(item.homework_id) },
      query: { classId: String(item.class_id) },
    };
    const sameInteraction = route.name === 'interactionContent'
        && String(route.params.id) === String(item.homework_id)
        && String(route.query.classId || '') === String(item.class_id);
    if (sameInteraction) return;
    router.push(target).catch(() => {
      router.replace(target);
    });
    return;
  }
  if (item.type === 'test' && item.homework_id && item.class_id) {
    closePanels();
    router.push({
      name: 'testContent',
      params: { id: String(item.homework_id) },
      query: { classId: String(item.class_id) },
    });
    return;
  }
  if (item.homework_id && item.class_id && (item.type === 'announcement' || item.type === 'topic' || item.type === 'material')) {
    closePanels();
    router.push({
      name: 'activityContent',
      params: { id: String(item.homework_id) },
      query: { classId: String(item.class_id), type: item.type },
    });
    return;
  }
  if (item.type === 'attendance' && item.class_id) {
    closePanels();
    router.push({ name: 'liveClass', query: { id: String(item.class_id) } });
    return;
  }
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
    if (item.type === 'topic') {
      query.section = 'topic';
    }
    if (item.type === 'material') {
      query.section = 'material';
    }
    if (item.type === 'test') {
      query.section = 'test';
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
    return;
  }

  if (route.name === 'activityContent') {
    const classId = route.query.classId;
    const activityId = route.params.id;
    if (classId) {
      request.post('/editor/getCourseById', { id: classId })
          .then(res => {
            parentCourseTitle.value = res?.class_name || '课程详情';
          })
          .catch(() => {
            parentCourseTitle.value = '课程详情';
          });
    }
    if (activityId) {
      request.post('/editor/getCourseActivityById', { activity_id: Number(activityId) })
          .then(res => {
            subPageTitle.value = res?.title || '活动详情';
          })
          .catch(() => {
            subPageTitle.value = '活动详情';
          });
    }
    return;
  }

  if (route.name === 'testContent') {
    const classId = route.query.classId;
    const activityId = route.params.id;
    if (classId) {
      request.post('/editor/getCourseById', { id: classId })
          .then(res => {
            parentCourseTitle.value = res?.class_name || '课程详情';
          })
          .catch(() => {
            parentCourseTitle.value = '课程详情';
          });
    }
    if (activityId) {
      request.post('/editor/getCourseActivityById', { activity_id: Number(activityId) })
          .then(res => {
            subPageTitle.value = res?.title || '测试答题';
          })
          .catch(() => {
            subPageTitle.value = '测试答题';
          });
    }
    return;
  }

  if (route.name === 'testEditor') {
    const classId = route.query.classId;
    const activityId = route.params.id;
    if (classId) {
      request.post('/editor/getCourseById', { id: classId })
          .then(res => {
            parentCourseTitle.value = res?.class_name || '课程详情';
          })
          .catch(() => {
            parentCourseTitle.value = '课程详情';
          });
    }
    if (activityId) {
      request.post('/editor/getCourseActivityById', { activity_id: Number(activityId) })
          .then(res => {
            subPageTitle.value = res?.title || '编辑测试';
          })
          .catch(() => {
            subPageTitle.value = '编辑测试';
          });
    }
    return;
  }

  if (route.name === 'interactionContent') {
    const classId = route.query.classId;
    const activityId = route.params.id;
    if (classId) {
      request.post('/editor/getCourseById', { id: classId })
          .then(res => {
            parentCourseTitle.value = res?.class_name || '课程详情';
          })
          .catch(() => {
            parentCourseTitle.value = '课程详情';
          });
    }
    if (activityId) {
      request.post('/editor/getCourseActivityById', { activity_id: Number(activityId) })
          .then(res => {
            subPageTitle.value = res?.title || '课程互动';
          })
          .catch(() => {
            subPageTitle.value = '课程互动';
          });
    }
  }
}

watch(
    () => [route.name, route.query.id, route.query.classId, route.params.id],
    loadSubPageTitles,
    { immediate: true }
);

onMounted(() => {
  loadNotificationCount();
  loadProfile();
  notificationPollTimer = setInterval(() => {
    loadNotificationCount();
    if (showNotifications.value) {
      request.post('/editor/notifications', { account: account.value })
          .then(res => { notifications.value = Array.isArray(res) ? res : []; });
    }
  }, 20000);
});

onBeforeUnmount(() => {
  if (notificationPollTimer) clearInterval(notificationPollTimer);
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
    <header class="app-header">
      <div class="header-inner">
        <div class="header-left">
          <button type="button" class="brand" @click="goHome" aria-label="返回我的课堂">
            <img src="../assets/newClassPi.png" class="logo" alt="ClassPi">
          </button>

          <nav class="header-nav" aria-label="页面路径">
            <button
                type="button"
                class="nav-crumb"
                :class="{ active: isHomeActive }"
                @click="goHome"
            >
              我的课堂
            </button>
            <template v-for="(crumb, index) in headerCrumbs" :key="index">
              <span class="nav-sep" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <button
                  v-if="crumb.action"
                  type="button"
                  class="nav-crumb link"
                  @click="crumb.action"
              >
                {{ crumb.label }}
              </button>
              <span v-else class="nav-crumb current" :title="crumb.label">{{ crumb.label }}</span>
            </template>
          </nav>
        </div>

        <div class="header-right">
          <div class="notify-menu" :class="{ open: showNotifications }">
            <button
                type="button"
                class="header-icon-btn"
                :class="{ active: showNotifications }"
                aria-label="消息通知"
                @click="toggleNotifications"
            >
              <i class="iconfont icon-lingdang-xianxing"></i>
              <span v-if="unreadCount > 0" class="notify-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </button>
            <div v-if="showNotifications" class="notify-panel">
              <div class="notify-header">
                <div class="notify-header-main">
                  <span class="notify-title">消息通知</span>
                  <span v-if="unreadCount > 0" class="notify-unread-tag">{{ unreadCount }} 条未读</span>
                </div>
                <button
                    v-if="hasUnreadNotifications"
                    type="button"
                    class="notify-read-all"
                    @click="markAllNotificationsRead"
                >
                  一键已读
                </button>
              </div>
              <div v-if="notifications.length === 0" class="notify-empty">暂无通知</div>
              <div
                  v-for="item in notifications"
                  :key="item.id"
                  class="notify-item"
                  :class="{ unread: isNotificationUnread(item) }"
              >
                <div
                    class="notify-item-main"
                    :class="{ clickable: item.homework_id || item.class_id }"
                    @click="openNotification(item)"
                >
                  <div class="notify-item-top">
                    <span class="notify-type-badge" :class="`notify-type-${item.type || 'default'}`">
                      {{ notificationTypeMeta(item).icon }}
                    </span>
                    <span class="notify-type-label">{{ notificationTypeMeta(item).label }}</span>
                    <span v-if="isNotificationUnread(item)" class="notify-dot" aria-label="未读"></span>
                  </div>
                  <div class="notify-message">{{ item.message }}</div>
                  <div class="notify-time">
                    {{ formatDateTime(item.create_time) }}
                    <span v-if="notificationLinkHint(item)" class="notify-link-hint">{{ notificationLinkHint(item) }}</span>
                  </div>
                </div>
                <div class="notify-item-actions">
                  <button
                      v-if="isNotificationUnread(item)"
                      type="button"
                      class="notify-action-btn"
                      @click.stop="readNotification(item)"
                  >
                    标记已读
                  </button>
                  <button
                      v-if="item.homework_id || item.class_id"
                      type="button"
                      class="notify-action-btn primary"
                      @click.stop="openNotification(item)"
                  >
                    查看
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
              class="user-menu"
              :class="{ open: showUserMenu }"
              @mouseenter="openUserMenu"
              @mouseleave="closeUserMenu"
          >
            <button type="button" class="user-trigger" @click="goUserSetting">
              <UserAvatar :avatar-url="avatarUrl" :name="name" :account="account" :size="42" />
              <span class="user-label">{{ name || '用户' }}</span>
              <svg class="user-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div v-show="showUserMenu" class="user-dropdown">
              <div class="dropdown-header">
                <UserAvatar :avatar-url="avatarUrl" :name="name" :account="account" :size="40" />
                <div class="dropdown-user-meta">
                  <div class="dropdown-name">{{ name || '未设置姓名' }}</div>
                  <div class="dropdown-account">{{ account }}</div>
                </div>
              </div>
              <ul class="user-dropdown-list">
                <li @click="goUserSetting">个人设置</li>
                <li class="danger" @click="logout">退出登录</li>
              </ul>
            </div>
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
.main-class-page {
  min-height: 100vh;
  background: #f4f6f9;
}

.main-content {
  padding-top: 76px;
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 76px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e8ecf1;
}

.header-inner {
  max-width: 1280px;
  height: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
  flex: 1;
}

.brand {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.logo {
  height: 38px;
  width: auto;
  display: block;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.nav-sep {
  display: flex;
  align-items: center;
  color: #cbd5e1;
  flex-shrink: 0;
}

.nav-sep svg {
  width: 18px;
  height: 18px;
}

.nav-crumb {
  border: none;
  background: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.nav-crumb.link {
  color: #4285f4;
}

.nav-crumb.link:hover {
  background: #eff6ff;
}

.nav-crumb.active {
  color: #1e293b;
  background: #f1f5f9;
}

.nav-crumb.current {
  color: #1e293b;
  font-weight: 600;
  font-size: 18px;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.notify-menu {
  position: relative;
}

.notify-menu.open::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 10px;
}

.header-icon-btn {
  position: relative;
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.header-icon-btn:hover,
.header-icon-btn.active {
  background: #f1f5f9;
  color: #4285f4;
}

.notify-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  border: 2px solid #fff;
}

.user-menu {
  position: relative;
}

.user-menu.open::after {
  content: '';
  position: absolute;
  right: 0;
  top: 100%;
  width: 220px;
  height: 8px;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px 6px 6px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.user-trigger:hover,
.user-menu.open .user-trigger {
  background: #f8fafc;
  border-color: #e8ecf1;
}

.user-label {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 17px;
  font-weight: 500;
  color: #334155;
}

.user-chevron {
  color: #94a3b8;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.user-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  width: 260px;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  z-index: 30;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.dropdown-user-meta {
  min-width: 0;
}

.dropdown-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-account {
  margin-top: 2px;
  font-size: 14px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-dropdown-list {
  margin: 0;
  padding: 8px;
  list-style: none;
}

.user-dropdown-list li {
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 16px;
  color: #475569;
  cursor: pointer;
  line-height: 1.4;
  width: auto;
  height: auto;
  margin: 0;
}

.user-dropdown-list li:hover {
  background: #f8fafc;
  color: #4285f4;
}

.user-dropdown-list li.danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.notify-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 380px;
  max-height: min(480px, calc(100vh - 96px));
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  z-index: 120;
}

.notify-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.notify-header-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.notify-title {
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
}

.notify-unread-tag {
  padding: 2px 8px;
  border-radius: 999px;
  background: #fef2f2;
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.notify-read-all {
  border: none;
  background: none;
  color: #4285f4;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 0;
  white-space: nowrap;
}

.notify-read-all:hover {
  text-decoration: underline;
}

.notify-empty {
  padding: 40px 16px;
  color: #94a3b8;
  text-align: center;
  font-size: 14px;
}

.notify-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}

.notify-item:last-child {
  border-bottom: none;
}

.notify-item.unread {
  background: #f8fbff;
}

.notify-item-main.clickable {
  cursor: pointer;
}

.notify-item-main.clickable:hover .notify-message {
  color: #4285f4;
}

.notify-item-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.notify-type-badge {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

.notify-type-interaction { background: #8b5cf6; }
.notify-type-interaction_pick { background: #ec4899; }
.notify-type-topic { background: #06b6d4; }
.notify-type-material { background: #6366f1; }
.notify-type-attendance { background: #f97316; }
.notify-type-homework { background: #4285f4; }
.notify-type-remind { background: #f59e0b; }
.notify-type-test { background: #ef4444; }
.notify-type-announcement { background: #10b981; }
.notify-type-default { background: #94a3b8; }

.notify-type-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.notify-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  margin-left: auto;
  flex-shrink: 0;
}

.notify-message {
  font-size: 14px;
  line-height: 1.55;
  color: #334155;
  margin-bottom: 6px;
}

.notify-link-hint {
  margin-left: 8px;
  color: #4285f4;
  font-size: 12px;
}

.notify-time {
  font-size: 12px;
  color: #94a3b8;
}

.notify-item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.notify-action-btn {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.notify-action-btn:hover {
  background: #f8fafc;
  color: #334155;
}

.notify-action-btn.primary {
  border-color: #4285f4;
  color: #4285f4;
}

.notify-action-btn.primary:hover {
  background: #eff6ff;
}

@media (max-width: 900px) {
  .user-label,
  .user-chevron {
    display: none;
  }

  .nav-crumb.current {
    max-width: 160px;
  }

  .header-inner {
    padding: 0 16px;
  }
}

@media (max-width: 640px) {
  .notify-panel {
    width: min(360px, calc(100vw - 32px));
    right: -8px;
  }

  .header-nav .nav-crumb:not(.current):not(.active):not(.link) {
    display: none;
  }
}
</style>
