<script setup lang="js" name="login">
import painting from '@/components/painting.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import {RouterView, useRoute, useRouter} from "vue-router";
import request from "@/utils/request.js";
import {useAccountStore} from "@/stores/account.js";
import {reactive, ref, onMounted, nextTick} from "vue";
import {validateAccount, validateLoginPassword, validatePhone} from '@/utils/formValidate.js';
import {toast} from '@/utils/toast.js';

const accountStore = useAccountStore();
const route = useRoute();
const router = useRouter();

const loginMode = ref('account');
const form = reactive({
  account: '',
  password: '',
});
const errors = reactive({
  account: '',
  password: '',
});

const lend = document.createElement('button');
lend.textContent = "发送验证码";
let lendCreated = false;

function setError(field, message) {
  errors[field] = message || '';
}

function validateField(field) {
  if (field === 'account') {
    setError('account', loginMode.value === 'phone'
        ? validatePhone(form.account)
        : validateAccount(form.account));
  }
  if (field === 'password') {
    setError('password', validateLoginPassword(form.password));
  }
}

function validateAll() {
  validateField('account');
  validateField('password');
  return !errors.account && !errors.password;
}

function setPasswordFieldWidth(px) {
  const input = document.getElementById('password');
  const wrap = input?.closest('.password-field');
  if (wrap) {
    wrap.style.maxWidth = `${px}px`;
  }
}

function resetLoginForm() {
  form.account = '';
  form.password = '';
  errors.account = '';
  errors.password = '';
}

function clearAutofillAfterLogout() {
  if (!sessionStorage.getItem('freshLogin')) return;
  sessionStorage.removeItem('freshLogin');
  resetLoginForm();
  nextTick(() => {
    const accountInput = document.getElementById('input_acc');
    const passwordInput = document.getElementById('password');
    if (accountInput) accountInput.value = '';
    if (passwordInput) passwordInput.value = '';
  });
}

onMounted(() => {
  resetLoginForm();
  clearAutofillAfterLogout();
  // 浏览器可能在渲染后再自动填充，延迟再清一次
  setTimeout(clearAutofillAfterLogout, 50);
});

function loginBut() {
  if (!validateAll()) return;

  request.post('/editor/login', {
    account: form.account.trim(),
    password: form.password,
  }).then(response => {
    if (response && response.account) {
      accountStore.setAccount(response.account, {
        token: response.token,
        avatar_url: response.avatar_url,
        name: response.name,
      });
      toast.success('登陆成功');
      router.push('/mainClass');
    } else {
      toast.error('账号或密码错误');
    }
  }).catch(error => {
    console.error(error);
    toast.error('登陆失败，请检查网络或后端服务');
  });
}

function accountM() {
  loginMode.value = 'account';
  login_form.style.display = 'block';
  setPasswordFieldWidth(490);
  setError('account', '');
  if (lendCreated) {
    lend.remove();
    lendCreated = false;
  }
}

function phoneNumM() {
  loginMode.value = 'phone';
  login_form.style.display = 'block';
  setPasswordFieldWidth(300);
  setError('account', '');
  if (!lendCreated) {
    Object.assign(lend.style, {
      color: 'rgb(255,255,255)',
      width: '170px',
      height: '58px',
      backgroundColor: 'rgb(72,138,248)',
      borderRadius: '5px',
      border: 'none',
      marginLeft: '20px',
      fontSize: '17px',
      cursor: 'pointer',
    });
    const passwordRow = document.getElementById('password_row');
    if (passwordRow) {
      passwordRow.appendChild(lend);
    }
    lendCreated = true;
  }
}

function wechatM() {
  loginMode.value = 'wechat';
  login_form.style.display = 'none';
}

</script>

<template>
  <div class="auth-page">
    <painting/>
    <div class="login_container">
      <h1 class="login-title">账号登陆</h1>
      <div class="login-tabs">
        <span class="tab" :class="{ 'active-tab': loginMode === 'account' }" @click="accountM" id="account">账号登陆</span>
        <span class="tab" :class="{ 'active-tab': loginMode === 'phone' }" @click="phoneNumM" id="phoneNum">手机短信登录</span>
        <span class="tab" :class="{ 'active-tab': loginMode === 'wechat' }" @click="wechatM" id="wechat">微信登陆</span>
      </div>
      <div class="login_form" id="login_form" autocomplete="off">
        <input
            v-model="form.account"
            type="text"
            :placeholder="loginMode === 'phone' ? '请输入手机号' : '请输入邮箱/手机号/账号'"
            class="input"
            :class="{ 'input-invalid': errors.account }"
            id="input_acc"
            name="classpi-account"
            autocomplete="off"
            readonly
            @focus="($event.target).removeAttribute('readonly')"
            @blur="validateField('account')"
        >
        <span class="error-message" :class="{ visible: errors.account }">{{ errors.account || ' ' }}</span>

        <div class="password-row" id="password_row">
          <PasswordInput
              id="password"
              v-model="form.password"
              placeholder="请输入密码"
              :invalid="!!errors.password"
              @blur="validateField('password')"
          />
        </div>
        <span class="error-message password-error" :class="{ visible: errors.password }">{{ errors.password || ' ' }}</span>

        <div class="form">
          <div class="checkbox-row">
            <input id="checkBox01" type="checkbox" class="checkbox-input">
            <div class="checkbox">下次自动登陆</div>
            <div class="checkbox-spacer"></div>
            <span @click="router.push('/forget')" class="forget">忘记密码?</span>
          </div>
        </div>
        <button type="button" class="login" @click="loginBut">登陆</button>
        <div class="register-link">还没有账号 ?
          <span @click="router.push('/register')" class="link">去注册</span>
        </div>
      </div>
      <div class="gist"></div>
    </div>
  </div>
  <RouterView :key="route.fullPath"/>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
  min-height: 100vh;
  padding: 40px 24px;
  background-color: rgb(248, 249, 250);
}

.login_container {
  height: auto;
  width: 570px;
  max-width: 100%;
  background-color: rgb(255, 255, 255);
  position: relative;
  box-shadow: 0 5px 20px rgba(0, 0, 0, .1);
  padding: 38px 38px 38px 41px;
  flex-shrink: 0;
}

.login-title {
  letter-spacing: 2px;
  margin-bottom: 20px;
  text-align: center;
}

.login-tabs {
  display: flex;
  gap: 48px;
  margin-bottom: 8px;
}

.tab {
  color: rgb(116, 120, 124);
  font-size: 23px;
  padding: 0 0 9px;
  cursor: pointer;
}

.tab.active-tab {
  color: rgb(72, 138, 248);
}

.input {
  height: 52px;
  max-width: 490px;
  margin-top: 20px;
  font-size: 16px;
}

.input-invalid {
  border-color: #f87171 !important;
  background: #fef2f2 !important;
}

input:focus {
  outline: none;
}

.input-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) !important;
}

input::placeholder {
  font-size: 15px;
}

.error-message {
  display: block;
  min-height: 20px;
  font-size: 12px;
  color: transparent;
  padding: 2px 0;
}

.error-message.visible {
  color: #f56c6c;
}

.password-error {
  margin-bottom: 4px;
}

.checkbox {
  font-size: 18px;
  color: rgb(96, 98, 100);
  cursor: pointer;
}

button.login {
  background-color: rgb(72, 138, 248);
  height: 63px;
  width: 100%;
  max-width: 490px;
  padding: 4px 20px;
  border-radius: 5px;
  border: none;
  margin-top: 16px;
  margin-bottom: 10px;
  font-size: 20px;
  color: white;
  cursor: pointer;
}

button.login:hover {
  background-color: rgb(104, 157, 246);
}

.checkbox-row {
  display: flex;
  align-items: center;
  height: 50px;
  gap: 8px;
}

.checkbox-input {
  transform: scale(1.4);
  accent-color: rgb(218, 220, 224);
  cursor: pointer;
}

.checkbox-spacer {
  flex: 1;
}

.forget {
  color: rgb(96, 98, 100);
  font-size: 17px;
  cursor: pointer;
  padding-bottom: 0;
}

.register-link {
  font-size: 18px;
  margin-top: 20px;
  text-align: right;
}

.link {
  color: rgb(72, 138, 248);
  font-size: 18px;
  cursor: pointer;
}

.password-row {
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: 60px;
  max-width: 490px;
}
</style>
