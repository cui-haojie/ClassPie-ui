<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppModal from '@/components/AppModal.vue';
import RichTextEditor from '@/components/RichTextEditor.vue';
import DateTimePicker from '@/components/DateTimePicker.vue';
import IconChevron from '@/components/IconChevron.vue';
import request from '@/utils/request.js';
import { toast } from '@/utils/toast.js';
import { normalizeDeadlineInput, toDatetimeLocalValue } from '@/utils/homeworkDeadline.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  classId: { type: [Number, String], required: true },
  creatorAccount: { type: String, required: true },
  draftId: { type: [Number, String], default: null },
});

const emit = defineEmits(['update:modelValue', 'published', 'saved']);

const router = useRouter();
const saving = ref(false);
const form = ref({ title: '', content: '', start_time: '', deadline: '' });
const activityId = ref(null);
const titleError = ref('');

function resetForm() {
  saving.value = false;
  titleError.value = '';
  activityId.value = props.draftId ? Number(props.draftId) : null;
  form.value = { title: '', content: '', start_time: '', deadline: '' };
}

watch(() => form.value.title, () => {
  if (titleError.value && form.value.title.trim()) {
    titleError.value = '';
  }
});

function loadDraft(id) {
  request.post('/editor/getTestDetail', {
    activity_id: Number(id),
    account: props.creatorAccount,
  }).then(res => {
    if (!res?.activity || res.activity.publish_status !== 'draft') return;
    activityId.value = res.activity.id;
    form.value = {
      title: res.activity.title ?? '',
      content: res.activity.content ?? '',
      start_time: toDatetimeLocalValue(res.activity.start_time),
      deadline: toDatetimeLocalValue(res.activity.deadline),
    };
  }).catch(() => {});
}

function buildPayload() {
  return {
    activity_id: activityId.value,
    class_id: Number(props.classId),
    title: form.value.title.trim(),
    content: form.value.content.trim(),
    start_time: form.value.start_time ? normalizeDeadlineInput(form.value.start_time) : null,
    deadline: form.value.deadline ? normalizeDeadlineInput(form.value.deadline) : null,
    creator_account: props.creatorAccount,
    questions: [],
  };
}

function validateTitle() {
  titleError.value = '';
  if (!form.value.title.trim()) {
    titleError.value = '请填写测试标题';
    toast.warning('请填写测试标题');
    return false;
  }
  if (form.value.start_time && form.value.deadline) {
    const startMs = new Date(form.value.start_time).getTime();
    const endMs = new Date(form.value.deadline).getTime();
    if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs <= startMs) {
      toast.warning('结束时间必须晚于开始时间');
      return false;
    }
  }
  return true;
}

function close() {
  emit('update:modelValue', false);
}

function saveDraft(thenEdit = false) {
  if (!validateTitle()) return;
  saving.value = true;
  request.post('/editor/saveCourseTestDraft', buildPayload())
      .then(res => {
        if (res?.ok && res.activity_id) {
          activityId.value = res.activity_id;
          toast.success('草稿已保存');
          emit('saved');
          if (thenEdit) {
            close();
            router.push({
              name: 'testEditor',
              params: { id: String(res.activity_id) },
              query: { classId: String(props.classId) },
            }).catch(() => {});
          }
        } else {
          toast.error('保存失败');
        }
      })
      .catch(() => toast.error('保存失败'))
      .finally(() => { saving.value = false; });
}

function goEditQuestions() {
  if (!validateTitle()) return;
  if (activityId.value) {
    close();
    router.push({
      name: 'testEditor',
      params: { id: String(activityId.value) },
      query: { classId: String(props.classId) },
    }).catch(() => {});
    return;
  }
  saveDraft(true);
}

watch(() => props.modelValue, (visible) => {
  if (!visible) return;
  resetForm();
  if (props.draftId) loadDraft(props.draftId);
});
</script>

<template>
  <AppModal
      :model-value="modelValue"
      title="发布测试"
      subtitle="填写基本信息，题目可在下一步单独编辑；支持存草稿稍后继续"
      size="md"
      @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="wizard-body step-basic">
      <label class="form-field">
        <span class="field-label">测试标题 <em>*</em></span>
        <input
            v-model="form.title"
            type="text"
            class="field-control"
            :class="{ 'input-invalid': titleError }"
            placeholder="例如：第一章单元测验"
        >
        <p v-if="titleError" class="field-error">{{ titleError }}</p>
      </label>
      <div class="form-field">
        <span class="field-label">测试说明</span>
        <RichTextEditor
            v-model="form.content"
            placeholder="选填：测试范围、注意事项等"
            min-height="180px"
        />
      </div>
      <div class="form-row-2">
        <label class="form-field">
          <span class="field-label">开始时间 <em class="optional-hint">发布前必填</em></span>
          <DateTimePicker v-model="form.start_time" placeholder="选择开始时间" />
        </label>
        <label class="form-field">
          <span class="field-label">结束时间 <em class="optional-hint">发布前必填</em></span>
          <DateTimePicker v-model="form.deadline" placeholder="选择结束时间" />
        </label>
      </div>
      <p class="form-tip">可先保存草稿，题目与时间稍后在编辑页继续完善</p>
    </div>

    <template #footer>
      <button type="button" class="btn-ghost" @click="close">取消</button>
      <button type="button" class="btn-ghost" :disabled="saving" @click="saveDraft(false)">
        {{ saving ? '保存中…' : '存草稿' }}
      </button>
      <button type="button" class="btn-primary btn-with-icon" @click="goEditQuestions">
        <span>编辑题目</span>
        <IconChevron direction="right" />
      </button>
    </template>
  </AppModal>
</template>

<style scoped>
.step-basic {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.optional-hint {
  font-style: normal;
  font-weight: 400;
  color: #94a3b8;
  font-size: 12px;
}

.form-tip {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.field-error {
  margin: 6px 0 0;
  font-size: 13px;
  color: #ef4444;
}

@media (max-width: 520px) {
  .form-row-2 { grid-template-columns: 1fr; }
}
</style>
