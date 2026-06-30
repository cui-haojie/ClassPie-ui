export const SEMESTER_OPTIONS = [
  { label: '2025-2026 第二学期', value: '2025-2026 第二学期' },
  { label: '2025-2026 第一学期', value: '2025-2026 第一学期' },
  { label: '2024-2025 第二学期', value: '2024-2025 第二学期' },
  { label: '2024-2025 第一学期', value: '2024-2025 第一学期' },
  { label: '2023-2024 第二学期', value: '2023-2024 第二学期' },
  { label: '2023-2024 第一学期', value: '2023-2024 第一学期' },
]

export function getDefaultSemester() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  if (month >= 9) {
    return `${year}-${year + 1} 第一学期`
  }
  if (month >= 3) {
    return `${year - 1}-${year} 第二学期`
  }
  return `${year - 1}-${year} 第一学期`
}

export function getSemesterRank(value) {
  if (!value) return -1
  const matched = String(value).match(/(\d{4})-\d{4}\s*(第一|第二)学期/)
  if (!matched) return 0
  const year = Number(matched[1])
  const term = matched[2] === '第二' ? 2 : 1
  return year * 10 + term
}

export function sortSemestersDesc(values) {
  return [...values].sort((a, b) => getSemesterRank(b) - getSemesterRank(a))
}

export function formatSemester(value) {
  if (!value) return '未设置学期'
  const matched = SEMESTER_OPTIONS.find(item => item.value === value)
  return matched ? matched.label : value
}
