<script setup>
import { ref, watch } from 'vue';
import { ElDatePicker } from 'element-plus';
import { parseDeadline } from '@/utils/homeworkDeadline.js';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '选择日期时间' },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue']);

function toModelString(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

/** Element Plus 需要 Date 实例；用 ref 比 computed 更稳定 */
const innerValue = ref(null);

watch(
  () => props.modelValue,
  (value) => {
    const parsed = parseDeadline(value);
    const current = innerValue.value?.getTime?.() ?? null;
    const next = parsed?.getTime?.() ?? null;
    if (current !== next) {
      innerValue.value = parsed;
    }
  },
  { immediate: true },
);

watch(innerValue, (value) => {
  const next = value instanceof Date && !Number.isNaN(value.getTime())
    ? toModelString(value)
    : '';
  if (next !== (props.modelValue || '')) {
    emit('update:modelValue', next);
  }
});
</script>

<template>
  <ElDatePicker
    v-model="innerValue"
    type="datetime"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :editable="false"
    format="YYYY-MM-DD HH:mm"
    :teleported="true"
    popper-class="classpi-datetime-popper"
    :popper-options="{ strategy: 'fixed' }"
    class="classpi-datetime-picker"
  />
</template>

<style scoped>
.classpi-datetime-picker {
  width: 100%;
}

.classpi-datetime-picker :deep(.el-input__wrapper) {
  min-height: 42px;
  padding: 4px 14px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  background: #f8fafc;
  transition: box-shadow 0.18s ease, background 0.18s ease;
  cursor: pointer;
}

.classpi-datetime-picker :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e1 inset;
  background: #fff;
}

.classpi-datetime-picker :deep(.el-input.is-focus .el-input__wrapper),
.classpi-datetime-picker :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #488af8 inset, 0 0 0 3px rgba(72, 138, 248, 0.14);
  background: #fff;
}

.classpi-datetime-picker :deep(.el-input__inner) {
  font-size: 14px;
  color: #0f172a;
  height: 32px;
  line-height: 32px;
  cursor: pointer;
}

.classpi-datetime-picker :deep(.el-input__prefix),
.classpi-datetime-picker :deep(.el-input__suffix) {
  color: #64748b;
}
</style>

<style>
/* 必须高于 AppModal (10000/10100)，否则弹窗内点选面板会被遮罩挡住 */
.classpi-datetime-popper.el-picker__popper {
  z-index: 12000 !important;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
}

.classpi-datetime-popper .el-picker-panel {
  border-radius: 12px;
}

.classpi-datetime-popper .el-date-picker__header-label:hover,
.classpi-datetime-popper .el-picker-panel__icon-btn:hover {
  color: #488af8;
}

.classpi-datetime-popper .el-date-table td.today .el-date-table-cell__text {
  color: #488af8;
  font-weight: 700;
}

.classpi-datetime-popper .el-date-table td.current:not(.disabled) .el-date-table-cell__text {
  background: #488af8;
}

.classpi-datetime-popper .el-time-panel__btn.confirm {
  color: #488af8;
}
</style>
