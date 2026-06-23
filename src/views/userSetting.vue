<script setup lang="js" name="UserSettingsPage">
import {useAccountStore} from "@/stores/account.js";
import {storeToRefs} from "pinia";
import {computed, onMounted, reactive, ref} from "vue";
import request from "@/utils/request.js";
import {useRouter} from "vue-router";
import {toast} from '@/utils/toast.js';
import PasswordInput from '@/components/PasswordInput.vue';
import {INSTITUTION_OPTIONS, resolveMechanism} from '@/constants/institutions.js';
import {
  validateMechanism,
  validateName,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
  validateStudentId,
} from '@/utils/formValidate.js';

const activeName = ref('first');
const editingField = ref('');
const saving = ref(false);

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
const schoolClassName = ref('')
const studentClassIds = ref([])
const schoolClasses = ref([])

const institutionOptions = INSTITUTION_OPTIONS

const filteredSchoolClasses = computed(() => {
  if (!mechanism.value) return schoolClasses.value
  return schoolClasses.value.filter(sc => !sc.mechanism || sc.mechanism === mechanism.value)
})

const editDraft = reactive({
  name: '',
  status: '',
  email_or_phone: '',
  password: '',
  passwordConfirm: '',
  status_number: '',
  mechanism: '',
  customMechanism: '',
  schoolClassIds: [],
})

const editErrors = reactive({
  name: '',
  status: '',
  email_or_phone: '',
  password: '',
  passwordConfirm: '',
  status_number: '',
  mechanism: '',
  customMechanism: '',
  schoolClasses: '',
})

function mechanismToForm(value) {
  const matched = INSTITUTION_OPTIONS.find(item => item.value === value && value !== '__other__')
  if (matched) {
    return { mechanism: value, customMechanism: '' }
  }
  return { mechanism: value ? '__other__' : '', customMechanism: value || '' }
}

function update() {
  if (!account.value) {
    toast.warning('请先登录')
    return
  }
  request.post("/editor/account", {account: account.value})
      .then((res) => {
        if (!res?.account) {
          toast.error('获取账户信息失败')
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
        toast.error(error.message || "请求失败")
      })

  request.post("/editor/studentSchoolClass", {account: account.value})
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.name ? [res] : [])
        studentClassIds.value = list.map(item => item.id).filter(Boolean)
        schoolClassName.value = list.map(item => item.name).filter(Boolean).join('、')
      })
      .catch(() => {
        studentClassIds.value = []
        schoolClassName.value = ''
      })
}

function loadSchoolClasses() {
  request.post('/editor/listSchoolClasses', {})
      .then(res => {
        schoolClasses.value = res || []
      })
      .catch(err => console.error(err))
}

function clearEditErrors() {
  Object.keys(editErrors).forEach(key => {
    editErrors[key] = ''
  })
}

function startEdit(field) {
  if (editingField.value && editingField.value !== field) {
    cancelEdit()
  }
  editingField.value = field
  clearEditErrors()

  switch (field) {
    case 'name':
      editDraft.name = name.value
      break
    case 'status':
      editDraft.status = status.value || '学生'
      break
    case 'email_or_phone':
      editDraft.email_or_phone = email_or_phone.value === 'yes' ? '' : email_or_phone.value
      break
    case 'password':
      editDraft.password = ''
      editDraft.passwordConfirm = ''
      break
    case 'status_number':
      editDraft.status_number = status_number.value
      break
    case 'mechanism': {
      const form = mechanismToForm(mechanism.value)
      editDraft.mechanism = form.mechanism
      editDraft.customMechanism = form.customMechanism
      break
    }
    case 'schoolClasses':
      editDraft.schoolClassIds = [...studentClassIds.value]
      break
    default:
      break
  }
}

function cancelEdit() {
  editingField.value = ''
  clearEditErrors()
}

function setEditError(field, message) {
  editErrors[field] = message || ''
}

function validateEditField(field) {
  switch (field) {
    case 'name':
      setEditError('name', validateName(editDraft.name))
      break
    case 'status':
      setEditError('status', editDraft.status ? '' : '请选择角色')
      break
    case 'email_or_phone':
      setEditError('email_or_phone', validatePhone(editDraft.email_or_phone))
      break
    case 'password':
      setEditError('password', validatePassword(editDraft.password))
      if (editDraft.passwordConfirm) validateEditField('passwordConfirm')
      break
    case 'passwordConfirm':
      setEditError('passwordConfirm', validatePasswordConfirm(editDraft.password, editDraft.passwordConfirm))
      break
    case 'status_number':
      setEditError('status_number', validateStudentId(editDraft.status_number))
      break
    case 'mechanism':
      setEditError('mechanism', validateMechanism(editDraft.mechanism, editDraft.customMechanism))
      if (editDraft.mechanism === '__other__') validateEditField('customMechanism')
      break
    case 'customMechanism':
      setEditError('customMechanism', validateMechanism(editDraft.mechanism, editDraft.customMechanism))
      break
    case 'schoolClasses':
      setEditError('schoolClasses', editDraft.schoolClassIds.length ? '' : '请至少选择一个行政班级')
      break
    default:
      break
  }
}

function validateEditForm(field) {
  const fields = field === 'password'
      ? ['password', 'passwordConfirm']
      : field === 'mechanism'
          ? (editDraft.mechanism === '__other__' ? ['mechanism', 'customMechanism'] : ['mechanism'])
          : field === 'schoolClasses'
              ? ['schoolClasses']
              : [field]

  fields.forEach(validateEditField)
  return fields.every(item => !editErrors[item])
}

async function saveEdit(field) {
  if (saving.value) return
  if (!validateEditForm(field)) return

  saving.value = true
  try {
    if (field === 'password') {
      const ok = await request.put('/editor/change', {
        account: account.value,
        password: editDraft.password.trim(),
      })
      if (ok) {
        toast.success('密码修改成功，请重新登录')
        cancelEdit()
        accountStore.logout()
        router.push({ name: 'login' })
      } else {
        toast.error('密码修改失败')
      }
      return
    }

    if (field === 'schoolClasses') {
      const ok = await request.put('/editor/updateStudentSchoolClasses', {
        account: account.value,
        school_class_ids: editDraft.schoolClassIds.map(Number),
      })
      if (ok) {
        toast.success('班级更新成功，已自动加入关联课程')
        cancelEdit()
        update()
      } else {
        toast.error('班级更新失败，请确认至少选择一个有效班级')
      }
      return
    }

    const payload = { account: account.value }
    switch (field) {
      case 'name':
        payload.name = editDraft.name.trim()
        break
      case 'status':
        payload.status = editDraft.status
        break
      case 'email_or_phone':
        payload.email_or_phone = editDraft.email_or_phone.trim()
        break
      case 'status_number':
        payload.status_number = editDraft.status_number.trim()
        break
      case 'mechanism':
        payload.mechanism = resolveMechanism(editDraft.mechanism, editDraft.customMechanism)
        break
      default:
        break
    }

    const ok = await request.put('/editor/updateAccount', payload)
    if (ok) {
      toast.success('修改成功')
      cancelEdit()
      update()
    } else {
      toast.error('修改失败，请确认后端已重启')
    }
  } catch (err) {
    console.error(err)
    toast.error('修改失败，请检查后端是否运行')
  } finally {
    saving.value = false
  }
}

function maskPhone(phone) {
  if (!phone || phone === 'yes') return '未绑定'
  if (phone.length <= 4) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

function bindHint(feature) {
  toast.info(`${feature}功能暂未开放`)
}

onMounted(() => {
  loadSchoolClasses()
})

update()
</script>

<template>
  <div class="user-settings-page">
    <div class="us-container">
      <div class="us-header">
        <img src="@/assets/head.png" class="us-avatar" alt="头像"/>
        <div class="us-info">
          <h2 class="us-username">{{ name || account_1 }}</h2>
          <button type="button" class="us-vip-btn">开通课堂派VIP</button>
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
        <h2 class="set_name">账号设置</h2>
        <ul class="accountReal">
          <li class="row-first">
            <label>账号</label>
            <span class="content">{{ account_1 }}</span>
          </li>

          <li :class="{ 'row-editing': editingField === 'status' }">
            <label>所属角色</label>
            <div class="field-body">
              <template v-if="editingField !== 'status'">
                <span class="content">{{ status || '未设置' }}</span>
              </template>
              <template v-else>
                <div class="inline-edit">
                  <select
                      v-model="editDraft.status"
                      class="inline-input inline-select"
                      :class="{ 'input-invalid': editErrors.status }"
                      @change="validateEditField('status')"
                  >
                    <option value="学生">学生</option>
                    <option value="老师">老师</option>
                  </select>
                  <p v-if="editErrors.status" class="field-error">{{ editErrors.status }}</p>
                </div>
              </template>
            </div>
            <div class="right">
              <template v-if="editingField !== 'status'">
                <span class="action-link" @click="startEdit('status')">去设置</span>
              </template>
              <template v-else>
                <span class="action-link muted" @click="cancelEdit">取消</span>
                <span class="action-link" :class="{ disabled: saving }" @click="saveEdit('status')">保存</span>
              </template>
            </div>
          </li>

          <li :class="{ 'row-editing': editingField === 'email_or_phone' }">
            <label>手机号</label>
            <div class="field-body">
              <template v-if="editingField !== 'email_or_phone'">
                <span class="content">{{ maskPhone(email_or_phone) }}</span>
              </template>
              <template v-else>
                <div class="inline-edit">
                  <input
                      v-model="editDraft.email_or_phone"
                      type="tel"
                      maxlength="11"
                      class="inline-input"
                      :class="{ 'input-invalid': editErrors.email_or_phone }"
                      placeholder="请输入 11 位手机号"
                      @blur="validateEditField('email_or_phone')"
                  >
                  <p v-if="editErrors.email_or_phone" class="field-error">{{ editErrors.email_or_phone }}</p>
                </div>
              </template>
            </div>
            <div class="right">
              <template v-if="editingField !== 'email_or_phone'">
                <span class="action-link" @click="startEdit('email_or_phone')">更换手机号</span>
              </template>
              <template v-else>
                <span class="action-link muted" @click="cancelEdit">取消</span>
                <span class="action-link" :class="{ disabled: saving }" @click="saveEdit('email_or_phone')">保存</span>
              </template>
            </div>
          </li>

          <li class="row-last" :class="{ 'row-editing': editingField === 'password' }">
            <label>密码</label>
            <div class="field-body">
              <template v-if="editingField !== 'password'">
                <span class="content">{{ password }}</span>
              </template>
              <template v-else>
                <div class="inline-edit inline-edit-stack">
                  <PasswordInput
                      v-model="editDraft.password"
                      placeholder="新密码（8~16 位，含字母和数字）"
                      :invalid="!!editErrors.password"
                      @blur="validateEditField('password')"
                  />
                  <p v-if="editErrors.password" class="field-error">{{ editErrors.password }}</p>
                  <PasswordInput
                      v-model="editDraft.passwordConfirm"
                      placeholder="确认新密码"
                      :invalid="!!editErrors.passwordConfirm"
                      @blur="validateEditField('passwordConfirm')"
                  />
                  <p v-if="editErrors.passwordConfirm" class="field-error">{{ editErrors.passwordConfirm }}</p>
                </div>
              </template>
            </div>
            <div class="right">
              <template v-if="editingField !== 'password'">
                <span class="action-link" @click="startEdit('password')">修改密码</span>
              </template>
              <template v-else>
                <span class="action-link muted" @click="cancelEdit">取消</span>
                <span class="action-link" :class="{ disabled: saving }" @click="saveEdit('password')">保存</span>
              </template>
            </div>
          </li>
        </ul>

        <h2 class="set_name">基础信息</h2>
        <ul class="accountReal">
          <li class="row-first" :class="{ 'row-editing': editingField === 'name' }">
            <label>姓名</label>
            <div class="field-body">
              <template v-if="editingField !== 'name'">
                <span class="content" v-if="name">{{ name }}</span>
                <span class="hint" v-else>未完善</span>
              </template>
              <template v-else>
                <div class="inline-edit">
                  <input
                      v-model="editDraft.name"
                      type="text"
                      maxlength="20"
                      class="inline-input"
                      :class="{ 'input-invalid': editErrors.name }"
                      placeholder="请输入中文姓名"
                      @blur="validateEditField('name')"
                  >
                  <p v-if="editErrors.name" class="field-error">{{ editErrors.name }}</p>
                </div>
              </template>
            </div>
            <div class="right">
              <template v-if="editingField !== 'name'">
                <span class="action-link" @click="startEdit('name')">编辑</span>
              </template>
              <template v-else>
                <span class="action-link muted" @click="cancelEdit">取消</span>
                <span class="action-link" :class="{ disabled: saving }" @click="saveEdit('name')">保存</span>
              </template>
            </div>
          </li>

          <li :class="{ 'row-editing': editingField === 'status_number' }">
            <label>学号</label>
            <div class="field-body">
              <template v-if="editingField !== 'status_number'">
                <span class="content" v-if="status_number">{{ status_number }}</span>
                <span class="hint" v-else>未完善</span>
              </template>
              <template v-else>
                <div class="inline-edit">
                  <input
                      v-model="editDraft.status_number"
                      type="text"
                      inputmode="numeric"
                      maxlength="20"
                      class="inline-input"
                      :class="{ 'input-invalid': editErrors.status_number }"
                      placeholder="6~20 位数字"
                      @input="editDraft.status_number = editDraft.status_number.replace(/\D/g, '')"
                      @blur="validateEditField('status_number')"
                  >
                  <p v-if="editErrors.status_number" class="field-error">{{ editErrors.status_number }}</p>
                </div>
              </template>
            </div>
            <div class="right">
              <template v-if="editingField !== 'status_number'">
                <span class="action-link" @click="startEdit('status_number')">编辑</span>
              </template>
              <template v-else>
                <span class="action-link muted" @click="cancelEdit">取消</span>
                <span class="action-link" :class="{ disabled: saving }" @click="saveEdit('status_number')">保存</span>
              </template>
            </div>
          </li>

          <li :class="{ 'row-editing': editingField === 'mechanism' }">
            <label>学校</label>
            <div class="field-body">
              <template v-if="editingField !== 'mechanism'">
                <span class="content" v-if="mechanism">{{ mechanism }}</span>
                <span class="hint" v-else>未完善</span>
              </template>
              <template v-else>
                <div class="inline-edit inline-edit-stack">
                  <select
                      v-model="editDraft.mechanism"
                      class="inline-input inline-select"
                      :class="{ 'input-invalid': editErrors.mechanism }"
                      @change="validateEditField('mechanism')"
                  >
                    <option value="">请选择学校</option>
                    <option v-for="item in institutionOptions" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                  <p v-if="editErrors.mechanism" class="field-error">{{ editErrors.mechanism }}</p>
                  <template v-if="editDraft.mechanism === '__other__'">
                    <input
                        v-model="editDraft.customMechanism"
                        type="text"
                        maxlength="50"
                        class="inline-input"
                        :class="{ 'input-invalid': editErrors.customMechanism }"
                        placeholder="请输入其他学校/机构名称"
                        @blur="validateEditField('customMechanism')"
                    >
                    <p v-if="editErrors.customMechanism" class="field-error">{{ editErrors.customMechanism }}</p>
                  </template>
                </div>
              </template>
            </div>
            <div class="right">
              <template v-if="editingField !== 'mechanism'">
                <span class="action-link" @click="startEdit('mechanism')">编辑</span>
              </template>
              <template v-else>
                <span class="action-link muted" @click="cancelEdit">取消</span>
                <span class="action-link" :class="{ disabled: saving }" @click="saveEdit('mechanism')">保存</span>
              </template>
            </div>
          </li>

          <li>
            <label>院系</label><span class="hint">未完善</span>
          </li>
          <li>
            <label>专业</label><span class="hint">未完善</span>
          </li>
          <li :class="{ 'row-editing': editingField === 'schoolClasses' }">
            <label>班级</label>
            <div class="field-body">
              <template v-if="editingField !== 'schoolClasses'">
                <span class="content" v-if="schoolClassName">{{ schoolClassName }}</span>
                <span class="hint" v-else-if="status === '老师'">教师账号无需绑定行政班</span>
                <span class="hint" v-else>未完善</span>
              </template>
              <template v-else>
                <div class="inline-edit">
                  <div class="class-picker" :class="{ 'picker-invalid': editErrors.schoolClasses }">
                    <p class="class-picker-title">行政班级（可多选）</p>
                    <label
                        v-for="sc in filteredSchoolClasses"
                        :key="sc.id"
                        class="class-option"
                    >
                      <input
                          type="checkbox"
                          :value="sc.id"
                          v-model="editDraft.schoolClassIds"
                          @change="validateEditField('schoolClasses')"
                      >
                      {{ sc.name }}{{ sc.mechanism ? ' · ' + sc.mechanism : '' }}
                    </label>
                    <p v-if="filteredSchoolClasses.length === 0" class="class-picker-empty">
                      {{ mechanism ? '该学校下暂无班级，请联系老师创建' : '请先完善学校信息' }}
                    </p>
                  </div>
                  <p v-if="editErrors.schoolClasses" class="field-error">{{ editErrors.schoolClasses }}</p>
                </div>
              </template>
            </div>
            <div v-if="status === '学生'" class="right">
              <template v-if="editingField !== 'schoolClasses'">
                <span class="action-link" @click="startEdit('schoolClasses')">编辑</span>
              </template>
              <template v-else>
                <span class="action-link muted" @click="cancelEdit">取消</span>
                <span class="action-link" :class="{ disabled: saving }" @click="saveEdit('schoolClasses')">保存</span>
              </template>
            </div>
          </li>
          <li>
            <label>年级</label><span class="hint">未完善</span>
          </li>
          <li class="row-last">
            <label>入学时间</label><span class="hint">未完善</span>
          </li>
        </ul>

        <h2 class="set_name">第三方账号绑定</h2>
        <ul class="accountReal">
          <li class="row-first">
            <label>邮箱绑定</label><span class="hint">未完善</span>
            <p class="right"><span class="action-link" @click="bindHint('邮箱绑定')">立即绑定</span></p>
          </li>
          <li class="row-last">
            <label>微信绑定</label><span class="hint">未完善</span>
            <p class="right"><span class="action-link" @click="bindHint('微信绑定')">立即绑定</span></p>
          </li>
        </ul>
      </div>

      <div class="account" v-show="activeName === 'second'">
        <p class="hint notify-hint">通知设置功能暂未开放</p>
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
  margin-top: 20px;
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
  padding: 24px 0 12px;
  margin: 0;
}

ul {
  border-radius: 5px;
  border-left: 5px solid rgb(66, 133, 244);
  margin: 0 0 8px;
  padding: 0;
}

li {
  list-style-type: none;
  padding: 16px 0;
  min-height: 68px;
  line-height: 34px;
  background-color: #FFFFFF;
  border: 1px solid rgb(218, 220, 224);
  margin: 0 0 -1px 4px;
  border-left: none !important;
  display: flex;
  position: relative;
  align-items: center;
}

li.row-editing {
  align-items: flex-start;
  padding-top: 18px;
  padding-bottom: 18px;
}

.row-first {
  border-top-right-radius: 5px;
}

.row-last {
  border-bottom-right-radius: 5px;
}

label {
  padding: 0 24px;
  color: #000000;
  font-size: 18px;
  width: 195px;
  flex-shrink: 0;
}

.field-body {
  flex: 1;
  min-width: 0;
  padding-right: 180px;
}

.right {
  display: flex;
  gap: 16px;
  position: absolute;
  right: 80px;
  top: 50%;
  transform: translateY(-50%);
}

li.row-editing .right {
  top: 24px;
  transform: none;
}

.action-link {
  cursor: pointer;
  color: rgb(66, 133, 244);
  white-space: nowrap;
}

.action-link.muted {
  color: #909399;
}

.action-link.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.content {
  color: rgb(95, 99, 148);
}

.hint {
  color: rgb(95, 99, 148);
}

.notify-hint {
  padding: 24px 0;
}

.inline-edit {
  max-width: 360px;
}

.inline-edit-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 420px;
}

.inline-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 6px;
  font-size: 15px;
  color: #303133;
  box-sizing: border-box;
  background: #fff;
}

.inline-input:focus {
  outline: none;
  border-color: rgb(72, 138, 248);
  box-shadow: 0 0 0 3px rgba(72, 138, 248, 0.12);
}

.inline-input.input-invalid {
  border-color: #f56c6c;
}

.inline-input.input-invalid:focus {
  border-color: #f56c6c;
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.12);
}

.inline-select {
  cursor: pointer;
}

.field-error {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.4;
  color: #f56c6c;
}

.inline-edit-stack :deep(.password-field) {
  max-width: none;
}

.inline-edit-stack :deep(.password-input) {
  height: 40px;
  padding: 4px 56px 4px 12px;
  font-size: 15px;
  border-radius: 6px;
}

.inline-edit-stack :deep(.password-input::placeholder) {
  font-size: 14px;
}

.inline-edit-stack :deep(.password-toggle) {
  font-size: 13px;
}

.class-picker {
  padding: 12px;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 6px;
  background: #fff;
  max-width: 420px;
}

.class-picker.picker-invalid {
  border-color: #f56c6c;
}

.class-picker-title {
  margin: 0 0 8px;
  font-size: 14px;
  color: #666;
}

.class-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 14px;
  color: #303133;
  cursor: pointer;
}

.class-picker-empty {
  margin: 0;
  color: #999;
  font-size: 13px;
}
</style>
