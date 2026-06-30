<script setup lang="js" name="ActivityContent">
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';
import request from '@/utils/request.js';
import { useAccountStore } from '@/stores/account.js';
import { storeToRefs } from 'pinia';
import { toast } from '@/utils/toast.js';
import UserAvatar from '@/components/UserAvatar.vue';
import RichHtml from '@/components/RichHtml.vue';
import IconChevron from '@/components/IconChevron.vue';
import {
  formatDateTime,
  formatDeadline,
  homeworkStatusLabel,
  isHomeworkOverdue,
  isBeforeStart,
  canTakeTest,
  testStatusLabel,
} from '@/utils/homeworkDeadline.js';
import { isImageAttachment, resolveAttachmentUrl } from '@/utils/avatar.js';

const replyImageFile = ref(null);
const replyImageInputRef = ref(null);
const replyImagePreview = ref('');
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
const isTestType = computed(() => activityType.value === 'test');
const isTestNotStarted = computed(() =>
    isTestType.value && activity.value?.start_time && isBeforeStart(activity.value.start_time)
);
const isTestOverdue = computed(() =>
    isTestType.value && activity.value?.deadline && isHomeworkOverdue(activity.value.deadline)
);
const isTestActive = computed(() =>
    isTestType.value && canTakeTest(activity.value?.start_time, activity.value?.deadline)
);
const testStatusText = computed(() =>
    testStatusLabel(activity.value?.start_time, activity.value?.deadline)
);
const myTestSubmission = computed(() =>
    isTestType.value ? replies.value.find(item => item.account === account.value) : null
);
const canSubmitTest = computed(() =>
    isTestActive.value && !myTestSubmission.value
);
const canUploadTopicImage = computed(() => activityType.value === 'topic');

function pickReplyImage() {
  replyImageInputRef.value?.click();
}

function onReplyImageChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast.warning('请选择图片文件');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.warning('图片不能超过 5MB');
    return;
  }
  replyImageFile.value = file;
  replyImagePreview.value = URL.createObjectURL(file);
}

function clearReplyImage() {
  if (replyImagePreview.value) {
    URL.revokeObjectURL(replyImagePreview.value);
  }
  replyImageFile.value = null;
  replyImagePreview.value = '';
  if (replyImageInputRef.value) {
    replyImageInputRef.value.value = '';
  }
}

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
  if (!text && !replyImageFile.value) {
    toast.warning(canUploadTopicImage.value ? '请输入文字或选择图片' : '请输入内容');
    return;
  }
  if (isTestType.value) {
    if (isTestNotStarted.value) {
      toast.warning('测试尚未开始');
      return;
    }
    if (isTestOverdue.value) {
      toast.warning('测试已结束，无法提交');
      return;
    }
    if (myTestSubmission.value) {
      toast.warning('您已提交过该测试');
      return;
    }
  } else if (isTestOverdue.value) {
    toast.warning('测试已截止，无法提交');
    return;
  }
  submitting.value = true;
  const formData = new FormData();
  formData.append('activity_id', String(activityId.value));
  formData.append('account', account.value);
  if (text) formData.append('content', text);
  if (replyImageFile.value) formData.append('file', replyImageFile.value);
  request.post('/editor/addActivityReply', formData)
      .then(ok => {
        if (ok) {
          toast.success('发布成功');
          replyText.value = '';
          clearReplyImage();
          loadReplies();
          loadActivity();
        } else {
          toast.error(activityType.value === 'test' ? '提交失败，可能不在测试时间或已提交过' : '发布失败');
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
    <button type="button" class="back-btn btn-with-icon" @click="goBack">
      <IconChevron direction="left" />
      <span>返回课程</span>
    </button>

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
        <div v-if="isTestType && activity.start_time && activity.deadline" class="activity-deadline test-window">
          测试时间：{{ formatDeadline(activity.start_time) }} 至 {{ formatDeadline(activity.deadline) }}
          <span
              class="test-status-badge"
              :class="{
                pending: isTestNotStarted,
                active: isTestActive,
                ended: isTestOverdue,
              }"
          >{{ testStatusText }}</span>
        </div>
        <div v-else-if="activity.deadline" class="activity-deadline">
          截止时间：{{ formatDeadline(activity.deadline) }}
          <span :class="{ overdue: isTestOverdue }">{{ homeworkStatusLabel(activity.deadline) }}</span>
        </div>
      </div>

      <RichHtml :content="activity.content || ''" class="activity-body" tag="div" />
      <p v-if="!activity.content" class="activity-body muted">暂无详细说明</p>

      <a
          v-if="activity.attachment_url"
          :href="resolveAttachmentUrl(activity.attachment_url)"
          target="_blank"
          rel="noopener"
          class="attachment-link"
      >
        📎 {{ activity.attachment_name || '查看资料' }}
      </a>
      <div
          v-if="activity.attachment_url && isImageAttachment(activity.attachment_url, activity.attachment_name)"
          class="material-image-preview"
      >
        <img :src="resolveAttachmentUrl(activity.attachment_url)" :alt="activity.attachment_name || '资料图片'">
      </div>
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
          <div v-if="item.content" class="reply-content">{{ item.content }}</div>
          <div v-if="item.attachment_url && isImageAttachment(item.attachment_url, item.attachment_name)" class="reply-image-wrap">
            <a :href="resolveAttachmentUrl(item.attachment_url)" target="_blank" rel="noopener">
              <img :src="resolveAttachmentUrl(item.attachment_url)" :alt="item.attachment_name || '图片'" class="reply-image">
            </a>
          </div>
          <a
              v-else-if="item.attachment_url"
              :href="resolveAttachmentUrl(item.attachment_url)"
              target="_blank"
              rel="noopener"
              class="reply-attachment-link"
          >
            📎 {{ item.attachment_name || '查看附件' }}
          </a>
        </div>
      </div>
    </div>

    <div v-if="myTestSubmission" class="my-test-submission">
      <div class="panel-title">我的提交</div>
      <div class="reply-content">{{ myTestSubmission.content || '（未填写文字答案）' }}</div>
      <div class="reply-time">{{ formatDateTime(myTestSubmission.create_time) }}</div>
    </div>

    <div v-if="canSubmitTest || (!isTestType && !isTestOverdue)" class="reply-composer">
      <div class="composer-title">{{ replyActionLabel }}</div>
      <p v-if="isTestNotStarted" class="composer-tip">测试尚未开始，请在开始时间后参与</p>
      <p v-else-if="isTestOverdue" class="composer-tip overdue-tip">测试已结束，无法继续提交</p>
      <textarea
          v-model="replyText"
          class="reply-input field-control field-textarea field-textarea-md"
          :placeholder="canUploadTopicImage ? '参与话题讨论，可配图…' : replyPlaceholder"
          :disabled="isTestType ? !canSubmitTest : isTestOverdue"
      ></textarea>
      <div v-if="canUploadTopicImage && !isTestOverdue && (!isTestType || canSubmitTest)" class="reply-image-upload">
        <input
            ref="replyImageInputRef"
            type="file"
            class="hidden-file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            @change="onReplyImageChange"
        >
        <button type="button" class="btn-image-pick" @click="pickReplyImage">添加图片</button>
        <span class="image-tip">支持 JPG/PNG/GIF/WebP，最大 5MB</span>
      </div>
      <div v-if="replyImagePreview" class="reply-image-preview">
        <img :src="replyImagePreview" alt="预览">
        <button type="button" class="preview-remove" @click="clearReplyImage">移除图片</button>
      </div>
      <div class="composer-actions">
        <button
            type="button"
            class="btn-submit"
            :disabled="submitting || (isTestType ? !canSubmitTest : isTestOverdue)"
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

.test-window {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.test-status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
}

.test-status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}

.test-status-badge.active {
  background: #dcfce7;
  color: #16a34a;
}

.test-status-badge.ended {
  background: #fee2e2;
  color: #dc2626;
}

.my-test-submission {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.activity-body {
  margin-top: 16px;
  line-height: 1.75;
  color: #334155;
}

.activity-body.muted {
  color: #94a3b8;
  font-size: 15px;
}

.attachment-link {
  display: inline-block;
  margin-top: 16px;
  color: #4285f4;
  text-decoration: none;
  font-weight: 500;
}

.material-image-preview {
  margin-top: 12px;
}

.material-image-preview img {
  max-width: min(100%, 480px);
  max-height: 320px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  object-fit: contain;
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

.reply-image-wrap {
  margin-top: 8px;
}

.reply-image {
  max-width: min(100%, 320px);
  max-height: 240px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  object-fit: cover;
  cursor: zoom-in;
}

.reply-attachment-link {
  display: inline-block;
  margin-top: 8px;
  color: #4285f4;
  text-decoration: none;
  font-size: 14px;
}

.reply-image-upload {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.hidden-file {
  display: none;
}

.btn-image-pick {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font-size: 14px;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
}

.btn-image-pick:hover {
  border-color: #4285f4;
  color: #4285f4;
}

.image-tip {
  font-size: 12px;
  color: #94a3b8;
}

.reply-image-preview {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: 10px;
}

.reply-image-preview img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.preview-remove {
  border: none;
  background: none;
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
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
