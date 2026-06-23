<script setup lang="js" name="mainInterface">
import {useRouter} from "vue-router";
import {useAccountStore} from "@/stores/account.js";
import {storeToRefs} from "pinia";
import request from "@/utils/request.js";
import {ref, onMounted} from "vue";
import {computed} from "vue";

const router = useRouter();
const accountStore = useAccountStore();
const {account} = storeToRefs(accountStore);
console.log(account.value)
const account_1 = ref('')
const name = ref('')
const password = ref('')
const status = ref('')
const mechanism = ref('')
const email_or_phone = ref('')
const status_number = ref('')
const join_Class = ref(null);
const joinOrCreate = ref(null);
const container = ref(null);
const courses = ref([]);
const learn = ref(null)
const teach = ref(null)
const searchKeyword = ref('')
const courseListVisible = ref(true)
const activeTab = ref('all')
const showArchiveModal = ref(false)
const archivedCourses = ref([])
const schoolClasses = ref([])
const selectedSchoolClassIds = ref([])
const newClassName = ref('')
const newClassMechanism = ref('')

const pinnedCourses = computed(() =>
    courses.value.filter(course => course.is_pinned)
);

const filteredCourses = computed(() => {
  let list = courses.value
  if (activeTab.value === 'learn') {
    list = list.filter(course => course.teacherName !== name.value)
  } else if (activeTab.value === 'teach') {
    list = list.filter(course => course.teacher_account === account.value || course.teacherName === name.value)
  }
  if (!searchKeyword.value) return list;
  return list.filter(course => {
    return (
        course.class_name.includes(searchKeyword.value) ||
        course.selected_classes.includes(searchKeyword.value) ||
        course.teacherName.includes(searchKeyword.value) ||
        course.code.includes(searchKeyword.value)
    );
  });
});

function update() {
  request.post("/editor/account", {account: account.value})
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
          join_Class.value.style.display = 'block';
          joinOrCreate.value.style.display = 'none';
        } else {
          join_Class.value.style.display = 'none';
          joinOrCreate.value.style.display = 'block';
          request.post("/editor/addTeacherCourse", {account: account.value})
              .then((res) => {
                if (res) {
                  alert("老师课程创建成功，请刷新")
                  loadCourse();
                }
              }).catch((err) => {
            alert("创建失败" + err.message);
            console.log(err);
          })
        }
      })
      .catch(error => {
        console.error(error);
        alert(error.message || "请求失败");
      });
}

onMounted(() => {
  update()
  loadCourse()
});

function loadCourse() {
  request.post("/editor/courses", {account: account.value})
      .then(async (res) => {
        if (!res) throw new Error("课程数据为空");
        courses.value = res;
        // alert("课程数据加载成功");

        // 使用 Promise.all 并行请求教师姓名
        const teacherRequests = res.map(course =>
            request.post("/editor/selectTeacherName", {account: course.teacher_account})
                .then(teacherRes => ({
                  ...course,
                  teacherName: teacherRes || "未知教师"
                }))
                .catch(err => {
                  console.error(`获取教师 ${course.teacher_account} 失败:`, err);
                  return {
                    ...course,
                    teacherName: "教师姓名获取失败"
                  };
                })
        );
        // 等待所有教师请求完成
        courses.value = await Promise.all(teacherRequests);
      })
      .catch(error => {
        console.error("课程加载失败:", error);
        alert("课程加载失败: " + error.message);
      });
}

console.log(courses.value[0])

function Choice() {
  choice.style.display = choice.style.display === 'none' ? 'block' : 'none';
}

function cancel() {
  around.style.display = 'none';
  join_class.style.display = 'none';
  code_input.value = '';
  document.body.style.overflow = 'visible';
  document.removeEventListener('touchmove', preventTouch);
}

function kill() {
  around.style.display = 'none';
  join_class.style.display = 'none';
  code_input.value = '';
  document.body.style.overflow = 'visible';
  document.removeEventListener('touchmove', preventTouch);
}

function joinClass() {
  around.style.display = 'block';
  join_class.style.display = 'block';
  document.body.style.overflow = 'hidden';
  document.addEventListener('touchmove', preventTouch, { passive: false });
}

function loadSchoolClasses() {
  request.post("/editor/listSchoolClasses", {})
      .then(res => {
        schoolClasses.value = res || [];
      })
      .catch(err => console.error(err));
}

function createClass() {
  loadSchoolClasses();
  around.style.display = 'block';
  create_class.style.display = 'block';
  document.body.style.overflow = 'hidden';
  document.addEventListener('touchmove', preventTouch, { passive: false });
}

function addSchoolClass() {
  if (!newClassName.value.trim()) {
    alert("请输入班级名称");
    return;
  }
  request.post("/editor/createSchoolClass", {
    name: newClassName.value.trim(),
    mechanism: newClassMechanism.value.trim() || mechanism.value,
    teacher_account: account.value
  }).then(res => {
    if (res && res.id) {
      schoolClasses.value = [res, ...schoolClasses.value];
      if (!selectedSchoolClassIds.value.includes(res.id)) {
        selectedSchoolClassIds.value = [...selectedSchoolClassIds.value, res.id];
      }
      newClassName.value = '';
      newClassMechanism.value = '';
      alert("班级创建成功");
    } else {
      alert("班级创建失败");
    }
  }).catch(err => alert("班级创建失败: " + err.message));
}

function kill2() {
  around.style.display = 'none';
  create_class.style.display = 'none';
  name_input.value = '';
  time_input.value = '';
  classes_input.value = '';
  selectedSchoolClassIds.value = [];
}

function cancel2() {
  around.style.display = 'none';
  create_class.style.display = 'none';
  name_input.value = '';
  time_input.value = '';
  classes_input.value = '';
  selectedSchoolClassIds.value = [];
}

function confirmClass() {
  let code = document.getElementById("code_input").value;
  request.post("/editor/addCourse", {account: account.value, code: code})
      .then((res) => {
        if (res) {
          alert(res + "添加成功！！！！！")
          console.log(res)
          loadCourse();
        } else {
          alert("课程码失效或该课程不存在！！！！！")
        }
      })
      .catch(error => {
        console.log(error);
        alert("该课程已添加或者不存在" + error.message);
      })
}

function CreateClass() {
  const CourseRequest = {
    teacher_account: account.value,
    class_time: time_input.value,
    class_name: name_input.value,
    selected_classes: classes_input.value,
    school_class_ids: selectedSchoolClassIds.value.map(Number)
  }
  request.post("/editor/createCourse", CourseRequest)
      .then((res) => {
        if (res && res.id) {
          alert("创建课程成功，加课码：" + (res.code || ''))
          loadCourse();
          cancel2();
        } else {
          alert("创建失败")
        }
      }).catch(error => {
    console.log(error);
    alert("创建失败" + error.message);
  })
}

function toTop(index) {
  courses.value[index].is_pinned = !courses.value[index].is_pinned;
  request.post("/editor/updatePinStatus", {
    id: courses.value[index].id,
    is_pinned: courses.value[index].is_pinned
  }).catch(error => {
    console.error("更新置顶状态失败:", error)
    courses.value[index].is_pinned = !courses.value[index].is_pinned;
  });
}

function toggleCourseList() {
  courseListVisible.value = !courseListVisible.value
}

function toBottom(courseId) {
  const index = courses.value.findIndex(course => course.id === courseId);
  if (index === -1) return;
  courses.value[index].is_pinned = false;
  request.post("/editor/updatePinStatus", {
    id: courseId,
    is_pinned: false
  }).catch(error => {
    console.error("取消置顶失败:", error);
    courses.value[index].is_pinned = true;
  });
}

function handleClick(courseId) {
  router.push({
    name: 'courseContent',
    query: {id: courseId}
  })
}

function deleteCourse(courseId) {
  const action = status.value === '学生' ? '退课' : '退出该课程'
  if (confirm(`确定${action}？`)) {
    request.post("/editor/deleteCourse", {id: courseId, account: account.value})
        .then(response => {
          if (response) {
            alert(`${action}成功`);
          }
          loadCourse();
        }).catch(error => {
      console.log(error);
      alert("操作失败" + error.message);
    })
  } else return;
}

function archiveCourse(courseId) {
  if (confirm('确定归档该课程？归档后可在归档管理中恢复')) {
    request.put('/editor/archiveCourse', {
      account: account.value,
      class_id: courseId,
      archived: true
    }).then(ok => {
      if (ok) {
        alert('归档成功')
        loadCourse()
      }
    })
  }
}

function openArchiveModal() {
  showArchiveModal.value = true
  request.post('/editor/archivedCourses', { account: account.value })
      .then(async res => {
        const list = res || []
        const teacherRequests = list.map(course =>
            request.post('/editor/selectTeacherName', { account: course.teacher_account })
                .then(teacherRes => ({ ...course, teacherName: teacherRes || '未知教师' }))
        )
        archivedCourses.value = await Promise.all(teacherRequests)
      })
}

function restoreCourse(courseId) {
  request.put('/editor/archiveCourse', {
    account: account.value,
    class_id: courseId,
    archived: false
  }).then(ok => {
    if (ok) {
      alert('恢复成功')
      openArchiveModal()
      loadCourse()
    }
  })
}


</script>
<template>
  <div id="around" class="modal-overlay"></div>
  <div class="modal-box" id="join_class">
    <h2 class="modal-title">加入课程<i @click="kill" class="iconfont icon-chacha_chacha modal-close"/></h2>
    <div class="modal-body">
      加课码:
      <input id="code_input" type="text" placeholder="请输入课程加课码" class="modal-input">
    </div>
    <div class="modal-footer">
      <div id="but_box">
        <button id="cancel" @click="cancel">取消</button>
        <button id="confirm" @click="confirmClass">确认</button>
      </div>
    </div>
  </div>
  <div class="modal-box" id="create_class" style="display: none">
    <h2 class="modal-title">创建课程<i @click="kill2" class="iconfont icon-chacha_chacha modal-close"/></h2>
    <div class="modal-body modal-body-form">
      <div>
        课程名称:
        <input id="name_input" type="text" class="modal-input modal-input-wide">
      </div>
      <div>
        课程时间:
        <input id="time_input" type="text" class="modal-input modal-input-wide">
      </div>
      <div>
        行政班级（可多选，不选则仅手动加课）:
        <div class="school-class-picker">
          <label
              v-for="sc in schoolClasses"
              :key="sc.id"
              class="class-option"
          >
            <input
                type="checkbox"
                :value="sc.id"
                v-model="selectedSchoolClassIds"
            >
            {{ sc.name }}{{ sc.mechanism ? ' · ' + sc.mechanism : '' }}
          </label>
          <p v-if="schoolClasses.length === 0" class="class-picker-hint">暂无班级，请先下方新建</p>
        </div>
      </div>
      <div class="new-class-row">
        <input v-model="newClassName" type="text" placeholder="新建班级名称" class="modal-input">
        <input v-model="newClassMechanism" type="text" placeholder="学校/机构" class="modal-input">
        <button type="button" class="mini-btn" @click="addSchoolClass">新建班级</button>
      </div>
      <div>
        教学班级（展示名，可留空自动取班级名）:
        <input id="classes_input" type="text" class="modal-input modal-input-wide">
      </div>
    </div>
    <div class="modal-footer">
      <div class="modal-actions">
        <button id="cancel" @click="cancel2">取消</button>
        <button id="confirm" @click="CreateClass">确认</button>
      </div>
    </div>
  </div>
  <div class="main">
    <div class="Top">
      <div class="top-header">
        <h2>置顶课程</h2>
        <div class="top-actions">
          <button class="join" style="display: none" id="join_Class" @click="joinClass" ref="join_Class">＋加入课程
          </button>
          <button class="join join-wide" @click="Choice" id="joinOrCreate" ref="joinOrCreate">＋加入/创建课程
          </button>
          <ul id="choice" style="display: none;background-color: #FFFFFF;">
            <li id="student_but_2" @click="joinClass">加入课程</li>
            <li id="teacher_but" @click="createClass">创建课程</li>
          </ul>
        </div>
      </div>
      <br>
      <div class="top_container">
        <div class="box" v-for="(course, index) in pinnedCourses" :key="course.id">
          <div class="box_top" @click="handleClick(course.id)">
            <p style="color: rgb(192, 196, 207)">2024-2025 第一学期</p>
            <p style="color: #FFFFFF;font-size: 25px">{{ course.class_name }}</p>
            <p style="color: #FFFFFF;margin-bottom: 12px">{{ course.selected_classes }}</p>
            <p style="color: #FFFFFF;font-size: 19px"><i class="iconfont icon-erweima"
                                                         style="margin-right: 10px"/>加课码:{{ course.code }}</p>
          </div>
          <div class="box-footer">
            <div class="box-footer-info">
              <span class="role-tag" v-if="course.teacherName !== name">学</span>
              <span class="role-tag teach-tag" v-else>教</span>
              <span class="teacher-label">负责人: {{ course.teacherName }}</span>
            </div>
            <div class="box-footer-actions">
              <span class="action-link" @click.stop="toBottom(course.id)">
                {{ course.is_pinned ? '取消置顶' : '置顶' }}
              </span>
              <span class="action-link" @click.stop="archiveCourse(course.id)">归档</span>
              <span class="action-link muted" @click.stop="deleteCourse(course.id)">退课</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mid">
      <div class="mine">
        <div style="width: 86px;height: 52px;font-size:22px;padding: 0 20px 0 0;line-height: 52px;cursor:pointer"
             :style="{color: activeTab === 'all' ? 'rgb(72,138,248)' : ''}"
             @click="activeTab = 'all'">
          全部
        </div>
        <div style="width: 86px;height: 52px;font-size:22px;padding: 0 20px 0 0;line-height: 52px;cursor:pointer"
             :style="{color: activeTab === 'learn' ? 'rgb(72,138,248)' : ''}"
             @click="activeTab = 'learn'">
          我学的
        </div>
        <div style="width: 110px;height: 52px;font-size:22px;padding: 0 0 0 20px;line-height: 52px;cursor:pointer"
             :style="{color: activeTab === 'teach' ? 'rgb(72,138,248)' : ''}"
             @click="activeTab = 'teach'">
          我教的
        </div>
      </div>
      <div class="right">
        <button class="manage" @click="openArchiveModal">归档管理</button>
        <div class="search-wrapper">
          <input class='search' type="text" placeholder="搜索我学的课程" v-model="searchKeyword" @input="handleSearch">
          <i class="iconfont icon-sousuo_sousuo search-icon"></i>
        </div>
      </div>
    </div>
    <div class="bottom">
      <div class="bottom-header" id="course_container">
        <div class="bt_left">
          2024-2025 第一学期
        </div>
        <div class="bt_right" @click="toggleCourseList">
          {{ courseListVisible ? '收起' : '展开' }}
        </div>
      </div>
      <div v-show="courseListVisible" class="container" ref="container" id="top_container">
        <div class="box" v-for="(course, index) in filteredCourses" :key="index">
          <div class="box_top" @click="handleClick(course.id)" id="nowCourse">
            <p style="color: rgb(192, 196, 207)">2024-2025 第一学期</p>
            <p style="color: #FFFFFF;font-size: 25px">{{ course.class_name }}</p>
            <p style="color: #FFFFFF;margin-bottom: 12px">{{ course.selected_classes }}</p>
            <p style="color: #FFFFFF;font-size: 19px"><i class="iconfont icon-erweima" style="margin-right: 10px"/>加课码:{{
                course.code
              }}
            </p>
          </div>
          <div class="box-footer">
            <div class="box-footer-info">
              <span class="role-tag" v-if="course.teacherName !== name">学</span>
              <span class="role-tag teach-tag" v-else>教</span>
              <span class="teacher-label">负责人: {{ course.teacherName }}</span>
            </div>
            <div class="box-footer-actions">
              <span class="action-link" @click.stop="toTop(index)">
                {{ course.is_pinned ? '取消置顶' : '置顶' }}
              </span>
              <span class="action-link" @click.stop="archiveCourse(course.id)">归档</span>
              <span class="action-link muted" @click.stop="deleteCourse(course.id)">退课</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showArchiveModal" class="archive-modal" @click.self="showArchiveModal = false">
    <div class="archive-box">
      <h3>归档管理</h3>
      <div v-if="archivedCourses.length === 0" class="archive-empty">暂无归档课程</div>
      <div v-for="course in archivedCourses" :key="course.id" class="archive-item">
        <span>{{ course.class_name }}（{{ course.teacherName }}）</span>
        <button @click="restoreCourse(course.id)">恢复</button>
        <button @click="deleteCourse(course.id)">退课</button>
      </div>
      <button class="archive-close" @click="showArchiveModal = false">关闭</button>
    </div>
  </div>
</template>

<style scoped>
.Top {
  border: 1px solid rgb(218, 220, 224);
  width: 100%;
  max-width: 1500px;
  border-radius: 10px;
  z-index: 1;
  padding: 18px;
  margin: 20px auto auto;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.top-actions {
  position: relative;
}

.join {
  border: none;
  background-color: rgb(72, 138, 248);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  height: 47px;
  width: 150px;
  font-size: 18px;
}

.join-wide {
  width: 200px;
}

.modal-overlay {
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 999;
  display: none;
}

.modal-box {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  background-color: #FFFFFF;
  border-radius: 7px;
  width: 850px;
  max-width: calc(100vw - 40px);
  display: none;
}

.modal-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  font-size: 23px;
  color: #575A5B;
  font-weight: 500;
}

.modal-close {
  cursor: pointer;
  font-size: 20px;
}

.modal-body {
  padding: 20px 24px;
  border-top: 1px solid rgb(218, 220, 224);
  border-bottom: 1px solid rgb(218, 220, 224);
  line-height: 56px;
}

.modal-body-form {
  line-height: 2.5;
}

.modal-input {
  border: 1px solid rgb(218, 220, 224);
  height: 45px;
  width: calc(100% - 80px);
  max-width: 630px;
  border-radius: 5px;
  font-size: 17px;
  padding: 0 12px;
}

.modal-input-wide {
  width: calc(100% - 100px);
  max-width: 705px;
}

.new-class-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 8px 0;
}

.new-class-row .modal-input {
  flex: 1;
  min-width: 120px;
  width: auto;
}

.mini-btn {
  height: 45px;
  padding: 0 16px;
  border: none;
  border-radius: 5px;
  background: rgb(72, 138, 248);
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
}

.school-class-picker {
  max-width: 705px;
  margin-top: 8px;
  padding: 12px;
  background: #fff;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 5px;
  max-height: 180px;
  overflow-y: auto;
}

.class-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 16px;
  color: rgb(95, 99, 148);
  cursor: pointer;
}

.class-option input {
  width: 16px;
  height: 16px;
}

.class-picker-hint {
  margin: 0;
  color: #999;
  font-size: 14px;
}

.modal-footer {
  padding: 10px 20px;
}

.modal-actions,
#but_box {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  position: static;
}

h2 {
  font-size: 23px;
  color: #575A5B;
  font-weight: 500;
  height: 40px;
}

.main {
  width: 100%;
  max-width: 1500px;
  margin: auto;
  flex-direction: column;
  display: flex;
  padding: 0 16px;
  box-sizing: border-box;
}

.mid {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  min-height: 100px;
  padding: 8px 0 12px 0;
  flex-wrap: wrap;
  gap: 16px;
}

.mine {
  display: flex;
  height: 70px;
}

.right {
  display: flex;
  align-items: center;
  margin-left: auto;
  flex-wrap: wrap;
  gap: 12px;
}

.search-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  right: 12px;
  cursor: pointer;
  pointer-events: none;
}

.manage {
  background-color: #FFFFFF;
  margin-left: 12px;
  height: 46px;
  width: 127px;
  border-radius: 5px;
  border: 1px solid rgb(218, 220, 224);
  font-size: 19px;
  color: rgb(96, 98, 102);
  cursor: pointer;
}

.manage:hover {
  background-color: rgb(236, 243, 254);
  border: 1px solid rgb(198, 218, 252);
  color: rgb(66, 133, 244);
}

.search {
  width: 267px;
  height: 46px;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 23px;
  padding: 4px 36px 0 15px;
}

input::placeholder {
  color: rgb(192, 196, 207);
  font-size: 17px;
}

input:focus {
  outline: none;
  border-color: rgb(72, 138, 248);
  border-width: 1px;
}

.icon-sousuo_sousuo {
  cursor: pointer;
}

.bottom {
  background-color: rgb(248, 249, 250);
  width: 100%;
  border: 1px solid rgb(218, 220, 224);
  padding: 12px;
  margin-bottom: 24px;
  margin-top: 12px;
  border-radius: 7px;
}

.bottom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
}

.bt_left {
  font-size: 22px;
  height: 40px;
}

.bt_right {
  font-size: 20px;
  color: rgb(72, 138, 248);
  cursor: pointer;
}

li {
  list-style-type: none;
  padding: 0 20px 0 12px;
  margin: 0 -12px;
  width: 100px;
  height: 30px;
  cursor: pointer;
  line-height: 30px;
  color: rgb(108, 110, 113);
}

li:hover {
  background-color: rgb(232, 240, 255);
}

ul {
  position: absolute;
  right: 0;
  top: 52px;
  box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.3);
  z-index: 5;
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
  border: none;
  color: #FFFFFF;
  background-color: rgb(66, 133, 244);
  border-radius: 5px;
  cursor: pointer;
  font-size: 18px;
}

#cancel:hover {
  background-color: rgb(236, 243, 254);
}

#around {
  display: none;
}

#join_class {
  display: none;
}

.container,
.top_container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 10px;
}

.box {
  background-color: #FFFFFF;
  width: 100%;
  min-width: 0;
  min-height: 304px;
  border-radius: 7px;
  border: 1px solid rgb(218, 220, 224);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.box_top {
  background-color: rgba(135, 2, 2, 0.65);
  flex: 1;
  min-height: 180px;
  border-top-right-radius: 7px;
  border-top-left-radius: 7px;
  padding: 22px;
}

.box-footer {
  padding: 10px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.box-footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.role-tag {
  flex-shrink: 0;
  color: #4285f4;
  font-size: 14px;
}

.teach-tag {
  color: #4285f4;
}

.teacher-label {
  font-size: 14px;
  font-weight: 400;
  color: rgb(60, 64, 67);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.box-footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  flex-wrap: nowrap;
}

.action-link {
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  font-size: 13px;
  color: rgb(72, 138, 248);
}

.action-link:hover {
  opacity: 0.85;
}

.action-link.muted {
  color: rgb(144, 147, 178);
}

p {
  margin-top: 5px;
  margin-bottom: 5px;
}

.learn, .teach {
  margin-right: 10px;
  color: #4285f4;
}

.archive-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.archive-box {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 520px;
  max-height: 70vh;
  overflow-y: auto;
}

.archive-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.archive-item button {
  margin-left: auto;
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.archive-empty {
  color: #999;
  padding: 24px 0;
}

.archive-close {
  margin-top: 16px;
  padding: 8px 16px;
  border: none;
  background: rgb(66,133,244);
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}

</style>