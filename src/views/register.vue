<script setup lang="js" name="register">

import {RouterView, useRoute, useRouter} from "vue-router";
import request from "@/utils/request.js";

const route = useRoute();
const router = useRouter();
let status = "老师";

function changeTeacher() {
  teacher.style.border = "1px solid rgb(72, 138, 248)"
  student.style.border = "transparent";
  studentId.style.display = "none";
  status = "老师";
}

function changeStudent() {
  student.style.border = "1px solid rgb(72, 138, 248)"
  teacher.style.border = "transparent";
  studentId.style.display = "block";
  status = "学生";
}

function create() {
  const account = {
    account: document.getElementById('input_account').value.trim(),
    password: document.getElementById('input_password').value.trim(),
    name: document.getElementById('input_name').value.trim(),
    status: status,
    mechanism: document.getElementById('input_mechanism').value.trim(),
    status_number: document.getElementById('input_status_number').value.trim(),
  }

  if (!validateAccount(account)) return;

  request.post('/editor/add', account).then(response => {
    if (response === true) {
      alert("创建成功")
      console.log(response + "创建成功")
    } else {
      alert("账户名已存在")
      console.log(response)
    }
  })
      .catch(error => {
        console.log(error)
        alert(error)
      })
}

//校验
function validateAccount(account) {
  let password = document.getElementById('input_password').value;
  let password_2 = document.getElementById('password_2').value;
  let test = document.getElementById('input_test').value;
  if (password !== password_2) {
    alert("两次输入不一致")
    return false;
  }
  if (test !== "1") {
    alert("验证码输入错误")
    return false;
  }
  if (account.password.length > 16 || account.password.length < 8) {
    alert("密码长度必须在8~16之间")
    return false;
  }
  return true;
}


</script>

<template>
  <img src="../assets/classPai.png" alt="商标" class="paintingImg">
  <img src="../assets/bg.png" alt="背景" class="bg">
  <div class="register_container">
    <h1>注册账号</h1>
    <input type="text" placeholder="请输入邮箱/手机号/账号" class="input" style="margin-top: 25px"
           id="input_account"><br>
    <span class="error-message">格式不正确</span><br>
    <input type="text" placeholder="请输入密码" class="input" id="input_password"><br>
    <span class="error-message"></span><br>
    <input type="text" placeholder="请确认输入密码" class="input" id="password_2"><br>
    <span class="error-message">两次输入密码不一致</span><br>
    <h2 style="font-weight: 450;font-size: 22px">选择身份</h2>
    <div class="form">
      <button id='teacher' class="status" @click="changeTeacher"><img src="../assets/teacher.png" class="teacher">老师
      </button>
      <button id='student' class="status" @click="changeStudent"><img src="../assets/student.png" class="student">学生
      </button>
    </div>
    <input type="text" placeholder="请输入姓名" class="input" style="margin-top: 25px" id="input_name"><br>
    <span class="error-message"></span><br>
    <input type="text" placeholder="请输入学校/机构" class="input" id="input_mechanism"><br>

    <div id="studentId">
      <input type="text" placeholder="请输入学号" class="input" id="input_status_number"><br>
    </div>
    <br>
    <input type="text" placeholder="请输入计算结果" class="input" style="width: 280px" id="input_test">
    <img src="../assets/check.png" style="position: absolute;right: 37px;height: 60px"><br>
    <span class="error-message">验证失败</span><br>

    <button class="register" @click="create">注册</button>
    <div style="display: flex;right:-350px;position: relative;margin-bottom: 20px">
      <div style="font-size: 18px;right: 40px">已有账号?
        <span @click="router.push({name : 'login'})" style="color: rgb(72, 138, 248);cursor: pointer">去登陆</span>
      </div>
    </div>
  </div>
  <RouterView :key="route.fullPath"/>
</template>

<style scoped>
.paintingImg {
  left: 78px;
  position: absolute;
  top: 55px;
}

.bg {
  left: 227px;
  position: relative;
  top: 140px;
  height: 700px;
}

.register_container {
  left: 1125px;
  position: fixed;
  top: 15px;
  background-color: rgb(255, 255, 255);
  width: 560px;
  padding: 0 35px;
}

h1 {
  text-align: center;
  margin-top: 24px;
  font-weight: 5950;
  font-size: 28px;
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
  transform: translateX(-50%);
}

.input {
  height: 60px;
  width: 490px;
  padding: 4px 15px;
  margin-bottom: 0;
  margin-top: 0;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 7px;
}

a {
  text-decoration: none;
}

input::placeholder {
  color: rgb(192, 196, 207);
  font-size: 17px;
  font-weight: 2;
}

.form {
  display: flex;
}

.status {
  width: 245px;
  height: 77px;
  padding: 8px 26px;
  background-color: rgb(255, 255, 255);
  border: transparent;
  margin-top: 10px;
  line-height: 77px;
  display: flex;
  justify-content: left;
  align-items: center;
  font-size: 20px;
}

input:focus {
  outline: none;
  border-color: rgb(72, 138, 248);
  border-width: 1px;
}

.student, .teacher {
  margin-right: 20px;
}

#teacher {
  border: 1px solid rgb(72, 138, 248);
}

#studentId {
  margin-top: 20px;
  display: none;
}

button.register {
  background-color: rgb(72, 138, 248);
  height: 63px;
  width: 490px;
  padding: 4px 20px;
  border-radius: 5px;
  border: none;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 20px;
  color: white;
  cursor: pointer;
  text-align: center;
}

</style>