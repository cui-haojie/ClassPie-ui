<script setup lang="js" name="courseContent">
import {useRoute,useRouter} from "vue-router";
import {useAccountStore} from "@/stores/account.js";
import {storeToRefs} from "pinia";
import {ref, onMounted,computed} from "vue";
import request from "@/utils/request.js";

/**
 * @typedef {Object} Homework
 * @property {number} homework_id
 * @property {string} name
 * @property {string} type
 * @property {string} deadline
 * @property {boolean} isCorrect
 * @property {Number} score
 * @property {string} submitter
*/

const router = useRouter();

const accountStore = useAccountStore();
const {account} = storeToRefs(accountStore);
console.log(account.value)
const route = useRoute();
const course_id = ref(route.query.id);

const account_1 = ref('')
const name = ref('')
const password = ref('')
const status = ref('')
const mechanism = ref('')
const email_or_phone = ref('')
const status_number = ref('')

const addHomework_container = ref(null)

const id = ref('')
const teacher_account = ref('')
const class_time = ref('')
const class_name = ref('')
const selected_classes = ref('')
const code = ref('')
const is_pinned = ref('')
const count = ref(0)

request.post("/editor/account",{account: account.value})
    .then((res) => {
      const data = res;
      console.log(res)
      const {
        account: resAccount,
        name: resName,
        status: resStatus,
        password: resPassword,
        mechanism: resMechanism,
        email_or_phone: resEmailOrPhone,
        status_number: resStatusNumber
      } = data;

      account_1.value = resAccount;
      name.value = resName;
      status.value = resStatus;
      password.value = resPassword;
      mechanism.value = resMechanism;
      email_or_phone.value = resEmailOrPhone;
      status_number.value = resStatusNumber;
      if (status.value === '学生') {
        addHomework_container.value.style.display = 'none';
      } else {
        addHomework_container.value.style.display = 'block';
      }})

request.post("/editor/getCourseById", {id: course_id.value})
    .then((res) => {
      console.log(res)
      const {
        id: resId,
        teacher_account: resTeacherAccount,
        class_time: resClassTime,
        class_name: resClassName,
        selected_classes: resSelectedClasses,
        code: resCode,
        is_pinned: resIsPinned
      } = res;
      id.value = resId;
      teacher_account.value = resTeacherAccount;
      class_time.value = resClassTime;
      class_name.value = resClassName;
      selected_classes.value = resSelectedClasses;
      code.value = resCode;
      is_pinned.value = resIsPinned;
    })
request.post("/editor/getCountById", {id: course_id.value})
.then((res) => {
  count.value = res;
})

const preventTouch = (e) => {
  e.preventDefault();
};

const around = ref(null);
const createHomework = ref(null);

function addHomework(){
  around.value.style.display = 'block';
  createHomework.value.style.display = 'block';
  document.body.style.overflow = 'hidden';
  document.addEventListener('touchmove', preventTouch, { passive: false });
}

const checkedOptions = ref({
  personal: false,
  team: false,
});

const lastSelected = ref(null);

const handleCheckboxChange = (changedOption) => {
  const newValue = !checkedOptions.value[changedOption];

  // 更新当前选项
  checkedOptions.value[changedOption] = newValue;

  if (newValue) {
    // 如果选中当前选项
    lastSelected.value = changedOption;
    // 取消另一个选项
    const otherOption = changedOption === 'personal' ? 'team' : 'personal';
    checkedOptions.value[otherOption] = false;
  } else {
    // 如果取消选中
    if (lastSelected.value === changedOption) {
      lastSelected.value = null;
    }
  }
};
const type = computed(() => {
  return lastSelected.value === 'team' ? '团队作业' :
      lastSelected.value === 'personal' ? '个人作业' :
          null;
});

function checkType() {
  if (type.value === null) {
    alert("请勾选类型！")
    return false;
  }
  if(!title_2.value.trim()){
    alert("请填写作业名称")
    return false;
  }
  return true;
}

const title_2 = ref('');
const bigInput = ref('');
const deadline = ref('');
const homework = computed(() => ({
  type: type.value,
  name: title_2.value,
  details: bigInput.value,
  deadline: deadline.value,
}));

function confirmHomework() {
  if (checkType()) {
    request.post("/editor/addHomework", {homework:homework.value,class_id:Number(course_id.value)})
        .then((res) => {
          if (res) {
            alert("作业添加成功！");
            cancel();  // 成功后关闭弹窗
          }
        })
        .catch(error => {
          console.error("完整错误:", error);
          alert(error.response?.data?.message || "提交失败");
        });
  }
}

function cancel() {
  around.value.style.display = 'none';
  createHomework.value.style.display = 'none';
  document.body.style.overflow = 'visible';
  document.removeEventListener('touchmove', preventTouch);

}

const num = ref(0)
const class_id = Number(course_id.value)
request.post("/editor/getCountByClassId", {class_id:class_id})
.then((res) => {
  num.value = res;
})
    .catch(error => {
      alert(error)
    })

const home_work = ref([]);

function loadHomework() {
request.post("/editor/getHomeworkByClassId", {class_id:class_id})
  .then((res) => {
    home_work.value = res;
    console.log(res);
  })
    .catch(error => {
      alert(error)
    })
}

loadHomework();

function handleHomework(homeworkId) {
  router.push({
    name: 'homeworkContent',
    params: {id: homeworkId},
  })
}

</script>

<template>
  <div id="around"
       ref = 'around'
       style="position: fixed;width: 100%;height: 100%;background-color: rgba(0,0,0,0.3);z-index: 999;display: none"></div>
  <div id = "createHomework"  ref="createHomework" style="margin-left: 450px;margin-top:70px;position: fixed;z-index: 9999;background-color: #FFFFFF;border-radius: 7px;width: 810px;height:700px;display: none">
    <div style="height: 10%;border-bottom: 1px solid rgb(218, 220, 224);padding: 20px">
      <span>添加作业</span>
      <i @click="cancel" class="iconfont icon-chacha_chacha" style="margin-left: 680px;cursor: pointer"></i>
    </div>
    <div style="height: 80%;border-bottom: 1px solid rgb(218, 220, 224);padding: 20px">
      <div style="cursor: pointer;color: #4285f4">导入作业</div>
      <div class = "homeworkType">
        <div style="margin-right: 10px">作业类型</div>
        <label style="margin-right: 10px">
          <input
              type="checkbox"
              :checked="checkedOptions.personal"
              @change="handleCheckboxChange('personal')"
          >
          个人作业
        </label>

        <label>
          <input
              type="checkbox"
              :checked="checkedOptions.team"
              @change="handleCheckboxChange('team')"
          >
          团队作业
        </label>
    </div>
      <div style="display: flex;margin-top: 20px"><div>作业标题</div>
        <input type="text" placeholder="作业标题" id="title_2"
               v-model="title_2"
               style="padding: 0 30px 0 15px;width: 705px;height: 36px;border: 1px solid rgb(218, 220, 224);border-radius: 5px">
      </div>
      <textarea
          id="bigInput"
          v-model="bigInput"
          class="large-textarea"
          placeholder="作业详情"></textarea>
      <div>选择截止日期 </div>
      <input type = "date" id = "deadline" v-model = "deadline">
    </div>
    <div style="height: 10%">
      <div id="but_box">
        <button id="cancel" @click="cancel">取消</button>
        <button id="confirm" @click="confirmHomework">确认</button>
      </div>
    </div>
  </div>
  <div style="justify-content: center;width: 1469px;margin: auto">
    <div style="padding-top: 100px" class="top">
      <div class="headTop">
        <h1 style="margin-top: 10px;color: #FFFFFF;font-size: 40px;font-weight: 450">{{ class_name }}</h1>
        <p style="font-size: 20px;font-weight: 450;margin-bottom: 70px">{{selected_classes}}</p>
        <p style="margin-top: 70px"><i class="iconfont icon-erweima"/> 加课码：{{code}} 已有{{count}}人加入</p>
      </div>
      <div class = "headBottom">
        <div class = "headBottomContent">
          <div class = "title" id = "classLearn">课程学习</div>
          <div class = "title">学情分析</div>
          <div class = "title">成绩管理</div>
          <div class = "title">课程介绍</div>
          <div class = "title">知识图谱</div>
        </div>
      </div>
    </div>
    <div class = "mid">
      <div class="midTitle" style="padding-left: 0">互动课件</div>
      <div class="midTitle">作业</div>
      <div class="midTitle">资料</div>
      <div class="midTitle">公告</div>
    </div>
    <div class = "mid_container">
      <div id = "acts">共{{num}}个活动</div>
      <div class = "teacher_create" id = "addHomework_container">
        <button id = "addHomework" ref="addHomework_container" @click = "addHomework">＋ 添加作业</button>
      </div>
    </div>
    <div class = "homeworks_container">
      <div class = "homeworks">
        <div class = "box" v-for = "(homework,index) in home_work" :key="homework.homework_id" @click = "handleHomework(homework.homework_id)">
          <div class = "homework">
            <img src="../assets/homework.png" alt="作业" style="width: 100px">
            <div class = "homeworkContent">
            <div class = "homeworkTitle">
              {{homework.name}}
            </div>
              <div class = "homeworkType">
                提交截止时间：
                {{homework.deadline}} | 未截止 | {{homework.type}}
              </div>
              <div class = "isCorrect">
<!--                {{homework.isCorrect}} {{homework.score}}-->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.headTop {
  width: 1469px;
  height: 240px;
  background: url("../assets/topBg.png") no-repeat;
  background-size: cover;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  padding: 24px;
}

.top {
  height: 320px;
  width:1469px;
  border-bottom-right-radius: 15px;
  border-bottom-left-radius: 15px;
}

.headBottom{
  display: flex;
  box-shadow:
      -4px 4px 10px rgba(0, 0, 0, 0.1),
      4px 4px 10px rgba(0, 0, 0, 0.1);
  width: 1469px;
  border-bottom-right-radius: 15px;
  border-bottom-left-radius: 15px;
  height: 75px;
}

.headBottomContent{
  display: flex;
  margin: auto;
  font-size: 23px;
}

.title{
  margin: 0 24px;
  padding: 0 5px;
  width: 108px;
  height: 48px;
  line-height: 48px;
  text-align: center;
  border-radius: 14px;
}

#classLearn{
  background-color: rgb(230, 238, 253);
  color: rgb(66, 133, 244);
}

.mid{
  display: flex;
  height: 60px;
  width:1469px;
  line-height: 60px;
  font-size: 19px;
  margin-top: 100px;
}

.midTitle{
  padding: 0 20px;
  font-weight: 500;
}

#acts {
  width: 150px;
  height: 20px;
  line-height: 20px;
  margin-top: 8px;
}

.mid_container{
  width: 1469px;
  height: 45px;
  line-height: 45px;
  display: flex;
}

.teacher_create{
  margin-left: 1232px;
  margin-bottom: 60px;
  padding-bottom: 60px;
}

.homeworks_container{
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 10px;
  border: 1px solid rgb(231, 235, 240);
  margin-top: 5px;
  padding: 20px 16px 16px;
}

#addHomework{
  height: 43px;
  width: 139px;
  background-color: #00CA90;
  padding: 10px 20px;
  color: #FFFFFF;
  border: none;
  outline: none;
  border-radius:22px;
  font-size: 16px;
  display: none;
  cursor: pointer;
}

.homeworkType{
  display: flex;
  margin-top: 5px;
  margin-bottom: 5px;
}

.large-textarea{
  margin-top: 10px;
  width: 100%;
  height: 300px;
  border: 1px solid rgb(231, 235, 240);
  border-radius: 5px;
}

#but_box {
  position: absolute;
  right: 20px;
  top: 642px;
}

#cancel {
  width: 90px;
  height: 46px;
  border: 1px solid rgb(218, 220, 224);
  color: rgb(96, 98, 102);
  background-color: #FFFFFF;
  border-radius: 5px;
  cursor: pointer;
  font-size: 18px;
}

#confirm {
  width: 90px;
  height: 46px;
  margin-left: 15px;
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

.homeworkContent{
  margin:6px 10px;
}

.box{
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

p {
  color: #FFFFFF;
}
</style>