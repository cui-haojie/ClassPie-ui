<script setup lang="js" name="ActivityContent">
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';
import request from '@/utils/request.js';
import { useAccountStore } from '@/stores/account.js';
import { storeToRefs } from 'pinia';
import { toast } from '@/utils/toast.js';
import UserAvatar from '@/components/UserAvatar.vue';
import {
  formatDateTime,
  formatDeadline,
  homeworkStatusLabel,
  isHomeworkOverdue,
} from '@/utils/homeworkDeadline.js';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();
const { account } = storeToRefs(accountStore);

const classId = ref(route.query.classId || '');
const activityId = ref(Number(route.params.id));
const activity = ref(history.state?.activity ?? null);
const replies = ref([]);
const replyText = ref('');
const submitting = ref(false);
const loading = ref(true);
const userStatus = ref('');

const TYPE_LABELS = {
  interaction: '课程互动',
  topic: '话题',
  material: '资料',
  test: '测试',
  announcement: '公告',
};

const REPLY_LABELS = {
  interaction: '参与讨论',
  topic: '发表回复',
  material: '提问讨论',
  test: '提交答案',
  announcement: '留言回复',
};

const REPLY_PLACEHOLDERS = {
  interaction: '写下你的观点或回答…',
  topic: '参与话题讨论…',
  material: '对资料有疑问或补充说明…',
  test: '在此提交你的测试答案…',
  announcement: '对公告有疑问可以留言…',
};

const activityType = computed(() => activity.value?.type || route.query.type || 'topic');
const typeLabel = computed(() => TYPE_LABELS[activityType.value] || '活动');
const replyActionLabel = computed(() => REPLY_LABELS[activityType.value] || '发表回复');
const replyPlaceholder = computed(() => REPLY_PLACEHOLDERS[activityType.value] || '写下你的内容…');
const isTestOverdue = computed(() =>
    activityType.value === 'test' && activity.value?.deadline && isHomeworkOverdue(activity.value.deadline)
);

function loadAccount() {
  request.post('/editor/account', { account: account.value })
      .then(res => { userStatus.value = res?.status || '' });
}

function loadActivity() {
  if (!activityId.value || Number.isNaN(activityId.value)) {
    loading.value = false;
    toast.error('活动不存在');
    return;
  }
  loading.value = true;
  request.post('/editor/getCourseActivityById', { activity_id: activityId.value })
      .then(res => { if (res) activity.value = res })
      .catch(() => {
        if (!activity.value) toast.error('加载失败');
      })
      .finally(() => { loading.value = false; });
}

function loadReplies() {
  if (!activityId.value || Number.isNaN(activityId.value)) return;
  request.post('/editor/getActivityReplies', { activity_id: activityId.value })
      .then(res => { replies.value = Array.isArray(res) ? res : [] });
}

function reloadAll() {
  loadActivity();
  loadReplies();
}

function submitReply() {
  const text = replyText.value.trim();
  if (!text) {
    toast.warning('请输入内容');
    return;
  }
  if (isTestOverdue.value) {
    toast.warning('测试已截止，无法提交');
    return;
  }
  submitting.value = true;
  request.post('/editor/addActivityReply', {
    activity_id: activityId.value,
    account: account.value,
    content: text,
  }).then(ok => {
    if (ok) {
      toast.success('发布成功');
      replyText.value = '';
      loadReplies();
      loadActivity();
    } else {
      toast.error(activityType.value === 'test' ? '提交失败，可能已截止' : '发布失败');
    }
  }).catch(() => toast.error('发布失败'))
      .finally(() => { submitting.value = false; });
}

function goBack() {
  router.push({
    name: 'courseContent',
    query: {
      id: classId.value,
      section: activityType.value,
    },
  });
}

watch(
    () => [route.params.id, route.query.classId],
    () => {
      activityId.value = Number(route.params.id);
      classId.value = route.query.classId || '';
      if (history.state?.activity) {
        activity.value = history.state.activity;
      }
      reloadAll();
    },
);

loadAccount();
reloadAll();
</script>

<template>
  <div class="activity-page">
    <button type="button" class="back-btn" @click="goBack">← 返回课程</button>

    <div v-if="loading && !activity" class="loading-panel">加载中…</div>

    <div v-else-if="!activity" class="loading-panel">未找到该活动</div>

    <div v-if="activity" class="activity-card">
      <div class="activity-head">
        <span class="type-badge">{{ typeLabel }}</span>
        <h1 class="activity-title">{{ activity.title }}</h1>
        <div class="activity-meta">
          <span>{{ activity.creator_name || activity.creator_account }}</span>
          <span>{{ formatDateTime(activity.create_time) }}</span>
          <span v-if="activity.reply_count != null">{{ activity.reply_count }} 条互动</span>
        </div>
        <div v-if="activity.deadline" class="activity-deadline">
          截止时间：{{ formatDeadline(activity.deadline) }}
          <span :class="{ overdue: isTestOverdue }">{{ homeworkStatusLabel(activity.deadline) }}</span>
        </div>
      </div>

      <div class="activity-body">{{ activity.content || '暂无详细说明' }}</div>

      <a
          v-if="activity.attachment_url"
          :href="activity.attachment_url"
          target="_blank"
          rel="noopener"
          class="attachment-link"
      >
        📎 {{ activity.attachment_name || '查看资料' }}
      </a>
    </div>

    <div class="discussion-panel">
      <div class="panel-title">
        {{ activityType === 'test' ? '提交记录' : '讨论区' }}
        <span class="count">（{{ replies.length }}）</span>
      </div>

      <div v-if="replies.length === 0" class="empty-replies">
        {{ activityType === 'test' ? '暂无提交，来做第一个答题的同学吧' : '还没有讨论，来发表第一条吧' }}
      </div>

      <div v-for="item in replies" :key="item.id" class="reply-item">
        <UserAvatar
            :avatar-url="item.avatar_url"
            :name="item.creator_name"
            :account="item.account"
            :size="40"
        />
        <div class="reply-body">
          <div class="reply-head">
            <span class="reply-name">{{ item.creator_name || item.account }}</span>
            <span class="reply-time">{{ formatDateTime(item.create_time) }}</span>
          </div>
          <div class="reply-content">{{ item.content }}</div>
        </div>
      </div>
    </div>

    <div class="reply-composer">
      <div class="composer-title">{{ replyActionLabel }}</div>
      <p v-if="isTestOverdue" class="composer-tip overdue-tip">测试已截止，无法继续提交</p>
      <textarea
          v-model="replyText"
          class="reply-input"
          :placeholder="replyPlaceholder"
          :disabled="isTestOverdue"
      ></textarea>
      <div class="composer-actions">
        <button
            type="button"
            class="btn-submit"
            :disabled="submitting || isTestOverdue"
            @click="submitReply"
        >
          {{ submitting ? '提交中…' : replyActionLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-page {
  width: min(900px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 24px 0 48px;
}

.back-btn {
  border: none;
  background: none;
  color: #4285f4;
  font-size: 16px;
  cursor: pointer;
  padding: 0 0 16px;
}

.back-btn:hover {
  text-decoration: underline;
}

.loading-panel {
  padding: 48px 16px;
  text-align: center;
  color: #64748b;
  font-size: 16px;
}

.activity-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #4285f4;
  font-size: 14px;
  font-weight: 500;
}

.activity-title {
  margin: 12px 0 8px;
  font-size: 26px;
  font-weight: 600;
  color: #1e293b;
}

.activity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 14px;
  color: #64748b;
}

.activity-deadline {
  margin-top: 10px;
  font-size: 14px;
  color: #475569;
}

.activity-deadline .overdue {
  color: #ef4444;
  font-weight: 600;
}

.activity-body {
  margin-top: 16px;
  line-height: 1.75;
  color: #334155;
  white-space: pre-wrap;
}

.attachment-link {
  display: inline-block;
  margin-top: 16px;
  color: #4285f4;
  text-decoration: none;
  font-weight: 500;
}

.discussion-panel {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.panel-title .count {
  font-weight: 400;
  color: #64748b;
  font-size: 15px;
}

.empty-replies {
  padding: 32px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 15px;
}

.reply-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.reply-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
}

.reply-time {
  font-size: 13px;
  color: #94a3b8;
}

.reply-content {
  font-size: 15px;
  line-height: 1.65;
  color: #334155;
  white-space: pre-wrap;
}

.reply-composer {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 20px;
}

.composer-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.composer-tip {
  margin: 0 0 10px;
  font-size: 14px;
}

.overdue-tip {
  color: #ef4444;
}

.reply-input {
  width: 100%;
  min-height: 120px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
}

.reply-input:focus {
  outline: none;
  border-color: #4285f4;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.12);
}

.reply-input:disabled {
  background: #f8fafc;
  color: #94a3b8;
}

.composer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.btn-submit {
  padding: 10px 24px;
  border: none;
  border-radius: 999px;
  background: #4285f4;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.btn-submit:hover:not(:disabled) {
  background: #3367d6;
}

.btn-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
