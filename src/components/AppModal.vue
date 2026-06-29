<script setup>
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock.js'
import { watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  size: { type: String, default: 'md' },
  closable: { type: Boolean, default: true },
  /** 叠在其它弹窗之上（如从弹窗内再打开导入） */
  elevated: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

watch(
    () => props.modelValue,
    (visible) => {
      if (visible) lockBodyScroll()
      else unlockBodyScroll()
    }
)

onBeforeUnmount(unlockBodyScroll)

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
          v-if="modelValue"
          class="app-modal-overlay"
          :class="{ 'app-modal-overlay-elevated': elevated }"
          @click.self="close"
      >
        <div class="app-modal" :class="`app-modal-${size}`" role="dialog" aria-modal="true">
          <div class="app-modal-header">
            <div class="app-modal-heading">
              <h2 v-if="title" class="app-modal-title">{{ title }}</h2>
              <p v-if="subtitle" class="app-modal-subtitle">{{ subtitle }}</p>
            </div>
            <button
                v-if="closable"
                type="button"
                class="app-modal-close"
                aria-label="关闭"
                @click="close"
            >
              ×
            </button>
          </div>
          <div class="app-modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="app-modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
