<script setup lang="js" name="mainClass">
import {RouterView, useRouter} from "vue-router";
import {storeToRefs} from "pinia";
import {useAccountStore} from "@/stores/account.js";
import {onMounted, ref} from "vue";
import request from "@/utils/request.js";

const accountStore = useAccountStore();
const {account} = storeToRefs(accountStore);
const router = useRouter();

const showNotifications = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);

function userSetting() {
  head.style.display = head.style.display === 'block' ? 'none' : 'block';
  showNotifications.value = false;
}

function logout() {
  accountStore.logout()
  head.style.display = 'none'
  router.push({ name: 'login' })
}

function loadNotificationCount() {
  if (!account.value) return
  request.post('/editor/notificationCount', { account: account.value })
      .then(res => { unreadCount.value = res || 0 })
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  head.style.display = 'none'
  if (showNotifications.value) {
    request.post('/editor/notifications', { account: account.value })
        .then(res => {
          notifications.value = Array.isArray(res) ? res : []
          loadNotificationCount()
        })
  }
}

function readNotification(item) {
  request.put('/editor/readNotification', { id: item.id, account: account.value })
      .then(() => {
        item.is_read = true
        loadNotificationCount()
      })
}

onMounted(() => {
  loadNotificationCount()
})
</script>

<template>
  <div class="main-class-page">
    <div class="leader">
      <img src="../assets/newClassPi.png" id="Pi">
      <div style="width: 60px"></div>
      <div class="word" style="width: 85px">我的课堂</div>
      <div class="leader-spacer"></div>
      <div class="leader_container">
        <div class="content" style="width: 80px">AI工具集</div>
        <div class="content"><i class="iconfont icon-chazhong"></i>论文查重</div>
        <div class="content"><i class="iconfont icon-renwubiao"></i>任务管理</div>
        <div class="content notify-wrap" style="width: 30px;" @click="toggleNotifications">
          <i class="iconfont icon-lingdang-xianxing"></i>
          <span v-if="unreadCount > 0" class="notify-badge">{{ unreadCount }}</span>
        </div>
        <div class="avatar-wrap">
          <img src="@/assets/head.png" style="width: 47px;border-radius: 50%" @click="userSetting">
        </div>
      </div>
      <div id="head" class="user-dropdown">
        <ul style="font-size: 14px;color: rgb(108, 110, 113)">
          <li>开通VIP</li>
          <li>账号容量</li>
          <li>机构用户认证</li>
          <li @click="router.push('/userSetting')">个人设置</li>
          <li @click="logout">退出登陆</li>
        </ul>
      </div>
      <div v-if="showNotifications" class="notify-panel">
        <div class="notify-title">消息通知</div>
        <div v-if="notifications.length === 0" class="notify-empty">暂无通知</div>
        <div
            v-for="item in notifications"
            :key="item.id"
            class="notify-item"
            :class="{ unread: !item.is_read }"
            @click="readNotification(item)"
        >
          <div>{{ item.message }}</div>
          <div class="notify-time">{{ item.create_time }}</div>
        </div>
      </div>
    </div>
    <div class="main-content">
      <RouterView/>
    </div>
  </div>
</template>

<style scoped>
#Pi {
  height: 37px;
  width: 147px;
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
}

.avatar-wrap {
  position: relative;
  top: 15px;
  cursor: pointer;
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

.notify-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.user-dropdown {
  width: 130px;
  padding: 12px;
  display: none;
  position: absolute;
  right: 15px;
  top: 55px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  background-color: #FFFFFF;
  z-index: 20;
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

.word {
  font-size: 20px;
  font-family: Roboto, Helvetica, Arial, sans-serif;
  height: 83px;
  color: rgb(72, 138, 248);
  border-bottom: 2px solid rgb(72, 138, 248);
  line-height: 83px;
  cursor: pointer;
}

.leader_container {
  font-family: Roboto, Helvetica, Arial, sans-serif;
  height: 83px;
  font-size: 20px;
  line-height: 83px;
  display: flex;
}

.content {
  margin-right: 15px;
  cursor: pointer;
  width: 100px;
}

.content:hover {
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
</style>
