<template>
  <div class="register-container">
    <div class="register-wrapper">
      <div class="register-box">
        <div class="register-header">
          <h2>用户注册</h2>
          <p>创建新账户</p>
        </div>
        
        <form @submit.prevent="handleRegister" class="register-form">
          <!-- 用户名输入 -->
          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              placeholder="请输入用户名"
              :disabled="loading"
              required
              minlength="3"
              maxlength="20"
            />
            <div v-if="errors.username" class="error-message">{{ errors.username }}</div>
          </div>

          <!-- 密码输入 -->
          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              :disabled="loading"
              required
              minlength="6"
            />
            <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
          </div>

          <!-- 确认密码输入 -->
          <div class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              :disabled="loading"
              required
              minlength="6"
            />
            <div v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</div>
          </div>

          <!-- 邮箱输入 -->
          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="请输入邮箱地址"
              :disabled="loading"
              required
            />
            <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
          </div>

          <!-- 验证码输入 -->
          <div class="form-group">
            <label for="verificationCode">邮箱验证码</label>
            <div class="verification-group">
              <input
                id="verificationCode"
                v-model="formData.verificationCode"
                type="text"
                placeholder="请输入验证码"
                :disabled="loading"
                required
                maxlength="6"
              />
              <button
                type="button"
                @click="sendVerificationCode"
                :disabled="loading || sendCodeLoading || countdown > 0 || !isEmailValid"
                :class="['send-code-btn', { loading: sendCodeLoading }]"
              >
                {{ countdown > 0 ? `${countdown}s后重发` : sendCodeLoading ? '发送中...' : '获取验证码' }}
              </button>
            </div>
            <div v-if="errors.verificationCode" class="error-message">{{ errors.verificationCode }}</div>
          </div>

          <!-- 错误信息显示 -->
          <div v-if="errorMessage" class="error-message global-error">
            {{ errorMessage }}
          </div>

          <!-- 成功信息显示 -->
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <!-- 注册按钮 -->
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="register-btn"
          >
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>

        <!-- 返回登录 -->
        <div class="login-link">
          已有账户？
          <router-link to="/login" class="link">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { registerAPI, sendVerificationCodeAPI } from '../api/auth'

const router = useRouter()

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  verificationCode: ''
})

// 错误信息
const errors = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  verificationCode: ''
})

// 状态管理
const loading = ref(false)
const sendCodeLoading = ref(false)
const countdown = ref(0)
const errorMessage = ref('')
const successMessage = ref('')

// 倒计时定时器
let countdownTimer = null

// 邮箱格式验证
const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(formData.email)
})

// 表单验证
const isFormValid = computed(() => {
  return formData.username.length >= 3 &&
         formData.password.length >= 6 &&
         formData.password === formData.confirmPassword &&
         isEmailValid.value &&
         formData.verificationCode.length === 6
})

// 清除错误信息
const clearErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  errorMessage.value = ''
  successMessage.value = ''
}

// 验证单个字段
const validateField = (field) => {
  clearErrors()
  
  switch (field) {
    case 'username':
      if (formData.username.length < 3) {
        errors.username = '用户名至少需要3个字符'
      } else if (formData.username.length > 20) {
        errors.username = '用户名不能超过20个字符'
      } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(formData.username)) {
        errors.username = '用户名只能包含字母、数字、下划线和中文'
      }
      break
    case 'password':
      if (formData.password.length < 6) {
        errors.password = '密码至少需要6个字符'
      } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = '密码必须包含字母和数字'
      }
      break
    case 'confirmPassword':
      if (formData.confirmPassword !== formData.password) {
        errors.confirmPassword = '两次输入的密码不一致'
      }
      break
    case 'email':
      if (!isEmailValid.value) {
        errors.email = '请输入有效的邮箱地址'
      }
      break
    case 'verificationCode':
      if (formData.verificationCode.length !== 6) {
        errors.verificationCode = '验证码必须是6位数字'
      } else if (!/^\d{6}$/.test(formData.verificationCode)) {
        errors.verificationCode = '验证码只能包含数字'
      }
      break
  }
}

// 发送验证码
const sendVerificationCode = async () => {
  if (!isEmailValid.value) {
    errors.email = '请输入有效的邮箱地址'
    return
  }

  try {
    sendCodeLoading.value = true
    clearErrors()
    
    await sendVerificationCodeAPI(formData.email)
    
    successMessage.value = '验证码发送成功，请查收邮件'
    
    // 开始倒计时
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
    
  } catch (error) {
    errorMessage.value = error.message || '发送验证码失败'
  } finally {
    sendCodeLoading.value = false
  }
}

// 处理注册
const handleRegister = async () => {
  clearErrors()
  
  // 验证所有字段
  validateField('username')
  validateField('password')
  validateField('confirmPassword')
  validateField('email')
  validateField('verificationCode')
  
  // 检查是否有错误
  const hasErrors = Object.values(errors).some(error => error !== '')
  if (hasErrors) {
    return
  }
  
  try {
    loading.value = true
    
    const result = await registerAPI(
      formData.username,
      formData.password,
      formData.email,
      formData.verificationCode
    )
    
    if (result.success) {
      successMessage.value = '注册成功！即将跳转到登录页面...'
      
      // 2秒后跳转到登录页面，并携带用户名
      setTimeout(() => {
        router.push({
          path: '/login',
          query: { username: formData.username }
        })
      }, 2000)
    }
    
  } catch (error) {
    errorMessage.value = error.message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}

// 清理定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  min-width: 100vw;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 2vw, 2rem);
  box-sizing: border-box;
  position: fixed;
  top: 0;
  left: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.register-wrapper {
  width: 100%;
  max-width: clamp(320px, 90vw, 500px);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 2rem);
  padding: clamp(1rem, 2vh, 2rem) 0;
  box-sizing: border-box;
}

.register-box {
  background: white;
  border-radius: clamp(12px, 2vw, 20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  padding: clamp(1.5rem, 3vw, 2.5rem);
  width: 100%;
  box-sizing: border-box;
  animation: slideInUp 0.6s ease-out;
  margin: auto;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.register-header {
  text-align: center;
  margin-bottom: clamp(1rem, 2.5vw, 1.5rem);
}

.register-header h2 {
  color: #333;
  font-size: clamp(1.25rem, 3.5vw, 1.75rem);
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.register-header p {
  color: #666;
  font-size: clamp(0.8rem, 2.2vw, 0.9rem);
  margin: 0;
  line-height: 1.3;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: clamp(0.8rem, 2vw, 1.2rem);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  color: #333;
  font-weight: 500;
  font-size: clamp(0.8rem, 2.2vw, 0.9rem);
  text-align: left;
}

.form-group input {
  padding: clamp(0.6rem, 1.8vw, 0.8rem);
  border: 2px solid #e1e5e9;
  border-radius: clamp(6px, 1.5vw, 10px);
  font-size: clamp(0.8rem, 2.2vw, 0.9rem);
  transition: all 0.3s ease;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.verification-group {
  display: flex;
  gap: clamp(0.5rem, 2vw, 1rem);
  align-items: stretch;
}

.verification-group input {
  flex: 1;
}

.send-code-btn {
  padding: clamp(0.75rem, 2vw, 1rem) clamp(1rem, 2.5vw, 1.5rem);
  background: #667eea;
  color: white;
  border: none;
  border-radius: clamp(6px, 1.5vw, 10px);
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: clamp(80px, 20vw, 120px);
}

.send-code-btn:hover:not(:disabled) {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.send-code-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  color: #e74c3c;
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  margin-top: 0.25rem;
}

.global-error {
  background: #ffeaea;
  border: 1px solid #e74c3c;
  border-radius: clamp(4px, 1vw, 6px);
  padding: clamp(0.75rem, 2vw, 1rem);
  text-align: center;
}

.success-message {
  color: #27ae60;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  background: #eafaf1;
  border: 1px solid #27ae60;
  border-radius: clamp(4px, 1vw, 6px);
  padding: clamp(0.75rem, 2vw, 1rem);
  text-align: center;
}

.register-btn {
  padding: clamp(0.875rem, 2.5vw, 1.25rem);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: clamp(6px, 1.5vw, 10px);
  font-size: clamp(1rem, 2.5vw, 1.125rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: clamp(0.5rem, 1.5vw, 1rem);
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.register-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-link {
  text-align: center;
  margin-top: clamp(1.5rem, 3vw, 2rem);
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  color: #666;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.link:hover {
  color: #5a6fd8;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-container {
    padding: clamp(0.5rem, 2vw, 1rem);
  }
  
  .register-wrapper {
    align-items: flex-start;
    padding-top: clamp(1rem, 4vh, 2rem);
    min-height: calc(100vh - 1rem);
  }
  
  .register-box {
    padding: clamp(1rem, 4vw, 1.5rem);
  }
  
  .verification-group {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .send-code-btn {
    min-width: auto;
    width: 100%;
  }
}

/* 确保内容区域不被截断 */
@media (max-height: 800px) {
  .register-container {
    align-items: flex-start;
  }
  
  .register-wrapper {
    align-items: flex-start;
    padding-top: clamp(0.5rem, 2vh, 1rem);
    padding-bottom: clamp(0.5rem, 2vh, 1rem);
    min-height: calc(100vh - 1rem);
  }
  
  .register-box {
    padding: clamp(1rem, 2.5vw, 2rem);
  }
  
  .register-header {
    margin-bottom: clamp(0.8rem, 2vw, 1.2rem);
  }
  
  .register-form {
    gap: clamp(0.6rem, 1.5vw, 1rem);
  }
}

/* 高分辨率屏幕优化 */
@media (min-width: 1200px) {
  .register-box {
    max-width: 500px;
  }
}

/* 表单焦点状态优化 */
.form-group input:focus + .error-message {
  display: none;
}

/* 加载状态动画 */
.register-btn:disabled,
.send-code-btn.loading {
  position: relative;
}

.register-btn:disabled::after,
.send-code-btn.loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  margin: auto;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: button-loading-spinner 1s ease infinite;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

@keyframes button-loading-spinner {
  from {
    transform: rotate(0turn);
  }
  to {
    transform: rotate(1turn);
  }
}
</style>
