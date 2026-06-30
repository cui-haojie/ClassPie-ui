<script setup lang="js" name="ToastHost">
import { toastState } from '@/utils/toast.js'
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <TransitionGroup name="toast">
      <div
          v-for="item in toastState.items"
          :key="item.id"
          class="toast-item"
          :class="`toast-${item.type}`"
      >
        <span class="toast-icon">{{ item.type === 'success' ? '✓' : item.type === 'error' ? '!' : item.type === 'warning' ? '!' : 'i' }}</span>
        <span class="toast-message">{{ item.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 13000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  max-width: min(420px, calc(100vw - 48px));
}

.toast-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-left: 4px solid rgb(72, 138, 248);
  color: #303133;
  font-size: 15px;
  line-height: 1.5;
  pointer-events: auto;
}

.toast-success {
  border-left-color: #67c23a;
}

.toast-error {
  border-left-color: #f56c6c;
}

.toast-warning {
  border-left-color: #e6a23c;
}

.toast-info {
  border-left-color: rgb(72, 138, 248);
}

.toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: rgb(72, 138, 248);
  margin-top: 1px;
}

.toast-success .toast-icon {
  background: #67c23a;
}

.toast-error .toast-icon {
  background: #f56c6c;
}

.toast-warning .toast-icon {
  background: #e6a23c;
}

.toast-message {
  word-break: break-word;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.28s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

.toast-move {
  transition: transform 0.28s ease;
}
</style>
