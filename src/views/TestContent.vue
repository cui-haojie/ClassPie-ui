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

const activity = computed(() => detail.value?.activity ?? null);
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
        <button type="button" class="btn-back" @click="goBack">← 返回测试列表</button>
        <h1 class="test-title">{{ activity.title }}</h1>
        <p v-if="activity.content" class="test-desc">{{ activity.content }}</p>
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
        </div>
      </header>

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
            <span class="question-score">{{ q.score ?? 5 }} 分</span>
          </div>
          <div class="question-stem">{{ q.stem }}</div>

          <div v-if="q.question_type === 'choice'" class="choice-options">
            <label
                v-for="opt in ['A', 'B', 'C', 'D']"
                :key="opt"
                class="choice-option"
                :class="{
                  selected: answers[q.id] === opt,
                  correct: isTeacher && q.correct_option === opt,
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
