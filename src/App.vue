<script setup>
// Vue登录应用主组件
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  height: 100%;
  width: 100%;
  scroll-behavior: smooth;
  /* 基础字体大小使用相对单位 */
  font-size: clamp(14px, 2.5vw, 18px);
  /* 确保html背景覆盖整个视口 */
  overflow-x: hidden;
}

body {
  height: 100%;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
  color: #333;
  overflow-x: hidden;
  /* 使用相对单位 */
  font-size: clamp(0.875rem, 2vw, 1rem);
  /* 确保body没有默认边距 */
  margin: 0;
  padding: 0;
  /* 防止内容溢出 */
  min-height: 100vh;
  min-width: 100vw;
  position: relative;
}

#app {
  min-height: 100vh;
  min-width: 100vw;
  width: 100%;
  height: 100%;
  position: relative;
  overflow-x: hidden;
  /* 使用容器查询支持 */
  container-type: inline-size;
  /* 确保app容器完全覆盖视口 */
  display: flex;
  flex-direction: column;
}

/* 通用按钮样式 */
button {
  font-family: inherit;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  /* 触摸设备优化 */
  touch-action: manipulation;
}

button:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* 通用输入框样式 */
input {
  font-family: inherit;
  outline: none;
  /* 移动端输入优化 */
  font-size: max(1rem, 16px); /* 防止iOS缩放 */
}

input:focus-visible {
  outline: none;
}

/* 通用链接样式 */
a {
  text-decoration: none;
  color: inherit;
}

/* 滚动条美化 - 响应式宽度 */
::-webkit-scrollbar {
  width: clamp(6px, 1vw, 12px);
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: clamp(3px, 0.5vw, 6px);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #667eea 100%);
}

/* 选择文本的样式 */
::selection {
  background: rgba(102, 126, 234, 0.2);
  color: #333;
}

::-moz-selection {
  background: rgba(102, 126, 234, 0.2);
  color: #333;
}

/* 通用动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(clamp(0.75rem, 2vw, 1.25rem));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(clamp(0.75rem, 2vw, 1.25rem));
}

/* 流体排版 - 自适应字体大小 */
h1 {
  font-size: clamp(1.75rem, 5vw, 3rem);
  line-height: 1.2;
}

h2 {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  line-height: 1.3;
}

h3 {
  font-size: clamp(1.25rem, 3.5vw, 2rem);
  line-height: 1.3;
}

p {
  font-size: clamp(0.875rem, 2.5vw, 1.125rem);
  line-height: 1.6;
}

/* 预加载减少闪烁 */
.preload * {
  transition: none !important;
  animation: none !important;
}

/* 容器查询支持的通用类 */
.container {
  width: 100%;
  max-width: min(90vw, 75rem);
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2rem);
}

.container-sm {
  max-width: min(95vw, 40rem);
}

.container-lg {
  max-width: min(85vw, 90rem);
}

/* 通用间距类 - 流体间距 */
.spacing-xs { margin: clamp(0.25rem, 1vw, 0.5rem); }
.spacing-sm { margin: clamp(0.5rem, 2vw, 1rem); }
.spacing-md { margin: clamp(1rem, 3vw, 2rem); }
.spacing-lg { margin: clamp(2rem, 5vw, 4rem); }
.spacing-xl { margin: clamp(3rem, 7vw, 6rem); }

/* 可访问性增强 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .login-card,
  .success-card {
    border: 2px solid #000;
  }
  
  button {
    border: 2px solid #000;
  }
  
  input {
    border: 2px solid #000;
  }
}

/* 打印样式 */
@media print {
  * {
    background: transparent !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  
  html, body {
    height: auto !important;
    overflow: visible !important;
  }
  
  body {
    font-size: 12pt;
    line-height: 1.5;
  }
  
  .login-container,
  .success-container {
    padding: 0;
    background: white !important;
    position: relative !important;
    min-height: auto !important;
    height: auto !important;
  }
  
  .login-card,
  .success-card {
    box-shadow: none !important;
    border: 1px solid #000;
    background: white !important;
    position: relative !important;
  }
}

/* 超小屏幕设备优化 */
@media (max-width: 280px) {
  html {
    font-size: 12px;
  }
  
  body {
    font-size: 0.75rem;
  }
}

/* 超大屏幕设备优化 */
@media (min-width: 3000px) {
  html {
    font-size: 20px;
  }
  
  .container {
    max-width: 120rem;
  }
}
</style>
