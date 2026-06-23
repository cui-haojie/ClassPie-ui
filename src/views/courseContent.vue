<script setup lang="js" name="courseContent">
import {useRoute,useRouter} from "vue-router";
import {useAccountStore} from "@/stores/account.js";
import {storeToRefs} from "pinia";
import {ref, onMounted, onBeforeUnmount, computed} from "vue";
import request from "@/utils/request.js";
import {toast} from '@/utils/toast.js';
import {lockBodyScroll, unlockBodyScroll} from '@/utils/scrollLock.js';
import {SEMESTER_OPTIONS, formatSemester} from '@/constants/semesters.js';

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
const semester = ref('')
const code = ref('')
const is_pinned = ref('')
const count = ref(0)
const members = ref([])
const activeSection = ref('homework')
const showEditCourse = ref(false)
const editForm = ref({ class_name: '', class_time: '', selected_classes: '', semester: '' })
const semesterOptions = SEMESTER_OPTIONS

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
      semester.value = res.semester || '';
      code.value = resCode;
      is_pinned.value = resIsPinned;
      editForm.value = {
        class_name: resClassName,
        class_time: resClassTime,
        selected_classes: resSelectedClasses,
        semester: res.semester || '',
      }
    })

function loadMembers() {
  request.post('/editor/getCourseMembers', { id: Number(course_id.value) })
      .then(res => { members.value = Array.isArray(res) ? res : [] })
}

loadMembers()

function openEditCourse() {
  if (status.value !== '老师') {
    toast.warning('仅课程负责人可编辑')
    return
  }
  showEditCourse.value = true
}

function saveCourseEdit() {
  request.put('/editor/updateCourse', {
    id: Number(course_id.value),
    teacher_account: account.value,
    class_name: editForm.value.class_name,
    class_time: editForm.value.class_time,
    selected_classes: editForm.value.selected_classes,
    semester: editForm.value.semester,
  }).then(ok => {
    if (ok) {
      toast.success('课程信息已更新')
      showEditCourse.value = false
      class_name.value = editForm.value.class_name
      class_time.value = editForm.value.class_time
      selected_classes.value = editForm.value.selected_classes
      semester.value = editForm.value.semester
    }
  })
}
request.post("/editor/getCountById", {id: course_id.value})
.then((res) => {
  count.value = res;
})

const around = ref(null);
const createHomework = ref(null);

function addHomework(){
  around.value.style.display = 'block';
  createHomework.value.style.display = 'block';
  lockBodyScroll();
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
    toast.warning("请勾选类型！")
    return false;
  }
  if(!title_2.value.trim()){
    toast.warning("请填写作业名称")
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
            toast.success("作业添加成功！");
            cancel();
            loadHomework();
          }
        })
        .catch(error => {
          console.error("完整错误:", error);
          toast.error(error.response?.data?.message || "提交失败");
        });
  }
}

function cancel() {
  around.value.style.display = 'none';
  createHomework.value.style.display = 'none';
  unlockBodyScroll();
}

onBeforeUnmount(() => {
  unlockBodyScroll();
});

const num = ref(0)
const class_id = Number(course_id.value)
request.post("/editor/getCountByClassId", {class_id:class_id})
.then((res) => {
  num.value = res;
})
    .catch(error => {
      toast.error('加载失败')
    })

const home_work = ref([]);

function loadHomework() {
request.post("/editor/getHomeworkByClassId", {class_id:class_id})
  .then((res) => {
    home_work.value = res;
    console.log(res);
  })
    .catch(error => {
      toast.error('加载失败')
    })
}

loadHomework();

function handleHomework(homeworkId) {
  router.push({
    name: 'homeworkContent',
    params: {id: homeworkId},
    query: { classId: course_id.value },
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
        <span class="course-semester-badge">{{ formatSemester(semester) }}</span>
        <h1 style="margin-top: 10px;color: #FFFFFF;font-size: 40px;font-weight: 450">{{ class_name }}</h1>
        <p style="font-size: 20px;font-weight: 450;margin-bottom: 70px">{{selected_classes}}</p>
        <p style="margin-top: 70px"><i class="iconfont icon-erweima"/> 加课码：{{code}} 已有{{count}}人加入</p>
      </div>
      <div class = "headBottom">
        <div class = "headBottomContent">
          <div class = "title" id = "classLearn">课程学习</div>
          <div class = "title" @click="activeSection='members'">成员({{count}})</div>
          <div class = "title" @click="openEditCourse">编辑课程</div>
        </div>
      </div>
    </div>
    <div class = "mid">
      <div class="midTitle" :class="{active: activeSection==='homework'}" @click="activeSection='homework'">作业</div>
      <div class="midTitle" :class="{active: activeSection==='members'}" @click="activeSection='members'">成员</div>
    </div>
    <div v-if="activeSection==='members'" class="members-panel">
      <div class="member-row member-header">
        <span>账号</span><span>姓名</span><span>角色</span><span>学号</span>
      </div>
      <div class="member-row" v-for="m in members" :key="m.account">
        <span>{{ m.account }}</span><span>{{ m.name }}</span><span>{{ m.status }}</span><span>{{ m.status_number || '-' }}</span>
      </div>
    </div>
    <template v-else>
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
    </template>
    <div v-if="showEditCourse" class="edit-course-modal" @click.self="showEditCourse=false">
      <div class="edit-course-box">
        <h3>编辑课程</h3>
        <input v-model="editForm.class_name" placeholder="课程名称" class="edit-input"/>
        <select v-model="editForm.semester" class="edit-input edit-select">
          <option v-for="item in semesterOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
        <input v-model="editForm.class_time" placeholder="上课时间" class="edit-input"/>
        <input v-model="editForm.selected_classes" placeholder="教学班级" class="edit-input"/>
        <div class="edit-actions">
          <button @click="showEditCourse=false">取消</button>
          <button class="primary" @click="saveCourseEdit">保存</button>
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
  position: relative;
}

.course-semester-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
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

.midTitle.active {
  color: rgb(66, 133, 244);
  font-weight: 600;
}

.members-panel {
  width: 1469px;
  margin-top: 20px;
  border: 1px solid rgb(231, 235, 240);
  border-radius: 8px;
  overflow: hidden;
}

.member-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.member-header {
  background: #f8f9fa;
  font-weight: 600;
}

.edit-course-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-course-box {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  width: 420px;
}

.edit-input {
  width: 100%;
  height: 40px;
  margin: 8px 0;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.edit-select {
  background: #fff;
  cursor: pointer;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.edit-actions .primary {
  background: rgb(66,133,244);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
}

p {
  color: #FFFFFF;
}
</style>