<template>
  <div class="home-container">
    <div class="welcome-section">
      <img alt="Vue logo" src="../assets/logo.png">
      <h1>智能文章优化工具</h1>
      <p class="description">
        一款帮助您优化文章内容的智能工具，只需几步即可获得质量更好的文章
      </p>
      <el-button type="primary" @click="goToOptimizer">开始优化</el-button>
    </div>

    <div class="features-section">
      <h2>核心功能</h2>
      <el-row :gutter="20">
        <el-col :sm="8">
          <el-card class="feature-card">
            <div class="icon-container">
              <i class="el-icon-edit"></i>
            </div>
            <h3>文章润色</h3>
            <p>让您的文章表达更加流畅自然</p>
          </el-card>
        </el-col>
        <el-col :sm="8">
          <el-card class="feature-card">
            <div class="icon-container">
              <i class="el-icon-reading"></i>
            </div>
            <h3>提高可读性</h3>
            <p>优化文章结构，提高阅读体验</p>
          </el-card>
        </el-col>
        <el-col :sm="8">
          <el-card class="feature-card">
            <div class="icon-container">
              <i class="el-icon-connection"></i>
            </div>
            <h3>增强专业性</h3>
            <p>添加专业术语，使文章更具说服力</p>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="contact-section">
      <p>问题反馈： <a href="mailto:slow@linux.do"><i class="el-icon-message"></i> slow@linux.do</a></p>
    </div>

    <!-- 首次访问公告弹窗 -->
    <el-dialog title="重要提示" :visible.sync="showNotice" width="420px" :show-close="false" center>
      <div class="notice-content">
        <i class="el-icon-warning-outline warning-icon"></i>
        <p>本工具仅为文章内容优化使用，不得用于论文改写等学术不端行为。如有违反，一切后果由使用者自行承担！</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-checkbox v-model="doNotShowAgain">不再提示</el-checkbox>
        <el-button type="primary" @click="confirmNotice">我已了解</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      showNotice: false,
      doNotShowAgain: false
    }
  },
  created() {
    // 检查是否需要显示公告
    const hasSeenNotice = localStorage.getItem('hasSeenNotice');
    if (!hasSeenNotice) {
      this.showNotice = true;
    }
  },
  methods: {
    goToOptimizer() {
      this.$router.push('/article-optimizer');
    },
    confirmNotice() {
      if (this.doNotShowAgain) {
        localStorage.setItem('hasSeenNotice', 'true');
      }
      this.showNotice = false;
    }
  }
}
</script>

<style scoped>
.home-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  /* 减去顶部导航和一些内边距 */
  box-sizing: border-box;
  overflow: hidden;
  /* 禁止滚动 */
}

.welcome-section {
  text-align: center;
  margin-bottom: 40px;
}

.welcome-section img {
  width: 80px;
  /* 减小logo大小 */
  margin-bottom: 10px;
  /* 减小间距 */
}

.welcome-section h1 {
  font-size: 2.2rem;
  color: #409EFF;
  margin-bottom: 15px;
  /* 减小间距 */
}

.description {
  font-size: 1.1rem;
  color: #606266;
  margin-bottom: 20px;
  /* 减小间距 */
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.features-section {
  flex-grow: 1;
}

.features-section h2 {
  text-align: center;
  margin-bottom: 20px;
  /* 减小间距 */
  color: #2c3e50;
}

.feature-card {
  text-align: center;
  height: 100%;
  transition: all 0.3s;
  padding: 15px 10px;
  /* 减小内边距 */
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.icon-container {
  margin: 10px 0;
  /* 减小间距 */
}

.icon-container i {
  font-size: 35px;
  /* 稍微减小图标 */
  color: #409EFF;
}

.feature-card h3 {
  font-size: 1.1rem;
  margin: 10px 0;
  /* 减小间距 */
  color: #2c3e50;
}

.feature-card p {
  color: #606266;
  font-size: 0.9rem;
  /* 稍微减小字体 */
}

.contact-section {
  margin-top: 20px;
  text-align: center;
  padding: 10px;
  border-top: 1px solid #eaeaea;
}

.contact-section p {
  color: #606266;
  font-size: 0.9rem;
}

.contact-section a {
  color: #409EFF;
  text-decoration: none;
  transition: color 0.3s;
}

.contact-section a:hover {
  color: #66b1ff;
}

/* 确保el-row在容器内 */
.el-row {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

/* 公告弹窗样式 */
.notice-content {
  text-align: center;
  padding: 10px 0;
}

.warning-icon {
  font-size: 48px;
  color: #E6A23C;
  margin-bottom: 15px;
  display: block;
}

.notice-content p {
  line-height: 1.6;
  color: #606266;
  font-size: 15px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
