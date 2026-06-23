<script setup lang="js" name="UserSettingsPage">
import {useAccountStore} from "@/stores/account.js";
import {storeToRefs} from "pinia";
import {ref} from "vue";
import request from "@/utils/request.js";
import {useRouter} from "vue-router";

const activeName = ref('first');

const accountStore = useAccountStore();
const {account} = storeToRefs(accountStore);
const router = useRouter();

const account_1 = ref('')
const name = ref('')
const password = ref('')
const status = ref('')
const mechanism = ref('')
const email_or_phone = ref('')
const status_number = ref('')

function update() {
  if (!account.value) {
    alert('请先登录')
    return
  }
  request.post("/editor/account", {account: account.value})
      .then((res) => {
        if (!res?.account) {
          alert('获取账户信息失败')
          return
        }
        account_1.value = res.account
        name.value = res.name || ''
        status.value = res.status || ''
        password.value = res.password ? '********' : ''
        mechanism.value = res.mechanism || ''
        email_or_phone.value = res.email_or_phone || ''
        status_number.value = res.status_number || ''
      })
      .catch(error => {
        console.error(error)
        alert(error.message || "请求失败")
      })
}

function saveField(field, label, currentValue) {
  const value = prompt(`请输入新的${label}`, currentValue || '')
  if (value === null) return
  if (!value.trim()) {
    alert(`${label}不能为空`)
    return
  }
  const payload = {account: account.value}
  payload[field] = value.trim()
  request.put('/editor/updateAccount', payload)
      .then((ok) => {
        if (ok) {
          alert('修改成功')
          update()
        } else {
          alert('修改失败，请确认后端已重启')
        }
      })
      .catch((err) => {
        console.error(err)
        alert('修改失败，请检查后端是否运行')
      })
}

function editName() {
  saveField('name', '姓名', name.value)
}

function editMechanism() {
  saveField('mechanism', '学校', mechanism.value)
}

function editStatusNumber() {
  saveField('status_number', '学号', status_number.value)
}

function editPhone() {
  saveField('email_or_phone', '手机号', email_or_phone.value)
}

function editStatus() {
  const pickStudent = confirm('点击「确定」设为学生，点击「取消」设为老师')
  const newStatus = pickStudent ? '学生' : '老师'
  request.put('/editor/updateAccount', {account: account.value, status: newStatus})
      .then((ok) => {
        if (ok) {
          alert(`已设置为${newStatus}`)
          update()
        } else {
          alert('修改失败')
        }
      })
      .catch((err) => {
        console.error(err)
        alert('修改失败')
      })
}

function changePassword() {
  const value = prompt('请输入新密码（8~16位）')
  if (value === null) return
  if (value.length < 8 || value.length > 16) {
    alert('密码长度必须在8~16位之间')
    return
  }
  request.put('/editor/change', {account: account.value, password: value.trim()})
      .then((ok) => {
        if (ok) {
          alert('密码修改成功，请重新登录')
          accountStore.logout()
          router.push({ name: 'login' })
        } else {
          alert('密码修改失败')
        }
      })
      .catch((err) => {
        console.error(err)
        alert('密码修改失败')
      })
}

function maskPhone(phone) {
  if (!phone || phone === 'yes') return '未绑定'
  if (phone.length <= 4) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

update()
</script>

<template>
  <div class="user-settings-page">
    <div class="us-container">
      <div class="us-header">
        <img src="@/assets/head.png" class="us-avatar"/>
        <div class="us-info">
          <h2 class="us-username">{{ name || account_1 }}</h2>
          <button class="us-vip-btn">开通课堂派VIP</button>
        </div>
      </div>

      <div class="us-tabs-container">
        <div class="us-tabs">
          <button
              type="button"
              class="us-tab"
              :class="{ active: activeName === 'first' }"
              @click="activeName = 'first'"
          >账户信息</button>
          <button
              type="button"
              class="us-tab"
              :class="{ active: activeName === 'second' }"
              @click="activeName = 'second'"
          >通知设置</button>
        </div>
      </div>

      <div class="account" v-show="activeName === 'first'">
        <h2 class="set_name" style="padding: 24px 0">账号设置</h2>
        <ul class="accountReal">
          <li style="border-top-right-radius: 5px">
            <label>账号</label><span class="content">{{ account_1 }}</span>
          </li>
          <li>
            <label>所属角色</label><span class="content">{{ status }}</span>
            <p class="right"><span @click="editStatus">去设置</span></p>
          </li>
          <li>
            <label>手机号</label><span class="content">{{ maskPhone(email_or_phone) }}</span>
            <p class="right"><span @click="editPhone">更换手机号</span></p>
          </li>
          <li style="border-bottom-right-radius: 5px">
            <label>密码</label><span class="content">{{ password }}</span>
            <p class="right"><span @click="changePassword">修改密码</span></p>
          </li>
        </ul>
        <h2 class="set_name" style="padding: 24px 0">基础信息</h2>
        <ul class="accountReal">
          <li style="border-top-right-radius: 5px">
            <label>姓名</label><span class="content">{{ name || '未完善' }}</span>
            <p class="right"><span @click="editName">编辑</span></p>
          </li>
          <li>
            <label>学号</label>
            <span class="content" v-if="status_number">{{ status_number }}</span>
            <span class="hint" v-else>未完善</span>
            <p class="right"><span @click="editStatusNumber">编辑</span></p>
          </li>
          <li style="border-bottom-right-radius: 5px">
            <label>学校</label>
            <span class="content" v-if="mechanism">{{ mechanism }}</span>
            <span class="hint" v-else>未完善</span>
            <p class="right"><span @click="editMechanism">编辑</span></p>
          </li>
        </ul>
      </div>

      <div class="account" v-show="activeName === 'second'">
        <p class="hint" style="padding: 24px 0">通知设置功能暂未开放</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-settings-page {
  --us-primary: #409EFF;
  --us-text: #303133;
  --us-bg: #f8f9fa;
  isolation: isolate;
  min-height: 100vh;
  padding-bottom: 40px;
}

.us-container {
  width: 100%;
  max-width: 1140px;
  padding: 0 20px;
  margin: auto;
  position: relative;
}

.us-header {
  padding: 24px;
  background-color: var(--us-bg);
  border-radius: 7px;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  margin-top: 100px;
}

.us-avatar {
  width: 114px;
  height: 114px;
  border-radius: 57px;
  margin-right: 20px;
}

.us-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.us-username {
  font: 500 30px/1.2 "PingFang SC", sans-serif;
  color: var(--us-text);
  margin: 0;
}

.us-vip-btn {
  font: 500 18px/1.5 "PingFang SC", sans-serif;
  color: #4285f4;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  width: fit-content;
}

.us-tabs-container {
  position: relative;
  z-index: 10;
}

.us-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid rgb(218, 220, 224);
}

.us-tab {
  font: 500 22px/52px "PingFang SC", sans-serif;
  padding: 0 20px;
  height: 52px;
  color: var(--us-text);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
}

.us-tab.active,
.us-tab:hover {
  color: var(--us-primary);
}

.us-tab.active {
  border-bottom-color: var(--us-primary);
}

.account {
  width: 100%;
  max-width: 1100px;
  background-color: rgb(248, 249, 250);
  margin-top: 16px;
  padding: 0 30px 30px;
  border-radius: 7px;
}

.set_name {
  font-weight: 400;
  font-size: 21px;
}

ul {
  border-radius: 5px;
  border-left: 5px solid rgb(66, 133, 244);
}

li {
  list-style-type: none;
  padding: 16px 0;
  height: 68px;
  line-height: 34px;
  background-color: #FFFFFF;
  border: 1px solid rgb(218, 220, 224);
  margin: 0 0 -1px 4px;
  border-left: none !important;
  display: flex;
  position: relative;
}

label {
  padding: 0 24px;
  color: #000000;
  font-size: 18px;
  width: 195px;
}

.right {
  cursor: pointer;
  display: flex;
  position: absolute;
  right: 80px;
  color: rgb(66, 133, 244);
}

.content {
  color: rgb(95, 99, 148);
}

.hint {
  color: rgb(95, 99, 148);
}
</style>
