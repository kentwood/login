<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">用户登录</h1>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">用户名:</label>
          <input
            id="username"
            v-model="loginForm.username"
            type="text"
            placeholder="请输入用户名"
            required
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码:</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            required
            :disabled="loading"
          />
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        
        <div class="divider">
          <span>或者</span>
        </div>
        
        <button type="button" class="github-login-button" @click="handleGithubLogin" :disabled="loading">
          <svg class="github-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub 登录
        </button>
        
        <div class="register-link">
          还没有账户？
          <router-link to="/register" class="register-btn">立即注册</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { loginAPI, initiateGithubOAuth } from '../api/auth.js'

const router = useRouter()
const route = useRoute()

// 响应式数据
const loginForm = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

// 页面加载时检查是否有用户名参数
onMounted(() => {
  if (route.query.username) {
    loginForm.value.username = route.query.username
  }
})

// 处理登录
const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    errorMessage.value = '请输入用户名和密码'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    const response = await loginAPI(loginForm.value.username, loginForm.value.password)
    
    // 只保存JWT token到localStorage
    localStorage.setItem('userToken', response.token)
    
    // 跳转到成功页面
    router.push('/success')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

// 处理GitHub登录
const handleGithubLogin = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    
    // 发起GitHub OAuth2授权
    await initiateGithubOAuth()
  } catch (error) {
    console.error('GitHub登录错误:', error)
    
    // 特殊处理CORS错误
    if (error.message.includes('CORS') || 
        error.message.includes('cross-origin') || 
        error.message.includes('strict-origin-when-cross-origin')) {
      errorMessage.value = '网络请求被阻止，请检查服务器配置或稍后重试'
    } else if (error.message.includes('网络连接失败')) {
      errorMessage.value = '无法连接到服务器，请检查网络连接'
    } else {
      errorMessage.value = error.message || 'GitHub登录失败'
    }
    
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  min-width: 100vw;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
  pointer-events: none;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem);
  border-radius: clamp(1rem, 2vw, 1.5rem);
  box-shadow: 
    0 clamp(1rem, 3vw, 2.5rem) clamp(2rem, 5vw, 4rem) rgba(0, 0, 0, 0.1),
    0 clamp(0.5rem, 2vw, 1rem) clamp(0.75rem, 1.5vw, 1.5rem) rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  width: 100%;
  max-width: min(90vw, 32rem);
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.login-card:hover {
  transform: translateY(-0.3rem);
  box-shadow: 
    0 clamp(1.5rem, 4vw, 3rem) clamp(3rem, 6vw, 5rem) rgba(0, 0, 0, 0.15),
    0 clamp(1rem, 3vw, 2rem) clamp(1.25rem, 2.5vw, 2rem) rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.login-title {
  text-align: center;
  margin-bottom: clamp(2rem, 4vw, 3rem);
  color: #333;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  position: relative;
  line-height: 1.2;
}

.login-title::after {
  content: '';
  position: absolute;
  bottom: clamp(-0.5rem, -1vw, -0.75rem);
  left: 50%;
  transform: translateX(-50%);
  width: clamp(3rem, 8vw, 5rem);
  height: clamp(2px, 0.3vw, 4px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 3vw, 2rem);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: clamp(0.5rem, 1.5vw, 1rem);
}

.form-group label {
  font-weight: 600;
  color: #555;
  font-size: clamp(0.85rem, 2vw, 1rem);
  letter-spacing: 0.02em;
  text-align: left;
  align-self: flex-start;
}

.form-group input {
  padding: clamp(0.75rem, 2.5vw, 1.25rem) clamp(1rem, 3vw, 1.5rem);
  border: 2px solid #e1e8ed;
  border-radius: clamp(0.5rem, 1.5vw, 0.75rem);
  font-size: clamp(0.9rem, 2.2vw, 1.1rem);
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  width: 100%;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 
    0 0 0 clamp(2px, 0.5vw, 3px) rgba(102, 126, 234, 0.1),
    0 clamp(2px, 1vw, 6px) clamp(6px, 2vw, 12px) rgba(102, 126, 234, 0.15);
  transform: translateY(clamp(-1px, -0.2vw, -2px));
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.error-message {
  color: #e74c3c;
  font-size: clamp(0.8rem, 2vw, 0.95rem);
  text-align: center;
  padding: clamp(0.75rem, 2vw, 1rem);
  background: linear-gradient(135deg, #fdf0ef 0%, #fce4ec 100%);
  border: 1px solid #f5b7b1;
  border-radius: clamp(0.5rem, 1.5vw, 0.75rem);
  font-weight: 500;
  animation: shake 0.5s ease-in-out;
  margin: clamp(0.5rem, 1vw, 1rem) 0;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(clamp(-3px, -0.5vw, -5px)); }
  75% { transform: translateX(clamp(3px, 0.5vw, 5px)); }
}

.login-button {
  padding: clamp(0.75rem, 2.5vw, 1.25rem) clamp(1.5rem, 4vw, 2.5rem);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: clamp(0.5rem, 1.5vw, 0.75rem);
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: clamp(1rem, 2vw, 1.5rem);
  position: relative;
  overflow: hidden;
  width: 100%;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.login-button:hover:not(:disabled) {
  transform: translateY(clamp(-1px, -0.3vw, -3px));
  box-shadow: 0 clamp(4px, 1.5vw, 8px) clamp(15px, 4vw, 25px) rgba(102, 126, 234, 0.3);
}

.login-button:hover:not(:disabled)::before {
  left: 100%;
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.divider {
  margin: clamp(1.5rem, 3vw, 2rem) 0;
  text-align: center;
  position: relative;
  color: #999;
  font-size: clamp(0.875rem, 2.2vw, 1rem);
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, #ddd, transparent);
  z-index: 1;
}

.divider span {
  background: white;
  padding: 0 clamp(1rem, 2vw, 1.5rem);
  position: relative;
  z-index: 2;
}

.github-login-button {
  padding: clamp(0.75rem, 2.5vw, 1.25rem) clamp(1.5rem, 4vw, 2.5rem);
  background: linear-gradient(135deg, #24292e 0%, #1b1f23 100%);
  color: white;
  border: none;
  border-radius: clamp(0.5rem, 1.5vw, 0.75rem);
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
  position: relative;
  overflow: hidden;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(0.5rem, 1vw, 0.75rem);
}

.github-login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 0.5s;
}

.github-login-button:hover:not(:disabled) {
  transform: translateY(clamp(-1px, -0.3vw, -3px));
  box-shadow: 0 clamp(4px, 1.5vw, 8px) clamp(15px, 4vw, 25px) rgba(36, 41, 46, 0.3);
  background: linear-gradient(135deg, #2f363d 0%, #24292e 100%);
}

.github-login-button:hover:not(:disabled)::before {
  left: 100%;
}

.github-login-button:active:not(:disabled) {
  transform: translateY(0);
}

.github-login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.github-icon {
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.github-login-button:hover:not(:disabled) .github-icon {
  transform: scale(1.1);
}

.register-link {
  text-align: center;
  margin-top: clamp(1.5rem, 3vw, 2rem);
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  color: #666;
}

.register-btn {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
}

.register-btn::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -2px;
  left: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.register-btn:hover {
  color: #5a6fd8;
  transform: translateY(-1px);
}

.register-btn:hover::after {
  width: 100%;
}

/* 流体响应式设计 - 使用容器查询和相对单位 */
@container (min-width: 480px) {
  .login-card {
    max-width: min(85vw, 28rem);
  }
}

@container (min-width: 768px) {
  .login-card {
    max-width: min(75vw, 30rem);
  }
}

@container (min-width: 1024px) {
  .login-card {
    max-width: min(65vw, 32rem);
  }
  
  .login-container {
    background: 
      linear-gradient(135deg, #667eea 0%, #764ba2 100%),
      url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.03)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.03)"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grain)"/></svg>');
  }
}

@container (min-width: 1200px) {
  .login-card {
    max-width: min(55vw, 34rem);
  }
}

/* 传统媒体查询作为后备 */
@media (max-width: 360px) {
  .login-container {
    padding: clamp(0.75rem, 3vw, 1rem);
  }
  
  .login-card {
    padding: clamp(1.5rem, 4vw, 2rem) clamp(1rem, 3vw, 1.5rem);
    max-width: 95vw;
  }
  
  .login-title {
    font-size: clamp(1.25rem, 5vw, 1.5rem);
    margin-bottom: clamp(1.5rem, 4vw, 2rem);
  }
}

@media (min-width: 361px) and (max-width: 767px) {
  .login-card {
    max-width: min(90vw, 26rem);
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .login-card {
    max-width: min(70vw, 28rem);
  }
}

@media (min-width: 1024px) {
  .login-container {
    background: 
      linear-gradient(135deg, #667eea 0%, #764ba2 100%),
      url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.03)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.03)"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grain)"/></svg>');
    background-attachment: fixed;
    background-size: cover, 100px 100px;
    background-repeat: no-repeat, repeat;
  }
  
  .login-card {
    max-width: min(60vw, 30rem);
  }
}

@media (min-width: 1200px) {
  .login-card {
    max-width: min(50vw, 32rem);
  }
}

@media (min-width: 1440px) {
  .login-card {
    max-width: min(40vw, 34rem);
  }
}

@media (min-width: 1920px) {
  .login-card {
    max-width: min(35vw, 36rem);
  }
}

/* 超宽屏优化 */
@media (min-width: 2560px) {
  .login-card {
    max-width: min(30vw, 40rem);
  }
}

/* 高度自适应 */
@media (max-height: 600px) {
  .login-container {
    padding: clamp(0.5rem, 2vh, 1rem);
  }
  
  .login-card {
    padding: clamp(1rem, 3vh, 2rem) clamp(1rem, 3vw, 2rem);
  }
  
  .login-title {
    margin-bottom: clamp(1rem, 3vh, 2rem);
    font-size: clamp(1.25rem, 4vh, 2rem);
  }
  
  .login-form {
    gap: clamp(0.75rem, 2vh, 1.5rem);
  }
}

/* 横屏模式优化 */
@media (orientation: landscape) and (max-height: 500px) {
  .login-container {
    padding: 1rem;
    align-items: flex-start;
    padding-top: 2rem;
    /* 确保横屏时背景也铺满 */
    min-height: 100vh;
    height: 100vh;
    position: fixed;
    background-attachment: fixed;
  }
  
  .login-card {
    padding: 1.5rem 2rem;
    max-width: min(80vw, 28rem);
  }
  
  .login-title {
    font-size: clamp(1.25rem, 3vh, 1.75rem);
    margin-bottom: 1.5rem;
  }
  
  .login-form {
    gap: 1rem;
  }
}
</style>
