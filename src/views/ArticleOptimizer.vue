<template>
  <div class="article-optimizer">
    <h1>内容优化工具</h1>
    <el-card class="optimizer-card">
      <div class="input-section">
        <h3>文章输入</h3>
        <el-input type="textarea" :rows="8" placeholder="请在此输入需要优化的文章内容..." v-model="inputText"
          class="fixed-textarea"></el-input>
      </div>

      <div class="action-section">
        <div class="usage-info">
          <el-progress :percentage="(usageCount / usageLimit) * 100" :format="format"
            :status="usageLimitReached ? 'exception' : null"></el-progress>
          <span class="usage-text">今日剩余使用次数: {{ usageLimit - usageCount }}/{{ usageLimit }}</span>
        </div>

        <el-button type="primary" @click="optimizeText" :loading="loading" :disabled="usageLimitReached">
          {{ loading ? `优化中${loadingDots}` : (usageLimitReached ? '今日次数已用完' : '一键优化') }}
        </el-button>
      </div>

      <div class="output-section" v-if="showOutput">
        <h3>优化结果</h3>
        <el-divider></el-divider>
        <div class="result-container">
          <div v-if="errorMessage" class="error-message">
            <p>{{ errorMessage }}</p>
            <el-button type="primary" @click="optimizeText" size="small">重试</el-button>
          </div>
          <div v-else>
            <div class="text-section">
              <div class="text-label">原文:</div>
              <div class="text-content">{{ inputText }}</div>
            </div>

            <el-divider content-position="center">优化结果</el-divider>

            <div class="text-section">
              <div class="text-label">修改后:</div>
              <div class="text-content modified-content" v-html="highlightedOutput"></div>
            </div>

            <div class="output-actions">
              <el-button type="primary" @click="regenerate" :loading="loading" size="small">
                <i class="el-icon-refresh-right"></i> 重新生成
              </el-button>
              <el-button type="success" @click="copyToClipboard" size="small">复制结果</el-button>
              <el-button @click="clearAll" size="small">清空</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    <div class="contact-info">
      <p>没时间自行优化的可以联系我帮忙优化，邮箱：<a href="mailto:slow@linux.do">slow@linux.do</a></p>
    </div>
  </div>
</template>

<script>
import { optimizeArticle } from '../services/apiService';
import jsdiff from 'diff'; // 需要安装: npm install diff

export default {
  name: 'ArticleOptimizer',
  data() {
    return {
      inputText: '',
      outputText: '',
      highlightedOutput: '',
      errorMessage: '',
      optimizationType: 'readability',
      loading: false,
      loadingDots: '',
      loadingInterval: null,
      usageCount: 0,
      usageLimit: 3,
      usageLimitReached: false
    }
  },
  computed: {
    showOutput() {
      return this.outputText || this.errorMessage;
    }
  },
  created() {
    this.checkUsageLimit();
  },
  methods: {
    checkUsageLimit() {
      const today = new Date().toISOString().split('T')[0]; // 获取当前日期，格式为YYYY-MM-DD
      const storedDate = localStorage.getItem('optimizerLastUsageDate');
      const storedCount = localStorage.getItem('optimizerUsageCount');

      if (storedDate === today) {
        // 如果存储的日期是今天，获取使用次数
        this.usageCount = parseInt(storedCount || '0', 10);
        if (this.usageCount >= this.usageLimit) {
          this.usageLimitReached = true;
        }
      } else {
        // 新的一天，重置使用次数
        localStorage.setItem('optimizerLastUsageDate', today);
        localStorage.setItem('optimizerUsageCount', '0');
        this.usageCount = 0;
        this.usageLimitReached = false;
      }
    },
    format(percentage) {
      return this.usageLimitReached ? '已用完' : `${this.usageCount}/${this.usageLimit}`;
    },
    incrementUsageCount() {
      this.usageCount++;
      localStorage.setItem('optimizerUsageCount', this.usageCount.toString());

      if (this.usageCount >= this.usageLimit) {
        this.usageLimitReached = true;
      }
    },
    async optimizeText() {
      if (!this.inputText.trim()) {
        this.$message.warning('请先输入需要优化的文章内容');
        return;
      }

      // 检查使用次数限制
      if (this.usageLimitReached) {
        this.$message.error(`每天最多只能使用${this.usageLimit}次优化功能，请明天再来`);
        return;
      }

      this.loading = true;
      this.errorMessage = '';
      this.startLoadingAnimation();

      try {
        const result = await optimizeArticle(
          this.inputText,
          null, // 提示词已在API服务中定义
          this.optimizationType
        );

        if (result.error) {
          this.errorMessage = result.text;
          this.outputText = '';
          this.highlightedOutput = '';
        } else if (!result.text || result.text === '无法获取优化结果') {
          this.errorMessage = '无法获取优化结果，请点击重试按钮再次尝试';
          this.outputText = '';
          this.highlightedOutput = '';
        } else {
          this.outputText = this.extractModifiedText(result.text);
          this.highlightedOutput = this.generateHighlightedDiff(this.inputText, this.outputText);
          this.errorMessage = '';
          // 增加使用次数
          this.incrementUsageCount();
        }
      } catch (error) {
        console.error('优化失败:', error);
        this.errorMessage = '文章优化失败，请稍后再试';
        this.outputText = '';
        this.highlightedOutput = '';
      } finally {
        this.loading = false;
        this.stopLoadingAnimation();
      }
    },
    async regenerate() {
      if (!this.inputText.trim()) {
        this.$message.warning('无法重新生成，请先输入需要优化的文章内容');
        return;
      }

      this.$message({
        message: '正在重新生成优化结果...',
        type: 'info',
        duration: 2000
      });

      await this.optimizeText();
    },
    extractModifiedText(text) {
      // 尝试提取"修改后:"之后的文本
      const modifiedPattern = /修改后[:：]([\s\S]*)/;
      const match = text.match(modifiedPattern);
      if (match && match[1]) {
        return match[1].trim();
      }

      // 尝试提取任何标记后的文本
      const anyLabelPattern = /^.*[:：]([^:：]*[\n\r]+[\s\S]*)/;
      const labelMatch = text.match(anyLabelPattern);
      if (labelMatch && labelMatch[1]) {
        return labelMatch[1].trim();
      }

      // 移除常见的markdown标记
      return this.cleanMarkdown(text);
    },
    cleanMarkdown(text) {
      // 移除常见的markdown标记
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体 **text**
        .replace(/\*(.*?)\*/g, '$1')     // 移除斜体 *text*
        .replace(/```.*?```/gs, '')      // 移除代码块
        .replace(/`(.*?)`/g, '$1')       // 移除内联代码
        .replace(/^#+\s+/gm, '')         // 移除标题标记 # Heading
        .replace(/^\s*[-*+]\s+/gm, '')   // 移除列表标记
        .replace(/^\s*\d+\.\s+/gm, '')   // 移除有序列表标记
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接，只保留文本
        .replace(/!\[(.*?)\]\(.*?\)/g, '')  // 移除图片
        .replace(/^>\s+/gm, '')          // 移除引用标记
        .trim();
    },
    generateHighlightedDiff(originalText, modifiedText) {
      try {
        // 使用更复杂的差异比较方法
        // 将文本分成段落进行比较
        const originalParagraphs = originalText.split(/\n+/);
        const modifiedParagraphs = modifiedText.split(/\n+/);

        // 构建结果HTML
        let resultHtml = '';

        // 为每个段落创建差异比较
        const maxParagraphs = Math.max(originalParagraphs.length, modifiedParagraphs.length);
        for (let i = 0; i < maxParagraphs; i++) {
          const originalPara = i < originalParagraphs.length ? originalParagraphs[i] : '';
          const modifiedPara = i < modifiedParagraphs.length ? modifiedParagraphs[i] : '';

          if (modifiedPara) {
            // 使用中文分词进行差异比较
            const segments = this.segmentChinese(originalPara, modifiedPara);
            const highlighted = this.highlightChanges(segments.original, segments.modified);
            resultHtml += `<p>${highlighted}</p>`;
          }
        }

        return resultHtml;
      } catch (error) {
        console.error('生成差异高亮出错:', error);
        return modifiedText;
      }
    },
    segmentChinese(original, modified) {
      // 简单的中文分词方法（按句子和短语分割）
      const segmentText = (text) => {
        // 按标点符号分割
        return text.split(/([，。！？；：,.!?;:]|\s+)/g).filter(Boolean);
      };

      return {
        original: segmentText(original),
        modified: segmentText(modified)
      };
    },
    highlightChanges(originalSegments, modifiedSegments) {
      // 对每个修改后的段进行判断，如果在原文中不存在或有变化，则高亮显示
      let highlightedText = '';

      for (const segment of modifiedSegments) {
        if (segment.trim() === '') {
          highlightedText += segment;
          continue;
        }

        // 检查这个段是否在原文中存在
        const exists = originalSegments.some(origSegment =>
          origSegment.includes(segment) || segment.includes(origSegment)
        );

        // 标点符号不高亮
        const isPunctuation = /^[，。！？；：,.!?;:]+$/.test(segment);

        if (!exists && !isPunctuation && segment.length > 1) {
          // 如果段落不存在于原文中且不是标点符号，高亮显示
          highlightedText += `<span class="highlight">${segment}</span>`;
        } else {
          highlightedText += segment;
        }
      }

      return highlightedText;
    },
    copyToClipboard() {
      const textToCopy = this.outputText;
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.$message.success('已复制到剪贴板');
    },
    clearAll() {
      this.inputText = '';
      this.outputText = '';
      this.highlightedOutput = '';
      this.errorMessage = '';
    },
    startLoadingAnimation() {
      this.loadingDots = '';
      this.loadingInterval = setInterval(() => {
        this.loadingDots = this.loadingDots.length >= 3 ? '' : this.loadingDots + '.';
      }, 500);
    },
    stopLoadingAnimation() {
      if (this.loadingInterval) {
        clearInterval(this.loadingInterval);
        this.loadingInterval = null;
      }
    }
  },
  beforeDestroy() {
    this.stopLoadingAnimation();
  }
}
</script>

<style scoped>
.article-optimizer {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.optimizer-card {
  margin-top: 20px;
}

.input-section,
.output-section {
  margin-bottom: 20px;
}

.action-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
}

.usage-info {
  display: flex;
  flex-direction: column;
  width: 200px;
}

.usage-text {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}

.output-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

h1 {
  color: #409EFF;
  text-align: center;
  margin-bottom: 30px;
}

h3 {
  margin-bottom: 15px;
  color: #606266;
}

.result-container {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  position: relative;
}

.error-message {
  color: #F56C6C;
  text-align: center;
  padding: 20px;
}

.fixed-textarea>>>.el-textarea__inner {
  resize: none !important;
  overflow-y: scroll !important;
  min-height: 250px;
  max-height: 250px;
}

.text-section {
  margin-bottom: 20px;
}

.text-label {
  font-weight: bold;
  margin-bottom: 10px;
  color: #409EFF;
}

.text-content {
  white-space: pre-wrap;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  padding: 15px;
  background-color: #fff;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.6;
  font-size: 14px;
}

.text-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background-color: #f5f7fa;
}

.text-content::-webkit-scrollbar-thumb {
  background-color: #c0c4cc;
  border-radius: 4px;
}

:deep(.highlight) {
  background-color: #ffecb3;
  border-radius: 3px;
  padding: 0 2px;
  display: inline;
  box-shadow: 0 0 0 1px rgba(255, 193, 7, 0.3);
}

.modified-content {
  color: #333;
}

.contact-info {
  text-align: center;
  margin-top: 20px;
  padding: 10px;
  color: #606266;
  font-size: 14px;
  border-top: 1px dashed #DCDFE6;
}

.contact-info a {
  color: #409EFF;
  text-decoration: none;
  transition: color 0.3s;
}

.contact-info a:hover {
  color: #66b1ff;
  text-decoration: underline;
}
</style>