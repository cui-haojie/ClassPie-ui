<script setup lang="js" name="PrepImportModal">
import { computed, ref, watch } from 'vue';
import AppModal from '@/components/AppModal.vue';
import request from '@/utils/request.js';
import { useAccountStore } from '@/stores/account.js';
import { storeToRefs } from 'pinia';
import { toast } from '@/utils/toast.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  kind: { type: String, required: true },
  title: { type: String, default: '从备课区导入' },
});

const emit = defineEmits(['update:modelValue', 'selected']);

const accountStore = useAccountStore();
const { account } = storeToRefs(accountStore);

const items = ref([]);
const loading = ref(false);

const kindLabel = computed(() => ({
  homework: '作业',
  topic: '话题',
  material: '资料',
  announcement: '公告',
  test: '测试',
}[props.kind] || '内容'));

function close() {
  emit('update:modelValue', false);
}

function loadItems() {
  loading.value = true;
  request.post('/editor/listPrepItems', { teacher_account: account.value, kind: props.kind })
      .then(res => { items.value = Array.isArray(res) ? res : []; })
      .catch(() => toast.error('加载备课区失败'))
      .finally(() => { loading.value = false; });
}

function pickItem(item) {
  request.post('/editor/getPrepItem', { id: item.id, teacher_account: account.value })
      .then(detail => {
        if (!detail?.id) {
          toast.error('加载备课内容失败');
          return;
        }
        emit('selected', detail);
        close();
      })
      .catch(() => toast.error('加载备课内容失败'));
}

watch(() => props.modelValue, (open) => {
  if (open) loadItems();
});
</script>

<template>
  <AppModal
      :model-value="modelValue"
      :title="title"
      :subtitle="`选择已准备的${kindLabel}，将填充到发布表单`"
      size="md"
      elevated
      @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="loading" class="prep-import-empty">加载中...</div>
    <div v-else-if="!items.length" class="prep-import-empty">
      备课区暂无{{ kindLabel }}，请先在「备课区」中创建
    </div>
    <ul v-else class="prep-import-list">
      <li v-for="item in items" :key="item.id" class="prep-import-item" @click="pickItem(item)">
        <strong>{{ item.title }}</strong>
        <span v-if="item.content" class="prep-import-preview">{{ item.content }}</span>
        <span v-if="item.attachment_name" class="prep-import-tag">📎 {{ item.attachment_name }}</span>
      </li>
    </ul>
    <template #footer>
      <button type="button" class="btn-ghost" @click="close">取消</button>
    </template>
  </AppModal>
</template>

<style scoped>
.prep-import-list { list-style: none; padding: 0; margin: 0; max-height: 360px; overflow-y: auto; }
.prep-import-item { padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; cursor: pointer; }
.prep-import-item:hover { background: #f8fbff; border-color: #488af8; }
.prep-import-preview { display: block; color: #64748b; font-size: 13px; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.prep-import-tag { display: inline-block; margin-top: 6px; font-size: 12px; color: #475569; }
.prep-import-empty { color: #64748b; padding: 24px 0; text-align: center; }
.btn-ghost { padding: 8px 16px; border-radius: 8px; border: none; background: #f1f5f9; cursor: pointer; }
</style>
