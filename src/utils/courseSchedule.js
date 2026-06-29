/** 星期选项 */
export const WEEKDAY_OPTIONS = [
  { value: '周一', label: '周一' },
  { value: '周二', label: '周二' },
  { value: '周三', label: '周三' },
  { value: '周四', label: '周四' },
  { value: '周五', label: '周五' },
  { value: '周六', label: '周六' },
  { value: '周日', label: '周日' },
];

/** 节次选项（一天最多 10 节，按双节次划分） */
export const PERIOD_OPTIONS = [
  { value: '1-2 节', label: '第 1-2 节' },
  { value: '3-4 节', label: '第 3-4 节' },
  { value: '5-6 节', label: '第 5-6 节' },
  { value: '7-8 节', label: '第 7-8 节' },
  { value: '9-10 节', label: '第 9-10 节' },
];

const SLOT_RE = /^(周[一二三四五六日])\s*(\d+-\d+\s*节)$/;

/** 解析上课时间字符串为多个时段 */
export function parseClassTimeSlots(value) {
  if (value == null || !String(value).trim()) {
    return [];
  }
  return String(value)
      .split(/[、,，;；\n|/]+/)
      .map(item => item.trim())
      .filter(Boolean);
}

/** 解析单个标准时段，无法识别则返回 null */
export function parseClassTimeSlot(value) {
  const text = String(value || '').trim();
  const match = text.match(SLOT_RE);
  if (!match) {
    return null;
  }
  return { weekday: match[1], period: match[2] };
}

/** 组合为标准时段文案 */
export function buildClassTimeSlot(weekday, period) {
  return `${weekday} ${period}`.trim();
}

/** 合并为展示用的一行文本 */
export function formatClassTimeDisplay(value) {
  const slots = parseClassTimeSlots(value);
  if (slots.length === 0) {
    return '';
  }
  return slots.join('、');
}

/** 将时段列表合并为存储字符串 */
export function joinClassTimeSlots(slots) {
  return slots.filter(Boolean).join('、');
}

/** 将存储字符串转为 picker 内部结构 */
export function toClassTimeEntries(value) {
  return parseClassTimeSlots(value).map((text) => {
    const parsed = parseClassTimeSlot(text);
    if (parsed) {
      return { ...parsed, raw: buildClassTimeSlot(parsed.weekday, parsed.period) };
    }
    return { weekday: '', period: '', raw: text };
  });
}

/** 将 picker 内部结构转为存储字符串 */
export function fromClassTimeEntries(entries) {
  return joinClassTimeSlots((entries || []).map(item => item.raw || buildClassTimeSlot(item.weekday, item.period)).filter(Boolean));
}
