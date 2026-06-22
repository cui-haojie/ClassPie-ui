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

const pinnedCourses = computed(() =>
    courses.value.filter(course => course.is_pinned)
);

const filteredCourses = computed(() => {
  if (!searchKeyword.value) return courses.value;

  return courses.value.filter(course => {
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

function createClass() {
  around.style.display = 'block';
  create_class.style.display = 'block';
  document.body.style.overflow = 'hidden';
  document.addEventListener('touchmove', preventTouch, { passive: false });
}

function kill2() {
  around.style.display = 'none';
  create_class.style.display = 'none';
  name_input.value = '';
  time_input.value = '';
  classes_input.value = '';
}

function cancel2() {
  around.style.display = 'none';
  create_class.style.display = 'none';
  name_input.value = '';
  time_input.value = '';
  classes_input.value = '';
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
    selected_classes: classes_input.value
  }
  request.post("/editor/createCourse", CourseRequest)
      .then((res) => {
        if (res) {
          alert("创建课程成功")
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

function hidden() {
  top_container.style.display = top_container.style.display === 'none' ? 'block' : 'none';
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
  if (confirm("确定删除该课程？")) {
    request.post("/editor/deleteCourse", {id: courseId})
        .then(response => {
          if (response) {
            alert("删除成功");
          }
          loadCourse();
        }).catch(error => {
      console.log(error);
      alert("删除错误" + error.message);
    })
  } else return;
}


</script>
<template>
  <div id="around"
       style="position: fixed;width: 100%;height: 100%;background-color: rgba(0,0,0,0.3);z-index: 999;"></div>
  <div style="position: fixed;z-index: 9999;background-color: #FFFFFF;top: 280px;left: 450px;border-radius: 7px"
       id="join_class">
    <h2 style="width: 850px;padding: 18px 24px;height: 62px">加入课程<i @click="kill" style="width: 200px;height:200px"
                                                                        class="iconfont icon-chacha_chacha"/></h2><br>
    <div
        style="width: 850px;height: 103px;padding: 20px 15px 15px 120px;border-bottom: 1px solid rgb(218,220,224);
        border-top: 1px solid rgb(218,220,224);line-height: 56px">
      加课码:
      <input id="code_input" type="text" placeholder="请输入课程加课码"
             style="border: 1px solid rgb(218,220,224);height: 45px;width: 630px;border-radius: 5px;font-size: 17px">
    </div>
    <div style="width: 850px;height: 67px;padding: 10px 20px">
      <div id="but_box">
        <button id="cancel" @click="cancel">取消</button>
        <button id="confirm" @click="confirmClass">确认</button>
      </div>
    </div>
  </div>
  <div
      style="position: fixed;z-index: 9999;background-color: #FFFFFF;top: 280px;left: 450px;border-radius: 7px;display: none"
      id="create_class">
    <h2 style="width: 850px;padding: 18px 24px;height: 42px">创建课程<i @click="kill2" style="width: 200px;height:200px"
                                                                        class="iconfont icon-chacha_chacha"/></h2><br>
    <div
        style="width: 850px;height: 203px;padding: 20px 15px 15px 30px;border-bottom: 1px solid rgb(218,220,224);
        border-top: 1px solid rgb(218,220,224);line-height: 56px">
      <div>
        课程名称:
        <input id="name_input" type="text"
               style="border: 1px solid rgb(218,220,224);height: 45px;width: 705px;border-radius: 5px;font-size: 17px">
      </div>
      <div>
        课程时间:
        <input id="time_input" type="text"
               style="border: 1px solid rgb(218,220,224);height: 45px;width: 705px;border-radius: 5px;font-size: 17px">
      </div>
      <div>
        教学班级:
        <input id="classes_input" type="text"
               style="border: 1px solid rgb(218,220,224);height: 45px;width: 705px;border-radius: 5px;font-size: 17px">
      </div>
    </div>
    <div style="width: 850px;height: 67px;padding: 10px 20px;">
      <div style="right: 442px;position:fixed;">
        <button id="cancel" @click="cancel2">取消</button>
        <button id="confirm" @click="CreateClass">确认</button>
      </div>
    </div>
  </div>
  <div class="main">
    <div class="Top">
      <div style="display: flex;">
        <h2>置顶课程</h2>
        <button class="join" style="display: none" id="join_Class" @click="joinClass" ref="join_Class">＋加入课程
        </button>
        <button class="join" style="width: 200px;position: relative;right: -1168px" @click="Choice" id="joinOrCreate"
                ref="joinOrCreate">＋加入/创建课程
        </button>
      </div>
      <ul id="choice" style="display: none;background-color: #FFFFFF;">
        <li id="student_but_2" @click="joinClass">加入课程</li>
        <li id="teacher_but" @click="createClass">创建课程</li>
      </ul>
      <br>
      <div style="display: flex" class="top_container">
        <div class="box" v-for="(course, index) in pinnedCourses" :key="course.id">
          <div class="box_top" @click="handleClick(course.id)">
            <p style="color: rgb(192, 196, 207)">2024-2025 第一学期</p>
            <p style="color: #FFFFFF;font-size: 25px">{{ course.class_name }}</p>
            <p style="color: #FFFFFF;margin-bottom: 12px">{{ course.selected_classes }}</p>
            <p style="color: #FFFFFF;font-size: 19px"><i class="iconfont icon-erweima"
                                                         style="margin-right: 10px"/>加课码:{{ course.code }}</p>
          </div>
          <div style="margin-top: 60px;display: flex;margin-left: 15px">
            <div class="learn" ref="learn" :style="{display:course.teacherName === name ? 'none' : 'block'}">学
            </div>
            <div class="teach" ref="teach" :style="{display:course.teacherName === name ? 'block' : 'none'}">教
            </div>
            <div style="font-size: 16px;font-weight: 400;color: rgb(60, 64, 67)">负责人:{{ course.teacherName }}</div>
            <div style="width: 80px"></div>
            <div v-show="!course.is_pinned" class="to_top" @click="toBottom(course.id)">置顶</div>
            <div v-show="course.is_pinned" class="to_top" @click="toBottom(course.id)">取消置顶</div>
            <div style="margin-left: 8px;color: rgb(192, 196, 207);cursor: pointer"><i class="iconfont icon-sandian"
                                                                                       @click="deleteCourse(course.id)"/>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mid">
      <div class="mine">
        <div style="width: 86px;height: 52px;font-size:22px;padding: 0 20px 0 0;line-height: 52px">
          我学的
        </div>
        <div style="width: 110px;height: 52px;font-size:22px;padding: 0 0 0 20px;line-height: 52px">
          我协助的
        </div>
        <div style="width: 120px;height: 52px;font-size:22px;padding-left: 40px;line-height: 52px">
          我教的
        </div>
      </div>
      <div style="width: 650px"></div>
      <div class="right">
        <button class="manage">归档管理</button>
        <input class='search' type="text" placeholder="搜索我学的课程" v-model="searchKeyword" @input="handleSearch">
        <i class="iconfont icon-sousuo_sousuo" style="position: relative;top:-101px;right: -410px"></i>
      </div>
    </div>
    <div class="bottom">
      <div style="height: 40px" id="course_container">
        <div class="bt_left">
          2024-2025 第一学期
        </div>
        <div class="bt_right" style="position: relative;right: -1430px;top: -40px" @click="hidden">
          展开
        </div>
      </div>
      <div style="display: flex" class="container" ref="container" id="top_container">
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
          <div style="margin-top: 60px;display: flex;margin-left: 15px">
            <div class="learn" ref="learn" :style="{display:course.teacherName === name ? 'none' : 'block'}">学
            </div>
            <div class="teach" ref="teach" :style="{display:course.teacherName === name ? 'block' : 'none'}">教
            </div>
            <div style="font-size: 16px;font-weight: 400;color: rgb(60, 64, 67)">负责人:{{ course.teacherName }}</div>
            <div style="width: 80px"></div>
            <div v-show="!course.is_pinned" class="to_top" @click="toTop(index)">置顶</div>
            <div v-show="course.is_pinned" class="to_top" @click="toTop(index)">取消置顶</div>
            <div style="margin-left: 8px;color: rgb(192, 196, 207);cursor: pointer"><i class="iconfont icon-sandian"
                                                                                       @click="deleteCourse(course.id)"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.Top {
  border: 1px solid rgb(218, 220, 224);
  width: 1500px;
  border-radius: 10px;
  z-index: 1;

  padding: 18px;
  margin: 100px auto auto;
}

.join {
  position: relative;
  right: -1216px;
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

h2 {
  font-size: 23px;
  color: #575A5B;
  font-weight: 500;
  height: 40px;
}

.main {
  width: 1500px;
  margin: auto;
  flex-direction: column;
  display: flex;
  max-width: 100vw; /* 限制为视口宽度 */
  overflow-x: hidden;
}

.mid {
  display: flex;
  width: 1500px;
  height: 100px;
  padding: 8px 0 12px 0;
}

.mine {
  display: flex;
  width: 410px;
  height: 70px;
}

.right {
  width: 440px;
  height: 100px;
  line-height: 100px;
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
  margin-left: 32px;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 23px;
  position: relative;
  top: -3px;
  padding: 4px 30px 0 15px;
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
  width: 1500px;
  border: 1px solid rgb(218, 220, 224);
  padding: 12px;
  margin-bottom: 24px;
  margin-top: 12px;
  border-radius: 7px;
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
  right: 130px;
  top: 110px;
  box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.3);
}

#but_box {
  position: absolute;
  right: 45px;
  top: 200px;
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

#cancel:hover {
  background-color: rgb(236, 243, 254);
}

.icon-chacha_chacha {
  margin-left: 658px;
  cursor: pointer;
}

#around {
  display: none;
}

#join_class {
  display: none;
}

.container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
}

.box {
  background-color: #FFFFFF;
  margin: 11px;
  min-width: 332px;
  height: 304px;
  border-radius: 7px;
  padding-bottom: 15px;
  border: 1px solid rgb(218, 220, 224);
}

.box_top {
  background-color: rgba(135, 2, 2, 0.65);
  height: 68%;
  border-top-right-radius: 7px;
  border-top-left-radius: 7px;
  padding: 22px;
}

p {
  margin-top: 5px;
  margin-bottom: 5px;
}

.learn, .teach {
  margin-right: 10px;
  color: #4285f4;
}

.to_top {
  cursor: pointer;
}

.top_container {
  overflow-x: auto;
}


</style>