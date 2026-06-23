<script setup lang="js" name="forget">
import {RouterView, RouterLink, useRoute, useRouter} from "vue-router";
import request from "@/utils/request.js";
import {toast} from '@/utils/toast.js';
import {nextTick} from "vue";

const route = useRoute();
const router = useRouter();


function next() {
  let account = document.getElementById("account").value.trim();
  console.log(account);
  let confirm = document.getElementById("confirm");
  let forget = document.getElementById("forget");
  request.post('/editor/check', account)
      .then(response => {
        if (!response) {
          toast.error("不存在的账户")
        } else {
          forget.style.display = "none";
          confirm.style.display = "block";
        }
      })
      .catch(error => {
        console.log(error)
        toast.error('请求失败，请稍后重试')
      })
}

function confirmPassword() {
  let password = document.getElementById("newPassword").value.trim();
  if (password.length > 16 || password.length < 8) {
    toast.warning("密码长度必须大于8小于16")
    return;
  }
  let account = document.getElementById("account").value.trim();
  console.log(account);
  request.put('/editor/change',
      {password: password, account: account})
      .then(response => {
        if (response) {
          toast.success('密码修改成功')
          router.push({name: 'login'})
        } else {
          toast.error("修改发生错误")
        }
      })
      .catch(error => {
        console.log(error)
        toast.error('请求失败，请稍后重试')
      })
}


</script>

<template>
  <div class="auth-page">
    <img src="../assets/classPai.png" alt="商标" class="paintingImg">
    <div class="forget_container" id="forget">
      <h1 style="letter-spacing: 2px;margin-bottom: 20px">忘记密码</h1>
      <input type="text" placeholder="请输入邮箱/手机号" class="input" style="margin-top: 25px" id="account"><br>
      <span class="error-message">格式错误</span><br>
      <button class="forget" id="next" @click="next">下一步</button>
      <br>
      <div class="login-link">
        又想起来了?
        <span @click="router.push({name : 'login'})" style="color: rgb(72, 138, 248);cursor: pointer">
          那就登陆</span>
      </div>
    </div>
    <div class="forget_container" id="confirm">
      <h1 style="letter-spacing: 2px;margin-bottom: 20px">修改密码</h1>
      <input type="text" placeholder="请输入新密码" class="input" style="margin-top: 25px" id="newPassword"><br>
      <span class="error-message">格式错误</span><br>
      <button class="forget" id="ok" @click="confirmPassword">确认</button>
      <br>
      <div class="login-link">
        又想起来了?
        <span @click="router.push({name : 'login'})" style="color: rgb(72, 138, 248);cursor: pointer">
          那就登陆</span>
      </div>
    </div>
  </div>
  <RouterView :key="route.fullPath"/>
</template>

<style scoped>
.auth-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  min-height: 100vh;
  padding: 40px 24px;
  background-color: rgb(248, 249, 250);
}

.paintingImg {
  max-width: 200px;
  height: auto;
}

.forget_container {
  width: 560px;
  max-width: 100%;
  background-color: rgb(255, 255, 255);
  padding: 24px 40px 32px;
  position: relative;
  box-shadow: 0 5px 20px rgba(0, 0, 0, .1);
  border-radius: 7px;
}

h1 {
  text-align: center;
  font-weight: 400;
  margin-top: 10px;
  font-size: 30px;
}

input:focus {
  outline: none;
  border-color: rgb(72, 138, 248);
  border-width: 1px;
}

.input {
  height: 60px;
  width: 100%;
  padding: 4px 15px;
  margin-bottom: 0;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 7px;
  margin-top: 0 !important;
}

input::placeholder {
  color: rgb(192, 196, 207);
  font-size: 17px;
  font-weight: 2;
}

button.forget {
  background-color: rgb(72, 138, 248);
  height: 63px;
  width: 100%;
  padding: 4px 20px;
  border-radius: 5px;
  border: none;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 20px;
  color: white;
  cursor: pointer;
}

a {
  text-decoration: none;
  color: rgb(72, 138, 248)
}

span {
  font-size: 18px;
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

.login-link {
  font-size: 18px;
  text-align: right;
}

#confirm {
  display: none;
}
</style>
