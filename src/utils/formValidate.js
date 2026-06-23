/** 账号：4~32 位，字母数字下划线或邮箱或手机号 */
export function validateAccount(value) {
  const v = (value || '').trim()
  if (!v) return '请输入账号'
  if (v.length < 4 || v.length > 32) return '账号长度为 4~32 位'
  const email = /^[\w.-]+@[\w.-]+\.\w{2,}$/
  const phone = /^1[3-9]\d{9}$/
  const account = /^[\w@.+-]+$/
  if (email.test(v) || phone.test(v)) return ''
  if (/^\d+$/.test(v) && !phone.test(v)) return '手机号格式不正确'
  if (!account.test(v)) return '账号仅支持字母、数字及 _@.+-'
  return ''
}

export function validatePhone(value) {
  const v = (value || '').trim()
  if (!v) return '请输入手机号'
  if (!/^1[3-9]\d{9}$/.test(v)) return '请输入正确的 11 位手机号'
  return ''
}

/** 密码：8~16 位，至少包含字母和数字 */
export function validatePassword(value) {
  const v = value || ''
  if (!v) return '请输入密码'
  if (v.length < 8 || v.length > 16) return '密码长度为 8~16 位'
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return '密码须同时包含字母和数字'
  return ''
}

export function validatePasswordConfirm(password, confirm) {
  if (!confirm) return '请再次输入密码'
  if (password !== confirm) return '两次输入密码不一致'
  return ''
}

/** 姓名：2~20 位中文或· */
export function validateName(value) {
  const v = (value || '').trim()
  if (!v) return '请输入姓名'
  if (v.length < 2 || v.length > 20) return '姓名长度为 2~20 位'
  if (!/^[\u4e00-\u9fa5·]+$/.test(v)) return '姓名请输入中文'
  return ''
}

export function validateMechanism(value, customValue) {
  if (!value) return '请选择学校/机构'
  if (value === '__other__' && !(customValue || '').trim()) return '请输入其他学校/机构名称'
  if (value === '__other__' && (customValue || '').trim().length > 50) return '机构名称不超过 50 字'
  return ''
}

/** 学号：6~20 位纯数字 */
export function validateStudentId(value) {
  const v = (value || '').trim()
  if (!v) return '请输入学号'
  if (!/^\d{6,20}$/.test(v)) return '学号为 6~20 位数字'
  return ''
}

export function validateCaptcha(value, expected = '1') {
  const v = (value || '').trim()
  if (!v) return '请输入验证码计算结果'
  if (v !== expected) return '验证码输入错误'
  return ''
}

export function validateLoginPassword(value) {
  const v = value || ''
  if (!v) return '请输入密码'
  if (v.length < 8 || v.length > 16) return '密码长度为 8~16 位'
  return ''
}
