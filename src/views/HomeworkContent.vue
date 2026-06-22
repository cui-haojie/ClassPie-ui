<script setup lang="js" name="HomeworkContent" xmlns="http://www.w3.org/1999/html">
import {useRoute,useRouter} from "vue-router";
import {computed, ref} from "vue";
import request from "@/utils/request.js";
import {useAccountStore} from "@/stores/account.js";
import {storeToRefs} from "pinia";

/**
 * @typedef {Object} Homework
 * @property {number} homework_id
 * @property {string} name
 * @property {string} type
 * @property {string} deadline
 * @property {boolean} isCorrect
 * @property {Number} score
 * @property {string} submitter
 * @property {string} details
 */

const router = useRouter();
const route = useRoute();

const accountStore = useAccountStore();
const {account} = storeToRefs(accountStore);

const studentTitle = ref("");
const teacherTitle = ref("");
const status = ref("");
const details_container = ref('');
const homeworks = ref('');
const comment_details = ref('');

const name = ref('');
const homework_id = ref(route.params.id);
const type = ref('');
const deadline = ref('');
const isCorrect = ref(false);
const score = ref(0);
const submitter = ref('');
const details = ref('');
const homework = ref({
  homework_id: homework_id.value,
  name: name.value,
  type: type.value,
  deadline: deadline.value,
  isCorrect: isCorrect.value,
  score: score.value,
  submitter: submitter.value,
  details: details.value,
})
const contents = ref([]);

const content_id = ref(route.params.id);
const account_1 = ref('');
const score_2 = ref(0);
const details_2 = ref('');
const content = ref({
  content_id: content_id.value,
  account: account_1.value,
  score: score_2.value,
  details: details_2.value,
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

checkStatus()

request.post("/editor/getHomeworkById",{homework_id:Number(homework_id.value)})
.then(res => {
  homework.value = res;
})
.catch(error => {
  alert(error)
})


function submit() {
  details_container.value.style.display = "none";
  homeworks.value.style.display = "block";
}

function showDetails() {
  details_container.value.style.display = "block"
  homeworks.value.style.display = "none";
}

function comment() {
 comment_details.value.style.display = "block";
 details_container.value.style.display = "none";
}

function showDetails_2() {
  details_container.value.style.display = "block";
  comment_details.value.style.display = "none";
}


function loadContent() {
  request.post("/editor/getContentById",{content_id:Number(content_id.value)})
  .then((res) => {
    contents.value = res;
    alert("作业加载成功！");
    console.log(contents.value);
  })
  .catch(error => {
    alert(error)
  })
}
loadContent();
</script>

<template>
  <div id = "body">
    <div class = "title_container" id = "teacherTitle" ref = "teacherTitle">
      <div class = "title" @click = "showDetails_2">详情</div>
      <div class = "title">AI批阅设置</div>
      <div class = "title" @click = "comment">批阅</div>
    </div>
    <div class = "title_container" id = "studentTitle" ref = "studentTitle">
      <div class = "title" @click = "showDetails">详情</div>
      <div class = "title" @click = "submit">提交作业</div>
    </div>
    <div id = "homeworks_container" ref="homeworks">
    <div class = "homeworks">
      <div class = "box">
        <div class = "homework">
          <img src="../assets/homework.png" alt="作业" style="width: 100px">
          <div class = "homeworkContent">
            <div class = "homeworkTitle">
              {{homework.name}}
            </div>
            <div class = "homeworkType">
              提交截止时间：
              {{homework.deadline}} | 未截止 | {{homework.type}} 100分
            </div>
            <div class = "isCorrect">
              <!--                {{homework.isCorrect}} {{homework.score}}-->
            </div>
          </div>
        </div>
      </div>
    </div>
      <div class = "bottom_container">
        <div>提交内容</div>
      </div>
      <div class = "bottom_box">
        <div>
        老师批阅
        </div>
        <div>
          成绩
        </div>
        <div>
          {{homework.score}} / 100
        </div>
      </div>
      <div class = "most_bottom">
        <div>
<textarea
    id="homework_submission"
    class="homework_submission"
    placeholder="作业提交框"></textarea>
          <button class = "confirmSay">提交作业</button>
        </div>
      </div>
    </div>
    <div id = "comment_details" ref = "comment_details" style="display: none;">
    <div class = "box">
      <div class = "homework">
        <img src="../assets/homework.png" alt="作业" style="width: 100px">
        <div class = "homeworkContent">
          <div class = "homeworkTitle">
            {{homework.name}}
          </div>
          <div class = "homeworkType">
            提交截止时间：
            {{homework.deadline}} | 未截止 | {{homework.type}} 100分
          </div>
          <div class = "isCorrect">
            <!--                {{homework.isCorrect}} {{homework.score}}-->
          </div>
        </div>
      </div>
    </div>
      <div id = "content_container" ref = "content_container">
        <div>

        </div>
      </div>
    </div>
    <div ref = "details_container">
    <div class = "details">
      <img src="../assets/homeworkTitle.png" style="width: 55px">
      <div id = "details">
        <div style="font-weight: bold;font-size: large;margin-bottom: 15px">{{ homework.name }}</div>
        <div class = "content">
          <div class = "type">{{homework.type}} </div>
          <div class = "type">截止时间： {{homework.deadline}} </div>
          <div class = "score">100分 </div>
          <div class = "score">查重 </div>
          <div class = "score">允许超时交</div>
        </div>
        <div style="margin-top: 10px;font-size: 15px">{{homework.details}}</div>
      </div>
    </div>
    <div class = "say">
  <img src="../assets/head.png" style="width: 40px;height:40px;border-radius: 20px;margin-top: 10px">
      <textarea
          id="bigInput"
          class="large-textarea"
          placeholder="说点什么吧"></textarea>
    </div>
    <div class = "bottom">
      <button class = "confirmSay">发表评论</button>
    </div><br>
    <div class = "mostBottom">
      <div style="line-height: 10px;display: flex">
    <div style="font-size: 28px">全部评论</div>
        <div style="margin-left: 10px;color: rgb(144, 147, 178)">共0条</div>
        </div>
      <img src="../assets/NoParam.png" style="width: 500px;margin-left: 430px;margin-top: 50px">
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

#details{
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

.score{
  height: 25px;
  padding: 5px;
  border-radius: 5px;
  background-color: rgb(248, 249, 250);
  color: rgb(144, 147, 178);
  line-height: 15px;
  margin-right: 10px;
}

.say {
  background-color: #f8f9fa;
  margin: 26px 0 0;
  padding: 12px;
  width: 100%;
  border-bottom: 3px solid rgb(66, 133, 244);
  display: flex;
  height: 90px;
}

#bigInput {
  border: none;
  outline: none;
  margin-left: 20px;
  background-color: #f8f9fa;
  width: 100%;
  margin-top: 10px;
}

::placeholder {
  color: #999;
  font-size: large;
  font-weight: bold;
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
  position: relative;
  right: 0;
}

.bottom {
  float: right;
}

.mostBottom{
  margin-top: 50px;
}

.homework {
  display: flex;
}

.homeworkContent{
  margin:6px 10px;
}

.box{
  width: 100%;
  border-bottom: 1px solid  rgb(231, 235, 240);
}

.homeworkTitle {
  font-size: large;
}

.homeworkType {
  font-size: small;
  margin:4px 0;
  color: rgb(95, 99, 104);
}

#homeworks_container {
  display: none;
}

.bottom_container {
  margin-top: 15px;
  font-size: 28px;
}

.bottom_box {
  padding: 24px;
  background-color: #f8f9fa;
  height: 167px;
  margin-top: 23px;
  border-radius: 10px;
  border: 1px solid rgb(204, 204, 204);
}

.most_bottom{
  padding: 24px;
  height: 200px;
  margin-top: 23px;
  border-radius: 10px;
  border: 1px solid rgb(204, 204, 204);
}

#homework_submission{
  border: none;
  outline: none;
  width: 100%;
  height: 80px;
}
</style>