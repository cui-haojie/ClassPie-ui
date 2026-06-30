<script setup>
import { onBeforeUnmount, shallowRef, watch, computed } from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import request from '@/utils/request.js';
import { toast } from '@/utils/toast.js';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '请输入内容…' },
  minHeight: { type: String, default: '200px' },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const editorRef = shallowRef();
const html = shallowRef(props.modelValue || '');

watch(
  () => props.modelValue,
  (value) => {
    const next = value || '';
    if (next !== html.value) html.value = next;
  },
);

watch(html, (value) => {
  emit('update:modelValue', value || '');
});

const toolbarConfig = {
  excludeKeys: ['group-video', 'fullScreen'],
};

const editorConfig = computed(() => ({
  placeholder: props.placeholder,
  readOnly: props.disabled,
  MENU_CONF: {
    uploadImage: {
      customUpload(file, insertFn) {
        const fd = new FormData();
        fd.append('file', file);
        request.post('/editor/uploadRichTextImage', fd, { timeout: 30000 })
          .then((res) => {
            if (res?.url) {
              insertFn(res.url, '', res.url);
              return;
            }
            toast.error('图片上传失败');
          })
          .catch(() => toast.error('图片上传失败'));
      },
    },
  },
}));

function onCreated(editor) {
  editorRef.value = editor;
}

onBeforeUnmount(() => {
  editorRef.value?.destroy();
});
</script>

<template>
  <div class="rich-text-editor" :style="{ '--rte-min-height': minHeight }">
    <Toolbar
      class="rich-text-toolbar"
      :editor="editorRef"
      :default-config="toolbarConfig"
      mode="default"
    />
    <Editor
      v-model="html"
      class="rich-text-body"
      :default-config="editorConfig"
      mode="default"
      @on-created="onCreated"
    />
  </div>
</template>

<style scoped>
.rich-text-editor {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.rich-text-toolbar {
  border-bottom: 1px solid #e2e8f0;
}

.rich-text-body {
  min-height: var(--rte-min-height, 200px);
}

:deep(.w-e-text-container) {
  min-height: var(--rte-min-height, 200px) !important;
  background: #fff;
}

:deep(.w-e-text-placeholder) {
  color: #94a3b8;
  font-style: normal;
}

:deep(.w-e-toolbar) {
  background: #f8fafc;
}

:deep(.w-e-bar-item button) {
  border-radius: 4px;
}

:deep(.w-e-panel-container),
:deep(.w-e-modal) {
  z-index: 12000 !important;
}
</style>
