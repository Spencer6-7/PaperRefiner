<template>
  <div id="app">
    <nav>
      <router-link to="/">首页</router-link> |
      <router-link to="/article-optimizer">内容优化</router-link> |
      <router-link to="/about">文章检测</router-link>
    </nav>
    <router-view />
  </div>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  /* 允许内容滚动，但不显示滚动条 */
  overflow: auto;
}

/* 隐藏滚动条但保留滚动功能 */
body::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari, Opera */
}

body {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* 允许内容自适应，内容少时不会出现滚动，内容多时可以滚动 */
  min-height: 100%;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
}

nav a.router-link-exact-active {
  color: #409EFF;
}

/* 隐藏所有元素的滚动条但保留滚动功能 */
::-webkit-scrollbar {
  display: none;
}

* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.fixed-textarea>>>.el-textarea__inner {
  resize: none !important;
  overflow-y: auto;
  min-height: 150px;
  max-height: 150px;
}
</style>
