<script setup lang="js" name="HomeworkContent">
import {useRoute} from "vue-router";
import {computed, ref, watch} from "vue";
import request from "@/utils/request.js";
import {useAccountStore} from "@/stores/account.js";
import {storeToRefs} from "pinia";
import {toast} from '@/utils/toast.js';
import {resolveAttachmentUrl} from '@/utils/avatar.js';
import {formatDeadline, homeworkStatusLabel, isHomeworkOverdue} from '@/utils/homeworkDeadline.js';
import UserAvatar from '@/components/UserAvatar.vue';

const route = useRoute();
const accountStore = useAccountStore();
const {account} = storeToRefs(accountStore);
const classId = ref(Number(route.query.classId || 0));

const status = ref("");
const activeView = ref('details');
const homework_id = ref(Number(route.params.id));
const homework = ref({
  homework_id: homework_id.value,
  name: '',
  type: '',
  deadline: '',
  isCorrect: false,
  score: 0,
  content_id: 0,
  details: '',
});

const contents = ref([]);
const selectedSubmission = ref(null);
const gradeScore = ref(0);
const aiGradeComment = ref('');
const aiGrading = ref(false);
const submissionText = ref('');
const mySubmission = ref(null);
const attachmentFile = ref(null);
const attachmentInputRef = ref(null);
const memberProfiles = ref({});

const homeworkContentId = computed(() => {
  const cid = homework.value?.content_id;
  return cid && cid > 0 ? Number(cid) : homework_id.value;
});

const isOverdue = computed(() => isHomeworkOverdue(homework.value?.deadline));
const deadlineText = computed(() => formatDeadline(homework.value?.deadline));
const statusLabel = computed(() => homeworkStatusLabel(homework.value?.deadline));

function checkStatus() {
  request.post("/editor/getAccountStatus", {account: account.value})
      .then((res) => {
        status.value = res;
        activeView.value = 'details';
      })
}

function loadHomework() {
  return request.post("/editor/getHomeworkById", {homework_id: homework_id.value})
      .then(res => {
        if (res) {
          homework.value = res;
        }
      })
}

function loadContent() {
  return request.post("/editor/getContentById", {contentId: homeworkContentId.value})
      .then((res) => {
        contents.value = Array.isArray(res) ? res : [];
        mySubmission.value = contents.value.find(item => item.account === account.value) || null;
        if (mySubmission.value) {
          submissionText.value = mySubmission.value.details || '';
        }
        loadMemberProfiles(contents.value.map(item => item.account));
      })
}

function loadMemberProfiles(accounts) {
  const unique = [...new Set(accounts.filter(Boolean))];
  unique.forEach(acc => {
    if (memberProfiles.value[acc]) return;
    request.post('/editor/account', { account: acc })
        .then(res => {
          if (res?.account) {
            memberProfiles.value = {
              ...memberProfiles.value,
              [acc]: {
                name: res.name,
                avatar_url: res.avatar_url,
              },
            };
          }
        })
        .catch(() => {});
  });
}

function initPage() {
  return loadHomework()
      .then(() => loadContent())
      .catch(error => {
        console.error(error);
        toast.error('加载作业失败');
      });
}

function resetHomeworkState() {
  activeView.value = 'details';
  submissionText.value = '';
  mySubmission.value = null;
  clearAttachment();
  selectedSubmission.value = null;
  gradeScore.value = 0;
  contents.value = [];
  memberProfiles.value = {};
  homework.value = {
    homework_id: homework_id.value,
    name: '',
    type: '',
    deadline: '',
    isCorrect: false,
    score: 0,
    content_id: 0,
    details: '',
  };
}

function syncFromRoute() {
  homework_id.value = Number(route.params.id);
  classId.value = Number(route.query.classId || 0);
}

syncFromRoute();
checkStatus();
initPage();

watch(
    () => [route.params.id, route.query.classId],
    ([newId, newClassId], [oldId, oldClassId]) => {
      if (String(newId) === String(oldId) && String(newClassId) === String(oldClassId)) {
        return;
      }
      syncFromRoute();
      resetHomeworkState();
      checkStatus();
      initPage();
    }
);

watch(homeworkContentId, () => {
  loadContent();
});

function showDetails() {
  activeView.value = 'details';
}

function submit() {
  activeView.value = 'submit';
}

function comment() {
  activeView.value = 'grade';
  if (contents.value.length > 0 && !selectedSubmission.value) {
    selectSubmission(contents.value[0]);
  }
}

function showDetails_2() {
  showDetails();
}

function selectSubmission(item) {
  selectedSubmission.value = item;
  gradeScore.value = item.score ?? 0;
  aiGradeComment.value = '';
}

function pickAttachment() {
  attachmentInputRef.value?.click();
}

function onAttachmentChange(event) {
  const file = event.target.files?.[0];
  attachmentFile.value = file || null;
}

function clearAttachment() {
  attachmentFile.value = null;
  if (attachmentInputRef.value) {
    attachmentInputRef.value.value = '';
  }
}

function submitHomework() {
  if (isOverdue.value) {
    toast.warning('作业已截止，无法提交');
    return;
  }
  const text = submissionText.value.trim();
  if (!text && !attachmentFile.value) {
    toast.warning('请填写作业内容或上传附件');
    return;
  }
  if (mySubmission.value) {
    toast.warning('您已提交过该作业');
    return;
  }
  const formData = new FormData();
  formData.append('content_id', String(homeworkContentId.value));
  formData.append('account', account.value);
  formData.append('details', text);
  if (attachmentFile.value) {
    formData.append('file', attachmentFile.value);
  }
  request.post('/editor/submitHomework', formData).then((ok) => {
    if (ok) {
      toast.success('作业提交成功');
      clearAttachment();
      loadContent();
      activeView.value = 'submit';
    } else {
      toast.error(isOverdue.value ? '作业已截止，无法提交' : '提交失败');
    }
  }).catch((err) => {
    console.error(err);
    toast.error('提交失败');
  });
}

function saveGrade() {
  if (!selectedSubmission.value) {
    toast.warning('请先选择要批阅的提交');
    return;
  }
  const score = Number(gradeScore.value);
  if (Number.isNaN(score) || score < 0 || score > 100) {
    toast.warning('成绩须在 0~100 之间');
    return;
  }
  request.put("/editor/setScore", {
    score,
    content_id: homeworkContentId.value,
    account: selectedSubmission.value.account,
  }).then((ok) => {
    if (ok) {
      toast.success('批阅成功');
      loadContent();
    } else {
      toast.error('批阅失败');
    }
  }).catch((err) => {
    console.error(err);
    toast.error('批阅失败');
  });
}

function suggestAiGrade() {
  if (!selectedSubmission.value) {
    toast.warning('请先选择要批阅的提交');
    return;
  }
  aiGrading.value = true;
  request.post('/editor/ai/suggestHomeworkGrade', {
    teacher_account: account.value,
    homework_name: homework.value.name,
    homework_description: homework.value.details || '',
    student_answer: selectedSubmission.value.details || '',
    max_score: 100,
  }, { timeout: 90000 }).then(res => {
    if (res?.available) {
      gradeScore.value = res.suggested_score ?? 0;
      aiGradeComment.value = res.comment || '';
      toast.success('AI 建议已填入');
    } else {
      toast.warning(res?.message || 'AI 暂不可用');
    }
  }).catch(() => toast.error('AI 调用失败'))
      .finally(() => { aiGrading.value = false; });
}

function remindSubmit() {
  if (!classId.value) {
    toast.warning('缺少课程信息，请从课程页进入作业');
    return;
  }
  request.post('/editor/remindHomework', {
    homework_id: homework_id.value,
    class_id: classId.value,
    teacher_account: account.value,
  }).then(ok => {
    if (ok) {
      toast.success('已向未提交学生发送催交通知');
    } else {
      toast.info('所有学生均已提交，无需催交');
    }
  }).catch(err => {
    console.error(err);
    toast.error('催交失败');
  });
}
</script>

<template>
  <div id="body">
    <div v-if="status === '老师'" class="title_container">
      <div class="title" :class="{ active: activeView === 'details' }" @click="showDetails_2">详情</div>
      <div class="title" :class="{ active: activeView === 'grade' }" @click="comment">批阅</div>
      <div class="title" @click="remindSubmit">催交</div>
    </div>
    <div v-else-if="status" class="title_container">
      <div class="title" :class="{ active: activeView === 'details' }" @click="showDetails">详情</div>
      <div
          class="title"
          :class="{ active: activeView === 'submit', disabled: isOverdue && !mySubmission }"
          @click="!isOverdue || mySubmission ? submit() : toast.warning('作业已截止，无法提交')"
      >
        提交作业
      </div>
    </div>

    <div v-show="activeView === 'details'" class="details">
      <img src="../assets/homeworkTitle.png" style="width: 55px" alt="">
      <div id="details">
        <div class="homework-name">{{ homework.name }}</div>
        <div class="content">
          <div class="type">{{ homework.type }}</div>
          <div class="type">截止时间： {{ deadlineText }}</div>
          <div class="score">100分</div>
          <div class="type" :class="{ overdue: isOverdue }">{{ statusLabel }}</div>
        </div>
        <div v-if="homework.details" class="homework-desc">{{ homework.details }}</div>
        <div v-else class="homework-desc muted">暂无作业说明</div>
        <div v-if="homework.attachment_url" class="attachment-row teacher-attachment">
          <span>教师附件：</span>
          <a :href="resolveAttachmentUrl(homework.attachment_url)" target="_blank" rel="noopener">
            {{ homework.attachment_name || '下载附件' }}
          </a>
        </div>
      </div>
    </div>

    <div v-show="activeView === 'submit'">
      <div class="details homework-intro">
        <img src="../assets/homeworkTitle.png" style="width: 55px" alt="">
        <div>
          <div class="homework-name">{{ homework.name }}</div>
          <div class="content">
            <div class="type">{{ homework.type }}</div>
            <div class="type">截止时间： {{ deadlineText }}</div>
            <div class="score">100分</div>
            <div class="type" :class="{ overdue: isOverdue }">{{ statusLabel }}</div>
          </div>
          <div v-if="homework.details" class="homework-desc">{{ homework.details }}</div>
          <div v-else class="homework-desc muted">暂无作业说明</div>
          <div v-if="homework.attachment_url" class="attachment-row teacher-attachment">
            <span>教师附件：</span>
            <a :href="resolveAttachmentUrl(homework.attachment_url)" target="_blank" rel="noopener">
              {{ homework.attachment_name || '下载附件' }}
            </a>
          </div>
        </div>
      </div>

      <div class="bottom_container">
        <div>提交内容</div>
      </div>
      <div class="bottom_box" v-if="mySubmission">
        <div>我的提交</div>
        <div style="margin-top: 12px; white-space: pre-wrap;">{{ mySubmission.details }}</div>
        <div v-if="mySubmission.attachment_url" class="attachment-row">
          <span>附件：</span>
          <a :href="resolveAttachmentUrl(mySubmission.attachment_url)" target="_blank" rel="noopener">
            {{ mySubmission.attachment_name || '下载附件' }}
          </a>
        </div>
        <div style="margin-top: 12px;">成绩：{{ mySubmission.score }} / 100</div>
      </div>
      <div class="most_bottom" v-else-if="isOverdue" >
        <div class="overdue-tip">作业已超过截止时间，无法继续提交。</div>
      </div>
      <div class="most_bottom" v-else>
        <textarea
            v-model="submissionText"
            class="homework_submission field-control field-textarea"
            placeholder="请输入作业内容（可与附件二选一或同时提交）"></textarea>
        <div class="attachment-upload">
          <input
              ref="attachmentInputRef"
              type="file"
              class="hidden-file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt"
              @change="onAttachmentChange"
          >
          <button type="button" class="btn-outline" @click="pickAttachment">选择附件</button>
          <span v-if="attachmentFile" class="attachment-name">
            {{ attachmentFile.name }}
            <button type="button" class="link-btn" @click="clearAttachment">移除</button>
          </span>
          <span v-else class="attachment-tip">支持 PDF、Office、图片、压缩包等，最大 10MB</span>
        </div>
        <button class="confirmSay" @click="submitHomework">提交作业</button>
      </div>
    </div>

    <div v-show="activeView === 'grade'">
      <div class="details homework-intro">
        <img src="../assets/homeworkTitle.png" style="width: 55px" alt="">
        <div>
          <div class="homework-name">{{ homework.name }}</div>
          <div class="content">
            <div class="type">{{ homework.type }}</div>
            <div class="type">截止时间： {{ deadlineText }}</div>
            <div class="score">100分</div>
            <div class="type" :class="{ overdue: isOverdue }">{{ statusLabel }}</div>
          </div>
          <div v-if="homework.details" class="homework-desc">{{ homework.details }}</div>
        </div>
      </div>
      <div class="grade-panel">
        <div class="grade-header">
          <span>学生提交列表（{{ contents.length }}）</span>
        </div>
        <div v-if="contents.length === 0" class="empty-tip">暂无学生提交</div>
        <div v-else class="submission-list">
          <div
              v-for="item in contents"
              :key="item.account"
              class="submission-item"
              :class="{ active: selectedSubmission?.account === item.account }"
              @click="selectSubmission(item)"
          >
            <UserAvatar
                :avatar-url="memberProfiles[item.account]?.avatar_url"
                :name="memberProfiles[item.account]?.name || item.account"
                :account="item.account"
                :size="36"
            />
            <div class="submission-meta">
              <div class="submission-account">{{ memberProfiles[item.account]?.name || item.account }}</div>
              <div class="submission-score">当前成绩：{{ item.score }} 分</div>
            </div>
          </div>
        </div>
        <div v-if="selectedSubmission" class="grade-form">
          <div class="grade-label">提交内容</div>
          <div class="grade-content">{{ selectedSubmission.details }}</div>
          <div v-if="selectedSubmission.attachment_url" class="attachment-row">
            <span>附件：</span>
            <a :href="resolveAttachmentUrl(selectedSubmission.attachment_url)" target="_blank" rel="noopener">
              {{ selectedSubmission.attachment_name || '下载附件' }}
            </a>
          </div>
          <div class="grade-row">
            <label>评分（0~100）</label>
            <input v-model.number="gradeScore" type="number" min="0" max="100" class="grade-input"/>
            <button type="button" class="btn-ai" :disabled="aiGrading" @click="suggestAiGrade">
              {{ aiGrading ? 'AI 分析中…' : 'AI 建议' }}
            </button>
            <button class="confirmSay" @click="saveGrade">保存批阅</button>
          </div>
          <p v-if="aiGradeComment" class="ai-comment">AI 评语：{{ aiGradeComment }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#body {
  width: min(1200px, calc(100vw - 48px));
  margin: auto;
  padding: 24px 0 48px;
}

.title_container {
  display: flex;
  margin-bottom: 20px;
}

.title {
  margin-right: 32px;
  font-size: 22px;
  cursor: pointer;
  color: #5f6368;
  padding-bottom: 6px;
  border-bottom: 2px solid transparent;
}

.title.active {
  color: rgb(66, 133, 244);
  border-bottom-color: rgb(66, 133, 244);
  font-weight: 600;
}

.title.disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.type.overdue {
  background-color: #fef2f2;
  color: #ef4444;
}

.overdue-tip {
  padding: 24px;
  text-align: center;
  color: #ef4444;
  font-size: 16px;
  background: #fef2f2;
  border-radius: 8px;
}

.details {
  display: flex;
  flex-direction: column;
  border: 1px solid rgb(204, 204, 204);
  margin-top: 20px;
  border-radius: 10px;
  padding: 16px;
}

.homework-intro {
  margin-bottom: 0;
}

.homework-name {
  font-weight: bold;
  font-size: large;
  margin-bottom: 15px;
}

.homework-desc {
  margin-top: 10px;
  font-size: 15px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.homework-desc.muted {
  color: #9ca3af;
}

#details {
  margin-top: 15px;
  margin-left: 15px;
  margin-bottom: 15px;
  font-size: 14px;
}

.content {
  display: flex;
}

.type {
  height: 25px;
  padding: 5px;
  border-radius: 5px;
  background-color: rgb(236, 243, 254);
  color: rgb(93, 133, 244);
  line-height: 15px;
  margin-right: 10px;
}

.score {
  height: 25px;
  padding: 5px;
  border-radius: 5px;
  background-color: rgb(248, 249, 250);
  color: rgb(144, 147, 178);
  line-height: 15px;
  margin-right: 10px;
}

.confirmSay {
  width: 100px;
  height: 40px;
  margin-top: 20px;
  border: none;
  color: #FFFFFF;
  background-color: rgb(66, 133, 244);
  border-radius: 5px;
  cursor: pointer;
  font-size: 18px;
}

.homework {
  display: flex;
}

.homeworkContent {
  margin: 6px 10px;
}

.box {
  width: 100%;
  border-bottom: 1px solid rgb(231, 235, 240);
}

.homeworkTitle {
  font-size: large;
}

.homeworkType {
  font-size: small;
  margin: 4px 0;
  color: rgb(95, 99, 104);
}

.bottom_container {
  margin-top: 15px;
  font-size: 28px;
}

.bottom_box {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 120px;
  margin-top: 23px;
  border-radius: 10px;
  border: 1px solid rgb(204, 204, 204);
}

.most_bottom {
  padding: 24px;
  min-height: 200px;
  margin-top: 23px;
  border-radius: 10px;
  border: 1px solid rgb(204, 204, 204);
}

.homework_submission {
  border: none;
  outline: none;
  width: 100%;
  height: 120px;
  resize: vertical;
}

.grade-panel {
  margin-top: 24px;
  padding: 24px;
  border: 1px solid rgb(204, 204, 204);
  border-radius: 10px;
  background: #f8f9fa;
}

.grade-header {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

.empty-tip {
  color: rgb(144, 147, 178);
  padding: 24px 0;
}

.submission-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.submission-item {
  padding: 12px 16px;
  background: #fff;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
}

.submission-meta {
  min-width: 0;
}

.submission-item.active {
  border-color: rgb(66, 133, 244);
  background: rgb(236, 243, 254);
}

.submission-account {
  font-weight: 600;
}

.submission-score {
  font-size: 14px;
  color: rgb(95, 99, 104);
  margin-top: 4px;
}

.grade-form {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgb(218, 220, 224);
}

.grade-label {
  font-weight: 600;
  margin-bottom: 8px;
}

.grade-content {
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  white-space: pre-wrap;
  min-height: 80px;
}

.grade-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.grade-input {
  width: 100px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 6px;
}

.btn-ai {
  padding: 0 14px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: #8b5cf6;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.btn-ai:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-comment {
  margin-top: 10px;
  font-size: 13px;
  color: #6d28d9;
  line-height: 1.5;
}

.attachment-upload {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.hidden-file {
  display: none;
}

.attachment-name {
  font-size: 14px;
  color: #374151;
}

.attachment-tip {
  font-size: 13px;
  color: #9ca3af;
}

.attachment-row {
  margin-top: 12px;
  font-size: 14px;
}

.teacher-attachment {
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.attachment-row a {
  color: rgb(72, 138, 248);
  text-decoration: none;
}

.link-btn {
  border: none;
  background: none;
  color: #ef4444;
  cursor: pointer;
  margin-left: 8px;
}
</style>
