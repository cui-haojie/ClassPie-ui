<script setup lang="js" name="forget">
import {RouterView, RouterLink, useRoute, useRouter} from "vue-router";
import request from "@/utils/request.js";
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
          alert("不存在的账户")
        } else {
          forget.style.display = "none";
          confirm.style.display = "block";
        }
      })
      .catch(error => {
        console.log(error)
        alert(error)
      })
}

function confirmPassword() {
  let password = document.getElementById("newPassword").value.trim();
  if (password.length > 16 || password.length < 8) {
    alert("密码长度必须大于8小于16")
    return;
  }
  let account = document.getElementById("account").value.trim();
  console.log(account);
  let result = confirm(`确认将密码修改为：${password}`);
  if (result) {
    request.put('/editor/change',
        {password: password, account: account})
        .then(response => {
          if (response) {
            router.push({name: 'login'})
          } else {
            alert("修改发生错误")
          }
        })
        .catch(error => {
          console.log(error)
          alert(error)
        })
  }
}


</script>

<template>
  <img src="../assets/classPai.png" alt="商标" class="paintingImg">
  <div class="forget_container" id="forget">
    <h1 style="letter-spacing: 2px;margin-bottom: 20px">忘记密码</h1>
    <input type="text" placeholder="请输入邮箱/手机号" class="input" style="margin-top: 25px" id="account"><br>
    <span class="error-message">格式错误</span><br>
    <button class="forget" id="next" @click="next">下一步</button>
    <br>

    <div style="display: flex">
      <div style="width: 305px"></div>
      <span>又想起来了?
      <span @click="router.push({name : 'login'})" style="color: rgb(72, 138, 248);cursor: pointer">
      那就登陆</span></span></div>
  </div>
  <div class="forget_container" id="confirm">
    <h1 style="letter-spacing: 2px;margin-bottom: 20px">修改密码</h1>
    <input type="text" placeholder="请输入新密码" class="input" style="margin-top: 25px" id="newPassword"><br>
    <span class="error-message">格式错误</span><br>
    <button class="forget" id="ok" @click="confirmPassword">确认</button>
    <br>

    <div style="display: flex">
      <div style="width: 305px"></div>
      <span>又想起来了?
      <span @click="router.push({name : 'login'})" style="color: rgb(72, 138, 248);cursor: pointer">
      那就登陆</span></span></div>
  </div>
  <RouterView :key="route.fullPath"/>
</template>

<style scoped>
.paintingImg {
  left: 78px;
  position: absolute;
  top: 55px;
}

.forget_container {
  width: 560px;
  height: 281px;
  background-color: rgb(255, 255, 255);
  top: 340px;
  left: 675px;
  padding: 0 40px;
  position: fixed;
  box-shadow: 0 5px 20px rgba(0, 0, 0, .1);
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
  width: 480px;
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
  width: 480px;
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
  left: 0 !important;
  letter-spacing: 1px;
  font-weight: 360;
}

#confirm {
  display: none;
}
</style>