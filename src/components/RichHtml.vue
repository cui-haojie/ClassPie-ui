<script setup>
import { computed } from 'vue';
import { stripHtml } from '@/utils/htmlText.js';

const props = defineProps({
  content: { type: String, default: '' },
  tag: { type: String, default: 'div' },
});

const hasHtml = computed(() => /[<>]/.test(props.content || ''));
const plainText = computed(() => stripHtml(props.content));
</script>

<template>
  <component
    :is="tag"
    v-if="hasHtml"
    class="rich-html"
    v-html="content"
  />
  <component
    :is="tag"
    v-else-if="plainText"
    class="rich-html rich-html-plain"
  >
    {{ plainText }}
  </component>
</template>

<style scoped>
.rich-html {
  line-height: 1.75;
  color: #334155;
  word-break: break-word;
}

.rich-html-plain {
  white-space: pre-wrap;
}

.rich-html :deep(p) {
  margin: 0 0 0.75em;
}

.rich-html :deep(p:last-child) {
  margin-bottom: 0;
}

.rich-html :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.rich-html :deep(ul),
.rich-html :deep(ol) {
  margin: 0 0 0.75em;
  padding-left: 1.5em;
}

.rich-html :deep(blockquote) {
  margin: 0 0 0.75em;
  padding: 8px 12px;
  border-left: 3px solid #488af8;
  background: #f8fafc;
  color: #475569;
}

.rich-html :deep(pre) {
  margin: 0 0 0.75em;
  padding: 12px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 13px;
}

.rich-html :deep(table) {
  border-collapse: collapse;
  max-width: 100%;
  margin-bottom: 0.75em;
}

.rich-html :deep(th),
.rich-html :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 6px 10px;
}
</style>
