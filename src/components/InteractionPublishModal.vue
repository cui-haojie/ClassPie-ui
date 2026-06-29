<script setup>
import { ref, watch } from 'vue';
import AppModal from '@/components/AppModal.vue';
import request from '@/utils/request.js';
import { toast } from '@/utils/toast.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  classId: { type: [Number, String], required: true },
  creatorAccount: { type: String, required: true },
});

const emit = defineEmits(['update:modelValue', 'published']);

const kindOptions = [
  { value: 'qa', label: '实时问答', desc: '多轮提问 + 随机点名' },
  { value: 'race', label: '抢答', desc: '老师开启后学生抢先回答' },
  { value: 'vote', label: '投票', desc: '单选投票，实时统计结果' },
];

const form = ref({
  title: '',
  content: '',
  interaction_kind: 'qa',
  vote_options: '赞成\n反对',
});

function reset() {
  form.value = { title: '', content: '', interaction_kind: 'qa', vote_options: '赞成\n反对' };
}

function close() {
  emit('update:modelValue', false);
}

function publish() {
  if (!form.value.title.trim()) {
    toast.warning('请填写互动标题');
    return;
  }
  const payload = {
    class_id: Number(props.classId),
    title: form.value.title.trim(),
    content: form.value.content.trim(),
    interaction_kind: form.value.interaction_kind,
    creator_account: props.creatorAccount,
  };
  if (form.value.interaction_kind === 'vote') {
    payload.options = form.value.vote_options
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
    if (payload.options.length < 2) {
      toast.warning('投票至少需要 2 个选项');
      return;
    }
  }
  request.post('/editor/addCourseInteraction', payload).then(ok => {
    if (ok) {
      toast.success('课堂互动已开启，已通知全班同学');
      emit('published');
      close();
    } else {
      toast.error('发布失败');
    }
  }).catch(() => toast.error('发布失败'));
}

watch(() => props.modelValue, (v) => { if (v) reset(); });
</script>

<template>
  <AppModal
      :model-value="modelValue"
      title="开启课堂互动"
      subtitle="选择互动类型，开启后通知全班"
      size="md"
      @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="interaction-form">
      <label class="form-field">
        <span class="field-label">互动类型</span>
        <div class="kind-grid">
          <button
              v-for="k in kindOptions"
              :key="k.value"
              type="button"
              class="kind-btn"
              :class="{ active: form.interaction_kind === k.value }"
              @click="form.interaction_kind = k.value"
          >
            <strong>{{ k.label }}</strong>
            <span>{{ k.desc }}</span>
          </button>
        </div>
      </label>
      <label class="form-field">
        <span class="field-label">互动标题</span>
        <input v-model="form.title" type="text" class="field-control" placeholder="例如：第三章课堂问答">
      </label>
      <label v-if="form.interaction_kind === 'qa'" class="form-field">
        <span class="field-label">首个问题（选填）</span>
        <textarea v-model="form.content" class="field-control field-textarea field-textarea-md" placeholder="可先留空，进入互动页后再提问…"></textarea>
      </label>
      <label v-if="form.interaction_kind === 'vote'" class="form-field">
        <span class="field-label">投票选项（每行一个）</span>
        <textarea v-model="form.vote_options" class="field-control field-textarea field-textarea-md"></textarea>
      </label>
      <label v-if="form.interaction_kind === 'race'" class="form-field">
        <span class="field-label">说明</span>
        <p class="hint">进入互动页后，老师点击「开始抢答」即可让学生抢答。</p>
      </label>
    </div>
    <template #footer>
      <button type="button" class="btn-ghost" @click="close">取消</button>
      <button type="button" class="btn-primary" @click="publish">开启并通知全班</button>
    </template>
  </AppModal>
</template>

<style scoped>
.interaction-form { display: flex; flex-direction: column; gap: 16px; }
.kind-grid { display: grid; gap: 8px; }
.kind-btn { text-align: left; padding: 10px 12px; border: 1px solid #dbeafe; border-radius: 8px; background: #fff; cursor: pointer; }
.kind-btn.active { border-color: #488af8; background: #eff6ff; }
.kind-btn span { display: block; font-size: 12px; color: #64748b; margin-top: 4px; }
.hint { margin: 0; color: #64748b; font-size: 13px; }
</style>
