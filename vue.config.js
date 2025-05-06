const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  // 配置网页标题
  pages: {
    index: {
      entry: 'src/main.js',
      title: '文章内容优化平台', // 这里修改为你想要的网页标题
    }
  }
})
