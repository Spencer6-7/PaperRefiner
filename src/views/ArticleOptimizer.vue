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
          <template v-if="!hasCustomApiConfig">
            <el-progress :percentage="(usageCount / usageLimit) * 100" :format="format"
              :status="usageLimitReached ? 'exception' : null"></el-progress>
            <span class="usage-text">今日剩余使用次数: {{ usageLimit - usageCount }}/{{ usageLimit }}</span>
          </template>
          <template v-else>
            <div class="vip-badge">
              <i class="el-icon-star-on"></i> 高级用户
            </div>
            <span class="usage-text custom-api-text">使用自定义API，不受次数限制</span>
          </template>
        </div>

        <div class="action-buttons">
          <el-button type="primary" @click="optimizeText" :loading="loading" :disabled="usageLimitReached">
            {{ loading ? `优化中${loadingDots}` : (usageLimitReached ? '今日次数已用完' : '一键优化') }}
          </el-button>
          <el-tooltip content="自定义API设置" placement="top">
            <el-button type="info" icon="el-icon-setting" circle @click="openApiSettings"></el-button>
          </el-tooltip>
        </div>
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

    <!-- API设置对话框 -->
    <el-dialog title="自定义API设置" :visible.sync="apiSettingsVisible" width="500px" :close-on-click-modal="false"
      class="api-settings-dialog">
      <el-form :model="apiSettings" label-width="120px" label-position="left">
        <el-form-item label="API地址">
          <el-input v-model="apiSettings.apiUrl" placeholder="如: https://api.example.com"></el-input>
          <div class="form-tip">默认: https://voapi.killerbest.com</div>
        </el-form-item>

        <el-form-item label="API密钥">
          <el-input v-model="apiSettings.apiKey" placeholder="请输入API密钥" show-password></el-input>
          <div class="form-tip">通常以sk-开头</div>
        </el-form-item>

        <el-form-item label="模型名称">
          <el-input v-model="apiSettings.modelName" placeholder="请输入模型名称"></el-input>
          <div class="form-tip">默认: gemini-2.5-pro-exp-03-25</div>
        </el-form-item>

        <div class="api-vip-tip">
          <el-alert type="success" show-icon title="使用自定义API可享受无限制使用权限"
            description="当您同时设置了自定义API地址和API密钥，将不受每日使用次数的限制。" :closable="false">
          </el-alert>
        </div>

        <div class="api-settings-footer">
          <el-button @click="resetApiSettings" size="small">恢复默认</el-button>
          <div class="spacer"></div>
          <el-button @click="apiSettingsVisible = false">取消</el-button>
          <el-button type="primary" @click="saveApiSettings">保存</el-button>
        </div>
      </el-form>

      <div class="api-settings-info">
        <el-alert title="什么是自定义API设置?" type="info" description="如果你有自己的API服务或密钥，可以在这里配置。如果不确定这些设置，请保持默认值。"
          :closable="false" show-icon>
        </el-alert>
      </div>
    </el-dialog>

    <div class="contact-info">
      <p>没时间自行优化的可以联系我帮忙优化，邮箱：<a href="mailto:slow@linux.do">slow@linux.do</a></p>
    </div>
  </div>
</template>

<script>
import { optimizeArticle, getApiConfig, saveApiConfig, resetApiConfig } from '../services/apiService';
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
      usageLimitReached: false,
      // API设置相关
      apiSettingsVisible: false,
      apiSettings: {
        apiUrl: '',
        apiKey: '',
        modelName: ''
      }
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
    },
    // 检查用户是否使用自定义API (同时提供了API地址和API密钥)
    hasCustomApiConfig() {
      const customApiUrl = localStorage.getItem('customApiUrl');
      const customApiKey = localStorage.getItem('customApiKey');
      return !!(customApiUrl && customApiKey);
    }
  },
  created() {
    this.checkUsageLimit();
    this.loadApiSettings();
  },
  methods: {
    ...mapMutations(['setArticleOptimizerInput', 'setArticleOptimizerOutput', 'clearArticleOptimizer']),
    // API设置相关方法
    loadApiSettings() {
      const config = getApiConfig();
      // 首次打开对话框时不显示默认值，保护系统安全
      this.apiSettings.apiUrl = localStorage.getItem('customApiUrl') || '';
      this.apiSettings.apiKey = localStorage.getItem('customApiKey') || '';
      this.apiSettings.modelName = localStorage.getItem('customModelName') || '';
    },
    openApiSettings() {
      this.loadApiSettings(); // 确保显示最新设置
      this.apiSettingsVisible = true;
    },
    saveApiSettings() {
      // 检查是否从自定义API切换到默认API
      const wasCustom = this.hasCustomApiConfig;

      saveApiConfig(
        this.apiSettings.apiUrl,
        this.apiSettings.apiKey,
        this.apiSettings.modelName
      );

      // 保存后重新检查使用限制，如果用户填写了自定义API信息，需要刷新显示
      this.checkUsageLimit();

      // 检查现在的状态，判断是否需要显示额外提示
      if (wasCustom && !this.hasCustomApiConfig) {
        // 用户清空了API地址或API密钥，从自定义API切换回默认API
        this.$message({
          message: 'API设置已保存，您已切换回默认API，将受到每日使用次数限制',
          type: 'warning',
          duration: 3000
        });
      } else if (!wasCustom && this.hasCustomApiConfig) {
        // 用户新增了自定义API配置
        this.$message({
          message: 'API设置已保存，您现在是高级用户，不受使用次数限制',
          type: 'success',
          duration: 3000
        });
      } else {
        // 保持相同状态，只是更新了信息
        this.$message.success('API设置已保存');
      }

      this.apiSettingsVisible = false;
    },
    resetApiSettings() {
      // 检查是否从自定义API切换到默认API
      const wasCustom = this.hasCustomApiConfig;

      resetApiConfig();
      this.loadApiSettings();

      // 重新检查使用限制，在切换回默认API时恢复使用次数限制
      this.checkUsageLimit();

      if (wasCustom) {
        this.$message({
          message: '已恢复默认API设置，将受到每日使用次数限制',
          type: 'warning',
          duration: 3000
        });
      } else {
        this.$message.info('已恢复默认API设置');
      }
    },
    checkUsageLimit() {
      // 如果用户同时提供了自定义API地址和密钥，则不受使用次数限制
      if (this.hasCustomApiConfig) {
        this.usageCount = 0;
        this.usageLimitReached = false;
        return;
      }

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
      // 如果用户使用自定义API，显示不受限制的信息
      if (this.hasCustomApiConfig) {
        return '不受限制';
      }
      return this.usageLimitReached ? '已用完' : `${this.usageCount}/${this.usageLimit}`;
    },
    incrementUsageCount() {
      // 如果用户使用自定义API，不增加使用次数
      if (this.hasCustomApiConfig) {
        return;
      }

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

      // 检查使用次数限制 (仅对非自定义API用户)
      if (!this.hasCustomApiConfig && this.usageLimitReached) {
        this.$message.error(`每天最多只能使用${this.usageLimit}次优化功能，请明天再来`);
        return;
      }

      this.loading = true;
      this.setArticleOptimizerOutput({ output: '', highlighted: '', error: '' });
      this.startLoadingAnimation();

      try {
        // 缓存输入文本，避免重复访问
        const inputText = this.inputText;

        const result = await optimizeArticle(
          inputText,
          null, // 提示词已在API服务中定义
          this.optimizationType
        );

        // 在生产环境中减少不必要的日志输出
        if (process.env.NODE_ENV !== 'production') {
          console.log('优化结果完整响应:', result);
        }

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
          if (process.env.NODE_ENV !== 'production') {
            console.log('API返回了特定的服务不可用消息');
          }
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

          // 仅在开发环境中输出日志
          if (process.env.NODE_ENV !== 'production') {
            console.log('处理后的输出:', {
              length: processedOutput.length,
              preview: processedOutput.substring(0, 100) + (processedOutput.length > 100 ? '...' : '')
            });
          }

          const highlightedResult = this.generateHighlightedDiff(inputText, processedOutput);
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
      if (!text || text.length < 10) return true;

      const lines = text.split('\n').map(line => line.trim()).filter(line => line);

      // 仅在开发环境中输出调试信息
      if (process.env.NODE_ENV !== 'production') {
        console.log('检查是否为空结果:', { lines: lines.slice(0, 3), totalLines: lines.length });
      }

      // 使用更高效的正则表达式检测常见的空结果模式
      const emptyPattern = /优化结果|修改后[\s:：]*$|无法获取优化结果|无法|获取失败/;
      if ((lines.length <= 3) && emptyPattern.test(text)) {
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
      // 输出原始文本进行调试（仅在开发环境）
      if (process.env.NODE_ENV !== 'production') {
        console.log('解析的原始文本:', {
          textLength: text.length,
          textPreview: text.substring(0, 100) + (text.length > 100 ? '...' : '')
        });
      }

      // 使用组合条件检查特定错误模式
      if (text.includes('内容优化服务暂时不可用') || text.includes('请稍后重试')) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('检测到特定的服务不可用消息');
        }
        this.$message.error('内容优化服务响应异常，请等待几分钟后再尝试');
        return '';
      }

      // 合并检查常见的错误情况
      if (text.includes('无法获取优化结果') ||
        text.trim() === '修改后:' ||
        (text.includes('原文') && !text.includes('修改后'))) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('响应中缺少必要的内容部分');
        }
        this.$message.error('优化未完成，请检查网络连接并稍后再试');
        return '';
      }

      // 使用更精确的正则表达式提取修改后内容
      const modifiedPattern = /修改后[:：]\s*([\s\S]*)/;
      const match = text.match(modifiedPattern);

      // 日志记录匹配结果（仅在开发环境）
      if (process.env.NODE_ENV !== 'production') {
        console.log('修改后匹配结果:', {
          hasMatch: !!match,
          matchGroups: match ? match.length : 0,
          matchPreview: match ? match[1]?.substr(0, 50) + (match[1]?.length > 50 ? '...' : '') : 'No match'
        });
      }

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
      if (text && text.length > this.inputText.length / 2 && !text.includes('无法') && !text.includes('error')) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('没有找到"修改后"标记，但返回了看起来合理的内容');
        }
        return this.cleanMarkdown(text);
      }

      // 如果没有找到标准格式，则进行基本清理并返回
      return this.cleanMarkdown(text);
    },
    cleanMarkdown(text) {
      // 使用单个正则表达式简化markdown清理过程
      return text
        .replace(/(\*\*|`)(.*?)\1/g, '$2') // 同时处理粗体和内联代码
        .replace(/\*(.*?)\*/g, '$1')       // 处理斜体
        .replace(/```.*?```/gs, '')        // 删除代码块
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
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

.custom-api-text {
  color: #67c23a;
  font-weight: bold;
}

.vip-badge {
  background-color: #67c23a;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
  display: inline-flex;
  align-items: center;
  max-width: fit-content;
}

.vip-badge i {
  margin-right: 5px;
  font-size: 16px;
}

.api-vip-tip {
  margin: 15px 0;
}

.action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
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
  font-weight: 600;
}

h3 {
  margin-bottom: 15px;
  color: #606266;
}

.result-container {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  position: relative;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.05);
}

.fixed-textarea>>>.el-textarea__inner {
  resize: none !important;
  overflow-y: scroll !important;
  min-height: 250px;
  max-height: 250px;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.fixed-textarea>>>.el-textarea__inner:hover,
.fixed-textarea>>>.el-textarea__inner:focus {
  border-color: #409EFF;
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
  border-radius: 8px;
  padding: 15px;
  background-color: #fff;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.6;
  font-size: 14px;
  transition: box-shadow 0.3s;
}

.text-content:hover {
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.1);
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

.text-content::-webkit-scrollbar-thumb:hover {
  background-color: #909399;
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

/* API设置对话框样式 */
.api-settings-dialog {
  border-radius: 8px;
}

.api-settings-dialog>>>.el-dialog__header {
  padding: 20px 20px 10px;
  border-bottom: 1px solid #ebeef5;
}

.api-settings-dialog>>>.el-dialog__body {
  padding: 20px;
}

.api-settings-dialog>>>.el-form-item__label {
  font-weight: 500;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.api-settings-footer {
  display: flex;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 10px;
}

.spacer {
  flex: 1;
}

.api-settings-info {
  margin-top: 25px;
}
</style>