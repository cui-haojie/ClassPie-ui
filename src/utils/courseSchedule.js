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

/** 合并为展示用的一行文本 */
export function formatClassTimeDisplay(value) {
  const slots = parseClassTimeSlots(value);
  if (slots.length === 0) {
    return '';
  }
  return slots.join('、');
}
