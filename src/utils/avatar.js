export function resolveAvatarUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  const base = import.meta.env.DEV ? '' : 'http://localhost:9090'
  return `${base}${url.startsWith('/') ? url : `/${url}`}`
}

export function resolveAttachmentUrl(url) {
  return resolveAvatarUrl(url)
}

export function avatarInitial(name, account) {
  const source = (name || account || '?').trim()
  return source.charAt(0).toUpperCase()
}

export function avatarColorSeed(text) {
  const value = text || 'default'
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = ['#488af8', '#00ca90', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b']
  return colors[Math.abs(hash) % colors.length]
}
