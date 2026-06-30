/** 去掉 HTML 标签，用于预览/AI 主题提取 */
export function stripHtml(html) {
  if (!html) return '';
  if (!/[<>]/.test(html)) return html.trim();
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').replace(/\u00a0/g, ' ').trim();
}

/** 富文本是否为空（含 wangEditor 默认空段落） */
export function isEmptyHtml(html) {
  return !stripHtml(html);
}
