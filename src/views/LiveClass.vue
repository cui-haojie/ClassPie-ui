<script setup lang="js" name="LiveClass">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '@/utils/request.js';
import { useAccountStore } from '@/stores/account.js';
import { storeToRefs } from 'pinia';
import { toast } from '@/utils/toast.js';
import { connectLiveSocket } from '@/utils/liveSocket.js';
import IconChevron from '@/components/IconChevron.vue';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();
const { account, token } = storeToRefs(accountStore);

const classId = ref(Number(route.query.id));
const isTeacher = ref(false);
const activePanel = ref('attendance');
const openSession = ref(null);
const viewSessionId = ref(null);
const attendanceDetail = ref(null);
const sessionHistory = ref([]);
const checkCode = ref('');
const gradeBook = ref(null);
const socket = ref(null);

const absentCount = computed(() => {
  const expected = attendanceDetail.value?.expected_count ?? 0;
  const checked = attendanceDetail.value?.checked_count ?? 0;
  return Math.max(expected - checked, 0);
});

const isViewingOpen = computed(() => {
  return !!(openSession.value && viewSessionId.value === openSession.value.id);
});

const panels = computed(() => {
  const base = [
    { key: 'attendance', label: '考勤签到' },
    { key: 'grades', label: '成绩概览' },
  ];
  if (isTeacher.value) {
    return base;
  }
  return base.filter(p => p.key !== 'grades');
});

function loadSessionHistory() {
  if (!isTeacher.value) return Promise.resolve();
  return request.post('/editor/listAttendances', {
    class_id: classId.value,
    account: account.value,
  }).then(res => {
    sessionHistory.value = Array.isArray(res) ? res : [];
  });
}

function selectSession(sessionId) {
  if (!sessionId) return;
  viewSessionId.value = sessionId;
  loadAttendanceDetail(sessionId);
}

function loadOpenAttendance() {
  return request.post('/editor/getOpenAttendance', {
    class_id: classId.value,
    account: account.value,
  }).then(res => {
    openSession.value = res;
    if (res?.id) {
      viewSessionId.value = res.id;
      return loadAttendanceDetail(res.id);
    }
    if (viewSessionId.value) {
      return loadAttendanceDetail(viewSessionId.value);
    }
    if (isTeacher.value) {
      return loadSessionHistory().then(() => {
        const latest = sessionHistory.value[0];
        if (latest?.id) {
          viewSessionId.value = latest.id;
          return loadAttendanceDetail(latest.id);
        }
        attendanceDetail.value = null;
      });
    }
    attendanceDetail.value = null;
  });
}

function loadAttendanceDetail(sessionId) {
  return request.post('/editor/getAttendanceDetail', {
    session_id: sessionId,
    account: account.value,
  }).then(res => {
    attendanceDetail.value = res;
    if (res?.session?.id) {
      viewSessionId.value = res.session.id;
    }
  });
}

function loadGradeBook() {
  if (!isTeacher.value) return;
  request.post('/editor/getCourseGradeBook', { class_id: classId.value }).then(res => {
    gradeBook.value = res;
  });
}

function startAttendance() {
  request.post('/editor/startAttendance', {
    class_id: classId.value,
    teacher_account: account.value,
    duration_minutes: 5,
  }).then(res => {
    if (res?.id) {
      toast.success(`签到已开启，签到码：${res.code}`);
      openSession.value = res;
      viewSessionId.value = res.id;
      loadAttendanceDetail(res.id);
      loadSessionHistory();
      subscribeRoom(`attendance:${res.id}`);
    } else {
      toast.error('开启签到失败');
    }
  }).catch(() => toast.error('开启签到失败'));
}

function closeAttendance() {
  if (!openSession.value?.id) return;
  const closedId = openSession.value.id;
  request.post('/editor/closeAttendance', {
    session_id: closedId,
    teacher_account: account.value,
  }).then(ok => {
    if (ok) {
      toast.success('签到已结束');
      openSession.value = null;
      viewSessionId.value = closedId;
      loadAttendanceDetail(closedId);
      loadSessionHistory();
    }
  });
}

function checkIn() {
  if (!openSession.value?.id) return;
  request.post('/editor/checkInAttendance', {
    session_id: openSession.value.id,
    account: account.value,
    code: checkCode.value.trim(),
  }).then(ok => {
    if (ok) {
      toast.success('签到成功');
      loadAttendanceDetail(openSession.value.id);
    } else {
      toast.error('签到失败，请检查签到码');
    }
  });
}

function goInteraction() {
  router.push({ name: 'courseContent', query: { id: classId.value, section: 'interaction' } });
}

function subscribeRoom(room) {
  if (socket.value) {
    socket.value.close();
  }
  if (!token.value) return;
  socket.value = connectLiveSocket(room, token.value, (payload) => {
    if (payload.type === 'attendance_closed') {
      const closedId = payload.data?.session_id;
      if (closedId && openSession.value?.id === closedId) {
        openSession.value = null;
        viewSessionId.value = closedId;
        loadAttendanceDetail(closedId);
        loadSessionHistory();
      }
      return;
    }
    if (payload.type?.startsWith('attendance')) {
      if (openSession.value?.id) {
        loadAttendanceDetail(openSession.value.id);
      } else {
        loadOpenAttendance();
      }
    }
  });
}

onMounted(async () => {
  await request.post('/editor/getAccountStatus', { account: account.value }).then(status => {
    isTeacher.value = status === '老师';
  });
  await loadOpenAttendance();
  if (isTeacher.value) {
    await loadSessionHistory();
  }
  if (openSession.value?.id) {
    subscribeRoom(`attendance:${openSession.value.id}`);
  }
  subscribeRoom(`course:${classId.value}`);
  if (isTeacher.value) {
    loadGradeBook();
  }
});

onBeforeUnmount(() => {
  socket.value?.close();
});
</script>

<template>
  <div class="live-class">
    <header class="live-header">
      <button type="button" class="btn-ghost btn-with-icon" @click="router.back()">
        <IconChevron direction="left" />
        <span>返回课程</span>
      </button>
      <h1>上课模式</h1>
      <span class="live-badge">Live</span>
    </header>

    <nav class="live-tabs">
      <button
          v-for="p in panels"
          :key="p.key"
          type="button"
          class="live-tab"
          :class="{ active: activePanel === p.key }"
          @click="activePanel = p.key"
      >{{ p.label }}</button>
    </nav>

    <section v-if="activePanel === 'attendance'" class="live-panel">
      <div v-if="isTeacher" class="teacher-actions">
        <button type="button" class="btn-primary" @click="startAttendance">发起签到</button>
        <button v-if="openSession && attendanceDetail?.is_teacher" type="button" class="btn-ghost" @click="closeAttendance">结束签到</button>
        <button type="button" class="btn-ghost" @click="goInteraction">课堂互动</button>
      </div>

      <div v-if="isViewingOpen && isTeacher" class="attendance-card">
        <h3>当前签到码</h3>
        <p class="attendance-code">{{ openSession.code }}</p>
        <p class="hint">请学生在 {{ openSession.duration_minutes || 5 }} 分钟内输入签到码完成签到</p>
        <div v-if="attendanceDetail" class="attendance-stats">
          <div class="stat-item">
            <span class="stat-value">{{ attendanceDetail.expected_count ?? 0 }}</span>
            <span class="stat-label">应到</span>
          </div>
          <div class="stat-item stat-present">
            <span class="stat-value">{{ attendanceDetail.checked_count ?? 0 }}</span>
            <span class="stat-label">实到</span>
          </div>
          <div class="stat-item stat-absent">
            <span class="stat-value">{{ absentCount }}</span>
            <span class="stat-label">缺勤</span>
          </div>
        </div>
      </div>
      <div v-else-if="!isViewingOpen && attendanceDetail && isTeacher" class="attendance-card closed-card">
        <h3>签到已结束</h3>
        <p class="hint">
          开始：{{ attendanceDetail.session?.create_time || '—' }}
          · 结束：{{ attendanceDetail.session?.close_time || '—' }}
        </p>
        <div class="attendance-stats">
          <div class="stat-item">
            <span class="stat-value">{{ attendanceDetail.expected_count ?? 0 }}</span>
            <span class="stat-label">应到</span>
          </div>
          <div class="stat-item stat-present">
            <span class="stat-value">{{ attendanceDetail.checked_count ?? 0 }}</span>
            <span class="stat-label">实到</span>
          </div>
          <div class="stat-item stat-absent">
            <span class="stat-value">{{ absentCount }}</span>
            <span class="stat-label">缺勤</span>
          </div>
        </div>
      </div>
      <div v-else-if="openSession && !isTeacher" class="attendance-card student-prompt">
        <h3>签到进行中</h3>
        <p class="hint">请输入教师在课堂上公布的 4 位签到码</p>
        <p v-if="attendanceDetail?.checked_in" class="checked-tag">你已签到</p>
      </div>
      <div v-else-if="!isTeacher" class="empty-hint">暂无进行中的签到</div>
      <div v-else-if="!attendanceDetail" class="empty-hint">暂无签到记录，点击「发起签到」开始</div>

      <div v-if="isTeacher && sessionHistory.length" class="session-history">
        <h4>历史签到</h4>
        <ul class="history-list">
          <li
              v-for="s in sessionHistory"
              :key="s.id"
              class="history-item"
              :class="{ active: viewSessionId === s.id }"
              @click="selectSession(s.id)"
          >
            <span>{{ s.create_time }}</span>
            <span class="history-meta">
              实到 {{ s.checked_count ?? 0 }}/{{ s.student_count ?? 0 }}
              · {{ s.status === 'open' ? '进行中' : '已结束' }}
            </span>
          </li>
        </ul>
      </div>

      <div v-if="!isTeacher && openSession" class="student-checkin">
        <input v-model="checkCode" type="text" maxlength="4" placeholder="输入 4 位签到码" class="field-control" />
        <button type="button" class="btn-primary" :disabled="attendanceDetail?.checked_in" @click="checkIn">
          {{ attendanceDetail?.checked_in ? '已签到' : '提交签到' }}
        </button>
      </div>

      <div v-if="isTeacher && attendanceDetail" class="attendance-lists">
        <div class="attendance-list-block">
          <h4>已签到（{{ attendanceDetail.checked_count ?? 0 }}）</h4>
          <ul v-if="attendanceDetail.records?.length" class="record-list">
            <li v-for="r in attendanceDetail.records" :key="r.id">
              <span class="member-name">{{ r.account_name || r.account }}</span>
              <span class="member-meta">{{ r.account }} · {{ r.check_time }}</span>
            </li>
          </ul>
          <p v-else class="empty-hint">暂无学生签到</p>
        </div>
        <div class="attendance-list-block absent-block">
          <h4>未签到（{{ absentCount }}）</h4>
          <ul v-if="attendanceDetail.absent_members?.length" class="record-list">
            <li v-for="m in attendanceDetail.absent_members" :key="m.account">
              <span class="member-name">{{ m.name || m.account }}</span>
              <span class="member-meta">{{ m.account }}<template v-if="m.status_number"> · {{ m.status_number }}</template></span>
            </li>
          </ul>
          <p v-else class="empty-hint">全员已到</p>
        </div>
      </div>
    </section>

    <section v-if="activePanel === 'grades' && isTeacher" class="live-panel">
      <button type="button" class="btn-ghost" @click="loadGradeBook">刷新成绩</button>
      <p v-if="gradeBook?.weights" class="grade-weight-tip">
        权重：作业 {{ gradeBook.weights.homework_weight }}% ·
        测试 {{ gradeBook.weights.test_weight }}% ·
        出勤 {{ gradeBook.weights.attendance_weight }}% ·
        互动 {{ gradeBook.weights.interaction_weight }}%
      </p>
      <table v-if="gradeBook?.rows?.length" class="grade-table">
        <thead>
          <tr>
            <th>学号/账号</th>
            <th>姓名</th>
            <th>作业均分</th>
            <th>测试均分</th>
            <th>出勤率</th>
            <th>互动次数</th>
            <th>综合分</th>
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
      <p v-else class="empty-hint">暂无成绩数据</p>
    </section>
  </div>
</template>

<style scoped>
.live-class { padding: 24px; max-width: 960px; margin: 0 auto; }
.live-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.live-header h1 { margin: 0; font-size: 22px; flex: 1; }
.live-badge { background: #ef4444; color: #fff; padding: 2px 10px; border-radius: 999px; font-size: 12px; }
.live-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.live-tab { border: 1px solid #dbeafe; background: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
.live-tab.active { background: #488af8; color: #fff; border-color: #488af8; }
.live-panel { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
.teacher-actions { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.attendance-card { text-align: center; padding: 16px; background: #f8fbff; border-radius: 10px; margin-bottom: 16px; }
.closed-card { background: #f0fdf4; }
.session-history { margin-bottom: 16px; }
.session-history h4 { margin: 0 0 8px; font-size: 14px; color: #334155; }
.history-list { list-style: none; padding: 0; margin: 0; max-height: 160px; overflow-y: auto; }
.history-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; cursor: pointer; font-size: 13px; }
.history-item:hover { background: #f8fafc; }
.history-item.active { border-color: #488af8; background: #eff6ff; }
.history-meta { color: #64748b; font-size: 12px; white-space: nowrap; }
.attendance-code { font-size: 42px; letter-spacing: 8px; font-weight: 700; color: #2563eb; margin: 8px 0; }
.student-prompt { text-align: center; }
.checked-tag { color: #16a34a; font-weight: 600; margin-top: 8px; }
.student-checkin { display: flex; gap: 8px; max-width: 360px; margin-bottom: 16px; }
.attendance-stats { display: flex; justify-content: center; gap: 24px; margin-top: 16px; }
.stat-item { display: flex; flex-direction: column; align-items: center; min-width: 64px; }
.stat-value { font-size: 28px; font-weight: 700; color: #1e293b; line-height: 1.2; }
.stat-label { font-size: 13px; color: #64748b; margin-top: 4px; }
.stat-present .stat-value { color: #16a34a; }
.stat-absent .stat-value { color: #dc2626; }
.attendance-lists { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px; }
.attendance-list-block { background: #f8fafc; border-radius: 10px; padding: 14px; min-height: 120px; }
.attendance-list-block h4 { margin: 0 0 10px; font-size: 14px; color: #334155; }
.absent-block { background: #fff7ed; }
.record-list { list-style: none; padding: 0; margin: 0; max-height: 280px; overflow-y: auto; }
.record-list li { padding: 8px 0; border-bottom: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 2px; }
.member-name { font-weight: 600; color: #1e293b; }
.member-meta { font-size: 12px; color: #64748b; }
@media (max-width: 720px) {
  .attendance-lists { grid-template-columns: 1fr; }
}
.grade-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
.grade-table th, .grade-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: center; }
.grade-weight-tip { color: #64748b; font-size: 13px; margin: 8px 0 12px; }
.empty-hint { color: #64748b; }
.field-control { flex: 1; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
.btn-primary, .btn-ghost { padding: 8px 16px; border-radius: 8px; cursor: pointer; border: none; }
.btn-primary { background: #488af8; color: #fff; }
.btn-ghost { background: #f1f5f9; color: #334155; }
</style>
