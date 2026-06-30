<script setup lang="js" name="TestContent">
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';
import request from '@/utils/request.js';
import { useAccountStore } from '@/stores/account.js';
import { storeToRefs } from 'pinia';
import { toast } from '@/utils/toast.js';
import {
  formatDeadline,
  isBeforeStart,
  canTakeTest,
  testStatusLabel,
  isHomeworkOverdue,
} from '@/utils/homeworkDeadline.js';
import RichHtml from '@/components/RichHtml.vue';
import IconChevron from '@/components/IconChevron.vue';
import { stripHtml } from '@/utils/htmlText.js';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();
const { account } = storeToRefs(accountStore);

const activityId = ref(Number(route.params.id));
const classId = ref(route.query.classId || '');
const loading = ref(true);
const submitting = ref(false);
const detail = ref(null);
const answers = ref({});
const gradingScores = ref({});
const gradingStudent = ref(null);
const gradingAnswers = ref({});
const aiGrading = ref({});
const aiComments = ref({});

const activity = computed(() => detail.value?.activity ?? null);
const answerResults = computed(() => detail.value?.answer_results ?? {});
const totalScore = computed(() => detail.value?.total_score ?? 0);
const maxScore = computed(() => detail.value?.max_score ?? 0);
const isFullyGraded = computed(() => {
  if (shortCount.value === 0 && submitted.value) return true;
  const flag = detail.value?.is_fully_graded;
  return flag === true || flag === 1;
});

const needsShortGrading = computed(() => shortCount.value > 0 && !isFullyGraded.value);

function submissionGradeLabel(item) {
  if (shortCount.value === 0) return '已批完';
  return item?.is_fully_graded ? '已批完' : '待批简答';
}
const submissions = computed(() => detail.value?.submissions ?? []);
const questions = computed(() => detail.value?.questions ?? []);
const choiceCount = computed(() => detail.value?.choice_count ?? 0);
const shortCount = computed(() => detail.value?.short_count ?? 0);
const totalCount = computed(() => questions.value.length);
const submitted = computed(() => !!detail.value?.submitted);
const isTeacher = computed(() => !!detail.value?.is_teacher);
const testStatus = computed(() =>
    testStatusLabel(activity.value?.start_time, activity.value?.deadline)
);
const isNotStarted = computed(() =>
    activity.value?.start_time && isBeforeStart(activity.value.start_time)
);
const isOverdue = computed(() =>
    activity.value?.deadline && isHomeworkOverdue(activity.value.deadline)
);
const canAnswer = computed(() =>
    !isTeacher.value && canTakeTest(activity.value?.start_time, activity.value?.deadline) && !submitted.value
);
const readOnly = computed(() => submitted.value || isTeacher.value || !canAnswer.value);

function questionTypeLabel(type) {
  return type === 'choice' ? '选择题' : '简答题';
}

function optionLabel(key) {
  return { A: 'A', B: 'B', C: 'C', D: 'D' }[key] || key;
}

function loadDetail() {
  loading.value = true;
  request.post('/editor/getTestDetail', {
    activity_id: activityId.value,
    account: account.value,
  }).then(res => {
    detail.value = res;
    const map = {};
    if (res?.my_answers) {
      Object.entries(res.my_answers).forEach(([qid, ans]) => {
        map[Number(qid)] = ans;
      });
    }
    (res?.questions ?? []).forEach(q => {
      if (map[q.id] === undefined) {
        map[q.id] = q.question_type === 'choice' ? '' : '';
      }
    });
    answers.value = map;
  }).catch(() => {
    toast.error('加载测试失败');
  }).finally(() => {
    loading.value = false;
  });
}

function setChoiceAnswer(questionId, option) {
  if (readOnly.value) return;
  answers.value = { ...answers.value, [questionId]: option };
}

function setShortAnswer(questionId, value) {
  if (readOnly.value) return;
  answers.value = { ...answers.value, [questionId]: value };
}

function validateAnswers() {
  for (const q of questions.value) {
    const ans = (answers.value[q.id] ?? '').trim();
    if (!ans) {
      toast.warning(`请完成第 ${questions.value.indexOf(q) + 1} 题`);
      return false;
    }
  }
  return true;
}

function submitTestPaper() {
  if (!canAnswer.value) return;
  if (!validateAnswers()) return;
  submitting.value = true;
  const payload = {
    activity_id: activityId.value,
    account: account.value,
    answers: questions.value.map(q => ({
      question_id: q.id,
      answer: (answers.value[q.id] ?? '').trim(),
    })),
  };
  request.post('/editor/submitTest', payload)
      .then(ok => {
        if (ok) {
          toast.success('提交成功');
          loadDetail();
        } else {
          toast.error('提交失败，可能不在测试时间或已提交过');
        }
      })
      .catch(() => toast.error('提交失败'))
      .finally(() => { submitting.value = false; });
}

function resultLabel(q) {
  const r = answerResults.value[q.id];
  if (!r) return '';
  if (q.question_type === 'choice') return r.is_correct ? '正确' : '错误';
  if (r.pending) return '待批阅';
  return `${r.score ?? 0} 分`;
}

function selectStudentForGrade(item) {
  gradingStudent.value = item;
  loadStudentAnswersForGrade(item.account);
}

function loadStudentAnswersForGrade(studentAccount) {
  request.post('/editor/getTestDetail', {
    activity_id: activityId.value,
    account: studentAccount,
  }).then(res => {
    const map = {};
    const ansMap = {};
    if (res?.my_answers) {
      Object.entries(res.my_answers).forEach(([qid, ans]) => {
        ansMap[Number(qid)] = ans;
      });
    }
    (res?.questions ?? []).filter(q => q.question_type === 'short').forEach(q => {
      const r = res.answer_results?.[q.id];
      map[q.id] = r?.score ?? 0;
    });
    gradingScores.value = map;
    gradingAnswers.value = ansMap;
  });
}

function saveShortGrade(questionId) {
  if (!gradingStudent.value) return;
  const score = Number(gradingScores.value[questionId] ?? 0);
  request.post('/editor/gradeTestAnswer', {
    activity_id: activityId.value,
    student_account: gradingStudent.value.account,
    question_id: questionId,
    score,
    teacher_account: account.value,
  }).then(ok => {
    if (ok) {
      toast.success('评分已保存');
      loadDetail();
      loadStudentAnswersForGrade(gradingStudent.value.account);
    } else {
      toast.error('评分失败');
    }
  });
}

function suggestShortGrade(questionId) {
  if (!gradingStudent.value) return;
  const q = questions.value.find(item => item.id === questionId);
  if (!q) return;
  aiGrading.value = { ...aiGrading.value, [questionId]: true };
  request.post('/editor/ai/suggestTestShortGrade', {
    teacher_account: account.value,
    question_stem: stripHtml(q.stem),
    student_answer: gradingAnswers.value[questionId] || '',
    max_score: q.score ?? 10,
  }, { timeout: 90000 }).then(res => {
    if (res?.available) {
      gradingScores.value = { ...gradingScores.value, [questionId]: res.suggested_score ?? 0 };
      aiComments.value = { ...aiComments.value, [questionId]: res.comment || '' };
      toast.success('AI 建议已填入');
    } else {
      toast.warning(res?.message || 'AI 暂不可用');
    }
  }).catch(() => toast.error('AI 调用失败'))
      .finally(() => {
        aiGrading.value = { ...aiGrading.value, [questionId]: false };
      });
}

function goBack() {
  router.push({
    name: 'courseContent',
    query: { id: classId.value, section: 'test' },
  }).catch(() => {});
}

watch(() => route.params.id, (id) => {
  activityId.value = Number(id);
  loadDetail();
});

loadDetail();
</script>

<template>
  <div class="test-page">
    <div v-if="loading" class="test-loading">加载中…</div>
    <template v-else-if="activity">
      <header class="test-header">
        <button type="button" class="btn-back btn-with-icon" @click="goBack">
          <IconChevron direction="left" />
          <span>返回测试列表</span>
        </button>
        <h1 class="test-title">{{ activity.title }}</h1>
        <RichHtml v-if="activity.content" :content="activity.content" class="test-desc" tag="p" />
        <div class="test-meta">
          <span v-if="activity.start_time && activity.deadline" class="meta-item">
            测试时间：{{ formatDeadline(activity.start_time) }} 至 {{ formatDeadline(activity.deadline) }}
          </span>
          <span class="meta-status" :class="{
            'status-pending': isNotStarted,
            'status-active': canAnswer,
            'status-ended': isOverdue,
          }">{{ testStatus }}</span>
        </div>
        <div class="test-summary">
          <span class="summary-chip choice">选择题 {{ choiceCount }} 题</span>
          <span class="summary-chip short">简答题 {{ shortCount }} 题</span>
          <span class="summary-chip total">共 {{ totalCount }} 题</span>
          <span v-if="submitted" class="summary-chip submitted">已提交</span>
          <span v-if="submitted && !isTeacher" class="summary-chip score">
            得分 {{ totalScore }} / {{ maxScore }}
            <template v-if="needsShortGrading">（简答题待批阅）</template>
          </span>
        </div>
      </header>

      <section v-if="isTeacher && submissions.length" class="teacher-grade-panel">
        <h3>学生成绩（{{ submissions.length }} 人交卷）</h3>
        <div class="submission-table">
          <div
              v-for="item in submissions"
              :key="item.account"
              class="submission-row"
              :class="{ active: gradingStudent?.account === item.account }"
              @click="selectStudentForGrade(item)"
          >
            <span class="name">{{ item.account_name || item.account }}</span>
            <span class="score">{{ item.total_score ?? 0 }} / {{ item.max_score ?? maxScore }}</span>
            <span class="badge" :class="{ done: shortCount === 0 || item.is_fully_graded }">{{ submissionGradeLabel(item) }}</span>
          </div>
        </div>
        <div v-if="gradingStudent" class="grade-short-box">
          <p class="grade-target">批阅：{{ gradingStudent.account_name || gradingStudent.account }}</p>
          <div v-for="q in questions.filter(x => x.question_type === 'short')" :key="q.id" class="grade-short-item">
            <div class="q-title">第 {{ questions.indexOf(q) + 1 }} 题（满分 {{ q.score }}）</div>
            <div class="q-answer">{{ gradingAnswers[q.id] || '（无答案）' }}</div>
            <div class="grade-row">
              <input v-model.number="gradingScores[q.id]" type="number" min="0" :max="q.score" class="field-control grade-input">
              <button type="button" class="btn-ai" :disabled="aiGrading[q.id]" @click="suggestShortGrade(q.id)">
                {{ aiGrading[q.id] ? 'AI 分析中…' : 'AI 建议' }}
              </button>
              <button type="button" class="btn-grade" @click="saveShortGrade(q.id)">保存</button>
            </div>
            <p v-if="aiComments[q.id]" class="ai-comment">AI 评语：{{ aiComments[q.id] }}</p>
          </div>
        </div>
      </section>

      <p v-if="isNotStarted && !isTeacher" class="test-tip warn">测试尚未开始，请在开始时间后作答</p>
      <p v-else-if="isOverdue && !submitted && !isTeacher" class="test-tip warn">测试已结束，无法提交</p>
      <p v-else-if="submitted" class="test-tip ok">你已提交本次测试，以下为你的作答</p>
      <p v-else-if="isTeacher" class="test-tip info">教师预览模式（含正确答案）</p>

      <div class="question-list">
        <article
            v-for="(q, index) in questions"
            :key="q.id"
            class="question-card"
            :class="q.question_type"
        >
          <div class="question-head">
            <span class="question-no">{{ index + 1 }}</span>
            <span class="question-type">{{ questionTypeLabel(q.question_type) }}</span>
            <span v-if="submitted && answerResults[q.id]" class="result-badge" :class="{
              ok: q.question_type === 'choice' && answerResults[q.id].is_correct,
              bad: q.question_type === 'choice' && answerResults[q.id].is_correct === false,
              pending: answerResults[q.id].pending,
            }">{{ resultLabel(q) }}</span>
            <span class="question-score">{{ q.score ?? 5 }} 分</span>
          </div>
          <RichHtml :content="q.stem" class="question-stem" tag="div" />
          <img v-if="q.stem_image_url" :src="q.stem_image_url" class="stem-image" alt="题干配图">

          <div v-if="q.question_type === 'choice'" class="choice-options">
            <label
                v-for="opt in ['A', 'B', 'C', 'D']"
                :key="opt"
                class="choice-option"
                :class="{
                  selected: answers[q.id] === opt,
                  correct: (isTeacher || submitted) && q.correct_option === opt,
                  wrong: submitted && answers[q.id] === opt && q.correct_option && q.correct_option !== opt,
                }"
            >
              <input
                  type="radio"
                  :name="'q-' + q.id"
                  :value="opt"
                  :checked="answers[q.id] === opt"
                  :disabled="readOnly"
                  @change="setChoiceAnswer(q.id, opt)"
              >
              <span class="opt-key">{{ optionLabel(opt) }}.</span>
              <span class="opt-text">{{ q['option_' + opt.toLowerCase()] }}</span>
            </label>
          </div>

          <div v-else class="short-answer">
            <textarea
                :value="answers[q.id] ?? ''"
                class="short-input field-control field-textarea field-textarea-md"
                rows="4"
                placeholder="请输入你的答案…"
                :disabled="readOnly"
                @input="setShortAnswer(q.id, $event.target.value)"
            />
          </div>

          <div v-if="isTeacher && q.question_type === 'choice' && q.correct_option" class="teacher-answer">
            正确答案：{{ q.correct_option }}
          </div>
        </article>
      </div>

      <div v-if="canAnswer" class="submit-bar">
        <button
            type="button"
            class="btn-submit"
            :disabled="submitting"
            @click="submitTestPaper"
        >
          {{ submitting ? '提交中…' : '提交试卷' }}
        </button>
      </div>
    </template>
    <div v-else class="test-loading">测试不存在或已删除</div>
  </div>
</template>

<style scoped>
.test-page {
  max-width: 820px;
  margin: 0 auto;
  padding: 24px 20px 80px;
}

.test-loading {
  text-align: center;
  color: #64748b;
  padding: 48px;
}

.btn-back {
  background: none;
  border: none;
  color: #488af8;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  margin-bottom: 12px;
}

.test-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
}

.test-desc {
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 12px;
}

.test-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 14px;
}

.meta-status {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-pending { background: #fef3c7; color: #b45309; }
.status-active { background: #dcfce7; color: #15803d; }
.status-ended { background: #fee2e2; color: #b91c1c; }

.test-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-chip {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.summary-chip.choice { background: #eff6ff; color: #1d4ed8; }
.summary-chip.short { background: #f0fdf4; color: #15803d; }
.summary-chip.total { background: #f1f5f9; color: #475569; }
.summary-chip.submitted { background: #fef3c7; color: #b45309; }
.summary-chip.score { background: #fce7f3; color: #be185d; font-weight: 700; }

.teacher-grade-panel {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 16px 18px; margin-bottom: 20px;
}
.teacher-grade-panel h3 { margin: 0 0 12px; font-size: 15px; }
.submission-table { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.submission-row {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer;
}
.submission-row.active { border-color: #488af8; background: #eff6ff; }
.submission-row .name { flex: 1; font-weight: 600; }
.submission-row .score { color: #64748b; font-size: 14px; }
.badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #fef3c7; color: #b45309; }
.badge.done { background: #dcfce7; color: #15803d; }
.grade-short-box { border-top: 1px solid #e2e8f0; padding-top: 14px; }
.grade-target { font-weight: 600; margin-bottom: 10px; }
.grade-short-item { margin-bottom: 14px; padding: 12px; background: #f8fafc; border-radius: 8px; }
.q-title { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.q-answer { white-space: pre-wrap; font-size: 14px; color: #334155; margin-bottom: 8px; }
.grade-row { display: flex; gap: 8px; align-items: center; }
.grade-input { max-width: 80px; }
.btn-grade {
  padding: 6px 14px; background: #488af8; color: #fff; border: none;
  border-radius: 8px; cursor: pointer; font-size: 13px;
}
.btn-ai {
  padding: 6px 14px; background: #8b5cf6; color: #fff; border: none;
  border-radius: 8px; cursor: pointer; font-size: 13px;
}
.btn-ai:disabled { opacity: 0.6; cursor: not-allowed; }
.ai-comment { margin: 8px 0 0; font-size: 13px; color: #6d28d9; line-height: 1.5; }
.result-badge {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
}
.result-badge.ok { background: #dcfce7; color: #15803d; }
.result-badge.bad { background: #fee2e2; color: #b91c1c; }
.result-badge.pending { background: #fef3c7; color: #b45309; }
.choice-option.wrong { border-color: #fca5a5; background: #fef2f2; }

.test-tip {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
}

.test-tip.warn { background: #fffbeb; color: #b45309; }
.test-tip.ok { background: #f0fdf4; color: #15803d; }
.test-tip.info { background: #eff6ff; color: #1d4ed8; }

.question-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.question-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.question-no {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #488af8;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.question-type {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
}

.question-card.choice .question-type { background: #eff6ff; color: #1d4ed8; }
.question-card.short .question-type { background: #f0fdf4; color: #15803d; }

.question-score {
  margin-left: auto;
  font-size: 12px;
  color: #94a3b8;
}

.question-stem {
  font-size: 15px;
  line-height: 1.7;
  color: #1e293b;
  margin-bottom: 14px;
  white-space: pre-wrap;
}

.stem-image {
  display: block;
  max-width: 100%;
  max-height: 320px;
  margin-bottom: 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  object-fit: contain;
}

.choice-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choice-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.choice-option:hover:not(:has(input:disabled)) {
  border-color: #93c5fd;
  background: #f8fafc;
}

.choice-option.selected {
  border-color: #488af8;
  background: #eff6ff;
}

.choice-option.correct {
  border-color: #22c55e;
  background: #f0fdf4;
}

.choice-option input {
  margin-top: 3px;
}

.opt-key {
  font-weight: 700;
  color: #488af8;
  min-width: 20px;
}

.opt-text {
  flex: 1;
  line-height: 1.5;
  color: #334155;
}

.teacher-answer {
  margin-top: 10px;
  font-size: 13px;
  color: #15803d;
  font-weight: 600;
}

.submit-bar {
  position: sticky;
  bottom: 0;
  margin-top: 24px;
  padding: 16px 0;
  background: linear-gradient(transparent, #f8fafc 30%);
  text-align: center;
}

.btn-submit {
  padding: 12px 48px;
  background: #488af8;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-submit:hover:not(:disabled) {
  background: #3b7ae0;
}
</style>
