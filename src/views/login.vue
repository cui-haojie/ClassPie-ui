<script setup lang="js" name="login">
import painting from '@/components/painting.vue'
import {RouterView, RouterLink, useRoute, useRouter} from "vue-router";
import request from "@/utils/request.js";
import {useAccountStore} from "@/stores/account.js";

const accountStore = useAccountStore();
const route = useRoute();
const router = useRouter();
const lend = document.createElement('button')
lend.textContent = "发送验证码";

function loginBut() {
  let account = document.getElementById("input_acc").value.trim();
  let password = document.getElementById("password").value.trim();

  request.post(
      '/editor/login',
      {account: account, password: password})
      .then(response => {
        if (response) {
          router.push('/mainClass')
          alert("登陆成功")
          accountStore.setAccount(account)
          console.log(accountStore.account)
        } else {
          alert("账户不存在，请重新输入")
        }
      }).catch(error => {
    console.log(error)
    alert("登陆错误" + error)
  })
}

let lendCreated = false;

function accountM() {
  login_form.style.display = 'block'
  account.style.color = 'rgb(72, 138, 248)'
  phoneNum.style.color = 'rgb(116,120,124)'
  wechat.style.color = 'rgb(116,120,124)'
  input_acc.placeholder = '请输入邮箱/手机号/账号'
  password.style.width = '490px'
  if (lendCreated) {
    lend.remove();
    lendCreated = false;
  }
}

function phoneNumM() {
  login_form.style.display = 'block'
  phoneNum.style.color = 'rgb(72, 138, 248)'
  account.style.color = 'rgb(116,120,124)'
  wechat.style.color = 'rgb(116,120,124)'
  input_acc.placeholder = '请输入手机号'
  password.style.width = '300px'
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
    password.after(lend);
    lendCreated = true
  }
}

function wechatM() {
  wechat.style.color = 'rgb(72, 138, 248)'
  phoneNum.style.color = 'rgb(116,120,124)'
  account.style.color = 'rgb(116,120,124)'
  login_form.style.display = 'none'
  login_form.style.background = "url('@/assets/wechat.png')"
}

</script>

<template>
  <div class="auth-page">
    <painting/>
    <div class="login_container">
      <h1 style="letter-spacing: 2px;margin-bottom: 20px">账号登陆</h1>
      <div style="display: flex">
        <span style="margin-left: 5px;margin-right: 15px;color: rgb(72, 138, 248)" @click="accountM"
              id="account">账号登陆</span>
        <span style="margin-left: 65px;margin-right: 78px" @click="phoneNumM" id="phoneNum">手机短信登录</span>
        <span @click="wechatM" id="wechat">微信登陆</span>
      </div>
      <div class="login_form" id="login_form">
        <input type="text" placeholder="请输入邮箱/手机号/账号" class="input" id="input_acc" style="margin-top: 25px"><br>
        <span class="error-message">格式错误</span><br>
        <div style="height: 60px;min-height: 60px">
          <input type="text" placeholder="请输入密码" class="input" id="password"></div>
        <br>
        <div class="form">
          <div class="checkbox-row">
            <input id="checkBox01" type="checkbox" class="checkbox-input">
            <div class="checkbox">
              下次自动登陆
            </div>
            <div class="checkbox-spacer"></div>
            <span @click="router.push('/forget')" style="color: rgb(96,98,100);font-size: 17px;cursor: pointer"
                  class="forget">
              忘记密码?
            </span>
          </div>
        </div>
        <button class="login" @click="loginBut">登陆</button>
        <div class="register-link">还没有账号 ? <span
            @click="router.push('/register')"
            style="color: rgb(72, 138, 248);font-size: 18px;cursor: pointer">去注册</span></div>
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
  align-items: center;
  justify-content: center;
  padding: 38px 38px 38px 41px;
  flex-shrink: 0;
}

span {
  color: rgb(116, 120, 124);
  font-size: 23px;
  padding: 0 0 9px;
  cursor: pointer;
}

.input {
  height: 60px;
  width: 100%;
  max-width: 490px;
  padding: 4px 15px;
  margin-bottom: 0;
  margin-top: 0;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 7px;
}

input::placeholder {
  color: rgb(192, 196, 207);
  font-size: 17px;
  font-weight: 2;
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
  margin-top: 25px;
  margin-bottom: 10px;
  font-size: 20px;
  color: white;
  cursor: pointer;
}

a {
  text-decoration: none;
}

input:focus {
  outline: none;
  border-color: rgb(72, 138, 248);
  border-width: 1px;
}

button.login:hover {
  background-color: rgb(104, 157, 246);
}

span.forget {
  padding-bottom: 0;
}

span.forget :hover {
  color: rgb(104, 157, 246);
}

.error-message {
  height: 20px;
  min-height: 20px;
  font-size: 12px;
  color: transparent;
  transition: color 0.3s;
  padding: 0;
  letter-spacing: 1px;
  font-weight: 360;
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

.register-link {
  font-size: 18px;
  margin-top: 20px;
  text-align: right;
}

h1 {
  text-align: center;
}

</style>