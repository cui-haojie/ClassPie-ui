<script setup lang="js" name="HomePage">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import logoImg from '@/assets/classPai.png';
import heroImg from '@/assets/newbg.png';

const router = useRouter();
const headerElevated = ref(false);

const navItems = [
  { id: 'hero', label: '首页' },
  { id: 'features', label: '产品功能' },
  { id: 'scenes', label: '适用场景' },
  { id: 'advantages', label: '平台优势' },
];

const features = [
  {
    icon: '作',
    title: '作业与测验',
    desc: '在线布置、提交与批阅，支持附件与 AI 辅助出题，减轻教师重复劳动。',
    tone: 'blue',
  },
  {
    icon: '互',
    title: '课堂互动',
    desc: '实时问答、抢答、投票，WebSocket 同步课堂状态，让每堂课都「活」起来。',
    tone: 'cyan',
  },
  {
    icon: '签',
    title: '考勤签到',
    desc: '一键发起签到，学生输入签到码即可到课，考勤数据自动汇总进成绩册。',
    tone: 'green',
  },
  {
    icon: '资',
    title: '资料共享',
    desc: '课件、文档、外链统一发布，学生随时查阅下载，话题讨论围绕资料展开。',
    tone: 'orange',
  },
  {
    icon: '绩',
    title: '成绩册',
    desc: '作业、测试、出勤、互动多维度加权，过程性评价一目了然。',
    tone: 'purple',
  },
  {
    icon: '备',
    title: '备课区',
    desc: '提前准备作业、资料、公告与测试模板，发布到课程时一键导入。',
    tone: 'pink',
  },
];

const scenes = [
  { title: '高校教学', desc: '大班授课、翻转课堂、混合式教学' },
  { title: '职业培训', desc: '企业内训、技能考核、学习跟踪' },
  { title: '中小学', desc: '班级管理、家校协同、日常作业' },
];

const stats = [
  { value: '8+', label: '核心教学模块' },
  { value: '实时', label: '课堂互动同步' },
  { value: '全流程', label: '教与学闭环' },
  { value: '免费', label: '校内部署使用' },
];

function onScroll() {
  headerElevated.value = window.scrollY > 8;
}

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function goLogin() {
  router.push({ name: 'login' });
}

function goRegister() {
  router.push({ name: 'register' });
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
});
</script>

<template>
  <div class="home-page">
    <header class="home-header" :class="{ elevated: headerElevated }">
      <div class="header-inner">
        <a class="brand" href="#" @click.prevent="scrollTo('hero')">
          <img :src="logoImg" alt="课堂派" class="brand-logo">
        </a>
        <nav class="header-nav">
          <button
              v-for="item in navItems"
              :key="item.id"
              type="button"
              class="nav-link"
              @click="scrollTo(item.id)"
          >
            {{ item.label }}
          </button>
        </nav>
        <div class="header-actions">
          <button type="button" class="btn-ghost" @click="goLogin">登录</button>
          <button type="button" class="btn-primary" @click="goRegister">免费注册</button>
        </div>
      </div>
    </header>

    <section id="hero" class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <p class="hero-badge">ClassPi · 互动教学管理平台</p>
          <h1 class="hero-title">简单好用的<br>课堂管理工具</h1>
          <p class="hero-desc">
            仿照课堂派教学体验打造：作业、互动、考勤、资料、测试与成绩册一体化，
            帮助教师专注教学，让学生学习更高效。
          </p>
          <div class="hero-actions">
            <button type="button" class="btn-hero-primary" @click="goRegister">立即免费使用</button>
            <button type="button" class="btn-hero-outline" @click="goLogin">已有账号，去登录</button>
          </div>
        </div>
        <div class="hero-visual">
          <img :src="heroImg" alt="课堂派产品示意" class="hero-image">
        </div>
      </div>
    </section>

    <section id="features" class="section features-section">
      <div class="section-inner">
        <div class="section-head">
          <h2>产品功能</h2>
          <p>覆盖课前、课中、课后完整教学流程</p>
        </div>
        <div class="feature-grid">
          <article
              v-for="item in features"
              :key="item.title"
              class="feature-card"
              :class="`tone-${item.tone}`"
          >
            <span class="feature-icon">{{ item.icon }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="stats-bar">
      <div class="stats-inner">
        <div v-for="item in stats" :key="item.label" class="stat-item">
          <strong>{{ item.value }}</strong>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </section>

    <section id="scenes" class="section scenes-section">
      <div class="section-inner">
        <div class="section-head">
          <h2>适用场景</h2>
          <p>满足不同层次、不同规模的教学组织需求</p>
        </div>
        <div class="scene-grid">
          <article v-for="item in scenes" :key="item.title" class="scene-card">
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="advantages" class="section advantages-section">
      <div class="section-inner advantages-layout">
        <div class="advantages-copy">
          <h2>为什么选择课堂派？</h2>
          <ul class="advantage-list">
            <li>
              <strong>上手快</strong>
              <span>界面清晰，与主流课堂派操作习惯一致，师生几乎零学习成本。</span>
            </li>
            <li>
              <strong>功能全</strong>
              <span>从发作业到课堂互动、签到、成绩汇总，一个平台完成日常教学。</span>
            </li>
            <li>
              <strong>可部署</strong>
              <span>支持本地/校内服务器部署，数据自主可控，适合课程设计与毕业项目。</span>
            </li>
            <li>
              <strong>持续迭代</strong>
              <span>富文本、AI 出题、归档管理等能力持续完善，贴近真实教学场景。</span>
            </li>
          </ul>
          <button type="button" class="btn-hero-primary" @click="goRegister">开始使用</button>
        </div>
        <div class="advantages-panel">
          <div class="panel-card">
            <span class="panel-label">教师端</span>
            <p>发布活动 · 批阅作业 · 课堂互动 · 成绩分析</p>
          </div>
          <div class="panel-card panel-card-alt">
            <span class="panel-label">学生端</span>
            <p>提交作业 · 参与讨论 · 签到答题 · 查看反馈</p>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="cta-inner">
        <h2>开启更高效的教与学</h2>
        <p>注册账号即可创建或加入课程，体验完整课堂派式教学流程。</p>
        <div class="cta-actions">
          <button type="button" class="btn-hero-primary btn-on-dark" @click="goRegister">免费注册</button>
          <button type="button" class="btn-hero-outline btn-on-dark" @click="goLogin">登录</button>
        </div>
      </div>
    </section>

    <footer class="home-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <img :src="logoImg" alt="" class="footer-logo">
          <span>课堂派 ClassPi</span>
        </div>
        <p class="footer-copy">© {{ new Date().getFullYear() }} 课堂派 · 简单好用的课堂管理工具</p>
        <p class="footer-note">本项目为课堂派式教学平台课程设计实现，参考 <a href="https://www.ketangpai.com/#/homePage" target="_blank" rel="noopener">ketangpai.com</a></p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #fff;
  color: #1e293b;
}

.home-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid transparent;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.home-header.elevated {
  border-color: #e2e8f0;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
}

.header-inner {
  width: 100%;
  margin: 0;
  padding: 0 40px 0 28px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  flex-shrink: 0;
}

.brand-logo {
  height: 40px;
  width: auto;
  display: block;
}

.header-nav {
  display: flex;
  gap: 8px;
  flex: 1;
}

.nav-link {
  border: none;
  background: none;
  padding: 8px 14px;
  font-size: 15px;
  color: #475569;
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}

.nav-link:hover {
  color: rgb(72, 138, 248);
  background: rgba(72, 138, 248, 0.08);
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  margin-left: auto;
}

.btn-ghost {
  height: 38px;
  padding: 0 18px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  font-size: 14px;
  cursor: pointer;
}

.btn-ghost:hover {
  border-color: rgb(72, 138, 248);
  color: rgb(72, 138, 248);
}

.btn-primary {
  height: 38px;
  padding: 0 18px;
  border: none;
  border-radius: 8px;
  background: rgb(72, 138, 248);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: rgb(58, 122, 232);
}

.hero {
  min-height: calc(100vh - 64px);
  padding: 96px 40px 72px 28px;
  background: linear-gradient(180deg, #f0f6ff 0%, #fff 100%);
  display: flex;
  align-items: center;
}

.hero-inner {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 40px;
  align-items: center;
}

.hero-badge {
  display: inline-block;
  margin: 0 0 16px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(72, 138, 248, 0.12);
  color: rgb(58, 122, 232);
  font-size: 13px;
  font-weight: 600;
}

.hero-title {
  margin: 0 0 20px;
  font-size: clamp(36px, 5vw, 52px);
  line-height: 1.15;
  font-weight: 800;
  color: #0f172a;
}

.hero-desc {
  margin: 0 0 32px;
  font-size: 17px;
  line-height: 1.75;
  color: #64748b;
  max-width: 520px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.btn-hero-primary {
  height: 48px;
  padding: 0 28px;
  border: none;
  border-radius: 10px;
  background: rgb(72, 138, 248);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(72, 138, 248, 0.35);
}

.btn-hero-primary:hover {
  background: rgb(58, 122, 232);
}

.btn-hero-outline {
  height: 48px;
  padding: 0 28px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font-size: 16px;
  cursor: pointer;
}

.btn-hero-outline:hover {
  border-color: rgb(72, 138, 248);
  color: rgb(72, 138, 248);
}

.hero-visual {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.hero-image {
  width: 100%;
  max-width: 680px;
  height: auto;
  max-height: min(620px, 72vh);
  object-fit: contain;
  filter: drop-shadow(0 20px 40px rgba(72, 138, 248, 0.15));
}

.section {
  padding: 80px 24px;
}

.section-inner {
  max-width: 1180px;
  margin: 0 auto;
}

.section-head {
  text-align: center;
  margin-bottom: 48px;
}

.section-head h2 {
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
}

.section-head p {
  margin: 0;
  font-size: 16px;
  color: #64748b;
}

.features-section {
  background: #f8fafc;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
}

.tone-blue .feature-icon { background: linear-gradient(135deg, #488af8, #6366f1); }
.tone-cyan .feature-icon { background: linear-gradient(135deg, #06b6d4, #0ea5e9); }
.tone-green .feature-icon { background: linear-gradient(135deg, #10b981, #059669); }
.tone-orange .feature-icon { background: linear-gradient(135deg, #f59e0b, #f97316); }
.tone-purple .feature-icon { background: linear-gradient(135deg, #8b5cf6, #6366f1); }
.tone-pink .feature-icon { background: linear-gradient(135deg, #ec4899, #f43f5e); }

.feature-card h3 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #0f172a;
}

.feature-card p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #64748b;
}

.stats-bar {
  background: linear-gradient(90deg, rgb(72, 138, 248), #6366f1);
  padding: 40px 24px;
}

.stats-inner {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  text-align: center;
  color: #fff;
}

.stat-item strong {
  display: block;
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 6px;
}

.stat-item span {
  font-size: 14px;
  opacity: 0.9;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.scene-card {
  padding: 32px 28px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eff6ff, #f8fafc);
  border: 1px solid #dbeafe;
}

.scene-card h3 {
  margin: 0 0 10px;
  font-size: 20px;
  color: #1d4ed8;
}

.scene-card p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

.advantages-section {
  background: #fff;
}

.advantages-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  align-items: center;
}

.advantages-copy h2 {
  margin: 0 0 28px;
  font-size: 32px;
  color: #0f172a;
}

.advantage-list {
  list-style: none;
  padding: 0;
  margin: 0 0 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.advantage-list li {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.advantage-list strong {
  font-size: 16px;
  color: #0f172a;
}

.advantage-list span {
  font-size: 14px;
  line-height: 1.65;
  color: #64748b;
}

.advantages-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-card {
  padding: 28px;
  border-radius: 16px;
  background: rgb(72, 138, 248);
  color: #fff;
}

.panel-card-alt {
  background: #0f172a;
}

.panel-label {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  opacity: 0.85;
}

.panel-card p {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
}

.cta-section {
  padding: 72px 24px;
  background: linear-gradient(135deg, #1e3a5f, #0f172a);
}

.cta-inner {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
  color: #fff;
}

.cta-inner h2 {
  margin: 0 0 12px;
  font-size: 30px;
}

.cta-inner p {
  margin: 0 0 28px;
  color: #cbd5e1;
  font-size: 16px;
}

.cta-actions {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

.btn-on-dark.btn-hero-outline {
  border-color: rgba(255, 255, 255, 0.35);
  background: transparent;
  color: #fff;
}

.btn-on-dark.btn-hero-outline:hover {
  border-color: #fff;
  color: #fff;
}

.home-footer {
  padding: 40px 24px 48px;
  background: #0f172a;
  color: #94a3b8;
}

.footer-inner {
  max-width: 1180px;
  margin: 0 auto;
  text-align: center;
}

.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #e2e8f0;
  font-weight: 600;
}

.footer-logo {
  height: 28px;
}

.footer-copy {
  margin: 0 0 8px;
  font-size: 14px;
}

.footer-note {
  margin: 0;
  font-size: 12px;
}

.footer-note a {
  color: #93c5fd;
}

@media (max-width: 960px) {
  .header-nav {
    display: none;
  }

  .hero-inner,
  .advantages-layout {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    order: -1;
  }

  .feature-grid,
  .scene-grid {
    grid-template-columns: 1fr;
  }

  .stats-inner {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 520px) {
  .header-inner {
    padding: 0 20px 0 16px;
  }

  .header-actions .btn-ghost {
    display: none;
  }

  .hero {
    padding-top: 88px;
    padding-left: 16px;
    padding-right: 16px;
  }

  .stats-inner {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
