<script setup>
import { confirmState, closeConfirm } from '@/utils/confirm.js'
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock.js'
import { watch, onBeforeUnmount } from 'vue'

watch(
    () => confirmState.visible,
    (visible) => {
      if (visible) lockBodyScroll()
      else unlockBodyScroll()
    }
)

onBeforeUnmount(unlockBodyScroll)

function onCancel() {
  closeConfirm(false)
}

function onConfirm() {
  closeConfirm(true)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="confirmState.visible" class="app-modal-overlay confirm-overlay" @click.self="onCancel">
      <div class="confirm-dialog" role="dialog" aria-modal="true">
        <div class="confirm-icon" :class="{ danger: confirmState.danger }">!</div>
        <h3 class="confirm-title">{{ confirmState.title }}</h3>
        <p class="confirm-message">{{ confirmState.message }}</p>
        <div class="confirm-actions">
          <button type="button" class="btn-ghost" @click="onCancel">{{ confirmState.cancelText }}</button>
          <button
              type="button"
              class="btn-primary"
              :class="{ 'btn-danger': confirmState.danger }"
              @click="onConfirm"
          >
            {{ confirmState.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  z-index: 10050;
}

.confirm-dialog {
  width: min(420px, calc(100vw - 32px));
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px 20px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  text-align: center;
}

.confirm-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: rgba(72, 138, 248, 0.12);
  color: rgb(72, 138, 248);
  font-size: 28px;
  font-weight: 700;
  line-height: 52px;
}

.confirm-icon.danger {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.confirm-title {
  margin: 0 0 8px;
  font-size: 20px;
  color: #1f2937;
}

.confirm-message {
  margin: 0 0 24px;
  font-size: 15px;
  line-height: 1.6;
  color: #6b7280;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
