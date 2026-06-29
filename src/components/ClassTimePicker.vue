<script setup>
import { ref, watch } from 'vue';
import { toast } from '@/utils/toast.js';
import {
  WEEKDAY_OPTIONS,
  PERIOD_OPTIONS,
  buildClassTimeSlot,
  fromClassTimeEntries,
  toClassTimeEntries,
} from '@/utils/courseSchedule.js';

const props = defineProps({
  modelValue: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const entries = ref([]);
const weekday = ref('周一');
const period = ref('1-2 节');

function syncFromModel(value) {
  entries.value = toClassTimeEntries(value);
}

function emitValue() {
  emit('update:modelValue', fromClassTimeEntries(entries.value));
}

function addSlot() {
  const label = buildClassTimeSlot(weekday.value, period.value);
  const exists = entries.value.some(item => (item.raw || buildClassTimeSlot(item.weekday, item.period)) === label);
  if (exists) {
    toast.warning('该时段已添加');
    return;
  }
  entries.value = [...entries.value, { weekday: weekday.value, period: period.value, raw: label }];
  emitValue();
}

function removeSlot(index) {
  entries.value = entries.value.filter((_, i) => i !== index);
  emitValue();
}

watch(() => props.modelValue, syncFromModel, { immediate: true });
</script>

<template>
  <div class="class-time-picker">
    <div class="picker-row">
      <select v-model="weekday" class="field-control field-select">
        <option v-for="item in WEEKDAY_OPTIONS" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </select>
      <select v-model="period" class="field-control field-select">
        <option v-for="item in PERIOD_OPTIONS" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </select>
      <button type="button" class="btn-add-slot" @click="addSlot">添加时段</button>
    </div>
    <div v-if="entries.length" class="slot-list">
      <span v-for="(item, index) in entries" :key="`${item.raw}-${index}`" class="slot-tag">
        {{ item.raw }}
        <button type="button" class="slot-remove" aria-label="移除" @click="removeSlot(index)">×</button>
      </span>
    </div>
    <p v-else class="slot-empty">请选择星期和节次后添加，可添加多个上课时段</p>
  </div>
</template>

<style scoped>
.class-time-picker { display: flex; flex-direction: column; gap: 10px; }
.picker-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: center; }
.btn-add-slot {
  border: 1px solid #488af8; background: #eff6ff; color: #1d4ed8;
  padding: 0 14px; height: 40px; border-radius: 10px; font-weight: 600; cursor: pointer; white-space: nowrap;
}
.slot-list { display: flex; flex-wrap: wrap; gap: 8px; }
.slot-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: 999px; background: #f1f5f9; color: #334155; font-size: 13px;
}
.slot-remove {
  border: none; background: none; color: #94a3b8; font-size: 16px; line-height: 1; cursor: pointer; padding: 0;
}
.slot-remove:hover { color: #ef4444; }
.slot-empty { margin: 0; font-size: 13px; color: #94a3b8; }
</style>
