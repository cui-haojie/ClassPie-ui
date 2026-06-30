/**
 * 作业时间：展示与截止判断均精确到分钟（不含秒、毫秒）。
 */

function pad2(n) {
  return String(n).padStart(2, '0')
}

/** 从任意后端时间字符串提取到分钟 */
export function formatDeadline(value) {
  if (value == null || value === '') return '-'

  if (typeof value === 'number') {
    return formatDateMinute(new Date(value))
  }

  let text = String(value).trim()
  // 去掉毫秒、时区
  text = text.replace(/\.\d+/, '').replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '')

  const match = text.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}):(\d{2}))?/)
  if (match) {
    const [, datePart, hh, mm] = match
    // 仅日期或 00:00 → 当天 23:59 截止
    if (!hh || (hh === '00' && mm === '00')) {
      return `${datePart} 23:59`
    }
    return `${datePart} ${pad2(Number(hh))}:${mm}`
  }

  const date = parseDeadline(value)
  if (!date) {
    // 兜底：截掉秒
    return text.replace(/:\d{2}$/, '').slice(0, 16).replace('T', ' ')
  }
  return formatDateMinute(date)
}

/** 通用时间（通知等），精确到分钟 */
export function formatDateTime(value) {
  return formatDeadline(value)
}

function formatDateMinute(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function parseDeadline(value) {
  if (value == null || value === '') return null

  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : truncateToMinute(date)
  }

  let text = String(value).trim()
  text = text.replace(/\.\d+/, '').replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '')

  const match = text.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}):(\d{2})(?::\d{2})?)?$/)
  if (match) {
    const [, datePart, hh, mm] = match
    const [y, m, d] = datePart.split('-').map(Number)
    if (!hh) {
      return new Date(y, m - 1, d, 23, 59, 0, 0)
    }
    if (hh === '00' && mm === '00') {
      return new Date(y, m - 1, d, 23, 59, 0, 0)
    }
    return new Date(y, m - 1, d, Number(hh), Number(mm), 0, 0)
  }

  const normalized = text.includes('T') ? text : text.replace(' ', 'T')
  const date = new Date(normalized)
  if (!Number.isNaN(date.getTime())) return truncateToMinute(date)

  const fallback = new Date(text.replace(/-/g, '/'))
  return Number.isNaN(fallback.getTime()) ? null : truncateToMinute(fallback)
}

function truncateToMinute(date) {
  return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      0,
      0,
  )
}

export function isHomeworkOverdue(value) {
  const deadline = parseDeadline(value)
  if (!deadline) return false
  return Date.now() > deadline.getTime()
}

export function homeworkStatusLabel(value) {
  return isHomeworkOverdue(value) ? '已截止' : '进行中'
}

/** 学生端作业提交状态（列表/详情展示） */
export function isHomeworkSubmitted(homework) {
  if (!homework) return false
  return homework.my_submitted === true
      || homework.mySubmitted === true
      || homework.my_submitted === 1
}

export function studentHomeworkSubmitStatus(homework) {
  if (!homework) {
    return { label: '未提交', tone: 'pending' }
  }
  if (homework.my_graded === true || homework.myGraded === true) {
    const score = homework.my_score ?? homework.myScore ?? 0
    return { label: `已批阅 · ${score} 分`, tone: 'graded' }
  }
  if (isHomeworkSubmitted(homework)) {
    return { label: '已提交 · 待批阅', tone: 'submitted' }
  }
  if (isHomeworkOverdue(homework.deadline)) {
    return { label: '未提交 · 已截止', tone: 'overdue' }
  }
  return { label: '未提交', tone: 'pending' }
}

/** 根据我的提交记录计算状态（作业详情页） */
export function studentSubmissionStatus(homework, submission) {
  if (submission) {
    if (submission.is_graded || submission.isGraded) {
      return { label: `已批阅 · ${submission.score ?? 0} 分`, tone: 'graded' }
    }
    return { label: '已提交 · 待批阅', tone: 'submitted' }
  }
  const base = { deadline: homework?.deadline }
  return studentHomeworkSubmitStatus(base)
}

export function isBeforeStart(value) {
  const start = parseDeadline(value)
  if (!start) return false
  return Date.now() < start.getTime()
}

export function testStatusLabel(startTime, endTime) {
  if (startTime && isBeforeStart(startTime)) return '未开始'
  if (endTime && isHomeworkOverdue(endTime)) return '已结束'
  return '进行中'
}

export function canTakeTest(startTime, endTime) {
  if (startTime && isBeforeStart(startTime)) return false
  if (endTime && isHomeworkOverdue(endTime)) return false
  return true
}

/** 创建作业时规范化 deadline 字符串（存库用，含秒） */
export function normalizeDeadlineInput(value) {
  if (value == null || value === '') return value
  let text = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) {
    return text.replace('T', ' ') + ':00'
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return `${text} 23:59:00`
  }
  text = text.replace(/\.\d+/, '').replace(/Z$/, '')
  const match = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/)
  if (match) {
    return `${match[1]} ${match[2]}:${match[3]}:00`
  }
  return text
}

/** 将后端返回的时间转为 datetime-local 可用格式 */
export function toDatetimeLocalValue(value) {
  if (value == null || value === '') return ''
  const text = String(value).trim().replace('T', ' ').slice(0, 16)
  return text.replace(' ', 'T')
}
