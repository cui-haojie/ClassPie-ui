import { reactive } from 'vue'

export const confirmState = reactive({
  visible: false,
  title: '确认操作',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  resolve: null,
})

export function appConfirm(message, options = {}) {
  return new Promise((resolve) => {
    confirmState.title = options.title || '确认操作'
    confirmState.message = message
    confirmState.confirmText = options.confirmText || '确定'
    confirmState.cancelText = options.cancelText || '取消'
    confirmState.danger = !!options.danger
    confirmState.resolve = resolve
    confirmState.visible = true
  })
}

export function closeConfirm(result) {
  if (confirmState.resolve) {
    confirmState.resolve(result)
  }
  confirmState.visible = false
  confirmState.resolve = null
}
