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
    </el-card>
    <div class="contact-info">
      <p>没时间自行优化的可以联系我帮忙优化，邮箱：<a href="mailto:slow@linux.do">slow@linux.do</a></p>
    </div>
  </div>
</template>

<script>
import { optimizeArticle } from '../services/apiService';
import jsdiff from 'diff'; // 需要安装: npm install diff
import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'ArticleOptimizer',
  data() {
    return {
      optimizationType: 'readability',
      loading: false,
      loadingDots: '',
      loadingInterval: null,
      usageCount: 0,
      usageLimit: 20,
      usageLimitReached: false
    }
  },
  computed: {
    ...mapGetters(['getArticleOptimizerState']),
    inputText: {
      get() {
        return this.getArticleOptimizerState.inputText;
      },
      set(value) {
        this.setArticleOptimizerInput(value);
      }
    },
    outputText() {
      return this.getArticleOptimizerState.outputText;
    },
    highlightedOutput() {
      return this.getArticleOptimizerState.highlightedOutput;
    },
    errorMessage() {
      return this.getArticleOptimizerState.errorMessage;
    },
    showOutput() {
      return this.outputText && !this.errorMessage;
    }
  },
  created() {
    this.checkUsageLimit();
  },
  methods: {
    ...mapMutations(['setArticleOptimizerInput', 'setArticleOptimizerOutput', 'clearArticleOptimizer']),
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
      this.setArticleOptimizerOutput({ output: '', highlighted: '', error: '' });
      this.startLoadingAnimation();

      try {
        const result = await optimizeArticle(
          this.inputText,
          null, // 提示词已在API服务中定义
          this.optimizationType
        );

        console.log('优化结果完整响应:', result);

        if (result.error) {
          this.$message.error(result.text);
          this.loading = false;
          this.stopLoadingAnimation();
          return;
        } else if (!result.text) {
          this.$message.error('优化服务暂时不可用，请稍后重试');
          this.loading = false;
          this.stopLoadingAnimation();
          return;
        } else if (result.text === '内容优化服务暂不可用，请稍后重试') {
          // 处理特定的错误消息，这是截图中显示的错误
          console.log('API返回了特定的服务不可用消息');
          this.$message.error('AI服务过载，请稍等片刻再试');
          this.loading = false;
          this.stopLoadingAnimation();
          return;
        } else if (this.isEmptyResult(result.text)) {
          // 检测到类似"修改后:"和"无法获取优化结果"的格式
          this.$message.error('内容优化未成功，可能是网络问题或服务繁忙');
          this.loading = false;
          this.stopLoadingAnimation();
          return;
        } else {
          const processedOutput = this.extractModifiedText(result.text);
          // 如果处理后的输出为空，则说明在extractModifiedText中已显示了错误提示
          if (!processedOutput) {
            this.loading = false;
            this.stopLoadingAnimation();
            return;
          }

          // 记录处理后的文本
          console.log('处理后的输出:', {
            length: processedOutput.length,
            preview: processedOutput.substring(0, 100) + (processedOutput.length > 100 ? '...' : '')
          });

          const highlightedResult = this.generateHighlightedDiff(this.inputText, processedOutput);
          this.setArticleOptimizerOutput({
            output: processedOutput,
            highlighted: highlightedResult,
            error: ''
          });
          // 增加使用次数
          this.incrementUsageCount();
        }
      } catch (error) {
        console.error('优化失败:', error);
        this.$message.error('文章优化失败，可能是网络不稳定或服务器繁忙');
        this.loading = false;
        this.stopLoadingAnimation();
        return;
      } finally {
        this.loading = false;
        this.stopLoadingAnimation();
      }
    },
    isEmptyResult(text) {
      // 检测是否为空结果或包含"无法获取优化结果"的特殊情况
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);

      console.log('检查是否为空结果:', { lines: lines.slice(0, 3), totalLines: lines.length });

      // 图片中显示的格式检测
      if (
        (lines.length <= 3) &&
        (text.includes('优化结果') || text.includes('修改后')) &&
        (text.includes('无法获取优化结果') || text.includes('无法') || text.includes('获取失败'))
      ) {
        return true;
      }

      return false;
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
      // 输出原始文本进行调试
      console.log('解析的原始文本:', {
        textLength: text.length,
        textPreview: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      });

      // 检查返回内容是否包含特定的错误信息
      if (text.includes('内容优化服务暂时不可用') || text.includes('请稍后重试')) {
        console.log('检测到特定的服务不可用消息');
        // 如果AI返回了服务不可用的消息，显示更有帮助的错误提示
        this.$message.error('内容优化服务响应异常，请等待几分钟后再尝试');
        return '';
      }

      // 检查返回内容是否为"无法获取优化结果"字样
      if (text.includes('无法获取优化结果') || text.trim() === '修改后:') {
        // 如果包含这个字样，通过toast提示并返回空字符串
        this.$message.error('优化未完成，请检查网络连接并稍后再试');
        return '';
      }

      // 检查是否包含"原文"但缺少"修改后"的情况
      if (text.includes('原文') && !text.includes('修改后')) {
        console.log('响应中包含原文但缺少修改后部分');
        this.$message.error('AI服务未能完成内容优化，请稍后重试');
        return '';
      }

      // 检查AI返回的内容格式
      // 如果AI已经按要求返回了"修改后"格式的内容
      const modifiedPattern = /修改后[:：]([\s\S]*)/;
      const match = text.match(modifiedPattern);

      // 记录匹配结果
      console.log('修改后匹配结果:', {
        hasMatch: !!match,
        matchGroups: match ? match.length : 0,
        matchContent: match ? match[1]?.substr(0, 100) + (match[1]?.length > 100 ? '...' : '') : 'No match'
      });

      if (match && match[1]) {
        const result = match[1].trim();
        // 检查提取后的内容是否为空或过短
        if (!result || result.length < 5) {
          this.$message.error('优化结果异常，请尝试刷新页面或稍后重试');
          return '';
        }
        return result;
      }

      // 尝试另一种常见模式：直接返回优化后的文本而没有"修改后:"标记
      // 如果文本看起来像是合理的优化结果（不太短并且没有诊断性消息）
      if (text && text.length > this.inputText.length / 2 && !text.includes('无法') && !text.includes('error')) {
        console.log('没有找到"修改后"标记，但返回了看起来合理的内容');
        return this.cleanMarkdown(text);
      }

      // 如果没有找到"修改后"标记，则保留完整内容
      // 只做基本的清理，避免丢失内容
      return this.cleanMarkdown(text);
    },
    cleanMarkdown(text) {
      // 只移除明显的markdown标记，保留所有实际内容
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体 **text**
        .replace(/\*(.*?)\*/g, '$1')     // 移除斜体 *text*
        .replace(/```.*?```/gs, '')      // 移除代码块
        .replace(/`(.*?)`/g, '$1')       // 移除内联代码
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
      this.clearArticleOptimizer();
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