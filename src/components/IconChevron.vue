<script setup>
defineProps({
  direction: {
    type: String,
    default: 'right',
    validator: (value) => ['left', 'right', 'up', 'down'].includes(value),
  },
  size: { type: [Number, String], default: 14 },
});
</script>

<template>
  <svg
    class="icon-chevron"
    :class="`icon-chevron-${direction}`"
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.icon-chevron {
  display: inline-block;
  vertical-align: -0.15em;
  flex-shrink: 0;
}

.icon-chevron-right {
  transform: rotate(-90deg);
}

.icon-chevron-left {
  transform: rotate(90deg);
}

.icon-chevron-up {
  transform: rotate(180deg);
}

.icon-chevron-down {
  transform: none;
}
</style>
