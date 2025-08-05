<template>
  <div class="success-container">
    <div class="success-card">
      <div class="success-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
          <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      
      <h1 class="success-title">登录成功！</h1>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在获取用户信息...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="errorMessage" class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ errorMessage }}</p>
      </div>
      
      <!-- 用户信息 -->
      <div v-else-if="userInfo" class="user-info">
        <p class="welcome-message">欢迎回来，{{ userInfo.name }}！</p>
        <div class="user-details">
          <p><strong>用户名:</strong> {{ userInfo.username }}</p>
          <p><strong>用户ID:</strong> {{ userInfo.id }}</p>
          <p><strong>邮箱:</strong> {{ userInfo.email }}</p>
          <p><strong>登录时间:</strong> {{ loginTime }}</p>
        </div>
      </div>
      
      <!-- 临时调试信息（开发环境） -->
      <div v-if="isDev" class="debug-info">
        <details>
          <summary>🐛 调试信息</summary>
          <div class="debug-content">
            <p><strong>当前URL:</strong> {{ currentUrl }}</p>
            <p><strong>路由参数:</strong> {{ JSON.stringify(route.query) }}</p>
            <p><strong>Token存在:</strong> {{ hasLocalToken }}</p>
            <p><strong>加载状态:</strong> {{ loading }}</p>
            <p><strong>错误信息:</strong> {{ errorMessage || '无' }}</p>
          </div>
        </details>
      </div>
      
      <div class="action-buttons">
        <button @click="goToHome" class="primary-button" :disabled="loading">
          进入主页
        </button>
        <button @click="logout" class="secondary-button" :disabled="loading">
          退出登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { logoutAPI, getUserInfoAPI } from '../api/auth.js'

const router = useRouter()
const route = useRoute()

// 响应式数据
const userInfo = ref(null)
const loginTime = ref('')
const loading = ref(true)
const errorMessage = ref('')

// 调试相关
const isDev = computed(() => import.meta.env.DEV)
const currentUrl = computed(() => window.location.href)
const hasLocalToken = computed(() => {
  try {
    return typeof localStorage !== 'undefined' && !!localStorage.getItem('userToken')
  } catch (error) {
    console.warn('无法访问localStorage:', error)
    return false
  }
})

// 组件挂载时获取用户信息
onMounted(async () => {
  // 强制输出日志，确保代码被执行
  console.log('=== Success页面开始加载 ===')
  console.log('当前时间:', new Date().toISOString())
  console.log('页面URL:', window.location.href)
  console.log('URLSearchParams:', window.location.search)
  
  let token = null
  
  try {
    // 方法1: 从Vue Router获取
    console.log('Vue路由查询参数:', route.query)
    if (route.query && route.query.token) {
      token = route.query.token
      console.log('✅ 从Vue Router获取到token:', token.substring(0, 50) + '...')
    }
    
    // 方法2: 从URLSearchParams获取（备用）
    if (!token) {
      console.log('尝试从URLSearchParams获取token...')
      const urlParams = new URLSearchParams(window.location.search)
      console.log('URLSearchParams entries:', Array.from(urlParams.entries()))
      
      if (urlParams.has('token')) {
        token = urlParams.get('token')
        console.log('✅ 从URLSearchParams获取到token:', token.substring(0, 50) + '...')
      }
    }
    
    // 方法3: 从localStorage获取
    if (!token) {
      console.log('尝试从localStorage获取token...')
      try {
        if (typeof localStorage !== 'undefined') {
          token = localStorage.getItem('userToken')
          if (token) {
            console.log('✅ 从localStorage获取到token:', token.substring(0, 50) + '...')
          } else {
            console.log('❌ localStorage中没有token')
          }
        } else {
          console.log('❌ localStorage不可用')
        }
      } catch (error) {
        console.warn('访问localStorage时出错:', error)
      }
    }
    
    // 如果找到了token，保存并清理URL
    if (token) {
      console.log('保存token到localStorage...')
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('userToken', token)
          console.log('✅ token已保存到localStorage')
        } else {
          console.warn('⚠️ localStorage不可用，无法保存token')
        }
      } catch (error) {
        console.warn('保存token到localStorage时出错:', error)
      }
      
      // 如果token来自URL，清理URL
      if (route.query.token || new URLSearchParams(window.location.search).has('token')) {
        console.log('清理URL中的token参数...')
        const newQuery = { ...route.query }
        delete newQuery.token
        
        console.log('保留的查询参数:', newQuery)
        router.replace({ 
          path: route.path, 
          query: Object.keys(newQuery).length > 0 ? newQuery : undefined 
        })
      }
      
      console.log('开始调用用户信息接口...')
      
      // 调用用户信息接口
      const response = await getUserInfoAPI()
      console.log('✅ 用户信息接口响应:', response)
      
      // 设置用户信息
      userInfo.value = {
        id: response.id,
        username: response.username,
        email: response.email,
        name: response.username
      }
      
      loginTime.value = new Date().toLocaleString('zh-CN')
      console.log('✅ 用户信息设置完成:', userInfo.value)
      
    } else {
      console.log('❌ 未找到token，准备跳转到登录页')
      errorMessage.value = '未找到有效的登录凭证'
      
      // 延迟跳转，让用户看到错误信息
      setTimeout(() => {
        console.log('跳转到登录页...')
        router.push('/login')
      }, 3000) // 延长到3秒
    }
    
  } catch (error) {
    console.error('❌ 处理过程中发生错误:', error)
    console.error('错误详情:', error.message)
    console.error('错误堆栈:', error.stack)
    
    errorMessage.value = `处理失败: ${error.message}`
    
    // 清除无效的token
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('userToken')
        localStorage.removeItem('userInfo')
        console.log('已清除localStorage中的token和用户信息')
      }
    } catch (error) {
      console.warn('清除localStorage时出错:', error)
    }
    
    // 延迟跳转
    setTimeout(() => {
      console.log('因错误跳转到登录页...')
      router.push('/login')
    }, 3000)
  } finally {
    loading.value = false
    console.log('✅ 加载状态更新完成, loading =', loading.value)
    console.log('=== Success页面加载结束 ===')
  }
})

// 进入主页（这里只是演示，实际项目中会跳转到真实的主页）
const goToHome = () => {
  alert('这里可以跳转到应用的主页面')
  // router.push('/dashboard') // 实际项目中的主页路由
}

// 退出登录
const logout = async () => {
  try {
    // 调用登出API
    await logoutAPI()
    
    // 跳转回登录页
    router.push('/login')
  } catch (error) {
    // 即使API调用失败，也要跳转到登录页
    console.error('登出失败:', error)
    
    // 手动清除本地存储（作为后备方案）
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('userToken')
        localStorage.removeItem('userInfo')
        console.log('已清除localStorage中的token和用户信息')
      }
    } catch (error) {
      console.warn('清除localStorage时出错:', error)
    }
    
    // 跳转回登录页
    router.push('/login')
  }
}
</script>

<style scoped>
.success-container {
  min-height: 100vh;
  min-width: 100vw;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  padding: clamp(1rem, 4vw, 2rem);
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  /* 确保背景完全覆盖 */
  background-attachment: fixed;
  background-size: cover;
  background-repeat: no-repeat;
}

.success-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 70%, rgba(17, 153, 142, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(56, 239, 125, 0.2) 0%, transparent 50%);
  pointer-events: none;
}

.success-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: clamp(2.5rem, 6vw, 5rem) clamp(2rem, 5vw, 4rem);
  border-radius: clamp(1.25rem, 3vw, 2rem);
  box-shadow: 
    0 clamp(1.5rem, 4vw, 3rem) clamp(3rem, 7vw, 6rem) rgba(0, 0, 0, 0.1),
    0 clamp(1rem, 3vw, 2rem) clamp(1.5rem, 3vw, 2.5rem) rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  width: 100%;
  max-width: min(92vw, 40rem);
  text-align: center;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.success-card:hover {
  transform: translateY(clamp(-3px, -0.5vw, -5px));
  box-shadow: 
    0 clamp(2rem, 5vw, 4rem) clamp(4rem, 8vw, 7rem) rgba(0, 0, 0, 0.15),
    0 clamp(1.5rem, 4vw, 3rem) clamp(2rem, 4vw, 3rem) rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.success-icon {
  margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
  display: flex;
  justify-content: center;
  animation: bounceIn 0.8s ease-out;
}

.success-icon svg {
  width: clamp(4rem, 8vw, 6.25rem);
  height: clamp(4rem, 8vw, 6.25rem);
  filter: drop-shadow(0 clamp(2px, 0.5vw, 4px) clamp(4px, 1vw, 8px) rgba(76, 175, 80, 0.3));
  transition: transform 0.3s ease;
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-icon:hover svg {
  transform: scale(1.1) rotate(5deg);
}

.success-title {
  color: #333;
  font-size: clamp(1.75rem, 5vw, 3rem);
  font-weight: 800;
  margin-bottom: clamp(2rem, 4vw, 3rem);
  letter-spacing: -0.02em;
  position: relative;
  animation: slideInDown 0.6s ease-out 0.2s both;
  line-height: 1.2;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(clamp(-1.5rem, -3vw, -2rem));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-title::after {
  content: '';
  position: absolute;
  bottom: clamp(-0.5rem, -1vw, -0.75rem);
  left: 50%;
  transform: translateX(-50%);
  width: clamp(4rem, 10vw, 6rem);
  height: clamp(3px, 0.4vw, 5px);
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border-radius: 2px;
}

.user-info {
  margin-bottom: clamp(2rem, 5vw, 3rem);
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

.loading-state {
  margin-bottom: clamp(2rem, 5vw, 3rem);
  animation: fadeInUp 0.6s ease-out 0.4s both;
  text-align: center;
}

.loading-spinner {
  width: clamp(2rem, 4vw, 3rem);
  height: clamp(2rem, 4vw, 3rem);
  border: 3px solid #f3f3f3;
  border-top: 3px solid #11998e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto clamp(1rem, 2vw, 1.5rem);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #666;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  font-weight: 500;
}

.error-state {
  margin-bottom: clamp(2rem, 5vw, 3rem);
  animation: fadeInUp 0.6s ease-out 0.4s both;
  text-align: center;
}

.error-icon {
  font-size: clamp(2rem, 4vw, 3rem);
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
}

.error-message {
  color: #e74c3c;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  font-weight: 500;
  background: #ffeaea;
  border: 1px solid #e74c3c;
  border-radius: clamp(0.5rem, 1vw, 0.75rem);
  padding: clamp(1rem, 2vw, 1.5rem);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(clamp(1.5rem, 3vw, 2rem));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-message {
  font-size: clamp(1.1rem, 3vw, 1.6rem);
  color: #4CAF50;
  font-weight: 700;
  margin-bottom: clamp(1rem, 3vw, 2rem);
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.user-details {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border-radius: clamp(0.75rem, 2vw, 1rem);
  border-left: clamp(3px, 0.5vw, 5px) solid #4CAF50;
  box-shadow: 0 clamp(2px, 0.5vw, 4px) clamp(6px, 1.5vw, 12px) rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.user-details:hover {
  transform: translateY(clamp(-1px, -0.2vw, -2px));
}

.user-details p {
  margin: clamp(0.5rem, 1.5vw, 1rem) 0;
  color: #555;
  font-size: clamp(0.95rem, 2.5vw, 1.2rem);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: clamp(0.5rem, 2vw, 1rem);
  flex-wrap: wrap;
}

.user-details strong {
  color: #333;
  font-weight: 600;
  flex-shrink: 0;
}

.action-buttons {
  display: flex;
  gap: clamp(1rem, 3vw, 2rem);
  justify-content: center;
  flex-wrap: wrap;
  animation: fadeInUp 0.6s ease-out 0.6s both;
}

.primary-button, .secondary-button {
  padding: clamp(0.75rem, 2.5vw, 1.2rem) clamp(1.5rem, 4vw, 3rem);
  border: none;
  border-radius: clamp(1rem, 2vw, 1.5rem);
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: clamp(8rem, 20vw, 10rem);
  position: relative;
  overflow: hidden;
  flex: 1;
  max-width: clamp(12rem, 30vw, 15rem);
}

.primary-button {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.primary-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.primary-button:hover {
  transform: translateY(clamp(-2px, -0.4vw, -3px));
  box-shadow: 0 clamp(6px, 2vw, 10px) clamp(15px, 4vw, 25px) rgba(17, 153, 142, 0.3);
}

.primary-button:hover::before {
  left: 100%;
}

.secondary-button {
  background: white;
  color: #666;
  border: 2px solid #ddd;
}

.secondary-button:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-color: #11998e;
  color: #11998e;
  transform: translateY(clamp(-2px, -0.4vw, -3px));
  box-shadow: 0 clamp(5px, 1.5vw, 8px) clamp(12px, 3vw, 20px) rgba(0, 0, 0, 0.1);
}

/* 调试信息样式 */
.debug-info {
  margin-top: clamp(2rem, 4vw, 3rem);
  text-align: left;
  border: 1px solid #ddd;
  border-radius: clamp(0.5rem, 1vw, 0.75rem);
  overflow: hidden;
}

.debug-info summary {
  background: #f8f9fa;
  padding: clamp(0.75rem, 2vw, 1rem);
  cursor: pointer;
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid #ddd;
}

.debug-info summary:hover {
  background: #e9ecef;
}

.debug-content {
  padding: clamp(1rem, 2.5vw, 1.5rem);
  background: white;
}

.debug-content p {
  margin: clamp(0.5rem, 1vw, 0.75rem) 0;
  font-size: clamp(0.85rem, 2vw, 1rem);
  color: #555;
  word-break: break-all;
}

.debug-content strong {
  color: #333;
  font-weight: 600;
}

/* 流体响应式设计 */
@container (min-width: 480px) {
  .success-card {
    max-width: min(85vw, 32rem);
  }
  
  .action-buttons {
    flex-direction: row;
  }
}

@container (min-width: 768px) {
  .success-card {
    max-width: min(75vw, 36rem);
  }
}

@container (min-width: 1024px) {
  .success-card {
    max-width: min(65vw, 40rem);
  }
  
  .success-container {
    background: 
      linear-gradient(135deg, #11998e 0%, #38ef7d 100%),
      url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100%" height="100%" fill="url(%23dots)"/></svg>');
  }
}

@container (min-width: 1200px) {
  .success-card {
    max-width: min(55vw, 42rem);
  }
}

/* 传统媒体查询作为后备 */
@media (max-width: 360px) {
  .success-container {
    padding: clamp(0.75rem, 3vw, 1rem);
  }
  
  .success-card {
    padding: clamp(2rem, 5vw, 2.5rem) clamp(1rem, 3vw, 1.5rem);
    max-width: 95vw;
  }
  
  .user-details p {
    flex-direction: column;
    align-items: flex-start;
    gap: clamp(0.25rem, 1vw, 0.5rem);
    text-align: left;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
    gap: clamp(0.75rem, 2vw, 1rem);
  }
  
  .primary-button, .secondary-button {
    width: 100%;
    max-width: clamp(15rem, 80vw, 18rem);
  }
}

@media (min-width: 361px) and (max-width: 767px) {
  .success-card {
    max-width: min(90vw, 30rem);
  }
  
  .action-buttons {
    gap: clamp(1rem, 3vw, 1.5rem);
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .success-card {
    max-width: min(70vw, 34rem);
  }
}

@media (min-width: 1024px) {
  .success-container {
    background: 
      linear-gradient(135deg, #11998e 0%, #38ef7d 100%),
      url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100%" height="100%" fill="url(%23dots)"/></svg>');
    background-attachment: fixed;
    background-size: cover, 20px 20px;
    background-repeat: no-repeat, repeat;
  }
  
  .success-card {
    max-width: min(60vw, 36rem);
  }
}

@media (min-width: 1200px) {
  .success-card {
    max-width: min(50vw, 38rem);
  }
}

@media (min-width: 1440px) {
  .success-card {
    max-width: min(45vw, 40rem);
  }
}

@media (min-width: 1920px) {
  .success-card {
    max-width: min(40vw, 42rem);
  }
}

/* 超宽屏优化 */
@media (min-width: 2560px) {
  .success-card {
    max-width: min(35vw, 45rem);
  }
}

/* 高度自适应 */
@media (max-height: 600px) {
  .success-container {
    padding: clamp(0.5rem, 2vh, 1rem);
    align-items: flex-start;
    padding-top: clamp(1rem, 3vh, 2rem);
  }
  
  .success-card {
    padding: clamp(1.5rem, 4vh, 2.5rem) clamp(1.5rem, 3vw, 2rem);
  }
  
  .success-title {
    margin-bottom: clamp(1rem, 3vh, 2rem);
    font-size: clamp(1.5rem, 4vh, 2.25rem);
  }
  
  .user-info {
    margin-bottom: clamp(1.5rem, 4vh, 2.5rem);
  }
  
  .success-icon {
    margin-bottom: clamp(1rem, 3vh, 1.5rem);
  }
  
  .success-icon svg {
    width: clamp(3rem, 6vh, 4rem);
    height: clamp(3rem, 6vh, 4rem);
  }
}

/* 横屏模式优化 */
@media (orientation: landscape) and (max-height: 500px) {
  .success-container {
    padding: 1rem;
    align-items: flex-start;
    padding-top: 1.5rem;
    /* 确保横屏时背景也铺满 */
    min-height: 100vh;
    height: 100vh;
    position: fixed;
    background-attachment: fixed;
  }
  
  .success-card {
    padding: 2rem;
    max-width: min(80vw, 32rem);
  }
  
  .success-title {
    font-size: clamp(1.5rem, 4vh, 2rem);
    margin-bottom: 1.5rem;
  }
  
  .user-info {
    margin-bottom: 2rem;
  }
  
  .success-icon {
    margin-bottom: 1rem;
  }
  
  .success-icon svg {
    width: clamp(3rem, 6vh, 4rem);
    height: clamp(3rem, 6vh, 4rem);
  }
  
  .action-buttons {
    gap: 1rem;
  }
}
</style>
