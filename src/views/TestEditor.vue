<script setup lang="js" name="TestEditor">
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';
import request from '@/utils/request.js';
import { useAccountStore } from '@/stores/account.js';
import { storeToRefs } from 'pinia';
import { toast } from '@/utils/toast.js';
import {
  normalizeDeadlineInput,
  toDatetimeLocalValue,
} from '@/utils/homeworkDeadline.js';
import RichTextEditor from '@/components/RichTextEditor.vue';
import DateTimePicker from '@/components/DateTimePicker.vue';
import IconChevron from '@/components/IconChevron.vue';
import { stripHtml, isEmptyHtml } from '@/utils/htmlText.js';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();
const { account } = storeToRefs(accountStore);

const activityId = ref(Number(route.params.id));
const classId = ref(route.query.classId || '');
const loading = ref(true);
const saving = ref(false);
const publishing = ref(false);
const aiGenerating = ref(false);
const aiTopic = ref('');
const aiChoiceCount = ref(3);
const aiShortCount = ref(1);

const form = ref({ title: '', content: '', start_time: '', deadline: '' });
const questions = ref([]);

const summary = computed(() => {
  const choice = questions.value.filter(q => q.question_type === 'choice').length;
  const short = questions.value.filter(q => q.question_type === 'short').length;
  return { choice, short, total: questions.value.length };
});

function emptyChoice() {
  return {
    question_type: 'choice',
    stem: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    score: 5,
  };
}

function emptyShort() {
  return { question_type: 'short', stem: '', score: 10 };
}

function mapQuestionsFromApi(list) {
  return (list ?? []).map(q => ({
    question_type: q.question_type,
    stem: q.stem ?? '',
    option_a: q.option_a ?? '',
    option_b: q.option_b ?? '',
    option_c: q.option_c ?? '',
    option_d: q.option_d ?? '',
    correct_option: q.correct_option ?? 'A',
    score: q.score ?? (q.question_type === 'choice' ? 5 : 10),
  }));
}

function loadTest() {
  loading.value = true;
  request.post('/editor/getTestDetail', {
    activity_id: activityId.value,
    account: account.value,
  }).then(res => {
    if (!res?.activity) {
      toast.error('测试不存在或无权编辑');
      goBack();
      return;
    }
    if (res.activity.publish_status === 'published') {
      toast.warning('已发布的测试不可在此编辑');
      router.replace({
        name: 'testContent',
        params: { id: String(activityId.value) },
        query: { classId: classId.value },
      });
      return;
    }
    form.value = {
      title: res.activity.title ?? '',
      content: res.activity.content ?? '',
      start_time: toDatetimeLocalValue(res.activity.start_time),
      deadline: toDatetimeLocalValue(res.activity.deadline),
    };
    questions.value = mapQuestionsFromApi(res.questions);
  }).catch(() => {
    toast.error('加载失败');
    goBack();
  }).finally(() => {
    loading.value = false;
  });
}

function buildPayload() {
  return {
    activity_id: activityId.value,
    class_id: Number(classId.value),
    title: form.value.title.trim(),
    content: form.value.content.trim(),
    start_time: form.value.start_time ? normalizeDeadlineInput(form.value.start_time) : null,
    deadline: form.value.deadline ? normalizeDeadlineInput(form.value.deadline) : null,
    creator_account: account.value,
    questions: questions.value.map(q => ({
      question_type: q.question_type,
      stem: q.stem?.trim() ?? '',
      option_a: q.option_a?.trim(),
      option_b: q.option_b?.trim(),
      option_c: q.option_c?.trim(),
      option_d: q.option_d?.trim(),
      correct_option: q.correct_option,
      score: Number(q.score) || (q.question_type === 'choice' ? 5 : 10),
    })),
  };
}

function saveDraft() {
  if (!form.value.title.trim()) {
    toast.warning('请填写测试标题');
    return;
  }
  saving.value = true;
  request.post('/editor/saveCourseTestDraft', buildPayload())
      .then(res => {
        if (res?.ok) {
          if (res.activity_id && res.activity_id !== activityId.value) {
            activityId.value = res.activity_id;
            router.replace({
              name: 'testEditor',
              params: { id: String(res.activity_id) },
              query: { classId: classId.value },
            });
          }
          toast.success('草稿已保存');
        } else {
          toast.error('保存失败');
        }
      })
      .catch(() => toast.error('保存失败'))
      .finally(() => { saving.value = false; });
}

function validatePublish() {
  if (!form.value.title.trim()) {
    toast.warning('请填写测试标题');
    return false;
  }
  if (!form.value.start_time || !form.value.deadline) {
    toast.warning('请填写开始和结束时间');
    return false;
  }
  const startMs = new Date(form.value.start_time).getTime();
  const endMs = new Date(form.value.deadline).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    toast.warning('结束时间必须晚于开始时间');
    return false;
  }
  if (questions.value.length === 0) {
    toast.warning('请至少添加一道题目');
    return false;
  }
  for (let i = 0; i < questions.value.length; i++) {
    const q = questions.value[i];
    if (isEmptyHtml(q.stem)) {
      toast.warning(`请填写第 ${i + 1} 题题干`);
      scrollToQuestion(i);
      return false;
    }
    if (q.question_type === 'choice') {
      if (!q.option_a?.trim() || !q.option_b?.trim() || !q.option_c?.trim() || !q.option_d?.trim()) {
        toast.warning(`第 ${i + 1} 题选项不完整`);
        scrollToQuestion(i);
        return false;
      }
    }
  }
  return true;
}

function publish() {
  if (!validatePublish()) return;
  publishing.value = true;
  const payload = buildPayload();
  payload.start_time = normalizeDeadlineInput(form.value.start_time);
  payload.deadline = normalizeDeadlineInput(form.value.deadline);
  request.post('/editor/addCourseTest', payload)
      .then(ok => {
        if (ok) {
          toast.success('测试发布成功');
          router.push({
            name: 'courseContent',
            query: { id: classId.value, section: 'test' },
          }).catch(() => {});
        } else {
          toast.error('发布失败，请检查题目与时间');
        }
      })
      .catch(() => toast.error('发布失败'))
      .finally(() => { publishing.value = false; });
}

function addQuestion(type) {
  questions.value.push(type === 'choice' ? emptyChoice() : emptyShort());
  scrollToQuestion(questions.value.length - 1);
}

function generateQuestionsByAi() {
  const topic = aiTopic.value.trim() || stripHtml(form.value.content) || form.value.title.trim();
  if (!topic) {
    toast.warning('请填写 AI 出题主题或测试标题/说明');
    return;
  }
  aiGenerating.value = true;
  request.post('/editor/ai/generateTestQuestions', {
    teacher_account: account.value,
    topic,
    course_name: form.value.title.trim(),
    choice_count: Number(aiChoiceCount.value) || 0,
    short_count: Number(aiShortCount.value) || 0,
  }, { timeout: 90000 }).then(res => {
    if (res?.available && Array.isArray(res.questions) && res.questions.length) {
      const generated = res.questions.map(q => ({
        question_type: q.question_type === 'short' ? 'short' : 'choice',
        stem: q.stem ?? '',
        option_a: q.option_a ?? '',
        option_b: q.option_b ?? '',
        option_c: q.option_c ?? '',
        option_d: q.option_d ?? '',
        correct_option: q.correct_option ?? 'A',
        score: q.score ?? (q.question_type === 'short' ? 10 : 5),
      }));
      questions.value = [...questions.value, ...generated];
      toast.success(`已生成 ${generated.length} 道题，请核对后发布`);
    } else {
      toast.warning(res?.message || 'AI 生成失败');
    }
  }).catch(() => toast.error('AI 调用失败'))
      .finally(() => { aiGenerating.value = false; });
}

function removeQuestion(index) {
  questions.value.splice(index, 1);
}

function moveQuestion(index, delta) {
  const target = index + delta;
  if (target < 0 || target >= questions.value.length) return;
  const list = [...questions.value];
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
  questions.value = list;
}

function scrollToQuestion(index) {
  requestAnimationFrame(() => {
    document.getElementById(`test-q-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function setCorrectOption(q, opt) {
  q.correct_option = opt;
}

function goBack() {
  router.push({
    name: 'courseContent',
    query: { id: classId.value, section: 'test' },
  }).catch(() => {});
}

watch(() => route.params.id, (id) => {
  activityId.value = Number(id);
  loadTest();
});

loadTest();
</script>

<template>
  <div class="test-editor-page">
    <div v-if="loading" class="editor-loading">加载中…</div>
    <template v-else>
      <header class="editor-topbar">
        <div class="topbar-left">
          <button type="button" class="btn-text btn-with-icon" @click="goBack">
            <IconChevron direction="left" />
            <span>返回</span>
          </button>
          <div class="topbar-title-wrap">
            <h1 class="topbar-title">{{ form.title || '未命名测试' }}</h1>
            <span class="draft-badge">草稿</span>
          </div>
        </div>
        <div class="topbar-stats">
          <span class="stat-chip choice">选择 {{ summary.choice }}</span>
          <span class="stat-chip short">简答 {{ summary.short }}</span>
          <span class="stat-chip total">共 {{ summary.total }} 题</span>
        </div>
        <div class="topbar-actions">
          <button type="button" class="btn-ghost" :disabled="saving" @click="saveDraft">
            {{ saving ? '保存中…' : '保存草稿' }}
          </button>
          <button type="button" class="btn-primary" :disabled="publishing" @click="publish">
            {{ publishing ? '发布中…' : '发布测试' }}
          </button>
        </div>
      </header>

      <section class="editor-basic card-panel">
        <h2 class="panel-title">基本信息</h2>
        <div class="basic-grid">
          <label class="form-field span-2">
            <span class="field-label">测试标题</span>
            <input v-model="form.title" type="text" class="field-control" placeholder="测试标题">
          </label>
          <div class="form-field span-2">
            <span class="field-label">测试说明</span>
            <RichTextEditor
                v-model="form.content"
                placeholder="选填：测试范围、注意事项等"
                min-height="160px"
            />
          </div>
          <label class="form-field">
            <span class="field-label">开始时间</span>
            <DateTimePicker v-model="form.start_time" placeholder="选择开始时间" />
          </label>
          <label class="form-field">
            <span class="field-label">结束时间</span>
            <DateTimePicker v-model="form.deadline" placeholder="选择结束时间" />
          </label>
        </div>
      </section>

      <section class="editor-ai card-panel">
        <h2 class="panel-title">AI 出题</h2>
        <p class="ai-panel-desc">根据知识点自动生成选择题和简答题草稿，生成后请核对再发布。</p>
        <div class="ai-generate-grid">
          <label class="form-field span-2">
            <span class="field-label">知识点 / 主题</span>
            <input v-model="aiTopic" type="text" class="field-control" placeholder="例如：Java 面向对象、第三章 多线程">
          </label>
          <label class="form-field">
            <span class="field-label">选择题数量</span>
            <input v-model.number="aiChoiceCount" type="number" min="0" max="10" class="field-control">
          </label>
          <label class="form-field">
            <span class="field-label">简答题数量</span>
            <input v-model.number="aiShortCount" type="number" min="0" max="5" class="field-control">
          </label>
        </div>
        <button type="button" class="btn-ai-block" :disabled="aiGenerating" @click="generateQuestionsByAi">
          {{ aiGenerating ? 'AI 生成中…' : 'AI 生成题目' }}
        </button>
      </section>

      <div v-if="questions.length" class="q-nav-strip">
        <button
            v-for="(q, i) in questions"
            :key="'nav-' + i"
            type="button"
            class="q-nav-pill"
            :class="[q.question_type, { filled: !isEmptyHtml(q.stem) }]"
            @click="scrollToQuestion(i)"
        >
          {{ i + 1 }}
        </button>
      </div>

      <section class="questions-area">
        <article
            v-for="(q, i) in questions"
            :id="'test-q-' + i"
            :key="i"
            class="q-block card-panel"
            :class="q.question_type"
        >
          <div class="q-block-toolbar">
            <div class="q-block-head">
              <span class="q-num">{{ i + 1 }}</span>
              <span class="q-type-tag">{{ q.question_type === 'choice' ? '选择题' : '简答题' }}</span>
              <span class="q-score-tag">{{ q.score ?? 5 }} 分</span>
            </div>
            <div class="q-block-ops">
              <button type="button" class="op-btn op-btn-icon" :disabled="i === 0" title="上移" @click="moveQuestion(i, -1)">
                <IconChevron direction="up" :size="12" />
              </button>
              <button type="button" class="op-btn op-btn-icon" :disabled="i === questions.length - 1" title="下移" @click="moveQuestion(i, 1)">
                <IconChevron direction="down" :size="12" />
              </button>
              <button type="button" class="op-btn danger" @click="removeQuestion(i)">删除</button>
            </div>
          </div>

          <div class="form-field">
            <span class="field-label">题干</span>
            <RichTextEditor
                v-model="q.stem"
                placeholder="请输入题目内容"
                min-height="140px"
            />
          </div>

          <template v-if="q.question_type === 'choice'">
            <div class="choice-editor">
              <div
                  v-for="opt in ['A', 'B', 'C', 'D']"
                  :key="opt"
                  class="choice-row"
                  :class="{ isAnswer: q.correct_option === opt, hasText: q['option_' + opt.toLowerCase()]?.trim() }"
                  @click="setCorrectOption(q, opt)"
              >
                <span class="choice-key">{{ opt }}</span>
                <input
                    v-model="q['option_' + opt.toLowerCase()]"
                    type="text"
                    class="field-control choice-input"
                    :placeholder="'选项 ' + opt"
                    @click.stop
                >
                <span v-if="q.correct_option === opt" class="answer-mark">✓ 答案</span>
              </div>
            </div>
            <p class="choice-hint">点击选项行可设为正确答案</p>
            <label class="form-field field-inline">
              <span class="field-label">分值</span>
              <input v-model.number="q.score" type="number" min="1" class="field-control score-field">
            </label>
          </template>
          <label v-else class="form-field field-inline">
            <span class="field-label">分值</span>
            <input v-model.number="q.score" type="number" min="1" class="field-control score-field">
          </label>
        </article>

        <div v-if="!questions.length" class="empty-questions card-panel">
          <p>还没有题目，点击下方按钮开始添加</p>
        </div>
      </section>

      <footer class="editor-footer">
        <button type="button" class="fab-add choice" @click="addQuestion('choice')">+ 选择题</button>
        <button type="button" class="fab-add short" @click="addQuestion('short')">+ 简答题</button>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.test-editor-page {
  max-width: 880px;
  margin: 0 auto;
  padding: 20px 20px 100px;
}

.editor-loading {
  text-align: center;
  padding: 80px 20px;
  color: #94a3b8;
}

.editor-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 200px;
}

.btn-text {
  border: none;
  background: none;
  color: #488af8;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}

.topbar-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.topbar-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.draft-badge {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fef3c7;
  color: #b45309;
}

.topbar-stats {
  display: flex;
  gap: 6px;
}

.stat-chip {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
}

.stat-chip.choice { background: #eff6ff; color: #1d4ed8; }
.stat-chip.short { background: #f0fdf4; color: #15803d; }
.stat-chip.total { background: #f1f5f9; color: #64748b; }

.topbar-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.card-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.panel-title {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 700;
  color: #334155;
}

.basic-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.span-2 { grid-column: span 2; }

.q-nav-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 16px 0;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  position: sticky;
  top: 0;
  z-index: 5;
}

.q-nav-pill {
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
}

.q-nav-pill.choice.filled { border-color: #93c5fd; color: #1d4ed8; }
.q-nav-pill.short.filled { border-color: #86efac; color: #15803d; }
.q-nav-pill:hover { border-color: #488af8; }

.questions-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.q-block { scroll-margin-top: 72px; }

.q-block-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
}

.q-block-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.q-num {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #488af8;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
}

.q-block.short .q-num { background: #22c55e; }

.q-type-tag {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.q-score-tag {
  font-size: 11px;
  color: #94a3b8;
}

.q-block-ops {
  display: flex;
  gap: 4px;
}

.op-btn {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  color: #64748b;
}

.op-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.op-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: 0 8px;
}
.op-btn.danger { color: #ef4444; border-color: #fecaca; }
.op-btn.danger:hover { background: #fef2f2; }

.choice-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.choice-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.choice-row:hover { border-color: #cbd5e1; background: #fafbfc; }
.choice-row.isAnswer {
  border-color: #22c55e;
  background: #f0fdf4;
}

.choice-key {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.choice-row.isAnswer .choice-key {
  background: #22c55e;
  color: #fff;
}

.choice-input {
  flex: 1;
  min-height: 38px;
  padding: 8px 12px;
}

.answer-mark {
  font-size: 11px;
  font-weight: 600;
  color: #15803d;
  flex-shrink: 0;
}

.choice-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: #94a3b8;
}

.field-inline {
  max-width: 140px;
}

.score-field { max-width: 100px; }

.empty-questions {
  text-align: center;
  color: #94a3b8;
  padding: 48px 20px;
}

.editor-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 14px 20px;
  background: linear-gradient(transparent, #f8fafc 24%, #f8fafc);
  border-top: 1px solid #e2e8f0;
  z-index: 10;
}

.fab-add {
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
}

.fab-add.choice { background: #488af8; color: #fff; }
.fab-add.short { background: #22c55e; color: #fff; }

@media (max-width: 640px) {
  .basic-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
  .topbar-actions { width: 100%; justify-content: flex-end; }
  .ai-generate-grid { grid-template-columns: 1fr; }
  .ai-generate-grid .span-2 { grid-column: span 1; }
}

.editor-ai { margin-bottom: 16px; }
.ai-panel-desc { margin: 0 0 14px; font-size: 13px; color: #64748b; }
.ai-generate-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.ai-generate-grid .span-2 { grid-column: span 2; }
.btn-ai-block {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.btn-ai-block:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
