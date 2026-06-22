<script setup lang="js" name="UserSettingsPage">
import {ElTabs, ElTabPane} from "element-plus";
import {useAccountStore} from "@/stores/account.js";
import {storeToRefs} from "pinia";
import {ref} from "vue";
import request from "@/utils/request.js";

const activeName = ref('first');

const accountStore = useAccountStore();
const {account} = storeToRefs(accountStore);
console.log(account.value)
const account_1 = ref('')
const name = ref('')
const password = ref('')
const status = ref('')
const mechanism = ref('')
const email_or_phone = ref('')
const status_number = ref('')

function update() {
  request.post("/editor/account", {account: account.value})
      .then((res) => {
        const data = res;
        console.log(res)
        const {
          account: resAccount,
          name: resName,
          status: resStatus,
          password: resPassword,
          mechanism: resMechanism,
          email_or_phone: resEmailOrPhone,
          status_number: resStatusNumber
        } = data;

        account_1.value = resAccount;
        name.value = resName;
        status.value = resStatus;
        password.value = resPassword;
        mechanism.value = resMechanism;
        email_or_phone.value = resEmailOrPhone;
        status_number.value = resStatusNumber;
      })
      .catch(error => {
        console.error(error);
        alert(error.message || "请求失败");
      });
}

update()
</script>

<template>
  <div class="user-settings-page">
    <div class="us-container">
      <div class="us-header">
        <img src="@/assets/head.png" class="us-avatar"/>
        <div class="us-info">
          <h2 class="us-username">{{ name }}</h2>
          <button class="us-vip-btn">开通课堂派VIP</button>
        </div>
      </div>

      <div class="us-tabs-container">
        <el-tabs
            v-model="activeName"
            class="us-tabs"
            stretch
        >
          <el-tab-pane label="账户信息" name="first"/>
          <el-tab-pane label="通知设置" name="second"/>
        </el-tabs>
      </div>
      <div class="account">
        <h2 class="set_name" style="padding: 24px 0">账号设置</h2>
        <ul class="accountReal">
          <li style="border-top-right-radius: 5px"><label>账号</label><span class="content">{{ account_1 }}</span>
            <p></p></li>
          <li><label>所属角色</label><span class="content">{{ status }}</span>
            <p class="right"><span>去设置</span></p></li>
          <li><label>手机号</label><span class="content">***********</span>
            <p class="right"><span>更换手机号</span><span> | </span><span>解绑</span></p></li>
          <li style="border-bottom-right-radius: 5px"><label>密码</label><span class="content"
                                                                               id="password">{{ password }}</span>
            <p class="right"><span id="changePassword" @click="changePassword">修改密码</span></p></li>
        </ul>
        <h2 class="set_name" style="padding: 24px 0">基础信息</h2>
        <ul class="accountReal">
          <li style="border-top-right-radius: 5px"><label>姓名</label><span class="content">{{ name }}</span>
            <p></p></li>
          <li><label>学号</label><span class="content">123456789</span>
            <p></p></li>
          <li><label>学校</label><span class="content">{{ mechanism }}</span>
            <p></p></li>
          <li><label>院系</label><span style="color: rgb(95, 99, 148)"><i
              class="iconfont icon-gantanhao"/> 未完善</span>
            <p></p></li>
          <li><label>专业</label><span style="color: rgb(95, 99, 148)"><i
              class="iconfont icon-gantanhao"/> 未完善</span>
            <p></p></li>
          <li><label>班级</label><span style="color: rgb(95, 99, 148)"><i
              class="iconfont icon-gantanhao"/> 未完善</span>
            <p></p></li>
          <li><label>年级</label><span style="color: rgb(95, 99, 148)"><i
              class="iconfont icon-gantanhao"/> 未完善</span>
            <p></p></li>
          <li style="border-bottom-right-radius: 5px"><label>入学时间</label><span style="color: rgb(95, 99, 148)"><i
              class="iconfont icon-gantanhao"/> 未完善</span>
            <p></p></li>
        </ul>
        <h2 class="set_name" style="padding: 24px 0">第三方账号绑定</h2>
        <ul class="accountReal">
          <li style="border-top-right-radius: 5px"><label>邮箱绑定</label><span style="color: rgb(95, 99, 148)"><i
              class="iconfont icon-gantanhao"/> 未完善</span>
            <p class="right"><span>立即绑定</span></p></li>
          <li style="border-bottom-right-radius: 5px"><label>微信绑定</label><span style="color: rgb(95, 99, 148)"><i
              class="iconfont icon-gantanhao"/> 未完善</span>
            <p class="right"><span>立即绑定</span></p></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 最外层隔离容器 */
.user-settings-page {
  --us-primary: #409EFF;
  --us-text: #303133;
  --us-bg: #f8f9fa;
  isolation: isolate; /* 关键：创建新的堆叠上下文 */
  height: auto;
  min-height: 100vh;
  overflow-y: hidden;
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

.us-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.us-tabs :deep(.el-tabs__nav) {
  display: flex;
  border: none !important;
}

.us-tabs :deep(.el-tabs__item) {
  font: 500 22px/52px "PingFang SC", sans-serif;
  padding: 0 20px;
  height: 52px;
  color: var(--us-text);
}

.us-tabs :deep(.el-tabs__item.is-active),
.us-tabs :deep(.el-tabs__item:hover) {
  color: var(--us-primary);
}

.us-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  background: var(--us-primary);
  transition: all 0.3s ease;
}

.account {
  width: 1100px;
  background-color: rgb(248, 249, 250);
  margin-top: 16px;
  padding: 0 30px 30px;
  height: 1200px;
  border-radius: 7px;
  overflow: hidden;
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
</style>