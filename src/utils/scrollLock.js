let touchHandler = null

function preventTouch(e) {
  e.preventDefault()
}

export function lockBodyScroll() {
  document.body.style.overflow = 'hidden'
  if (!touchHandler) {
    touchHandler = preventTouch
    document.addEventListener('touchmove', touchHandler, { passive: false })
  }
}

export function unlockBodyScroll() {
  document.body.style.overflow = ''
  if (touchHandler) {
    document.removeEventListener('touchmove', touchHandler)
    touchHandler = null
  }
}
