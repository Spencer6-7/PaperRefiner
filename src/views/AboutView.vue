<template>
  <div class="about-page">
    <h1>请我喝杯咖啡吧</h1>
    <p class="description">
      如果你觉得这个工具对你有帮助的话，也可以通过以下渠道进行请我喝杯咖啡 ☕️
    </p>

    <div class="section">
      <h2>友情链接</h2>
      <div class="friend-links">
        <a href="https://matrix.tencent.com/ai-detect/" target="_blank" rel="noopener noreferrer" class="link-card">
          <div class="link-icon">
            <i class="el-icon-search"></i>
          </div>
          <div class="link-info">
            <h3>朱雀AI检测</h3>
            <p>腾讯朱雀AI文本检测工具，可有效识别AI生成内容</p>
          </div>
        </a>

        <a href="https://www.paperpass.com/" target="_blank" rel="noopener noreferrer" class="link-card">
          <div class="link-icon">
            <i class="el-icon-document-checked"></i>
          </div>
          <div class="link-info">
            <h3>PaperPass</h3>
            <p>专业的论文查重和智能降重工具，助力学术诚信</p>
          </div>
        </a>

        <a href="https://vgms.fanyu.com/" target="_blank" rel="noopener noreferrer" class="link-card">
          <div class="link-icon">
            <i class="el-icon-document"></i>
          </div>
          <div class="link-info">
            <h3>维普论文管理系统</h3>
            <p>集论文检测、教师审阅统一管理的一体综合平台</p>
          </div>
        </a>

        <a href="https://www.cnki.net/" target="_blank" rel="noopener noreferrer" class="link-card">
          <div class="link-icon">
            <i class="el-icon-collection"></i>
          </div>
          <div class="link-info">
            <h3>知网</h3>
            <p>知识基础设施工程，提供海量学术资源与论文查询服务</p>
          </div>
        </a>
      </div>
    </div>

    <div class="section payment-section">
      <h2>赞助支持</h2>
      <div class="payment-options">
        <div class="payment-card">
          <div class="payment-header">
            <i class="el-icon-chat-dot-round"></i>
            <h3>微信支付</h3>
          </div>
          <div class="qr-container">
            <img src="https://blogimgoss.oss-cn-nanjing.aliyuncs.com/img/83e6795093ef904e2a08c4a7d6c60030.jpg"
              alt="微信收款码" class="qr-code">
          </div>
        </div>

        <div class="payment-card">
          <div class="payment-header">
            <i class="el-icon-wallet"></i>
            <h3>支付宝</h3>
          </div>
          <div class="qr-container">
            <img src="https://blogimgoss.oss-cn-nanjing.aliyuncs.com/img/0a3b0d7a7d3b8d2e649357468e0b7561.jpg"
              alt="支付宝收款码" class="qr-code">
          </div>
        </div>
      </div>
    </div>



    <div class="section">
      <h2>我们的服务</h2>
      <ul class="service-list">
        <li><i class="el-icon-edit"></i> 文本润色与优化</li>
        <li><i class="el-icon-reading"></i> 提高文章可读性</li>
        <li><i class="el-icon-scissors"></i> 精简冗余内容</li>
        <li><i class="el-icon-collection-tag"></i> 增强专业表达</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
}

h1 {
  color: #409EFF;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
}

h2 {
  color: #1d2025;
  margin: 20px 0 15px;
  font-size: 1.5rem;
  border-left: 4px solid #409EFF;
  padding-left: 15px;
}

.description {
  text-align: center;
  color: #707b91;
  max-width: 700px;
  font-size: 1.2rem;
  margin: 0 auto 40px;
  line-height: 1.6;
}

.section {
  margin-bottom: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.payment-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.payment-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s;
}

.payment-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.payment-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.payment-header i {
  font-size: 1.8rem;
  color: #409EFF;
  margin-right: 10px;
}

.payment-header h3 {
  margin: 0;
  color: #303133;
  font-size: 1.2rem;
}

.qr-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.qr-code {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.friend-links {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.link-card {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  text-decoration: none;
  color: inherit;
}

.link-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.link-icon {
  font-size: 2.5rem;
  color: #409EFF;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background-color: #ecf5ff;
  border-radius: 50%;
}

.link-info h3 {
  margin: 0 0 5px;
  color: #303133;
  font-size: 1.1rem;
}

.link-info p {
  margin: 0;
  color: #606266;
  font-size: 0.9rem;
}

.service-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.service-list li {
  background-color: #fff;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
}

.service-list li i {
  color: #409EFF;
  margin-right: 10px;
  font-size: 1.2rem;
}

@media (max-width: 768px) {

  .friend-links,
  .payment-options {
    grid-template-columns: 1fr;
  }

  .qr-code {
    width: 120px;
    height: 120px;
  }
}
</style>
