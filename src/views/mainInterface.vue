<script setup lang="js" name="mainInterface">
import {useRouter} from "vue-router";
import {useAccountStore} from "@/stores/account.js";
import {storeToRefs} from "pinia";
import request from "@/utils/request.js";
import {toast} from '@/utils/toast.js';
import {ref, onMounted, onBeforeUnmount, reactive, watch} from "vue";
import {computed} from "vue";
import {INSTITUTION_OPTIONS, resolveMechanism} from '@/constants/institutions.js';
import {SEMESTER_OPTIONS, formatSemester, getDefaultSemester} from '@/constants/semesters.js';
import {lockBodyScroll, unlockBodyScroll} from '@/utils/scrollLock.js';

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
const selectedSemester = ref(getDefaultSemester())
const showArchiveModal = ref(false)
const archivedCourses = ref([])
const schoolClasses = ref([])
const selectedSchoolClassIds = ref([])
const newClassName = ref('')
const newClassInstitution = ref('')
const newClassCustomMechanism = ref('')
const importExcelFile = ref(null)
const excelInputRef = ref(null)
const classToAdd = ref('')
const importTargetClassId = ref('')
const institutionOptions = INSTITUTION_OPTIONS
const semesterOptions = SEMESTER_OPTIONS

const createForm = reactive({
  class_name: '',
  class_time: '',
  selected_classes: '',
  semester: getDefaultSemester(),
})

const pinnedCourses = computed(() =>
    semesterScopedCourses.value.filter(course => course.is_pinned)
);

const availableSemesters = computed(() => {
  const values = new Set()
  courses.value.forEach(course => {
    if (course.semester) values.add(course.semester)
  })
  return Array.from(values).sort().reverse()
})

const semesterFilterOptions = computed(() => {
  const options = [{ label: '全部学期', value: 'all' }]
  const seen = new Set(['all'])
  semesterOptions.forEach(item => {
    options.push({ label: item.label, value: item.value })
    seen.add(item.value)
  })
  availableSemesters.value.forEach(value => {
    if (!seen.has(value)) {
      options.push({ label: value, value })
      seen.add(value)
    }
  })
  return options
})

const semesterScopedCourses = computed(() => {
  if (selectedSemester.value === 'all') {
    return courses.value
  }
  return courses.value.filter(course => course.semester === selectedSemester.value)
})

function getCourseThemeIndex(course) {
  const id = Number(course?.id) || 0;
  const name = course?.class_name || '';
  let hash = id * 31;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i) * (i + 7)) % 100000;
  }
  return hash % 8;
}

function isTeachingCourse(course) {
  return status.value === '老师' && course.teacher_account === account.value;
}

const filteredCourses = computed(() => {
  let list = semesterScopedCourses.value
  if (activeTab.value === 'learn') {
    list = list.filter(course => !isTeachingCourse(course))
  } else if (activeTab.value === 'teach') {
    list = list.filter(course => isTeachingCourse(course))
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

watch(status, (val) => {
  if (val === '学生' && activeTab.value === 'teach') {
    activeTab.value = 'all';
  }
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
                  toast.success("老师课程已同步")
                  loadCourse();
                }
              }).catch((err) => {
            toast.error("创建失败：" + err.message);
            console.log(err);
          })
        }
      })
      .catch(error => {
        console.error(error);
        toast.error(error.message || "请求失败");
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
        toast.error("课程加载失败: " + error.message);
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
  unlockBodyScroll();
}

function kill() {
  around.style.display = 'none';
  join_class.style.display = 'none';
  code_input.value = '';
  unlockBodyScroll();
}

function joinClass() {
  around.style.display = 'block';
  join_class.style.display = 'block';
  lockBodyScroll();
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
  newClassInstitution.value = mechanism.value || '';
  resetCreateForm();
  around.style.display = 'block';
  create_class.style.display = 'block';
  lockBodyScroll();
}

function getSchoolClassLabel(id) {
  const sc = schoolClasses.value.find(item => item.id === id);
  if (!sc) return '未知班级';
  return sc.mechanism ? `${sc.name} · ${sc.mechanism}` : sc.name;
}

function addClassFromDropdown() {
  if (!classToAdd.value) {
    toast.warning('请先在下拉框中选择班级');
    return;
  }
  const id = Number(classToAdd.value);
  if (!selectedSchoolClassIds.value.includes(id)) {
    selectedSchoolClassIds.value = [...selectedSchoolClassIds.value, id];
  }
  importTargetClassId.value = String(id);
  classToAdd.value = '';
}

function removeSelectedClass(id) {
  selectedSchoolClassIds.value = selectedSchoolClassIds.value.filter(item => item !== id);
  if (String(id) === importTargetClassId.value) {
    importTargetClassId.value = selectedSchoolClassIds.value[0] ? String(selectedSchoolClassIds.value[0]) : '';
  }
}

function resolveNewClassMechanism() {
  return resolveMechanism(newClassInstitution.value, newClassCustomMechanism.value) || mechanism.value || '';
}

function addSchoolClass() {
  if (!newClassName.value.trim()) {
    toast.warning("请输入班级名称");
    return;
  }
  request.post("/editor/createSchoolClass", {
    name: newClassName.value.trim(),
    mechanism: resolveNewClassMechanism(),
    teacher_account: account.value
  }).then(res => {
    if (res && res.id) {
      schoolClasses.value = [res, ...schoolClasses.value];
      if (!selectedSchoolClassIds.value.includes(res.id)) {
        selectedSchoolClassIds.value = [...selectedSchoolClassIds.value, res.id];
      }
      importTargetClassId.value = String(res.id);
      newClassName.value = '';
      newClassCustomMechanism.value = '';
      toast.success("班级创建成功");
    } else {
      toast.error("班级创建失败");
    }
  }).catch(err => toast.error("班级创建失败: " + err.message));
}

function onExcelFileChange(event) {
  importExcelFile.value = event.target.files?.[0] || null
}

function resetExcelInput() {
  importExcelFile.value = null
  if (excelInputRef.value) {
    excelInputRef.value.value = ''
  }
}

function downloadImportTemplate() {
  window.open('/editor/downloadStudentImportTemplate', '_blank')
}

function importStudentsExcel(schoolClassId) {
  if (!schoolClassId) {
    toast.warning('请先创建或选择一个班级')
    return
  }
  if (!importExcelFile.value) {
    toast.warning('请先选择 Excel 文件')
    return
  }
  const formData = new FormData()
  formData.append('file', importExcelFile.value)
  formData.append('school_class_id', String(schoolClassId))
  return request.post('/editor/importSchoolClassStudents', formData, { timeout: 60000 })
      .then(res => {
        const summary = `导入完成：新建 ${res.created || 0} 人，关联 ${res.linked || 0} 人，跳过 ${res.skipped || 0} 人，失败 ${res.failed || 0} 人`
        if ((res.failed || 0) > 0) {
          toast.warning(summary)
        } else {
          toast.success(summary)
        }
        if (res.messages?.length) {
          console.log('导入详情：', res.messages)
          if (res.messages.length <= 3) {
            res.messages.forEach(msg => toast.info(msg))
          } else {
            toast.info(`另有 ${res.messages.length} 条详情，请查看控制台`)
          }
        }
        resetExcelInput()
        loadSchoolClasses()
      })
      .catch(err => toast.error('导入失败：' + (err.message || '请检查文件格式')))
}

function addSchoolClassWithImport() {
  if (!newClassName.value.trim()) {
    toast.warning("请输入班级名称");
    return
  }
  if (!importExcelFile.value) {
    addSchoolClass()
    return
  }
  request.post("/editor/createSchoolClass", {
    name: newClassName.value.trim(),
    mechanism: resolveNewClassMechanism(),
    teacher_account: account.value
  }).then(res => {
    if (res && res.id) {
      schoolClasses.value = [res, ...schoolClasses.value];
      if (!selectedSchoolClassIds.value.includes(res.id)) {
        selectedSchoolClassIds.value = [...selectedSchoolClassIds.value, res.id];
      }
      importTargetClassId.value = String(res.id);
      newClassName.value = '';
      newClassCustomMechanism.value = '';
      return importStudentsExcel(res.id)
    }
    toast.error("班级创建失败");
  }).catch(err => toast.error("班级创建失败: " + err.message));
}

function importToSelectedClass() {
  const classId = importTargetClassId.value || (selectedSchoolClassIds.value.length === 1 ? String(selectedSchoolClassIds.value[0]) : '');
  if (!classId) {
    toast.warning('请选择要导入学生的班级');
    return;
  }
  importStudentsExcel(Number(classId));
}

function resetCreateForm() {
  createForm.class_name = '';
  createForm.class_time = '';
  createForm.selected_classes = '';
  createForm.semester = getDefaultSemester();
  selectedSchoolClassIds.value = [];
  classToAdd.value = '';
  importTargetClassId.value = '';
  newClassName.value = '';
  newClassCustomMechanism.value = '';
  resetExcelInput();
}

function kill2() {
  around.style.display = 'none';
  create_class.style.display = 'none';
  resetCreateForm();
  unlockBodyScroll();
}

onBeforeUnmount(() => {
  unlockBodyScroll();
});

function cancel2() {
  kill2();
}

function confirmClass() {
  let code = document.getElementById("code_input").value;
  request.post("/editor/addCourse", {account: account.value, code: code})
      .then((res) => {
        if (res) {
          toast.success("课程添加成功")
          console.log(res)
          loadCourse();
        } else {
          toast.error("课程码失效或该课程不存在")
        }
      })
      .catch(error => {
        console.log(error);
        toast.error("该课程已添加或者不存在：" + error.message);
      })
}

function CreateClass() {
  if (!createForm.class_name.trim()) {
    toast.warning('请输入课程名称');
    return;
  }
  const CourseRequest = {
    teacher_account: account.value,
    class_time: createForm.class_time.trim(),
    class_name: createForm.class_name.trim(),
    selected_classes: createForm.selected_classes.trim(),
    semester: createForm.semester,
    school_class_ids: selectedSchoolClassIds.value.map(Number)
  }
  request.post("/editor/createCourse", CourseRequest)
      .then((res) => {
        if (res && res.id) {
          toast.success("创建课程成功，加课码：" + (res.code || ''))
          loadCourse();
          cancel2();
        } else {
          toast.error("创建失败")
        }
      }).catch(error => {
    console.log(error);
    toast.error("创建失败：" + error.message);
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
  const course = courses.value.find(item => item.id === courseId)
  const action = course && isTeachingCourse(course) ? '退出该课程' : '退课'
  if (confirm(`确定${action}？`)) {
    request.post("/editor/deleteCourse", {id: courseId, account: account.value})
        .then(response => {
          if (response) {
            toast.success(`${action}成功`);
          }
          loadCourse();
        }).catch(error => {
      console.log(error);
      toast.error("操作失败：" + error.message);
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
        toast.success('归档成功')
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
      toast.success('恢复成功')
      openArchiveModal()
      loadCourse()
    }
  })
}


</script>
<template>
  <div id="around" class="modal-overlay"></div>
  <div class="modal-box modal-box-sm" id="join_class">
    <div class="create-modal-header compact">
      <div>
        <h2 class="create-modal-title">加入课程</h2>
        <p class="create-modal-subtitle">输入教师提供的加课码</p>
      </div>
      <button type="button" class="modal-close-btn" @click="kill">×</button>
    </div>
    <div class="create-modal-body compact-body">
      <label class="form-field">
        <span class="field-label">加课码</span>
        <input id="code_input" type="text" placeholder="请输入课程加课码" class="field-control">
      </label>
    </div>
    <div class="create-modal-footer">
      <button type="button" class="btn-ghost" @click="cancel">取消</button>
      <button type="button" class="btn-primary" @click="confirmClass">加入</button>
    </div>
  </div>
  <div class="modal-box modal-box-lg" id="create_class" style="display: none">
    <div class="create-modal-header">
      <div>
        <h2 class="create-modal-title">创建课程</h2>
        <p class="create-modal-subtitle">填写课程信息，关联行政班后学生将自动加入</p>
      </div>
      <button type="button" class="modal-close-btn" @click="kill2">×</button>
    </div>

    <div class="create-modal-body">
      <section class="form-section">
        <h3 class="section-title">基本信息</h3>
        <div class="form-grid">
          <label class="form-field">
            <span class="field-label">课程名称 <em>*</em></span>
            <input v-model="createForm.class_name" type="text" class="field-control" placeholder="例如：Java 程序设计">
          </label>
          <label class="form-field">
            <span class="field-label">学年学期</span>
            <select v-model="createForm.semester" class="field-control field-select">
              <option v-for="item in semesterOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </label>
          <label class="form-field">
            <span class="field-label">课程时间</span>
            <input v-model="createForm.class_time" type="text" class="field-control" placeholder="例如：周一 1-2 节">
          </label>
          <label class="form-field form-field-full">
            <span class="field-label">教学班级展示名</span>
            <input v-model="createForm.selected_classes" type="text" class="field-control" placeholder="可留空，将自动使用行政班名称">
          </label>
        </div>
      </section>

      <section class="form-section">
        <h3 class="section-title">关联行政班</h3>
        <p class="section-desc">不关联班级时，学生需通过加课码手动加入</p>
        <div class="form-row-inline">
          <select v-model="classToAdd" class="field-control field-select">
            <option value="">请选择行政班级</option>
            <option v-for="sc in schoolClasses" :key="sc.id" :value="String(sc.id)">
              {{ sc.name }}{{ sc.mechanism ? ' · ' + sc.mechanism : '' }}
            </option>
          </select>
          <button type="button" class="btn-outline" @click="addClassFromDropdown">添加</button>
        </div>
        <div v-if="selectedSchoolClassIds.length" class="tag-list">
          <span v-for="id in selectedSchoolClassIds" :key="id" class="class-tag">
            {{ getSchoolClassLabel(id) }}
            <button type="button" class="tag-remove" @click="removeSelectedClass(id)">×</button>
          </span>
        </div>
        <p v-else class="empty-hint">暂未选择班级</p>
      </section>

      <section class="form-section form-section-muted">
        <h3 class="section-title">新建班级</h3>
        <div class="form-grid form-grid-3">
          <label class="form-field">
            <span class="field-label">班级名称</span>
            <input v-model="newClassName" type="text" class="field-control" placeholder="例如：软件 2201">
          </label>
          <label class="form-field">
            <span class="field-label">所属学校</span>
            <select v-model="newClassInstitution" class="field-control field-select">
              <option value="">请选择学校</option>
              <option v-for="item in institutionOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </label>
          <div class="form-field form-field-action">
            <span class="field-label">&nbsp;</span>
            <button type="button" class="btn-primary-block" @click="addSchoolClass">创建班级</button>
          </div>
        </div>
        <label v-if="newClassInstitution === '__other__'" class="form-field form-field-full">
          <span class="field-label">其他学校名称</span>
          <input v-model="newClassCustomMechanism" type="text" class="field-control" placeholder="请输入学校/机构名称">
        </label>
      </section>

      <section class="form-section form-section-muted">
        <h3 class="section-title">Excel 批量导入学生</h3>
        <div class="import-panel">
          <div class="import-panel-row">
            <label class="form-field">
              <span class="field-label">导入目标班级</span>
              <select v-model="importTargetClassId" class="field-control field-select">
                <option value="">请选择班级</option>
                <option v-for="sc in schoolClasses" :key="'import-' + sc.id" :value="String(sc.id)">
                  {{ sc.name }}{{ sc.mechanism ? ' · ' + sc.mechanism : '' }}
                </option>
              </select>
            </label>
            <label class="form-field file-field">
              <span class="field-label">学生名单</span>
              <input ref="excelInputRef" type="file" accept=".xlsx,.xls" class="field-control file-control" @change="onExcelFileChange">
            </label>
          </div>
          <div class="import-panel-actions">
            <button type="button" class="btn-text" @click="downloadImportTemplate">下载 Excel 模板</button>
            <button type="button" class="btn-outline" @click="addSchoolClassWithImport">新建班级并导入</button>
            <button type="button" class="btn-primary" @click="importToSelectedClass">导入到所选班级</button>
          </div>
          <p class="import-tip">模板列：账号、姓名、学号、密码（可选，默认 ClassPi123）</p>
        </div>
      </section>
    </div>

    <div class="create-modal-footer">
      <button type="button" class="btn-ghost" @click="cancel2">取消</button>
      <button type="button" class="btn-primary btn-primary-lg" @click="CreateClass">创建课程</button>
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
        <div class="course-card" v-for="course in pinnedCourses" :key="'pin-' + course.id">
          <div
              class="course-card-cover"
              :class="'theme-' + getCourseThemeIndex(course)"
              @click="handleClick(course.id)"
          >
            <div class="course-card-decor decor-a"></div>
            <div class="course-card-decor decor-b"></div>
            <span class="course-card-term">{{ formatSemester(course.semester) }}</span>
            <h3 class="course-card-title">{{ course.class_name }}</h3>
            <p class="course-card-subtitle">{{ course.selected_classes || '暂无班级展示名' }}</p>
            <div class="course-card-code">
              <i class="iconfont icon-erweima"></i>
              <span>加课码 {{ course.code }}</span>
            </div>
          </div>
          <div class="course-card-footer">
            <div class="course-card-footer-info">
              <span class="role-tag" :class="{ 'teach-tag': isTeachingCourse(course) }">
                {{ isTeachingCourse(course) ? '教' : '学' }}
              </span>
              <span class="teacher-label">负责人: {{ course.teacherName }}</span>
            </div>
            <div class="course-card-footer-actions">
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
        <div
            v-if="status === '老师'"
            style="width: 110px;height: 52px;font-size:22px;padding: 0 0 0 20px;line-height: 52px;cursor:pointer"
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
          <label class="semester-filter">
            <span class="semester-filter-label">学期</span>
            <select v-model="selectedSemester" class="semester-select">
              <option v-for="item in semesterFilterOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </label>
        </div>
        <div class="bt_right" @click="toggleCourseList">
          {{ courseListVisible ? '收起' : '展开' }}
        </div>
      </div>
      <div v-show="courseListVisible" class="container" ref="container" id="top_container">
        <div class="course-card" v-for="(course, index) in filteredCourses" :key="course.id">
          <div
              class="course-card-cover"
              :class="'theme-' + getCourseThemeIndex(course)"
              @click="handleClick(course.id)"
          >
            <div class="course-card-decor decor-a"></div>
            <div class="course-card-decor decor-b"></div>
            <span class="course-card-term">{{ formatSemester(course.semester) }}</span>
            <h3 class="course-card-title">{{ course.class_name }}</h3>
            <p class="course-card-subtitle">{{ course.selected_classes || '暂无班级展示名' }}</p>
            <div class="course-card-code">
              <i class="iconfont icon-erweima"></i>
              <span>加课码 {{ course.code }}</span>
            </div>
          </div>
          <div class="course-card-footer">
            <div class="course-card-footer-info">
              <span class="role-tag" :class="{ 'teach-tag': isTeachingCourse(course) }">
                {{ isTeachingCourse(course) ? '教' : '学' }}
              </span>
              <span class="teacher-label">负责人: {{ course.teacherName }}</span>
            </div>
            <div class="course-card-footer-actions">
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
  border-radius: 12px;
  width: 850px;
  max-width: calc(100vw - 40px);
  display: none;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.modal-box-lg {
  width: 760px;
}

.modal-box-sm {
  width: 480px;
}

.create-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid #eef0f4;
  background: linear-gradient(180deg, #fafbfd 0%, #fff 100%);
}

.create-modal-header.compact {
  padding-bottom: 14px;
}

.create-modal-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
}

.create-modal-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.modal-close-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}

.modal-close-btn:hover {
  background: #e5e7eb;
  color: #111827;
}

.create-modal-body {
  padding: 20px 24px;
  max-height: min(70vh, 620px);
  overflow-y: auto;
}

.compact-body {
  max-height: none;
}

.form-section {
  margin-bottom: 20px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section-muted {
  padding: 16px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}

.section-title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.section-desc,
.empty-hint,
.import-tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.5;
}

.empty-hint {
  margin-top: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-grid-3 {
  grid-template-columns: 1fr 1fr auto;
  align-items: end;
}

.form-field-full {
  grid-column: 1 / -1;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.form-field-action {
  min-width: 120px;
}

.field-label {
  font-size: 13px;
  color: #4b5563;
  font-weight: 500;
}

.field-label em {
  color: #ef4444;
  font-style: normal;
}

.field-control {
  height: 42px;
  width: 100%;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-control:focus {
  outline: none;
  border-color: rgb(72, 138, 248);
  box-shadow: 0 0 0 3px rgba(72, 138, 248, 0.12);
}

.field-select {
  appearance: auto;
  cursor: pointer;
}

.form-row-inline {
  display: flex;
  gap: 10px;
  align-items: center;
}

.form-row-inline .field-select {
  flex: 1;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.class-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(72, 138, 248, 0.1);
  color: rgb(56, 117, 222);
  font-size: 13px;
}

.tag-remove {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
}

.import-panel-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.file-control {
  padding-top: 8px;
  height: auto;
  min-height: 42px;
}

.import-panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 14px;
}

.create-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #eef0f4;
  background: #fff;
}

.btn-primary,
.btn-primary-block,
.btn-primary-lg {
  border: none;
  border-radius: 8px;
  background: rgb(72, 138, 248);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-primary:hover,
.btn-primary-block:hover,
.btn-primary-lg:hover {
  background: rgb(56, 117, 222);
}

.btn-primary,
.btn-outline,
.btn-ghost {
  height: 40px;
  padding: 0 18px;
}

.btn-primary-block {
  width: 100%;
  height: 42px;
}

.btn-primary-lg {
  height: 42px;
  padding: 0 24px;
  font-size: 15px;
}

.btn-outline {
  border: 1px solid rgb(72, 138, 248);
  border-radius: 8px;
  background: #fff;
  color: rgb(72, 138, 248);
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.btn-outline:hover {
  background: rgba(72, 138, 248, 0.06);
}

.btn-ghost {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #4b5563;
  cursor: pointer;
}

.btn-ghost:hover {
  background: #f9fafb;
}

.btn-text {
  border: none;
  background: transparent;
  color: rgb(72, 138, 248);
  cursor: pointer;
  font-size: 14px;
  padding: 8px 0;
}

@media (max-width: 720px) {
  .form-grid,
  .form-grid-3,
  .import-panel-row {
    grid-template-columns: 1fr;
  }

  .form-field-action {
    min-width: 0;
  }

  .form-row-inline {
    flex-direction: column;
    align-items: stretch;
  }
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

.mini-btn.secondary {
  background: #fff;
  color: rgb(72, 138, 248);
  border: 1px solid rgb(72, 138, 248);
}

.import-class-block {
  margin: 12px 0;
  padding: 12px;
  border: 1px dashed rgb(218, 220, 224);
  border-radius: 8px;
  max-width: 705px;
  background: #fff;
}

.import-class-title {
  font-size: 15px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 500;
}

.import-class-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.link-btn {
  border: none;
  background: transparent;
  color: rgb(72, 138, 248);
  cursor: pointer;
  font-size: 14px;
  padding: 8px 4px;
}

.excel-file-input {
  max-width: 220px;
  font-size: 14px;
}

.import-class-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
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
  display: flex;
  align-items: center;
}

.semester-filter {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.semester-filter-label {
  font-size: 18px;
  color: #575a5b;
}

.semester-select {
  height: 38px;
  min-width: 210px;
  padding: 0 12px;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  background: #fff;
  cursor: pointer;
}

.semester-select:focus {
  outline: none;
  border-color: rgb(72, 138, 248);
  box-shadow: 0 0 0 3px rgba(72, 138, 248, 0.12);
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 10px 4px 16px;
}

.course-card {
  background: #fff;
  width: 100%;
  min-width: 0;
  border-radius: 14px;
  border: 1px solid rgba(218, 220, 224, 0.9);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

.course-card-cover {
  position: relative;
  min-height: 188px;
  padding: 20px 22px 18px;
  cursor: pointer;
  overflow: hidden;
  color: #fff;
}

.course-card-decor {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.course-card-decor.decor-a {
  width: 140px;
  height: 140px;
  right: -36px;
  top: -40px;
  background: rgba(255, 255, 255, 0.14);
}

.course-card-decor.decor-b {
  width: 88px;
  height: 88px;
  left: -20px;
  bottom: -28px;
  background: rgba(255, 255, 255, 0.08);
}

.course-card-cover.theme-0 {
  background: linear-gradient(135deg, #4facfe 0%, #00c6fb 100%);
}

.course-card-cover.theme-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.course-card-cover.theme-2 {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.course-card-cover.theme-3 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.course-card-cover.theme-4 {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa502 100%);
}

.course-card-cover.theme-5 {
  background: linear-gradient(135deg, #5c7cfa 0%, #845ef7 100%);
}

.course-card-cover.theme-6 {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.course-card-cover.theme-7 {
  background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
}

.course-card-term {
  position: relative;
  z-index: 1;
  display: inline-block;
  font-size: 12px;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.16);
  padding: 4px 10px;
  border-radius: 999px;
  backdrop-filter: blur(4px);
}

.course-card-title {
  position: relative;
  z-index: 1;
  margin: 14px 0 8px;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-card-subtitle {
  position: relative;
  z-index: 1;
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-card-code {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
}

.course-card-code .iconfont {
  font-size: 18px;
}

.course-card-footer {
  padding: 12px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fafbfc;
}

.course-card-footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.role-tag {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
}

.teach-tag {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.1);
}

.teacher-label {
  font-size: 13px;
  font-weight: 400;
  color: rgb(60, 64, 67);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-card-footer-actions {
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