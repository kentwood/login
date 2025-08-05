<template>
  <div class="oauth-callback-container">
    <div class="callback-card">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <h2 class="loading-title">处理GitHub登录中...</h2>
        <p class="loading-message">正在验证您的GitHub账户，请稍候</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="errorMessage" class="error-state">
        <div class="error-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#e74c3c"/>
            <path d="M15 9l-6 6m0-6l6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 class="error-title">登录失败</h2>
        <p class="error-message">{{ errorMessage }}</p>
        <div class="error-actions">
          <button @click="retryLogin" class="retry-button">重试登录</button>
          <button @click="goToLogin" class="back-button">返回登录页</button>
        </div>
      </div>
      
      <!-- 成功状态 -->
      <div v-else-if="success" class="success-state">
        <div class="success-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
            <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="success-title">GitHub登录成功！</h2>
        <p class="success-message">正在跳转到主页...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { handleGithubCallback } from '../api/auth.js'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const errorMessage = ref('')
const success = ref(false)

onMounted(async () => {
  try {
    // 获取URL参数
    const { code, state, error, error_description } = route.query
    
    // 检查是否有错误参数
    if (error) {
      throw new Error(error_description || '授权被拒绝')
    }
    
    // 检查必需参数
    if (!code) {
      throw new Error('缺少授权码参数')
    }
    
    // 处理GitHub回调
    const response = await handleGithubCallback(code, state)
    
    // 保存token
    localStorage.setItem('userToken', response.token)
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken)
    }
    
    // 显示成功状态
    success.value = true
    loading.value = false
    
    // 延迟跳转
    setTimeout(() => {
      router.push('/success')
    }, 2000)
    
  } catch (error) {
    console.error('GitHub OAuth2回调处理失败:', error)
    errorMessage.value = error.message || 'GitHub登录失败'
    loading.value = false
  }
})

// 重试登录
const retryLogin = () => {
  // 返回登录页并重新发起GitHub登录
  router.push('/login')
}

// 返回登录页
const goToLogin = () => {
  // 清除可能的错误状态
  localStorage.removeItem('userToken')
  localStorage.removeItem('refreshToken')
  router.push('/login')
}
</script>

<style scoped>
.oauth-callback-container {
  min-height: 100vh;
  min-width: 100vw;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #24292e 0%, #1b1f23 100%);
  padding: clamp(1rem, 4vw, 2rem);
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  background-attachment: fixed;
  background-size: cover;
  background-repeat: no-repeat;
}

.oauth-callback-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 70%, rgba(36, 41, 46, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(27, 31, 35, 0.2) 0%, transparent 50%);
  pointer-events: none;
}

.callback-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: clamp(2.5rem, 6vw, 5rem) clamp(2rem, 5vw, 4rem);
  border-radius: clamp(1.25rem, 3vw, 2rem);
  box-shadow: 
    0 clamp(1.5rem, 4vw, 3rem) clamp(3rem, 7vw, 6rem) rgba(0, 0, 0, 0.15),
    0 clamp(1rem, 3vw, 2rem) clamp(1.5rem, 3vw, 2.5rem) rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  width: 100%;
  max-width: min(92vw, 35rem);
  text-align: center;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 加载状态样式 */
.loading-state {
  animation: fadeInUp 0.6s ease-out;
}

.loading-spinner {
  width: clamp(3rem, 6vw, 4rem);
  height: clamp(3rem, 6vw, 4rem);
  border: 4px solid #f3f3f3;
  border-top: 4px solid #24292e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto clamp(1.5rem, 3vw, 2rem);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-title {
  color: #333;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 700;
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
  letter-spacing: -0.02em;
}

.loading-message {
  color: #666;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  line-height: 1.5;
}

/* 错误状态样式 */
.error-state {
  animation: fadeInUp 0.6s ease-out;
}

.error-icon {
  margin-bottom: clamp(1.5rem, 3vw, 2rem);
  display: flex;
  justify-content: center;
  animation: bounceIn 0.8s ease-out;
}

.error-icon svg {
  width: clamp(4rem, 8vw, 5rem);
  height: clamp(4rem, 8vw, 5rem);
  filter: drop-shadow(0 clamp(2px, 0.5vw, 4px) clamp(4px, 1vw, 8px) rgba(231, 76, 60, 0.3));
}

.error-title {
  color: #e74c3c;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 700;
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
  letter-spacing: -0.02em;
}

.error-message {
  color: #666;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  line-height: 1.5;
  margin-bottom: clamp(2rem, 4vw, 3rem);
  background: #ffeaea;
  border: 1px solid #e74c3c;
  border-radius: clamp(0.5rem, 1vw, 0.75rem);
  padding: clamp(1rem, 2vw, 1.5rem);
}

.error-actions {
  display: flex;
  gap: clamp(1rem, 3vw, 1.5rem);
  justify-content: center;
  flex-wrap: wrap;
}

.retry-button, .back-button {
  padding: clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem);
  border: none;
  border-radius: clamp(0.5rem, 1.5vw, 0.75rem);
  font-size: clamp(0.95rem, 2.2vw, 1.1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: clamp(7rem, 18vw, 9rem);
}

.retry-button {
  background: linear-gradient(135deg, #24292e 0%, #1b1f23 100%);
  color: white;
}

.retry-button:hover {
  background: linear-gradient(135deg, #2f363d 0%, #24292e 100%);
  transform: translateY(clamp(-1px, -0.2vw, -2px));
  box-shadow: 0 clamp(4px, 1.5vw, 8px) clamp(12px, 3vw, 20px) rgba(36, 41, 46, 0.3);
}

.back-button {
  background: white;
  color: #666;
  border: 2px solid #ddd;
}

.back-button:hover {
  background: #f8f9fa;
  border-color: #24292e;
  color: #24292e;
  transform: translateY(clamp(-1px, -0.2vw, -2px));
  box-shadow: 0 clamp(4px, 1.5vw, 8px) clamp(12px, 3vw, 20px) rgba(0, 0, 0, 0.1);
}

/* 成功状态样式 */
.success-state {
  animation: fadeInUp 0.6s ease-out;
}

.success-icon {
  margin-bottom: clamp(1.5rem, 3vw, 2rem);
  display: flex;
  justify-content: center;
  animation: bounceIn 0.8s ease-out;
}

.success-icon svg {
  width: clamp(4rem, 8vw, 5rem);
  height: clamp(4rem, 8vw, 5rem);
  filter: drop-shadow(0 clamp(2px, 0.5vw, 4px) clamp(4px, 1vw, 8px) rgba(76, 175, 80, 0.3));
}

.success-title {
  color: #4CAF50;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 700;
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
  letter-spacing: -0.02em;
}

.success-message {
  color: #666;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  line-height: 1.5;
}

/* 动画定义 */
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

/* 响应式设计 */
@media (max-width: 480px) {
  .callback-card {
    padding: clamp(2rem, 5vw, 2.5rem) clamp(1.5rem, 4vw, 2rem);
    max-width: 95vw;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .retry-button, .back-button {
    width: 100%;
    max-width: clamp(12rem, 80vw, 15rem);
  }
}

@media (min-width: 768px) {
  .callback-card {
    max-width: min(70vw, 32rem);
  }
}

@media (min-width: 1024px) {
  .oauth-callback-container {
    background: 
      linear-gradient(135deg, #24292e 0%, #1b1f23 100%),
      url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100%" height="100%" fill="url(%23dots)"/></svg>');
    background-attachment: fixed;
    background-size: cover, 20px 20px;
    background-repeat: no-repeat, repeat;
  }
  
  .callback-card {
    max-width: min(60vw, 35rem);
  }
}
</style>
