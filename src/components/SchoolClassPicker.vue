<script setup>
import { onMounted, ref, watch } from 'vue';
import request from '@/utils/request.js';
import { toast } from '@/utils/toast.js';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);

const schoolClasses = ref([]);
const classToAdd = ref('');

function loadSchoolClasses() {
  return request.post('/editor/listSchoolClasses', {})
      .then(res => { schoolClasses.value = Array.isArray(res) ? res : []; })
      .catch(() => { schoolClasses.value = []; });
}

function getSchoolClassLabel(id) {
  const sc = schoolClasses.value.find(item => Number(item.id) === Number(id));
  if (!sc) return '未知班级';
  return sc.mechanism ? `${sc.name} · ${sc.mechanism}` : sc.name;
}

function addClassFromDropdown() {
  if (!classToAdd.value) {
    toast.warning('请先选择行政班级');
    return;
  }
  const id = Number(classToAdd.value);
  const current = (props.modelValue || []).map(Number);
  if (!current.includes(id)) {
    emit('update:modelValue', [...current, id]);
  }
  classToAdd.value = '';
}

function removeSelectedClass(id) {
  const current = (props.modelValue || []).map(Number).filter(item => item !== Number(id));
  emit('update:modelValue', current);
}

onMounted(loadSchoolClasses);

watch(() => props.modelValue, () => {}, { deep: true });
</script>

<template>
  <div class="school-class-picker">
    <div class="picker-row">
      <select v-model="classToAdd" class="field-control field-select">
        <option value="">请选择行政班级</option>
        <option v-for="sc in schoolClasses" :key="sc.id" :value="String(sc.id)">
          {{ sc.name }}{{ sc.mechanism ? ' · ' + sc.mechanism : '' }}
        </option>
      </select>
      <button type="button" class="btn-add" @click="addClassFromDropdown">添加</button>
    </div>
    <div v-if="modelValue?.length" class="tag-list">
      <span v-for="id in modelValue" :key="id" class="class-tag">
        {{ getSchoolClassLabel(id) }}
        <button type="button" class="tag-remove" @click="removeSelectedClass(id)">×</button>
      </span>
    </div>
    <p v-else class="empty-hint">暂未关联行政班，保存后学生需通过加课码加入</p>
  </div>
</template>

<style scoped>
.school-class-picker { display: flex; flex-direction: column; gap: 10px; }
.picker-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
.btn-add {
  border: 1px solid #488af8; background: #eff6ff; color: #1d4ed8;
  padding: 0 14px; height: 40px; border-radius: 10px; font-weight: 600; cursor: pointer;
}
.tag-list { display: flex; flex-wrap: wrap; gap: 8px; }
.class-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: 999px; background: #f1f5f9; color: #334155; font-size: 13px;
}
.tag-remove {
  border: none; background: none; color: #94a3b8; font-size: 16px; line-height: 1; cursor: pointer; padding: 0;
}
.tag-remove:hover { color: #ef4444; }
.empty-hint { margin: 0; font-size: 13px; color: #94a3b8; }
</style>
