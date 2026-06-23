<script setup lang="js" name="HomeworkContent">
import {useRoute} from "vue-router";
import {computed, ref, watch} from "vue";
import request from "@/utils/request.js";
import {useAccountStore} from "@/stores/account.js";
import {storeToRefs} from "pinia";
import {toast} from '@/utils/toast.js';

const route = useRoute();
const accountStore = useAccountStore();
const {account} = storeToRefs(accountStore);
const classId = ref(Number(route.query.classId || 0));

const studentTitle = ref(null);
const teacherTitle = ref(null);
const details_container = ref(null);
const homeworks = ref(null);
const comment_details = ref(null);

const status = ref("");
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
const submissionText = ref('');
const mySubmission = ref(null);

const homeworkContentId = computed(() => {
  const cid = homework.value?.content_id;
  return cid && cid > 0 ? Number(cid) : homework_id.value;
});

function checkStatus() {
  request.post("/editor/getAccountStatus", {account: account.value})
      .then((res) => {
        status.value = res;
        if (status.value === "老师") {
          teacherTitle.value.style.display = "flex";
          studentTitle.value.style.display = "none";
        } else {
          teacherTitle.value.style.display = "none";
          studentTitle.value.style.display = "flex";
        }
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
      })
}

function initPage() {
  loadHomework()
      .then(() => loadContent())
      .catch(error => {
        console.error(error);
        toast.error('加载作业失败');
      });
}

checkStatus();
initPage();

watch(homeworkContentId, () => {
  loadContent();
});

function submit() {
  details_container.value.style.display = "none";
  comment_details.value.style.display = "none";
  homeworks.value.style.display = "block";
}

function showDetails() {
  details_container.value.style.display = "block";
  homeworks.value.style.display = "none";
  comment_details.value.style.display = "none";
}

function comment() {
  comment_details.value.style.display = "block";
  details_container.value.style.display = "none";
  homeworks.value.style.display = "none";
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
}

function submitHomework() {
  const text = submissionText.value.trim();
  if (!text) {
    toast.warning('请先填写作业内容');
    return;
  }
  if (mySubmission.value) {
    toast.warning('您已提交过该作业');
    return;
  }
  request.post("/editor/addContent", {
    content_id: homeworkContentId.value,
    account: account.value,
    score: 0,
    details: text,
  }).then((ok) => {
    if (ok) {
      toast.success('作业提交成功');
      loadContent();
    } else {
      toast.error('提交失败');
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
    <div class="title_container" id="teacherTitle" ref="teacherTitle" style="display: none">
      <div class="title" @click="showDetails_2">详情</div>
      <div class="title" @click="comment">批阅</div>
      <div class="title" @click="remindSubmit">催交</div>
    </div>
    <div class="title_container" id="studentTitle" ref="studentTitle" style="display: none">
      <div class="title" @click="showDetails">详情</div>
      <div class="title" @click="submit">提交作业</div>
    </div>

    <div id="homeworks_container" ref="homeworks" style="display: none">
      <div class="homeworks">
        <div class="box">
          <div class="homework">
            <img src="../assets/homework.png" alt="作业" style="width: 100px">
            <div class="homeworkContent">
              <div class="homeworkTitle">{{ homework.name }}</div>
              <div class="homeworkType">
                提交截止时间：{{ homework.deadline }} | {{ homework.type }} 100分
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="bottom_container">
        <div>提交内容</div>
      </div>
      <div class="bottom_box" v-if="mySubmission">
        <div>我的提交</div>
        <div style="margin-top: 12px; white-space: pre-wrap;">{{ mySubmission.details }}</div>
        <div style="margin-top: 12px;">成绩：{{ mySubmission.score }} / 100</div>
      </div>
      <div class="most_bottom" v-else>
        <textarea
            v-model="submissionText"
            class="homework_submission"
            placeholder="请输入作业内容"></textarea>
        <button class="confirmSay" @click="submitHomework">提交作业</button>
      </div>
    </div>

    <div id="comment_details" ref="comment_details" style="display: none;">
      <div class="box">
        <div class="homework">
          <img src="../assets/homework.png" alt="作业" style="width: 100px">
          <div class="homeworkContent">
            <div class="homeworkTitle">{{ homework.name }}</div>
            <div class="homeworkType">
              提交截止时间：{{ homework.deadline }} | {{ homework.type }} 100分
            </div>
          </div>
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
            <div class="submission-account">{{ item.account }}</div>
            <div class="submission-score">当前成绩：{{ item.score }} 分</div>
          </div>
        </div>
        <div v-if="selectedSubmission" class="grade-form">
          <div class="grade-label">提交内容</div>
          <div class="grade-content">{{ selectedSubmission.details }}</div>
          <div class="grade-row">
            <label>评分（0~100）</label>
            <input v-model.number="gradeScore" type="number" min="0" max="100" class="grade-input"/>
            <button class="confirmSay" @click="saveGrade">保存批阅</button>
          </div>
        </div>
      </div>
    </div>

    <div ref="details_container">
      <div class="details">
        <img src="../assets/homeworkTitle.png" style="width: 55px">
        <div id="details">
          <div style="font-weight: bold;font-size: large;margin-bottom: 15px">{{ homework.name }}</div>
          <div class="content">
            <div class="type">{{ homework.type }}</div>
            <div class="type">截止时间： {{ homework.deadline }}</div>
            <div class="score">100分</div>
          </div>
          <div style="margin-top: 10px;font-size: 15px">{{ homework.details }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#body {
  width: 1469px;
  margin: auto;
  padding-top: 110px;
}

.title_container {
  display: flex;
  margin-bottom: 20px;
}

.title {
  margin-right: 32px;
  font-size: 22px;
  cursor: pointer;
}

.details {
  display: flex;
  flex-direction: column;
  border: 1px solid rgb(204, 204, 204);
  margin-top: 40px;
  border-radius: 10px;
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
</style>
