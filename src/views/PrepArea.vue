<script setup lang="js" name="PrepArea">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/utils/request.js';
import { useAccountStore } from '@/stores/account.js';
import { storeToRefs } from 'pinia';
import { toast } from '@/utils/toast.js';
import AppModal from '@/components/AppModal.vue';
import { normalizeDeadlineInput } from '@/utils/homeworkDeadline.js';
import { appConfirm } from '@/utils/confirm.js';

const router = useRouter();
const accountStore = useAccountStore();
const { account } = storeToRefs(accountStore);

const kindTabs = [
  { key: '', label: '全部' },
  { key: 'homework', label: '作业' },
  { key: 'material', label: '资料' },
  { key: 'topic', label: '话题' },
  { key: 'announcement', label: '公告' },
  { key: 'test', label: '测试' },
];

const kindLabels = {
  homework: '作业', material: '资料', topic: '话题', announcement: '公告', test: '测试',
};

const activeKind = ref('');
const items = ref([]);
const showEditor = ref(false);
const editingId = ref(null);
const prepFile = ref(null);
const prepFileInputRef = ref(null);

const form = ref({
  kind: 'homework',
  title: '',
  content: '',
  homework_type: '个人作业',
  deadline: '',
  start_time: '',
  attachment_url: '',
  attachment_name: '',
});

const testQuestions = ref([]);

const editorTitle = computed(() => editingId.value ? '编辑备课内容' : '新建备课内容');

function emptyChoiceQuestion() {
  return {
    question_type: 'choice',
    stem: '',
    stem_image_url: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    score: 5,
  };
}

function emptyShortQuestion() {
  return {
    question_type: 'short',
    stem: '',
    stem_image_url: '',
    score: 10,
  };
}

function normalizeTestQuestion(q) {
  return {
    question_type: q.question_type === 'short' ? 'short' : 'choice',
    stem: q.stem || '',
    stem_image_url: q.stem_image_url || '',
    option_a: q.option_a || '',
    option_b: q.option_b || '',
    option_c: q.option_c || '',
    option_d: q.option_d || '',
    correct_option: q.correct_option || 'A',
    score: q.score ?? (q.question_type === 'short' ? 10 : 5),
  };
}

function loadItems() {
  request.post('/editor/listPrepItems', {
    teacher_account: account.value,
    kind: activeKind.value || undefined,
  }).then(res => { items.value = Array.isArray(res) ? res : []; })
      .catch(err => {
        console.error(err);
        toast.error('备课区加载失败，请确认后端已更新并执行 migration_teacher_prep.sql');
      });
}

function switchKind(key) {
  activeKind.value = key;
  loadItems();
}

function openCreate(kind = 'homework') {
  editingId.value = null;
  form.value = {
    kind,
    title: '',
    content: '',
    homework_type: '个人作业',
    deadline: '',
    start_time: '',
    attachment_url: '',
    attachment_name: '',
  };
  testQuestions.value = [emptyChoiceQuestion()];
  prepFile.value = null;
  showEditor.value = true;
}

function openEdit(item) {
  request.post('/editor/getPrepItem', { id: item.id, teacher_account: account.value })
      .then(detail => {
        if (!detail?.id) return;
        editingId.value = detail.id;
        form.value = {
          kind: detail.kind,
          title: detail.title || '',
          content: detail.content || '',
          homework_type: detail.homework_type || '个人作业',
          deadline: detail.deadline || '',
          start_time: detail.start_time || '',
          attachment_url: detail.attachment_url || '',
          attachment_name: detail.attachment_name || '',
        };
        testQuestions.value = (detail.questions || []).map(q => normalizeTestQuestion(q));
        if (detail.kind === 'test' && !testQuestions.value.length) {
          testQuestions.value = [emptyChoiceQuestion()];
        }
        prepFile.value = null;
        showEditor.value = true;
      });
}

async function removeItem(item) {
  const ok = await appConfirm(`确定删除「${item.title}」？`);
  if (!ok) return;
  request.post('/editor/deletePrepItem', { id: item.id, teacher_account: account.value })
      .then(res => {
        if (res) {
          toast.success('已删除');
          loadItems();
        }
      });
}

function pickPrepFile() {
  prepFileInputRef.value?.click();
}

function onPrepFileChange(e) {
  prepFile.value = e.target.files?.[0] || null;
}

function addTestQuestion(type = 'choice') {
  testQuestions.value.push(type === 'short' ? emptyShortQuestion() : emptyChoiceQuestion());
}

function removeTestQuestion(index) {
  testQuestions.value.splice(index, 1);
}

function uploadQuestionImage(q, event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  request.post('/editor/uploadTestQuestionImage', fd).then(res => {
    if (res?.url) {
      q.stem_image_url = res.url;
      toast.success('配图已上传');
    } else {
      toast.error('配图上传失败');
    }
  }).catch(() => toast.error('配图上传失败'));
  event.target.value = '';
}

function removeQuestionImage(q) {
  q.stem_image_url = '';
}

function validTestQuestions() {
  return testQuestions.value.filter(q => q.stem?.trim() || q.stem_image_url);
}

function savePrep() {
  if (!form.value.title.trim()) {
    toast.warning('请填写标题');
    return;
  }
  if (form.value.kind === 'material' && !prepFile.value && !form.value.attachment_url.trim() && !editingId.value) {
    toast.warning('资料需上传文件或填写链接');
    return;
  }
  if (form.value.kind === 'test') {
    const validQs = validTestQuestions();
    if (!validQs.length) {
      toast.warning('请至少添加一道题目（填写题干或上传配图）');
      return;
    }
    for (let i = 0; i < validQs.length; i++) {
      const q = validQs[i];
      if (q.question_type === 'choice') {
        if (!q.option_a?.trim() || !q.option_b?.trim() || !q.option_c?.trim() || !q.option_d?.trim()) {
          toast.warning(`第 ${i + 1} 题选择题选项不完整`);
          return;
        }
      }
    }
  }
  const fd = new FormData();
  if (editingId.value) fd.append('id', String(editingId.value));
  fd.append('teacher_account', account.value);
  fd.append('kind', form.value.kind);
  fd.append('title', form.value.title.trim());
  if (form.value.content.trim()) fd.append('content', form.value.content.trim());
  if (form.value.kind === 'homework') {
    fd.append('homework_type', form.value.homework_type);
    if (form.value.deadline) fd.append('deadline', normalizeDeadlineInput(form.value.deadline));
  }
  if (form.value.kind === 'test') {
    if (form.value.start_time) fd.append('start_time', normalizeDeadlineInput(form.value.start_time));
    if (form.value.deadline) fd.append('deadline', normalizeDeadlineInput(form.value.deadline));
    fd.append('questions_json', JSON.stringify(validTestQuestions().map(q => ({
      question_type: q.question_type,
      stem: q.stem?.trim() || '',
      stem_image_url: q.stem_image_url || null,
      option_a: q.option_a?.trim(),
      option_b: q.option_b?.trim(),
      option_c: q.option_c?.trim(),
      option_d: q.option_d?.trim(),
      correct_option: q.question_type === 'choice' ? q.correct_option : null,
      score: Number(q.score) || (q.question_type === 'short' ? 10 : 5),
    }))));
  }
  if (prepFile.value) {
    fd.append('file', prepFile.value);
  } else if (form.value.attachment_url.trim()) {
    fd.append('attachment_url', form.value.attachment_url.trim());
    fd.append('attachment_name', form.value.attachment_name.trim() || '附件');
  }
  request.post('/editor/savePrepItem', fd).then(res => {
    if (res?.id) {
      toast.success('已保存到备课区');
      showEditor.value = false;
      loadItems();
    } else {
      toast.error('保存失败');
    }
  }).catch(() => toast.error('保存失败'));
}

onMounted(loadItems);
</script>

<template>
  <div class="prep-area">
    <header class="prep-header">
      <button type="button" class="btn-ghost" @click="router.push({ name: 'mainInterface' })">← 返回课堂</button>
      <h1>备课区</h1>
      <p class="prep-subtitle">提前准备作业、资料、话题、公告和测试，发布到课程时可一键导入</p>
    </header>

    <nav class="prep-tabs">
      <button
          v-for="tab in kindTabs"
          :key="tab.key"
          type="button"
          class="prep-tab"
          :class="{ active: activeKind === tab.key }"
          @click="switchKind(tab.key)"
      >{{ tab.label }}</button>
      <button type="button" class="btn-primary prep-add" @click="openCreate(activeKind || 'homework')">+ 新建</button>
    </nav>

    <div v-if="!items.length" class="prep-empty">暂无备课内容，点击「新建」开始准备</div>
    <div v-else class="prep-grid">
      <article v-for="item in items" :key="item.id" class="prep-card">
        <span class="prep-kind-tag">{{ kindLabels[item.kind] || item.kind }}</span>
        <h3>{{ item.title }}</h3>
        <p v-if="item.content" class="prep-preview">{{ item.content }}</p>
        <p v-if="item.attachment_name" class="prep-attach">📎 {{ item.attachment_name }}</p>
        <div class="prep-card-actions">
          <button type="button" class="btn-ghost" @click="openEdit(item)">编辑</button>
          <button type="button" class="btn-danger" @click="removeItem(item)">删除</button>
        </div>
      </article>
    </div>

    <AppModal v-model="showEditor" :title="editorTitle" subtitle="保存后在课程发布时可从备课区导入" size="lg">
      <div class="prep-form">
        <label class="form-field">
          <span>类型</span>
          <select v-model="form.kind" class="field-control" :disabled="!!editingId">
            <option value="homework">作业</option>
            <option value="material">资料</option>
            <option value="topic">话题</option>
            <option value="announcement">公告</option>
            <option value="test">测试</option>
          </select>
        </label>
        <label class="form-field">
          <span>标题</span>
          <input v-model="form.title" type="text" class="field-control" placeholder="标题">
        </label>
        <label class="form-field">
          <span>内容说明</span>
          <textarea v-model="form.content" class="field-control field-textarea" placeholder="详细说明、正文或测试说明"></textarea>
        </label>

        <template v-if="form.kind === 'homework'">
          <label class="form-field">
            <span>作业类型</span>
            <select v-model="form.homework_type" class="field-control">
              <option value="个人作业">个人作业</option>
              <option value="团队作业">团队作业</option>
            </select>
          </label>
          <label class="form-field">
            <span>默认截止时间（发布时可改）</span>
            <input v-model="form.deadline" type="datetime-local" class="field-control">
          </label>
        </template>

        <template v-if="form.kind === 'test'">
          <label class="form-field">
            <span>默认开始时间</span>
            <input v-model="form.start_time" type="datetime-local" class="field-control">
          </label>
          <label class="form-field">
            <span>默认结束时间</span>
            <input v-model="form.deadline" type="datetime-local" class="field-control">
          </label>
          <div class="test-questions">
            <div class="test-questions-head">
              <strong>测试题目</strong>
              <div class="test-add-btns">
                <button type="button" class="btn-add-choice" @click="addTestQuestion('choice')">+ 选择题</button>
                <button type="button" class="btn-add-short" @click="addTestQuestion('short')">+ 简答题</button>
              </div>
            </div>
            <div v-for="(q, idx) in testQuestions" :key="idx" class="test-question-block" :class="q.question_type">
              <div class="test-q-toolbar">
                <span class="test-q-label">第 {{ idx + 1 }} 题 · {{ q.question_type === 'short' ? '简答题' : '选择题' }}</span>
                <button type="button" class="btn-remove-q" @click="removeTestQuestion(idx)">删除</button>
              </div>
              <label class="form-field">
                <span>题干</span>
                <textarea v-model="q.stem" class="field-control field-textarea" placeholder="请输入题目文字（可与配图一起使用）"></textarea>
              </label>
              <div class="stem-image-row">
                <label class="btn-ghost btn-upload">
                  上传配图
                  <input type="file" accept="image/*" class="hidden-file-input" @change="uploadQuestionImage(q, $event)">
                </label>
                <button v-if="q.stem_image_url" type="button" class="btn-ghost" @click="removeQuestionImage(q)">移除配图</button>
              </div>
              <img v-if="q.stem_image_url" :src="q.stem_image_url" class="stem-image-preview" alt="题干配图">
              <template v-if="q.question_type === 'choice'">
                <input v-model="q.option_a" type="text" class="field-control" placeholder="选项 A">
                <input v-model="q.option_b" type="text" class="field-control" placeholder="选项 B">
                <input v-model="q.option_c" type="text" class="field-control" placeholder="选项 C">
                <input v-model="q.option_d" type="text" class="field-control" placeholder="选项 D">
                <select v-model="q.correct_option" class="field-control">
                  <option value="A">正确答案 A</option>
                  <option value="B">正确答案 B</option>
                  <option value="C">正确答案 C</option>
                  <option value="D">正确答案 D</option>
                </select>
              </template>
              <label class="form-field field-inline-score">
                <span>分值</span>
                <input v-model.number="q.score" type="number" min="1" class="field-control score-input">
              </label>
            </div>
            <p v-if="!testQuestions.length" class="test-empty-tip">点击上方按钮添加选择题或简答题</p>
          </div>
        </template>

        <template v-if="form.kind === 'homework' || form.kind === 'material'">
          <label class="form-field">
            <span>上传附件</span>
            <input ref="prepFileInputRef" type="file" class="hidden-file-input" @change="onPrepFileChange">
            <button type="button" class="btn-ghost" @click="pickPrepFile">选择文件</button>
            <span v-if="prepFile">{{ prepFile.name }}</span>
            <span v-else-if="form.attachment_name">{{ form.attachment_name }}（已保存）</span>
          </label>
          <label v-if="form.kind === 'material'" class="form-field">
            <span>或外链</span>
            <input v-model="form.attachment_url" type="text" class="field-control" placeholder="https://...">
          </label>
        </template>
      </div>
      <template #footer>
        <button type="button" class="btn-ghost" @click="showEditor=false">取消</button>
        <button type="button" class="btn-primary" @click="savePrep">保存到备课区</button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.prep-area { padding: 24px; max-width: 1100px; margin: 0 auto; }
.prep-header { margin-bottom: 20px; }
.prep-header h1 { margin: 8px 0 4px; font-size: 24px; }
.prep-subtitle { color: #64748b; margin: 0; }
.prep-tabs { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 20px; }
.prep-tab { border: 1px solid #dbeafe; background: #fff; padding: 8px 14px; border-radius: 8px; cursor: pointer; }
.prep-tab.active { background: #488af8; color: #fff; border-color: #488af8; }
.prep-add { margin-left: auto; }
.prep-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.prep-card { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
.prep-kind-tag { font-size: 12px; color: #488af8; background: #eff6ff; padding: 2px 8px; border-radius: 999px; }
.prep-card h3 { margin: 10px 0 6px; font-size: 16px; }
.prep-preview { color: #64748b; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.prep-attach { font-size: 12px; color: #475569; }
.prep-card-actions { display: flex; gap: 8px; margin-top: 12px; }
.prep-empty { color: #64748b; text-align: center; padding: 48px 0; }
.prep-form .form-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.field-control { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; }
.field-textarea { min-height: 80px; resize: vertical; }
.test-questions { border-top: 1px solid #e2e8f0; padding-top: 12px; }
.test-questions-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px; }
.test-add-btns { display: flex; gap: 8px; }
.btn-add-choice { background: #488af8; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-add-short { background: #22c55e; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.test-question-block { background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; border: 1px solid #e2e8f0; }
.test-question-block.short { background: #f0fdf4; border-color: #bbf7d0; }
.test-q-toolbar { display: flex; justify-content: space-between; align-items: center; }
.test-q-label { font-size: 13px; font-weight: 600; color: #334155; }
.btn-remove-q { border: none; background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; }
.stem-image-row { display: flex; gap: 8px; align-items: center; }
.btn-upload { position: relative; overflow: hidden; cursor: pointer; }
.stem-image-preview { max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid #e2e8f0; object-fit: contain; }
.field-inline-score { max-width: 120px; }
.score-input { max-width: 100px; }
.test-empty-tip { color: #94a3b8; font-size: 13px; text-align: center; margin: 8px 0; }
.btn-primary, .btn-ghost, .btn-danger { padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer; }
.btn-primary { background: #488af8; color: #fff; }
.btn-ghost { background: #f1f5f9; color: #334155; }
.btn-danger { background: #fee2e2; color: #b91c1c; }
.hidden-file-input { display: none; }
</style>
