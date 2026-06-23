<script setup lang="js" name="register">

import {RouterView, useRoute, useRouter} from "vue-router";
import request from "@/utils/request.js";
import PasswordInput from '@/components/PasswordInput.vue';
import {computed, onMounted, reactive, ref} from "vue";
import {INSTITUTION_OPTIONS, resolveMechanism} from '@/constants/institutions.js';
import {
  validateAccount,
  validateCaptcha,
  validateMechanism,
  validateName,
  validatePassword,
  validatePasswordConfirm,
  validateStudentId,
} from '@/utils/formValidate.js';
import {toast} from '@/utils/toast.js';

const route = useRoute();
const router = useRouter();

const status = ref('老师');
const schoolClasses = ref([]);
const selectedClassIds = ref([]);

const form = reactive({
  account: '',
  password: '',
  passwordConfirm: '',
  name: '',
  mechanism: '',
  customMechanism: '',
  status_number: '',
  captcha: '',
});

const errors = reactive({
  account: '',
  password: '',
  passwordConfirm: '',
  name: '',
  mechanism: '',
  customMechanism: '',
  status_number: '',
  captcha: '',
  schoolClasses: '',
});

const institutionOptions = INSTITUTION_OPTIONS;

const filteredSchoolClasses = computed(() => {
  const mechanism = resolveMechanism(form.mechanism, form.customMechanism);
  if (!mechanism) return schoolClasses.value;
  return schoolClasses.value.filter(sc => !sc.mechanism || sc.mechanism === mechanism);
});

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

function setError(field, message) {
  errors[field] = message || '';
}

function validateField(field) {
  switch (field) {
    case 'account':
      setError('account', validateAccount(form.account));
      break;
    case 'password':
      setError('password', validatePassword(form.password));
      if (form.passwordConfirm) validateField('passwordConfirm');
      break;
    case 'passwordConfirm':
      setError('passwordConfirm', validatePasswordConfirm(form.password, form.passwordConfirm));
      break;
    case 'name':
      setError('name', validateName(form.name));
      break;
    case 'mechanism':
      setError('mechanism', validateMechanism(form.mechanism, form.customMechanism));
      if (form.mechanism === '__other__') validateField('customMechanism');
      selectedClassIds.value = [];
      break;
    case 'customMechanism':
      setError('customMechanism', validateMechanism(form.mechanism, form.customMechanism));
      selectedClassIds.value = [];
      break;
    case 'status_number':
      setError('status_number', validateStudentId(form.status_number));
      break;
    case 'captcha':
      setError('captcha', validateCaptcha(form.captcha));
      break;
    default:
      break;
  }
}

function validateAll() {
  validateField('account');
  validateField('password');
  validateField('passwordConfirm');
  validateField('name');
  validateField('mechanism');
  if (form.mechanism === '__other__') validateField('customMechanism');
  validateField('captcha');

  if (status.value === '学生') {
    validateField('status_number');
    if (selectedClassIds.value.length === 0) {
      setError('schoolClasses', '请至少选择一个行政班级');
    } else {
      setError('schoolClasses', '');
    }
  } else {
    setError('status_number', '');
    setError('schoolClasses', '');
  }

  return !Object.values(errors).some(msg => msg);
}

function changeTeacher() {
  status.value = '老师';
  setError('status_number', '');
  setError('schoolClasses', '');
  selectedClassIds.value = [];
}

function changeStudent() {
  status.value = '学生';
  loadSchoolClasses();
}

function create() {
  if (!validateAll()) return;

  const payload = {
    account: form.account.trim(),
    password: form.password,
    name: form.name.trim(),
    status: status.value,
    mechanism: resolveMechanism(form.mechanism, form.customMechanism),
    status_number: status.value === '学生' ? form.status_number.trim() : '',
  };

  if (status.value === '学生') {
    payload.school_class_ids = selectedClassIds.value.map(Number);
  }

  request.post('/editor/add', payload).then(response => {
    if (response === true) {
      toast.success('注册成功');
      router.push({ name: 'login' });
    } else {
      toast.error('账户名已存在');
    }
  }).catch(error => {
    console.error(error);
    toast.error('注册失败，请稍后重试');
  });
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

      <input
          v-model="form.account"
          type="text"
          placeholder="请输入邮箱/手机号/账号"
          class="input"
          :class="{ 'input-invalid': errors.account }"
          style="margin-top: 25px"
          @blur="validateField('account')"
      >
      <span class="error-message" :class="{ visible: errors.account }">{{ errors.account || ' ' }}</span>

      <PasswordInput
          v-model="form.password"
          id="input_password"
          placeholder="请输入密码"
          :invalid="!!errors.password"
          @blur="validateField('password')"
      />
      <span class="error-message" :class="{ visible: errors.password }">{{ errors.password || ' ' }}</span>

      <PasswordInput
          v-model="form.passwordConfirm"
          id="password_2"
          placeholder="请确认输入密码"
          :invalid="!!errors.passwordConfirm"
          @blur="validateField('passwordConfirm')"
      />
      <span class="error-message" :class="{ visible: errors.passwordConfirm }">{{ errors.passwordConfirm || ' ' }}</span>

      <h2 class="section-title">选择身份</h2>
      <div class="form">
        <button
            type="button"
            class="status"
            :class="{ active: status === '老师' }"
            @click="changeTeacher"
        >
          <img src="../assets/teacher.png" class="teacher" alt="">老师
        </button>
        <button
            type="button"
            class="status"
            :class="{ active: status === '学生' }"
            @click="changeStudent"
        >
          <img src="../assets/student.png" class="student" alt="">学生
        </button>
      </div>

      <input
          v-model="form.name"
          type="text"
          placeholder="请输入姓名"
          class="input"
          :class="{ 'input-invalid': errors.name }"
          @blur="validateField('name')"
      >
      <span class="error-message" :class="{ visible: errors.name }">{{ errors.name || ' ' }}</span>

      <select
          v-model="form.mechanism"
          class="input select-input"
          :class="{ 'input-invalid': errors.mechanism }"
          @change="validateField('mechanism')"
      >
        <option value="">请选择学校/机构</option>
        <option v-for="item in institutionOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </select>
      <span class="error-message" :class="{ visible: errors.mechanism }">{{ errors.mechanism || ' ' }}</span>

      <input
          v-if="form.mechanism === '__other__'"
          v-model="form.customMechanism"
          type="text"
          placeholder="请输入学校/机构名称"
          class="input"
          :class="{ 'input-invalid': errors.customMechanism }"
          @blur="validateField('customMechanism')"
      >
      <span
          v-if="form.mechanism === '__other__'"
          class="error-message"
          :class="{ visible: errors.customMechanism }"
      >{{ errors.customMechanism || ' ' }}</span>

      <div v-if="status === '学生'" class="student-block">
        <input
            v-model="form.status_number"
            type="text"
            inputmode="numeric"
            maxlength="20"
            placeholder="请输入 6~20 位数字学号"
            class="input"
            :class="{ 'input-invalid': errors.status_number }"
            @input="form.status_number = form.status_number.replace(/\D/g, '')"
            @blur="validateField('status_number')"
        >
        <span class="error-message" :class="{ visible: errors.status_number }">{{ errors.status_number || ' ' }}</span>

        <div class="class-picker" :class="{ 'picker-invalid': errors.schoolClasses }">
          <p class="class-picker-title">行政班级（可多选）</p>
          <label
              v-for="sc in filteredSchoolClasses"
              :key="sc.id"
              class="class-option"
          >
            <input type="checkbox" :value="sc.id" v-model="selectedClassIds" @change="setError('schoolClasses', '')">
            {{ sc.name }}{{ sc.mechanism ? ' · ' + sc.mechanism : '' }}
          </label>
          <p v-if="filteredSchoolClasses.length === 0" class="class-picker-empty">
            {{ form.mechanism ? '该机构下暂无班级，请联系老师创建' : '请先选择学校/机构' }}
          </p>
        </div>
        <span class="error-message" :class="{ visible: errors.schoolClasses }">{{ errors.schoolClasses || ' ' }}</span>
      </div>

      <div class="captcha-row">
        <input
            v-model="form.captcha"
            type="text"
            placeholder="请输入计算结果"
            class="input captcha-input"
            :class="{ 'input-invalid': errors.captcha }"
            @blur="validateField('captcha')"
        >
        <img src="../assets/check.png" class="captcha-img" alt="验证码">
      </div>
      <span class="error-message" :class="{ visible: errors.captcha }">{{ errors.captcha || ' ' }}</span>

      <button type="button" class="register" @click="create">注册</button>
      <div class="login-link">已有账号?
        <span @click="router.push({name : 'login'})" class="link">去登陆</span>
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

.section-title {
  font-weight: 450;
  font-size: 22px;
  margin: 8px 0;
}

.error-message {
  display: block;
  min-height: 20px;
  font-size: 12px;
  color: transparent;
  padding: 2px 0 4px;
  letter-spacing: 1px;
}

.error-message.visible {
  color: #f56c6c;
}

.input {
  height: 60px;
  width: 100%;
  max-width: 490px;
  padding: 4px 15px;
  margin-top: 0;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 7px;
  font-size: 17px;
  box-sizing: border-box;
}

.select-input {
  appearance: auto;
  background: #fff;
  color: #333;
}

.input-invalid {
  border-color: #f56c6c;
}

input:focus,
select:focus {
  outline: none;
  border-color: rgb(72, 138, 248);
}

.input-invalid:focus {
  border-color: #f56c6c;
}

input::placeholder {
  color: rgb(192, 196, 207);
  font-size: 17px;
}

.form {
  display: flex;
}

.status {
  width: 245px;
  height: 77px;
  padding: 8px 26px;
  background-color: rgb(255, 255, 255);
  border: 1px solid transparent;
  margin-top: 10px;
  line-height: 77px;
  display: flex;
  justify-content: left;
  align-items: center;
  font-size: 20px;
  cursor: pointer;
}

.status.active {
  border-color: rgb(72, 138, 248);
}

.student, .teacher {
  margin-right: 20px;
}

.student-block {
  margin-top: 8px;
}

.class-picker {
  margin-top: 12px;
  padding: 12px 15px;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 7px;
  background: #fff;
  max-width: 490px;
}

.class-picker.picker-invalid {
  border-color: #f56c6c;
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
  margin-top: 8px;
  margin-bottom: 10px;
  font-size: 20px;
  color: white;
  cursor: pointer;
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

.link {
  color: rgb(72, 138, 248);
  cursor: pointer;
}
</style>
