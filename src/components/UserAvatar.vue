<script setup>
import { computed, ref } from 'vue'
import defaultAvatar from '@/assets/head.png'
import { avatarColorSeed, avatarInitial, resolveAvatarUrl } from '@/utils/avatar.js'

const props = defineProps({
  avatarUrl: { type: String, default: '' },
  name: { type: String, default: '' },
  account: { type: String, default: '' },
  size: { type: Number, default: 40 },
  clickable: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

const imageFailed = ref(false)

const resolvedUrl = computed(() => resolveAvatarUrl(props.avatarUrl))
const showImage = computed(() => !!resolvedUrl.value && !imageFailed.value)
const initial = computed(() => avatarInitial(props.name, props.account))
const bgColor = computed(() => avatarColorSeed(props.name || props.account))

const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.max(12, Math.round(props.size * 0.42))}px`,
}))

function onError() {
  imageFailed.value = true
}

function onClick() {
  if (props.clickable) emit('click')
}
</script>

<template>
  <div
      class="user-avatar"
      :class="{ clickable }"
      :style="style"
      @click="onClick"
  >
    <img
        v-if="showImage"
        :src="resolvedUrl"
        alt="头像"
        class="user-avatar-img"
        @error="onError"
    >
    <img
        v-else-if="!avatarUrl"
        :src="defaultAvatar"
        alt="默认头像"
        class="user-avatar-img"
    >
    <span
        v-else
        class="user-avatar-fallback"
        :style="{ backgroundColor: bgColor }"
    >
      {{ initial }}
    </span>
  </div>
</template>

<style scoped>
.user-avatar {
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: #eef2ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.user-avatar.clickable {
  cursor: pointer;
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.user-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
}
</style>
