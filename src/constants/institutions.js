export const INSTITUTION_OPTIONS = [
  { label: '重庆大学', value: '重庆大学' },
  { label: '西南大学', value: '西南大学' },
  { label: '重庆邮电大学', value: '重庆邮电大学' },
  { label: '重庆交通大学', value: '重庆交通大学' },
  { label: '重庆医科大学', value: '重庆医科大学' },
  { label: '西南政法大学', value: '西南政法大学' },
  { label: '重庆师范大学', value: '重庆师范大学' },
  { label: '重庆理工大学', value: '重庆理工大学' },
  { label: '重庆工商大学', value: '重庆工商大学' },
  { label: '四川外国语大学', value: '四川外国语大学' },
  { label: '四川美术学院', value: '四川美术学院' },
  { label: '重庆科技大学', value: '重庆科技大学' },
  { label: '其他院校/机构', value: '__other__' },
]

export function resolveMechanism(selected, custom) {
  if (!selected) return ''
  if (selected === '__other__') return (custom || '').trim()
  return selected
}
