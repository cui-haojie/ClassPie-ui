import { reactive } from 'vue'

export const toastState = reactive({
  items: [],
})

let seed = 0

function remove(id) {
  const index = toastState.items.findIndex(item => item.id === id)
  if (index >= 0) {
    toastState.items.splice(index, 1)
  }
}

function show(message, type = 'info', duration = 2800) {
  if (!message) return
  const id = ++seed
  toastState.items.push({ id, message, type })
  window.setTimeout(() => remove(id), duration)
}

export const toast = {
  success(message, duration) {
    show(message, 'success', duration)
  },
  error(message, duration = 3200) {
    show(message, 'error', duration)
  },
  warning(message, duration) {
    show(message, 'warning', duration)
  },
  info(message, duration) {
    show(message, 'info', duration)
  },
}
