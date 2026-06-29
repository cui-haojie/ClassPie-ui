<script setup lang="js" name="InteractionContent">
import { useRoute, useRouter } from 'vue-router';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import request from '@/utils/request.js';
import { useAccountStore } from '@/stores/account.js';
import { storeToRefs } from 'pinia';
import { toast } from '@/utils/toast.js';
import { formatDateTime } from '@/utils/homeworkDeadline.js';

import { connectLiveSocket } from '@/utils/liveSocket.js';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();
const { account, token } = storeToRefs(accountStore);

const activityId = ref(Number(route.params.id));
const classId = ref(route.query.classId || '');
const loading = ref(true);
const submitting = ref(false);
const picking = ref(false);
const detail = ref(null);
const answerText = ref('');
const newQuestion = ref('');
const pollTimer = ref(null);
const liveSocket = ref(null);
const courseLiveSocket = ref(null);

const interactionKind = computed(() => detail.value?.interaction_kind || 'qa');
const voteStats = computed(() => detail.value?.vote_stats ?? []);
const voteOptions = computed(() => detail.value?.vote_options ?? []);
const raceOpen = computed(() => !!detail.value?.race_open);
const raceResults = computed(() => detail.value?.race_results ?? []);
const myOptionIndex = computed(() => detail.value?.my_option_index);
const participantCount = computed(() => detail.value?.participant_count ?? 0);

const activity = computed(() => detail.value?.activity ?? null);
const isTeacher = computed(() => !!detail.value?.is_teacher);
const isActive = computed(() => detail.value?.status === 'active');
const currentRound = computed(() => detail.value?.current_round ?? 1);
const currentQuestion = computed(() => detail.value?.current_question || '');
const participated = computed(() => !!detail.value?.participated);
const answers = computed(() => detail.value?.answers ?? []);
const picks = computed(() => detail.value?.picks ?? []);
const latestPick = computed(() => detail.value?.latest_pick ?? null);
const answerCount = computed(() => detail.value?.answer_count ?? 0);
const studentCount = computed(() => detail.value?.student_count ?? 0);
const iWasPicked = computed(() => !!detail.value?.i_was_picked);
const canAnswer = computed(() => !isTeacher.value && isActive.value);

function loadDetail(silent = false) {
  if (!silent) loading.value = true;
  return request.post('/editor/getInteractionDetail', {
    activity_id: activityId.value,
    account: account.value,
  }).then(res => {
    detail.value = res;
    if (res?.participated) {
      answerText.value = res.my_content ?? '';
    }
    if (isTeacher.value && res?.current_question) {
      newQuestion.value = res.current_question;
    }
  }).catch(() => {
    if (!silent) toast.error('加载失败');
  }).finally(() => {
    if (!silent) loading.value = false;
  });
}

function startPolling() {
  stopPolling();
  pollTimer.value = setInterval(() => loadDetail(true), 4000);
}

function stopPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
}

function submitAnswer() {
  if (!canAnswer.value) return;
  const text = answerText.value.trim();
  if (!text) {
    toast.warning('请先填写你的回答');
    return;
  }
  submitting.value = true;
  request.post('/editor/submitInteraction', {
    activity_id: activityId.value,
    account: account.value,
    content: text,
  }).then(ok => {
    if (ok) {
      toast.success(participated.value ? '回答已更新' : '回答已提交');
      loadDetail(true);
    } else {
      toast.error('提交失败，互动可能已结束');
    }
  }).catch(() => toast.error('提交失败'))
      .finally(() => { submitting.value = false; });
}

function publishQuestion() {
  const text = newQuestion.value.trim();
  if (!text) {
    toast.warning('请填写问题');
    return;
  }
  request.post('/editor/askInteractionQuestion', {
    activity_id: activityId.value,
    teacher_account: account.value,
    question: text,
  }).then(ok => {
    if (ok) {
      toast.success('新问题已发布');
      loadDetail(true);
    } else {
      toast.error('发布失败');
    }
  }).catch(() => toast.error('发布失败'));
}

function pickStudent() {
  if (!isTeacher.value || !isActive.value) return;
  picking.value = true;
  request.post('/editor/pickRandomStudent', {
    activity_id: activityId.value,
    teacher_account: account.value,
  }).then(res => {
    if (res?.picked) {
      toast.success(`已点名：${res.picked.account_name || res.picked.account}`);
      loadDetail(true);
    } else if (res?.no_student_left) {
      toast.warning('班级暂无学生');
    } else {
      toast.error('点名失败');
    }
  }).catch(() => toast.error('点名失败'))
      .finally(() => { picking.value = false; });
}

function closeSession() {
  if (!confirm('确定结束本次课堂互动吗？')) return;
  request.post('/editor/closeInteraction', {
    activity_id: activityId.value,
    teacher_account: account.value,
  }).then(ok => {
    if (ok) {
      toast.success('互动已结束');
      loadDetail(true);
    } else {
      toast.error('操作失败');
    }
  }).catch(() => toast.error('操作失败'));
}

function startRace() {
  request.post('/editor/startRace', {
    activity_id: activityId.value,
    teacher_account: account.value,
  }).then(ok => {
    if (ok) {
      toast.success('抢答已开始');
      loadDetail(true);
    } else {
      toast.error('开启抢答失败');
    }
  });
}

function submitVote(optionIndex) {
  request.post('/editor/submitInteraction', {
    activity_id: activityId.value,
    account: account.value,
    option_index: optionIndex,
  }).then(ok => {
    if (ok) {
      toast.success('投票成功');
      loadDetail(true);
    } else {
      toast.error('投票失败');
    }
  });
}

function raceAnswer() {
  request.post('/editor/submitInteraction', {
    activity_id: activityId.value,
    account: account.value,
    content: '抢答',
  }).then(ok => {
    if (ok) {
      toast.success('抢答成功');
      loadDetail(true);
    } else {
      toast.error('抢答失败，可能尚未开始或已抢过');
    }
  });
}

function subscribeLive() {
  if (!token.value) return;
  liveSocket.value = connectLiveSocket(`interaction:${activityId.value}`, token.value, (payload) => {
    if (payload.type === 'interaction_closed' || payload.type === 'interaction_updated') {
      loadDetail(true);
    }
  });
  if (classId.value) {
    courseLiveSocket.value = connectLiveSocket(`course:${classId.value}`, token.value, (payload) => {
      if (payload.type === 'attendance_closed' || payload.type === 'interactions_closed') {
        loadDetail(true);
      }
    });
  }
}
function goBack() {
  router.push({ name: 'courseContent', query: { id: classId.value, section: 'interaction' } }).catch(() => {});
}

watch(() => route.params.id, (id) => {
  activityId.value = Number(id);
  loadDetail();
});

onMounted(() => {
  loadDetail().then(() => {
    startPolling();
    subscribeLive();
  });
});

onBeforeUnmount(() => {
  stopPolling();
  liveSocket.value?.close();
  courseLiveSocket.value?.close();
});

watch(isActive, (active) => {
  if (active) startPolling();
  else stopPolling();
});
</script>

<template>
  <div class="interaction-page">
    <div v-if="loading" class="loading">加载中…</div>
    <template v-else-if="activity">
      <button type="button" class="btn-back" @click="goBack">← 返回互动列表</button>

      <header class="page-header">
        <div class="header-top">
          <span class="kind-badge">{{ interactionKind === 'vote' ? '投票' : interactionKind === 'race' ? '抢答' : '课堂问答' }}</span>
          <span class="status-badge" :class="isActive ? 'active' : 'closed'">
            {{ isActive ? '进行中' : '已结束' }}
          </span>
        </div>
        <h1>{{ activity.title }}</h1>
        <div class="meta">
          <template v-if="interactionKind === 'qa'">
            <span>第 {{ currentRound }} 轮问答</span>
            <span>{{ answerCount }} / {{ studentCount }} 人已回答</span>
            <span>{{ picks.length }} 次点名</span>
          </template>
          <template v-else-if="interactionKind === 'vote'">
            <span>{{ participantCount }} 人参与投票</span>
          </template>
          <template v-else-if="interactionKind === 'race'">
            <span>{{ raceOpen ? '抢答进行中' : '等待老师开启抢答' }}</span>
            <span>{{ raceResults.length }} 人已抢答</span>
          </template>
        </div>
      </header>

      <section v-if="latestPick" class="panel pick-highlight">
        <div class="pick-title">最新点名</div>
        <div class="pick-name">{{ latestPick.account_name || latestPick.account }}</div>
        <div v-if="latestPick.create_time" class="pick-time">{{ formatDateTime(latestPick.create_time) }}</div>
      </section>

      <section v-if="!isTeacher && iWasPicked && isActive" class="panel alert-panel">
        老师刚刚点到了你，请准备好回答！
      </section>

      <section v-if="interactionKind === 'vote'" class="panel">
        <h2>投票</h2>
        <div v-if="!isTeacher && isActive && myOptionIndex == null" class="vote-options">
          <button v-for="(opt, idx) in voteOptions" :key="idx" type="button" class="btn-primary" @click="submitVote(idx)">{{ opt }}</button>
        </div>
        <p v-else-if="!isTeacher && myOptionIndex != null" class="empty-inline">你已投票：{{ voteOptions[myOptionIndex] }}</p>
        <ul class="vote-stats">
          <li v-for="stat in voteStats" :key="stat.index">{{ stat.label }}：{{ stat.count }} 票 ({{ stat.percent }}%)</li>
        </ul>
      </section>

      <section v-if="interactionKind === 'race'" class="panel">
        <h2>抢答</h2>
        <div v-if="isTeacher" class="teacher-actions">
          <button type="button" class="btn-primary" :disabled="!isActive" @click="startRace">开始抢答</button>
        </div>
        <div v-else-if="isActive && raceOpen" class="student-actions">
          <button type="button" class="btn-primary" @click="raceAnswer">抢答！</button>
        </div>
        <ol class="race-list">
          <li v-for="(item, idx) in raceResults" :key="item.account">{{ idx + 1 }}. {{ item.account_name || item.account }}</li>
        </ol>
      </section>

      <template v-if="interactionKind === 'qa'">
      <section class="panel">
        <h2>当前问题</h2>
        <p v-if="currentQuestion" class="question-text">{{ currentQuestion }}</p>
        <p v-else class="empty-inline">老师尚未提问，请等待…</p>
      </section>

      <section v-if="isTeacher" class="panel teacher-panel">
        <h2>教师操作</h2>
        <label class="form-field">
          <span class="field-label">发布新问题（会开启新一轮回答）</span>
          <textarea v-model="newQuestion" class="field-control field-textarea field-textarea-md" placeholder="输入课堂问题…"></textarea>
        </label>
        <div class="teacher-actions">
          <button type="button" class="btn-primary" :disabled="!isActive" @click="publishQuestion">发布问题</button>
          <button type="button" class="btn-pick" :disabled="!isActive || picking" @click="pickStudent">
            {{ picking ? '抽取中…' : '随机点名' }}
          </button>
          <button v-if="isActive" type="button" class="btn-danger" @click="closeSession">结束互动</button>
        </div>
      </section>

      <section v-if="!isTeacher" class="panel">
        <h2>{{ participated ? '我的回答' : '提交回答' }}</h2>
        <p v-if="!isActive" class="tip warn">互动已结束，无法提交新回答</p>
        <p v-else-if="!currentQuestion" class="tip">等待老师提问…</p>
        <template v-else>
          <textarea
              v-model="answerText"
              class="field-control field-textarea field-textarea-md"
              :disabled="!canAnswer"
              placeholder="写下你的回答…"
          ></textarea>
          <button
              v-if="canAnswer"
              type="button"
              class="btn-submit"
              :disabled="submitting"
              @click="submitAnswer"
          >
            {{ submitting ? '提交中…' : (participated ? '更新回答' : '提交回答') }}
          </button>
        </template>
      </section>

      <section class="panel">
        <h2>本轮回答（{{ answerCount }}）</h2>
        <div v-if="!answers.length" class="empty">暂无回答</div>
        <div v-else class="answer-list">
          <article v-for="(item, i) in answers" :key="i" class="answer-item">
            <div class="answer-head">{{ item.account_name || item.account }}</div>
            <div class="answer-body">{{ item.content }}</div>
            <div v-if="item.create_time" class="answer-time">{{ formatDateTime(item.create_time) }}</div>
          </article>
        </div>
      </section>

      <section v-if="picks.length" class="panel">
        <h2>点名记录</h2>
        <div class="pick-list">
          <div v-for="(item, i) in picks" :key="i" class="pick-row">
            <span class="pick-no">{{ picks.length - i }}</span>
            <span class="pick-student">{{ item.account_name || item.account }}</span>
            <span v-if="item.create_time" class="pick-when">{{ formatDateTime(item.create_time) }}</span>
          </div>
        </div>
      </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.interaction-page { max-width: 760px; margin: 0 auto; padding: 24px 20px 60px; }
.loading, .empty { text-align: center; color: #94a3b8; padding: 24px; }
.btn-back { border: none; background: none; color: #488af8; cursor: pointer; margin-bottom: 12px; }
.page-header { margin-bottom: 20px; }
.header-top { display: flex; gap: 8px; margin-bottom: 8px; }
.kind-badge {
  display: inline-block; padding: 4px 10px; border-radius: 999px;
  font-size: 12px; font-weight: 600; background: #eff6ff; color: #1d4ed8;
}
.status-badge {
  display: inline-block; padding: 4px 10px; border-radius: 999px;
  font-size: 12px; font-weight: 600;
}
.status-badge.active { background: #f0fdf4; color: #15803d; }
.status-badge.closed { background: #f1f5f9; color: #64748b; }
.page-header h1 { margin: 0 0 10px; font-size: 22px; }
.meta { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; color: #64748b; }
.panel {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 20px; margin-bottom: 16px;
}
.panel h2 { margin: 0 0 14px; font-size: 16px; }
.question-text { margin: 0; line-height: 1.7; white-space: pre-wrap; color: #334155; font-size: 16px; }
.empty-inline { margin: 0; color: #94a3b8; }
.pick-highlight {
  background: linear-gradient(135deg, #eff6ff, #f5f3ff);
  border-color: #bfdbfe; text-align: center;
}
.pick-title { font-size: 13px; color: #64748b; margin-bottom: 6px; }
.pick-name { font-size: 28px; font-weight: 800; color: #1d4ed8; }
.pick-time { font-size: 12px; color: #94a3b8; margin-top: 6px; }
.alert-panel {
  background: #fffbeb; border-color: #fde68a; color: #b45309; font-weight: 600;
}
.teacher-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.btn-primary, .btn-pick, .btn-danger, .btn-submit {
  padding: 10px 18px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;
}
.btn-primary, .btn-submit { background: #488af8; color: #fff; }
.btn-pick { background: #8b5cf6; color: #fff; }
.btn-danger { background: #fee2e2; color: #b91c1c; }
.btn-primary:disabled, .btn-pick:disabled, .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
.tip { font-size: 14px; color: #64748b; margin-bottom: 12px; }
.tip.warn { color: #b45309; }
.answer-list, .pick-list { display: flex; flex-direction: column; gap: 10px; }
.answer-item { padding: 12px; background: #f8fafc; border-radius: 10px; }
.answer-head { font-weight: 600; margin-bottom: 6px; }
.answer-body { white-space: pre-wrap; line-height: 1.6; color: #334155; }
.answer-time, .pick-when { font-size: 12px; color: #94a3b8; margin-top: 6px; }
.pick-row {
  display: grid; grid-template-columns: 36px 1fr auto; gap: 10px; align-items: center;
  padding: 10px 12px; background: #f8fafc; border-radius: 8px;
}
.pick-no { font-weight: 700; color: #6366f1; }
.pick-student { font-weight: 600; }
</style>
