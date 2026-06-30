<script setup lang="js" name="courseContent">
import {useRoute,useRouter} from "vue-router";
import {useAccountStore} from "@/stores/account.js";
import {storeToRefs} from "pinia";
import {ref, computed, watch, onMounted, onBeforeUnmount} from "vue";
import request from "@/utils/request.js";
import {toast} from '@/utils/toast.js';
import {SEMESTER_OPTIONS, formatSemester} from '@/constants/semesters.js';
import AppModal from '@/components/AppModal.vue';
import TestPublishModal from '@/components/TestPublishModal.vue';
import InteractionPublishModal from '@/components/InteractionPublishModal.vue';
import PrepImportModal from '@/components/PrepImportModal.vue';
import ClassTimePicker from '@/components/ClassTimePicker.vue';
import SchoolClassPicker from '@/components/SchoolClassPicker.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import RichTextEditor from '@/components/RichTextEditor.vue';
import DateTimePicker from '@/components/DateTimePicker.vue';
import IconChevron from '@/components/IconChevron.vue';
import RichHtml from '@/components/RichHtml.vue';
import { stripHtml } from '@/utils/htmlText.js';
import {formatDateTime, formatDeadline, homeworkStatusLabel, isHomeworkOverdue, normalizeDeadlineInput, testStatusLabel} from '@/utils/homeworkDeadline.js';
import { parseClassTimeSlots } from '@/utils/courseSchedule.js';

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
const activeSection = ref('interaction')
const showEditCourse = ref(false)
const showHomeworkModal = ref(false)
const showActivityModal = ref(false)
const showTestPublishModal = ref(false)
const showInteractionModal = ref(false)
const showPrepImport = ref(false)
const prepImportKind = ref('homework')
const importedPrepId = ref(null)
const editingDraftId = ref(null)
const activityForm = ref({ title: '', content: '', start_time: '', deadline: '', attachment_url: '', attachment_name: '' })
const currentActivityType = ref('interaction')
const activities = ref({
  interaction: [],
  topic: [],
  material: [],
  test: [],
  announcement: [],
})
const activityCounts = ref({
  interaction: 0,
  topic: 0,
  material: 0,
  test: 0,
  announcement: 0,
})
const gradeBook = ref(null)
const gradeWeightForm = ref({
  homework_weight: 35,
  test_weight: 35,
  attendance_weight: 20,
  interaction_weight: 10,
})
const showGradeWeightEditor = ref(false)
const openAttendance = ref(null)
let attendancePollTimer = null

const sectionTabs = [
  { key: 'interaction', label: '课程互动', type: 'interaction', addLabel: '开启互动', icon: '互', desc: '课堂实时问答、随机点名，开启后通知全班' },
  { key: 'topic', label: '话题', type: 'topic', addLabel: '发起话题', icon: '话', desc: '课程讨论与交流' },
  { key: 'material', label: '资料', type: 'material', addLabel: '添加资料', icon: '资', desc: '课件、文档、参考资料' },
  { key: 'test', label: '测试', type: 'test', addLabel: '发布测试', icon: '测', desc: '随堂测验与练习' },
  { key: 'announcement', label: '公告', type: 'announcement', addLabel: '发布公告', icon: '告', desc: '课程通知与重要说明' },
  { key: 'homework', label: '作业', type: null, addLabel: '添加作业', icon: '作', desc: '' },
  { key: 'grades', label: '成绩册', type: null, addLabel: '', icon: '绩', desc: '作业、测试、考勤与互动综合统计' },
  { key: 'members', label: '成员', type: null, addLabel: '', icon: '', desc: '' },
]

const initialSection = route.query.section;
if (typeof initialSection === 'string' && sectionTabs.some(t => t.key === initialSection)) {
  activeSection.value = initialSection;
}

const activeTabMeta = computed(() => sectionTabs.find(t => t.key === activeSection.value) || sectionTabs[0])

const sectionCountLabel = computed(() => {
  if (activeSection.value === 'members') return ''
  if (activeSection.value === 'grades') return gradeBook.value ? `共 ${gradeBook.value.student_count} 名学生` : ''
  if (activeSection.value === 'homework') return `共 ${num.value} 个活动`
  const type = activeTabMeta.value.type
  if (type) return `共 ${activityCounts.value[type] ?? 0} 个活动`
  return ''
})

const isActivitySection = computed(() => !!activeTabMeta.value.type)
const classTimeSlots = computed(() => parseClassTimeSlots(class_time.value))
const editForm = ref({ class_name: '', class_time: '', selected_classes: '', semester: '' })
const editSchoolClassIds = ref([])
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
    })
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
      editSchoolClassIds.value = Array.isArray(res.school_class_ids)
          ? res.school_class_ids.map(Number)
          : (res.school_class_id ? [Number(res.school_class_id)] : [])
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
    school_class_ids: editSchoolClassIds.value.map(Number),
  }).then(ok => {
    if (ok) {
      toast.success('课程信息已更新')
      showEditCourse.value = false
      class_name.value = editForm.value.class_name
      class_time.value = editForm.value.class_time
      selected_classes.value = editForm.value.selected_classes
      semester.value = editForm.value.semester
      loadMembers()
    }
  })
}
request.post("/editor/getCountById", {id: course_id.value})
.then((res) => {
  count.value = res;
})

function addHomework(){
  importedPrepId.value = null;
  showHomeworkModal.value = true;
}

function cancel() {
  showHomeworkModal.value = false;
  importedPrepId.value = null;
  title_2.value = '';
  bigInput.value = '';
  deadline.value = '';
  checkedOptions.value = { personal: false, team: false };
  lastSelected.value = null;
  clearHomeworkAttachment();
}

const homeworkAttachmentFile = ref(null);
const homeworkAttachmentInputRef = ref(null);

function pickHomeworkAttachment() {
  homeworkAttachmentInputRef.value?.click();
}

function onHomeworkAttachmentChange(event) {
  const file = event.target.files?.[0];
  homeworkAttachmentFile.value = file || null;
}

function clearHomeworkAttachment() {
  homeworkAttachmentFile.value = null;
  if (homeworkAttachmentInputRef.value) {
    homeworkAttachmentInputRef.value.value = '';
  }
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
    if (importedPrepId.value) {
      request.post('/editor/publishPrepToCourse', {
        prep_id: importedPrepId.value,
        class_id: Number(course_id.value),
        teacher_account: account.value,
        deadline: normalizeDeadlineInput(deadline.value),
        homework_type: type.value,
      }).then(res => {
        if (res) {
          toast.success('作业已从备课区发布');
          cancel();
          loadHomework();
        } else {
          toast.error('发布失败，请检查截止时间');
        }
      }).catch(() => toast.error('发布失败'));
      return;
    }
    const formData = new FormData();
    formData.append('class_id', String(Number(course_id.value)));
    formData.append('name', title_2.value.trim());
    formData.append('type', type.value);
    formData.append('deadline', normalizeDeadlineInput(deadline.value));
    if (bigInput.value.trim()) {
      formData.append('details', bigInput.value.trim());
    }
    if (homeworkAttachmentFile.value) {
      formData.append('file', homeworkAttachmentFile.value);
    }
    request.post("/editor/addHomework", formData)
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

function loadActivities(type) {
  if (!type) return
  request.post('/editor/getCourseActivities', { class_id: class_id, type, account: account.value })
      .then(res => { activities.value[type] = Array.isArray(res) ? res : [] })
      .catch(() => toast.error('加载失败'))
  request.post('/editor/getCourseActivityCount', { class_id: class_id, type })
      .then(res => { activityCounts.value[type] = res ?? 0 })
}

function loadAllActivities() {
  ;['interaction', 'topic', 'material', 'test', 'announcement'].forEach(loadActivities)
}

function switchSection(key) {
  activeSection.value = key
  const tab = sectionTabs.find(t => t.key === key)
  if (tab?.type) loadActivities(tab.type)
  if (key === 'grades') loadGradeBook()
}

function loadGradeBook() {
  if (status.value !== '老师') return
  request.post('/editor/getCourseGradeBook', { class_id: Number(course_id.value) }).then(res => {
    gradeBook.value = res
    if (res?.weights) {
      gradeWeightForm.value = { ...res.weights }
    }
  })
}

const gradeWeightSum = computed(() => {
  const w = gradeWeightForm.value
  return Number(w.homework_weight || 0)
      + Number(w.test_weight || 0)
      + Number(w.attendance_weight || 0)
      + Number(w.interaction_weight || 0)
})

function saveGradeWeights() {
  if (gradeWeightSum.value !== 100) {
    toast.warning('四项权重之和必须等于 100')
    return
  }
  request.put('/editor/updateCourseGradeWeight', {
    class_id: Number(course_id.value),
    teacher_account: account.value,
    ...gradeWeightForm.value,
  }).then(ok => {
    if (ok) {
      toast.success('成绩权重已保存')
      showGradeWeightEditor.value = false
      loadGradeBook()
    } else {
      toast.error('保存失败，请确认您有权限设置本课程权重')
    }
  }).catch(() => toast.error('保存失败'))
}

function goLiveClass() {
  router.push({ name: 'liveClass', query: { id: course_id.value } })
}

function loadOpenAttendance() {
  if (!course_id.value) return Promise.resolve()
  return request.post('/editor/getOpenAttendance', {
    class_id: Number(course_id.value),
    account: account.value,
  }).then(res => {
    openAttendance.value = res?.id ? res : null
  }).catch(() => {})
}

onMounted(() => {
  loadOpenAttendance()
  attendancePollTimer = setInterval(loadOpenAttendance, 15000)
})

onBeforeUnmount(() => {
  if (attendancePollTimer) clearInterval(attendancePollTimer)
})

const activityAttachmentFile = ref(null);
const activityAttachmentInputRef = ref(null);

function pickActivityAttachment() {
  activityAttachmentInputRef.value?.click();
}

function onActivityAttachmentChange(event) {
  const file = event.target.files?.[0];
  activityAttachmentFile.value = file || null;
  if (file) {
    activityForm.value.attachment_name = file.name;
  }
}

function clearActivityAttachment() {
  activityAttachmentFile.value = null;
  if (activityAttachmentInputRef.value) {
    activityAttachmentInputRef.value.value = '';
  }
  activityForm.value.attachment_url = '';
  activityForm.value.attachment_name = '';
}

function openAddActivity() {
  if (status.value !== '老师') {
    toast.warning('仅教师可发布')
    return
  }
  importedPrepId.value = null
  const tab = activeTabMeta.value
  if (!tab.type) return
  if (tab.type === 'test') {
    editingDraftId.value = null
    showTestPublishModal.value = true
    return
  }
  if (tab.type === 'interaction') {
    showInteractionModal.value = true
    return
  }
  currentActivityType.value = tab.type
  activityForm.value = { title: '', content: '', start_time: '', deadline: '', attachment_url: '', attachment_name: '' }
  clearActivityAttachment()
  showActivityModal.value = true
}

function confirmActivity() {
  if (!activityForm.value.title.trim()) {
    toast.warning('请填写标题')
    return
  }
  if (currentActivityType.value === 'material' && !importedPrepId.value
      && !activityAttachmentFile.value && !activityForm.value.attachment_url.trim()) {
    toast.warning('请上传资料文件或填写资料链接')
    return
  }
  if (importedPrepId.value) {
    request.post('/editor/publishPrepToCourse', {
      prep_id: importedPrepId.value,
      class_id: class_id,
      teacher_account: account.value,
    }).then(ok => {
      if (ok) {
        toast.success('已从备课区发布')
        showActivityModal.value = false
        importedPrepId.value = null
        clearActivityAttachment()
        loadActivities(currentActivityType.value)
      } else {
        toast.error('发布失败')
      }
    }).catch(() => toast.error('发布失败'))
    return
  }
  const formData = new FormData();
  formData.append('class_id', String(class_id));
  formData.append('type', currentActivityType.value);
  formData.append('title', activityForm.value.title.trim());
  formData.append('creator_account', account.value);
  if (activityForm.value.content.trim()) {
    formData.append('content', activityForm.value.content.trim());
  }
  if (activityAttachmentFile.value) {
    formData.append('file', activityAttachmentFile.value);
  } else if (activityForm.value.attachment_url.trim()) {
    formData.append('attachment_url', activityForm.value.attachment_url.trim());
    formData.append('attachment_name', activityForm.value.attachment_name.trim() || '资料附件');
  }
  request.post('/editor/addCourseActivity', formData)
      .then(ok => {
        if (ok) {
          toast.success('发布成功')
          showActivityModal.value = false
          clearActivityAttachment()
          loadActivities(currentActivityType.value)
        } else {
          toast.error('发布失败，请检查测试时间或是否已提交')
        }
      }).catch(() => toast.error('发布失败'))
}

function openPrepImport(kind) {
  prepImportKind.value = kind
  showPrepImport.value = true
}

function onPrepImported(detail) {
  importedPrepId.value = detail.id
  if (detail.kind === 'homework') {
    title_2.value = detail.title || ''
    bigInput.value = detail.content || ''
    if (detail.homework_type === '团队作业') {
      checkedOptions.value = { personal: false, team: true }
      lastSelected.value = 'team'
    } else {
      checkedOptions.value = { personal: true, team: false }
      lastSelected.value = 'personal'
    }
    deadline.value = detail.deadline || ''
    showHomeworkModal.value = true
    toast.success('已导入备课内容，可修改后发布')
    return
  }
  if (['topic', 'material', 'announcement'].includes(detail.kind)) {
    currentActivityType.value = detail.kind
    activityForm.value = {
      title: detail.title || '',
      content: detail.content || '',
      start_time: '',
      deadline: '',
      attachment_url: detail.attachment_url || '',
      attachment_name: detail.attachment_name || '',
    }
    showActivityModal.value = true
    toast.success('已导入备课内容，确认后即可发布')
  }
  if (detail.kind === 'test') {
    importedPrepId.value = detail.id
    request.post('/editor/publishPrepToCourse', {
      prep_id: detail.id,
      class_id: class_id,
      teacher_account: account.value,
      start_time: detail.start_time,
      deadline: detail.deadline,
    }).then(ok => {
      if (ok) {
        toast.success('测试已从备课区发布')
        importedPrepId.value = null
        loadActivities('test')
      } else {
        toast.error('发布失败，请先在备课区设置测试时间')
      }
    }).catch(() => toast.error('发布失败'))
  }
}

function openActivityDetail(item) {
  const activityId = item?.id ?? item?.activity_id;
  if (!activityId) {
    toast.error('活动数据异常，无法打开');
    return;
  }
  if (item.type === 'test') {
    if (item.publish_status === 'draft' && status.value === '老师') {
      router.push({
        name: 'testEditor',
        params: { id: String(activityId) },
        query: { classId: course_id.value },
      }).catch(() => {});
      return;
    }
    router.push({
      name: 'testContent',
      params: { id: String(activityId) },
      query: { classId: course_id.value },
    }).catch(() => {});
    return;
  }
  if (item.type === 'interaction') {
    router.push({
      name: 'interactionContent',
      params: { id: String(activityId) },
      query: { classId: course_id.value },
    }).catch(() => {});
    return;
  }
  router.push({
    name: 'activityContent',
    params: { id: String(activityId) },
    query: { classId: course_id.value, type: item.type },
    state: { activity: item },
  }).catch(() => {});
}

function replyCountLabel(item) {
  const count = item.reply_count ?? 0;
  const type = item.type || activeTabMeta.value.type;
  if (type === 'test') {
    if (item.publish_status === 'draft') return '草稿 · 继续编辑';
    return `${count} 人已交卷`;
  }
  if (type === 'interaction') return `${count} 人已参与`;
  return `${count} 条讨论`;
}

function interactionKindLabel(item) {
  if (item.interaction_kind === 'vote') return '投票';
  if (item.interaction_kind === 'race') return '抢答';
  if (item.interaction_kind === 'qa') return '课堂问答';
  return '课堂互动';
}

function interactionStatusLabel(item) {
  try {
    const opts = JSON.parse(item.interaction_options || '{}');
    return opts.status === 'active' ? '进行中' : '已结束';
  } catch {
    return '已结束';
  }
}

watch(activeSection, (key) => {
  const tab = sectionTabs.find(t => t.key === key)
  if (tab?.type) loadActivities(tab.type)
})

loadAllActivities()

</script>

<template>
  <InteractionPublishModal
      v-model="showInteractionModal"
      :class-id="class_id"
      :creator-account="account"
      @published="loadActivities('interaction')"
  />

  <TestPublishModal
      v-model="showTestPublishModal"
      :class-id="class_id"
      :creator-account="account"
      :draft-id="editingDraftId"
      @published="loadActivities('test')"
      @saved="loadActivities('test')"
  />

  <AppModal
      v-model="showActivityModal"
      :title="activeTabMeta.addLabel"
      :subtitle="activeTabMeta.desc"
      size="lg"
  >
    <div class="homework-form">
      <label class="form-field">
        <span class="field-label">标题</span>
        <input v-model="activityForm.title" type="text" placeholder="请输入标题" class="field-control">
      </label>
      <div class="form-field">
        <span class="field-label">内容</span>
        <RichTextEditor
            v-model="activityForm.content"
            placeholder="详细说明、讨论内容或公告正文"
            min-height="180px"
        />
      </div>
      <template v-if="currentActivityType === 'material'">
        <label class="form-field">
          <span class="field-label">上传资料文件</span>
          <div class="homework-attachment-upload">
            <input
                ref="activityAttachmentInputRef"
                type="file"
                class="hidden-file-input"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt"
                @change="onActivityAttachmentChange"
            >
            <button type="button" class="btn-attachment-pick" @click="pickActivityAttachment">选择文件</button>
            <span v-if="activityAttachmentFile" class="attachment-selected">
              {{ activityAttachmentFile.name }}
              <button type="button" class="attachment-remove" @click="clearActivityAttachment">移除</button>
            </span>
            <span v-else-if="importedPrepId && activityForm.attachment_name" class="attachment-selected">
              备课附件：{{ activityForm.attachment_name }}
            </span>
            <span v-else class="attachment-hint">支持 PDF、Office、图片、压缩包等，最大 10MB</span>
          </div>
        </label>
        <label class="form-field">
          <span class="field-label">或填写外链（选填）</span>
          <input v-model="activityForm.attachment_url" type="text" placeholder="https://..." class="field-control">
        </label>
        <label v-if="activityForm.attachment_url && !activityAttachmentFile" class="form-field">
          <span class="field-label">外链名称（选填）</span>
          <input v-model="activityForm.attachment_name" type="text" placeholder="如：第一章课件.pdf" class="field-control">
        </label>
      </template>
    </div>
    <template #footer>
      <button type="button" class="btn-ghost" @click="showActivityModal=false; importedPrepId=null">取消</button>
      <button v-if="status === '老师'" type="button" class="btn-ghost" @click="openPrepImport(currentActivityType)">从备课区导入</button>
      <button type="button" class="btn-primary" @click="confirmActivity">确认发布</button>
    </template>
  </AppModal>

  <AppModal
      v-model="showHomeworkModal"
      title="添加作业"
      subtitle="填写作业信息并设置截止时间"
      size="lg"
  >
    <div class="homework-form">
      <div class="homework-type-row">
        <span class="field-label">作业类型</span>
        <label class="type-option">
          <input type="checkbox" :checked="checkedOptions.personal" @change="handleCheckboxChange('personal')">
          个人作业
        </label>
        <label class="type-option">
          <input type="checkbox" :checked="checkedOptions.team" @change="handleCheckboxChange('team')">
          团队作业
        </label>
      </div>
      <label class="form-field">
        <span class="field-label">作业标题</span>
        <input v-model="title_2" type="text" placeholder="请输入作业标题" class="field-control">
      </label>
      <div class="form-field">
        <span class="field-label">作业详情</span>
        <RichTextEditor
            v-model="bigInput"
            placeholder="作业要求、说明等"
            min-height="220px"
        />
      </div>
      <label class="form-field">
        <span class="field-label">截止时间</span>
        <DateTimePicker v-model="deadline" placeholder="选择作业截止时间" />
      </label>
      <label class="form-field">
        <span class="field-label">作业附件</span>
        <div class="homework-attachment-upload">
          <input
              ref="homeworkAttachmentInputRef"
              type="file"
              class="hidden-file-input"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt"
              @change="onHomeworkAttachmentChange"
          >
          <button type="button" class="btn-attachment-pick" @click="pickHomeworkAttachment">选择附件</button>
          <span v-if="homeworkAttachmentFile" class="attachment-selected">
            {{ homeworkAttachmentFile.name }}
            <button type="button" class="attachment-remove" @click="clearHomeworkAttachment">移除</button>
          </span>
          <span v-else class="attachment-hint">支持 PDF、Office、图片、压缩包等，最大 10MB</span>
        </div>
      </label>
    </div>
    <template #footer>
      <button type="button" class="btn-ghost" @click="cancel">取消</button>
      <button v-if="status === '老师'" type="button" class="btn-ghost" @click="openPrepImport('homework')">从备课区导入</button>
      <button type="button" class="btn-primary" @click="confirmHomework">确认发布</button>
    </template>
  </AppModal>

  <AppModal v-model="showEditCourse" title="编辑课程" subtitle="更新课程基本信息与关联行政班" size="lg">
    <div class="edit-form">
      <label class="form-field">
        <span class="field-label">课程名称</span>
        <input v-model="editForm.class_name" placeholder="课程名称" class="field-control"/>
      </label>
      <label class="form-field">
        <span class="field-label">学年学期</span>
        <select v-model="editForm.semester" class="field-control field-select">
          <option v-for="item in semesterOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <div class="form-field">
        <span class="field-label">上课时间</span>
        <ClassTimePicker v-model="editForm.class_time" />
      </div>
      <label class="form-field">
        <span class="field-label">教学班级展示名</span>
        <input v-model="editForm.selected_classes" placeholder="可留空，将自动使用行政班名称" class="field-control"/>
      </label>
      <div class="form-field">
        <span class="field-label">关联行政班</span>
        <p class="field-hint">修改后，新关联行政班中的学生会自动加入本课程</p>
        <SchoolClassPicker v-model="editSchoolClassIds" />
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn-ghost" @click="showEditCourse=false">取消</button>
      <button type="button" class="btn-primary" @click="saveCourseEdit">保存</button>
    </template>
  </AppModal>

  <div class="course-page">
    <div class="course-hero-card">
      <div class="course-hero">
        <div class="course-hero-body">
          <span class="course-semester-badge">{{ formatSemester(semester) }}</span>
          <h1 class="course-title">{{ class_name }}</h1>
          <p v-if="selected_classes" class="course-subtitle">{{ selected_classes }}</p>
          <div class="course-meta">
            <span class="meta-chip"><i class="iconfont icon-erweima"/> 加课码 {{ code }}</span>
            <span class="meta-chip">{{ count }} 人已加入</span>
            <template v-if="classTimeSlots.length">
              <span class="meta-chip meta-chip-label">上课时间</span>
              <span
                  v-for="(slot, index) in classTimeSlots"
                  :key="`${slot}-${index}`"
                  class="meta-chip meta-chip-schedule"
              >
                {{ slot }}
              </span>
            </template>
          </div>
        </div>
        <div class="course-hero-actions">
          <button
              v-if="status === '老师'"
              type="button"
              class="btn-live-class"
              @click="goLiveClass"
          >
            开始上课
          </button>
          <button
              v-else
              type="button"
              class="btn-live-class"
              :class="{ pulse: openAttendance }"
              @click="goLiveClass"
          >
            {{ openAttendance ? '立即签到' : '进入课堂' }}
          </button>
          <button
              v-if="status === '老师'"
              type="button"
              class="btn-edit-course"
              @click="openEditCourse"
          >
            编辑课程
          </button>
        </div>
      </div>
      <nav class="course-tabs" aria-label="课程内容">
        <button
            v-for="tab in sectionTabs"
            :key="tab.key"
            type="button"
            class="course-tab"
            :class="{ active: activeSection === tab.key }"
            @click="switchSection(tab.key)"
        >
          {{ tab.label }}<template v-if="tab.key === 'members'"> · {{ count }}</template>
        </button>
      </nav>
    </div>

    <div v-if="status !== '老师' && openAttendance" class="attendance-banner" @click="goLiveClass">
      <span class="attendance-banner-dot" />
      <span>老师已发起签到，点击进入输入签到码</span>
      <span class="attendance-banner-action btn-with-icon">
        <span>去签到</span>
        <IconChevron direction="right" :size="12" />
      </span>
    </div>

    <div class="course-body">
    <div v-if="activeSection==='grades'" class="grades-panel">
      <div class="mid_container">
        <div id="acts">过程性评价 · 共 {{ gradeBook?.student_count || 0 }} 名学生</div>
        <div v-if="status === '老师'" class="grades-actions">
          <button type="button" class="btn-add-activity" @click="showGradeWeightEditor = !showGradeWeightEditor">
            {{ showGradeWeightEditor ? '收起权重' : '设置权重' }}
          </button>
          <button type="button" class="btn-add-activity" @click="loadGradeBook">刷新</button>
        </div>
      </div>

      <div v-if="gradeBook?.weights" class="grade-weight-summary">
        当前权重：作业 {{ gradeBook.weights.homework_weight }}% ·
        测试 {{ gradeBook.weights.test_weight }}% ·
        出勤 {{ gradeBook.weights.attendance_weight }}% ·
        互动 {{ gradeBook.weights.interaction_weight }}%
      </div>

      <div v-if="status === '老师' && showGradeWeightEditor" class="grade-weight-editor">
        <p class="grade-weight-hint">设置综合分计算权重，四项之和须为 100。多次作业/测试取各自均分后加权。</p>
        <div class="grade-weight-grid">
          <label class="grade-weight-field">
            <span>作业权重 (%)</span>
            <input v-model.number="gradeWeightForm.homework_weight" type="number" min="0" max="100" class="field-control">
          </label>
          <label class="grade-weight-field">
            <span>测试权重 (%)</span>
            <input v-model.number="gradeWeightForm.test_weight" type="number" min="0" max="100" class="field-control">
          </label>
          <label class="grade-weight-field">
            <span>出勤权重 (%)</span>
            <input v-model.number="gradeWeightForm.attendance_weight" type="number" min="0" max="100" class="field-control">
          </label>
          <label class="grade-weight-field">
            <span>互动权重 (%)</span>
            <input v-model.number="gradeWeightForm.interaction_weight" type="number" min="0" max="100" class="field-control">
          </label>
        </div>
        <div class="grade-weight-footer">
          <span :class="{ invalid: gradeWeightSum !== 100 }">当前合计：{{ gradeWeightSum }}%</span>
          <button type="button" class="btn-primary" :disabled="gradeWeightSum !== 100" @click="saveGradeWeights">保存权重</button>
        </div>
      </div>

      <table v-if="gradeBook?.rows?.length" class="grade-table">
        <thead>
          <tr>
            <th>账号</th><th>姓名</th><th>作业</th><th>测试</th><th>出勤</th><th>互动</th><th>综合</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in gradeBook.rows" :key="row.account">
            <td>{{ row.account }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.homework_avg }}</td>
            <td>{{ row.test_avg }}</td>
            <td>{{ row.attendance_rate }}%</td>
            <td>{{ row.interaction_count }}</td>
            <td>{{ row.composite_score }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty-tip">暂无成绩数据，发布作业/测试并开展签到后可查看。</p>
    </div>
    <div v-else-if="activeSection==='members'" class="members-panel">
      <div class="member-row member-header">
        <span></span><span>成员</span><span>账号</span><span>角色</span><span>学号</span>
      </div>
      <div class="member-row" v-for="m in members" :key="m.account">
        <UserAvatar :avatar-url="m.avatar_url" :name="m.name" :account="m.account" :size="40" />
        <span class="member-name">{{ m.name }}</span>
        <span>{{ m.account }}</span>
        <span><span class="role-badge" :class="{ teacher: m.status === '老师' }">{{ m.status }}</span></span>
        <span>{{ m.status_number || '-' }}</span>
      </div>
    </div>
    <template v-else-if="activeSection==='homework'">
    <div class = "mid_container">
      <div id = "acts">{{ sectionCountLabel }}</div>
      <div class="teacher_create">
        <button v-if="status === '老师'" type="button" class="btn-add-activity" @click="addHomework">＋ 添加作业</button>
      </div>
    </div>
    <div class = "homeworks_container">
      <div class = "homeworks">
        <div class = "box" v-for = "homework in home_work" :key="homework.homework_id" @click = "handleHomework(homework.homework_id)">
          <div class = "homework">
            <img src="../assets/homework.png" alt="作业" style="width: 100px">
            <div class = "homeworkContent">
            <div class = "homeworkTitle">
              {{homework.name}}
            </div>
              <div class = "homeworkType">
                提交截止时间：{{ formatDeadline(homework.deadline) }}
                | <span :class="{ 'status-overdue': isHomeworkOverdue(homework.deadline) }">
                  {{ homeworkStatusLabel(homework.deadline) }}
                </span>
                | {{ homework.type }}
              </div>
              <div v-if="status === '老师'" class="homework-stats">
                <span class="stat-item stat-graded">已批 {{ homework.graded_count ?? 0 }}</span>
                <span class="stat-item stat-ungraded">未批 {{ homework.ungraded_count ?? 0 }}</span>
                <span class="stat-item stat-unsubmitted">未提交 {{ homework.unsubmitted_count ?? 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="home_work.length === 0" class="empty-panel">暂无作业</div>
      </div>
    </div>
    </template>
    <template v-else-if="isActivitySection">
      <div class="mid_container">
        <div id="acts">{{ sectionCountLabel }}</div>
        <div v-if="status === '老师'" class="teacher_create activity-add-wrap">
          <button class="btn-add-activity" @click="openAddActivity">＋ {{ activeTabMeta.addLabel }}</button>
          <button
              v-if="activeTabMeta.type && activeTabMeta.type !== 'interaction'"
              type="button"
              class="btn-add-activity btn-prep-import"
              @click="openPrepImport(activeTabMeta.type === 'test' ? 'test' : currentActivityType || activeTabMeta.type)"
          >从备课区导入</button>
        </div>
      </div>
      <div class="homeworks_container">
        <div class="homeworks">
          <div
              v-for="item in activities[activeTabMeta.type]"
              :key="item.id"
              class="box activity-box"
              @click="openActivityDetail(item)"
          >
            <div class="homework">
              <div class="activity-icon" :class="`activity-icon-${activeTabMeta.type}`">
                {{ activeTabMeta.icon }}
              </div>
              <div class="homeworkContent">
                <div class="homeworkTitle">
                  {{ item.title }}
                  <span v-if="item.type === 'test' && item.publish_status === 'draft'" class="draft-tag">草稿</span>
                </div>
                <div class="homeworkType">
                  {{ item.creator_name || item.creator_account }}
                  · {{ formatDateTime(item.create_time) }}
                  <template v-if="item.type === 'test' && item.publish_status === 'draft'">
                    · 未发布
                    <template v-if="item.choice_count || item.short_count">
                      · 选择题 {{ item.choice_count ?? 0 }} · 简答题 {{ item.short_count ?? 0 }}
                    </template>
                  </template>
                  <template v-else-if="item.type === 'test' && item.start_time && item.deadline">
                    · {{ formatDeadline(item.start_time) }} 至 {{ formatDeadline(item.deadline) }}
                    · {{ testStatusLabel(item.start_time, item.deadline) }}
                  </template>
                  <template v-else-if="item.type === 'test' && (item.choice_count || item.short_count)">
                    · 选择题 {{ item.choice_count ?? 0 }} · 简答题 {{ item.short_count ?? 0 }}
                  </template>
                  <template v-if="item.type === 'interaction' && item.interaction_kind">
                    · {{ interactionKindLabel(item) }}
                    · {{ interactionStatusLabel(item) }}
                  </template>
                  <template v-else-if="item.deadline">
                    · 截止 {{ formatDeadline(item.deadline) }}
                  </template>
                </div>
                <div v-if="item.content" class="activity-preview">{{ stripHtml(item.content) }}</div>
                <div class="activity-footer">
                  <span class="reply-count">{{ replyCountLabel(item) }}</span>
                  <span v-if="item.attachment_url" class="activity-attachment">📎 {{ item.attachment_name || '附件' }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!activities[activeTabMeta.type]?.length" class="empty-panel">
            暂无{{ activeTabMeta.label }}，{{ status === '老师' ? '点击右上角发布' : '请等待教师发布' }}
          </div>
        </div>
      </div>
    </template>
    </div>
  </div>

  <PrepImportModal
      v-model="showPrepImport"
      :kind="prepImportKind"
      @selected="onPrepImported"
  />
</template>

<style scoped>
.meta-chip-schedule {
  background: rgba(255, 255, 255, 0.22);
}

.meta-chip-label {
  background: rgba(255, 255, 255, 0.28);
  font-weight: 600;
}

.schedule-input {
  min-height: 88px;
  resize: vertical;
}

.course-page {
  width: min(1200px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 24px 0 48px;
}

.course-hero-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
  border: 1px solid #e8ecf1;
}

.course-hero {
  position: relative;
  padding: 28px 32px 24px;
  background: linear-gradient(135deg, #4285f4 0%, #5b8def 45%, #7baaf7 100%);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.course-hero-body {
  flex: 1;
  min-width: 0;
}

.course-semester-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.course-title {
  margin: 12px 0 6px;
  color: #fff;
  font-size: 32px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.course-subtitle {
  margin: 0 0 16px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 16px;
  font-weight: 400;
}

.course-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  backdrop-filter: blur(4px);
}

.btn-edit-course {
  flex-shrink: 0;
}

.course-hero-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.btn-live-class {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: #ef4444;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.btn-live-class.pulse {
  animation: attendance-pulse 1.5s ease-in-out infinite;
}

@keyframes attendance-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.45); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}

.attendance-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  cursor: pointer;
}

.attendance-banner-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  flex-shrink: 0;
}

.attendance-banner-action {
  margin-left: auto;
  font-weight: 600;
}

.grades-panel .grade-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.grades-actions {
  display: flex;
  gap: 8px;
}

.grade-weight-summary {
  margin: 8px 0 12px;
  padding: 10px 12px;
  background: #f8fbff;
  border-radius: 8px;
  color: #475569;
  font-size: 14px;
}

.grade-weight-editor {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.grade-weight-hint {
  margin: 0 0 12px;
  color: #64748b;
  font-size: 13px;
}

.grade-weight-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.grade-weight-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #334155;
}

.grade-weight-field .field-control {
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

.grade-weight-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
}

.grade-weight-footer .invalid {
  color: #dc2626;
}

.grade-weight-footer .btn-primary {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #488af8;
  color: #fff;
  cursor: pointer;
}

.grade-weight-footer .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .grade-weight-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.grades-panel .grade-table th,
.grades-panel .grade-table td {
  border: 1px solid #e2e8f0;
  padding: 10px;
  text-align: center;
  font-size: 14px;
}

.empty-tip { color: #64748b; padding: 16px 0; }

.btn-edit-course {
  flex-shrink: 0;
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  backdrop-filter: blur(4px);
}

.btn-edit-course:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.7);
}

.course-tabs {
  display: flex;
  gap: 4px;
  padding: 0 16px;
  overflow-x: auto;
  border-bottom: 1px solid #eef1f5;
  background: #fafbfc;
}

.course-tab {
  position: relative;
  padding: 14px 18px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.2s;
}

.course-tab:hover {
  color: #4285f4;
}

.course-tab.active {
  color: #4285f4;
  font-weight: 600;
}

.course-tab.active::after {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: #4285f4;
}

.course-body {
  margin-top: 20px;
}

#acts {
  font-size: 14px;
  color: #64748b;
}

.mid_container {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}

.teacher_create {
  margin: 0;
  padding: 0;
}

.homeworks_container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 12px;
  border: 1px solid #e8ecf1;
  background: #fff;
  padding: 8px 16px 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.btn-add-activity {
  height: 43px;
  padding: 10px 20px;
  background-color: #00CA90;
  color: #FFFFFF;
  border: none;
  border-radius: 22px;
  font-size: 16px;
  cursor: pointer;
  white-space: nowrap;
}

.homework {
  display: flex;
  align-items: center;
  gap: 4px;
}

.homeworkContent {
  margin: 6px 10px;
}

.box {
  padding: 14px 8px;
  border-bottom: 1px solid #eef1f5;
  transition: background 0.15s;
  cursor: pointer;
}

.box:last-child {
  border-bottom: none;
}

.box:hover {
  background: #f8fafc;
}

.homeworkTitle {
  font-size: large;
}

.homeworkType {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: small;
  margin: 4px 0;
  color: rgb(95, 99, 104);
}

.status-overdue {
  color: #ef4444;
  font-weight: 600;
}

.homework-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
}

.stat-graded {
  background: #ecfdf5;
  color: #059669;
}

.stat-ungraded {
  background: #fff7ed;
  color: #ea580c;
}

.stat-unsubmitted {
  background: #fef2f2;
  color: #dc2626;
}

.members-panel {
  width: 100%;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.member-row {
  display: grid;
  grid-template-columns: 52px 1fr 1.2fr 0.8fr 0.8fr;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.member-name {
  font-weight: 600;
  color: #111827;
}

.role-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #488af8;
  font-size: 13px;
}

.role-badge.teacher {
  background: #ecfdf5;
  color: #059669;
}

.homework-form,
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: block;
}

.field-hint {
  margin: 0 0 8px;
  font-size: 13px;
  color: #64748b;
}

.homework-type-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.type-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #374151;
}

.homework-detail {
  min-height: 140px;
}

.member-header {
  background: #f8f9fa;
  font-weight: 600;
}

.activity-add-wrap {
  margin-left: auto;
  margin-right: 0;
  display: flex;
  gap: 8px;
}

.btn-prep-import {
  background: #fff;
  color: #488af8;
  border: 1px solid #488af8;
}

.activity-box {
  cursor: pointer;
}

.draft-tag {
  display: inline-block;
  margin-left: 8px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fef3c7;
  color: #b45309;
  vertical-align: middle;
}

.activity-box:has(.draft-tag) {
  border-left: 3px solid #f59e0b;
}

.activity-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.activity-icon-interaction { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.activity-icon-topic { background: linear-gradient(135deg, #0ea5e9, #06b6d4); }
.activity-icon-material { background: linear-gradient(135deg, #f59e0b, #f97316); }
.activity-icon-test { background: linear-gradient(135deg, #ef4444, #f43f5e); }
.activity-icon-announcement { background: linear-gradient(135deg, #10b981, #059669); }

.activity-preview {
  margin-top: 6px;
  font-size: 14px;
  color: #6b7280;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-attachment {
  font-size: 13px;
  color: #4285f4;
}

.activity-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.reply-count {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 10px;
  border-radius: 999px;
}

.empty-panel {
  padding: 48px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 15px;
}

.activity-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #6b7280;
}

.detail-deadline {
  font-size: 14px;
  color: #374151;
}

.detail-content {
  white-space: pre-wrap;
  line-height: 1.7;
  color: #111827;
  min-height: 80px;
}

.detail-link {
  color: #4285f4;
  text-decoration: none;
  font-weight: 500;
}

.detail-link:hover {
  text-decoration: underline;
}

.homework-attachment-upload {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.hidden-file-input {
  display: none;
}

.btn-attachment-pick {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-attachment-pick:hover {
  border-color: #4285f4;
  color: #4285f4;
}

.attachment-selected {
  font-size: 14px;
  color: #334155;
}

.attachment-remove {
  border: none;
  background: none;
  color: #ef4444;
  cursor: pointer;
  margin-left: 8px;
  font-size: 13px;
}

.attachment-hint {
  font-size: 13px;
  color: #94a3b8;
}
</style>