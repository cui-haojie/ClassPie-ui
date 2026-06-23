<script setup lang="js" name="register">

import {RouterView, useRoute, useRouter} from "vue-router";
import request from "@/utils/request.js";
import {onMounted, ref} from "vue";

const route = useRoute();
const router = useRouter();
let status = "老师";
const schoolClasses = ref([]);
const selectedClassIds = ref([]);

function loadSchoolClasses() {
  request.post('/editor/listSchoolClasses', {})
      .then(res => {
        schoolClasses.value = res || [];
      })
      .catch(err => console.error(err));
}

onMounted(() => {
  loadSchoolClasses();
});

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
  loadSchoolClasses();
}

function create() {
  const payload = {
    account: document.getElementById('input_account').value.trim(),
    password: document.getElementById('input_password').value.trim(),
    name: document.getElementById('input_name').value.trim(),
    status: status,
    mechanism: document.getElementById('input_mechanism').value.trim(),
    status_number: document.getElementById('input_status_number').value.trim(),
  }

  if (!validateAccount(payload)) return;

  if (status === '学生') {
    if (selectedClassIds.value.length === 0) {
      alert("请至少选择一个行政班级");
      return;
    }
    payload.school_class_ids = selectedClassIds.value.map(Number);
  }

  request.post('/editor/add', payload).then(response => {
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
  <div class="auth-page">
    <div class="auth-left">
      <img src="../assets/classPai.png" alt="商标" class="paintingImg">
      <img src="../assets/bg.png" alt="背景" class="bg">
    </div>
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
        <div class="class-picker">
          <p class="class-picker-title">行政班级（可多选）</p>
          <label v-for="sc in schoolClasses" :key="sc.id" class="class-option">
            <input type="checkbox" :value="sc.id" v-model="selectedClassIds">
            {{ sc.name }}{{ sc.mechanism ? ' · ' + sc.mechanism : '' }}
          </label>
          <p v-if="schoolClasses.length === 0" class="class-picker-empty">暂无班级，请联系老师先创建</p>
        </div>
      </div>
      <br>
      <div class="captcha-row">
        <input type="text" placeholder="请输入计算结果" class="input captcha-input" id="input_test">
        <img src="../assets/check.png" class="captcha-img" alt="验证码">
      </div>
      <span class="error-message">验证失败</span><br>

      <button class="register" @click="create">注册</button>
      <div class="login-link">已有账号?
        <span @click="router.push({name : 'login'})" style="color: rgb(72, 138, 248);cursor: pointer">去登陆</span>
      </div>
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

.auth-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  max-width: 640px;
  min-width: 0;
}

.paintingImg {
  margin-bottom: 24px;
  max-width: 100%;
  height: auto;
}

.bg {
  max-width: 100%;
  height: auto;
  max-height: 560px;
  object-fit: contain;
}

.register_container {
  position: relative;
  background-color: rgb(255, 255, 255);
  width: 560px;
  max-width: 100%;
  padding: 0 35px 24px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, .1);
  flex-shrink: 0;
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

.class-select {
  margin-top: 12px;
}

.class-picker {
  margin-top: 12px;
  padding: 12px 15px;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 7px;
  background: #fff;
  max-width: 490px;
}

.class-picker-title {
  margin: 0 0 8px;
  font-size: 15px;
  color: #666;
}

.class-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 16px;
  color: rgb(95, 99, 148);
  cursor: pointer;
}

.class-option input {
  width: 16px;
  height: 16px;
}

.class-picker-empty {
  margin: 0;
  color: #999;
  font-size: 14px;
}

button.register {
  background-color: rgb(72, 138, 248);
  height: 63px;
  width: 100%;
  max-width: 490px;
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

.captcha-row {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 490px;
}

.captcha-input {
  flex: 1;
  min-width: 0;
}

.captcha-img {
  height: 60px;
  flex-shrink: 0;
}

.login-link {
  font-size: 18px;
  text-align: right;
  margin-bottom: 20px;
}

</style>