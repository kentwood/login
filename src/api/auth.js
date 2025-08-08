// 导入加密库
import CryptoJS from 'crypto-js'

// API配置文件
const API_CONFIG = {
  // 基础URL - 根据环境动态设置
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  
  // 接口端点
  ENDPOINTS: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    USER_INFO: '/auth/user/me',
    REGISTER: '/auth/register',
    SEND_CODE: '/auth/send-verification-code',
    VERIFY_CODE: '/auth/verify-code',
    GITHUB_OAUTH: '/auth/oauth2/github/login',
    GITHUB_CALLBACK: '/auth/oauth2/github/callback'
  },
  
  // 请求超时时间（毫秒）
  TIMEOUT: 10000,
  
  // 默认请求头
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // 密码加密配置
  CRYPTO: {
    // 从环境变量获取盐值
    SALT: import.meta.env.VITE_CRYPTO_SALT,
    // 加密算法
    ALGORITHM: 'SHA256'
  }
}

// 密码加密函数
const encryptPassword = (password) => {
  try {
    // 使用SHA256算法对密码+盐进行加密
    const saltedPassword = password + API_CONFIG.CRYPTO.SALT
    const hashedPassword = CryptoJS.SHA256(saltedPassword).toString(CryptoJS.enc.Hex)
    
    return hashedPassword
  } catch (error) {
    console.error('密码加密失败:', error)
    throw new Error('密码加密失败')
  }
}

// 创建请求拦截器
const createRequest = (url, options = {}) => {
  const fullUrl = API_CONFIG.BASE_URL + url
  
  const defaultOptions = {
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...options.headers
    },
    timeout: API_CONFIG.TIMEOUT,
    ...options
  }
  
  // 添加认证token（如果存在）
  const token = localStorage.getItem('userToken')
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`
  }
  
  return fetch(fullUrl, defaultOptions)
}

// 响应拦截器
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = '请求失败'
    
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch (e) {
      // 如果无法解析JSON，使用默认错误信息
    }
    
    // 根据状态码处理不同错误
    switch (response.status) {
      case 400:
        throw new Error(errorMessage || '请求参数错误')
      case 401:
        // 清除本地token
        localStorage.removeItem('userToken')
        localStorage.removeItem('userInfo')
        throw new Error('登录已过期，请重新登录')
      case 403:
        throw new Error('权限不足')
      case 404:
        throw new Error('请求的资源不存在')
      case 500:
        throw new Error('服务器内部错误')
      case 502:
        throw new Error('网关错误')
      case 503:
        throw new Error('服务暂时不可用')
      default:
        throw new Error(errorMessage)
    }
  }
  
  return response.json()
}

// 登录API
export const loginAPI = async (username, password, captchaToken = null) => {
  try {
    const requestData = {
      username,
      password: encryptPassword(password)
    }
    
    // 如果有验证码token，则添加到请求中
    if (captchaToken) {
      requestData.hcaptcha_token = captchaToken
    }
    
    const response = await createRequest(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(requestData)
    })
    
    const data = await handleResponse(response)
    
    // 标准化返回数据格式
    return {
      success: true,
      message: data.message || '登录成功',
      token: data.token || data.access_token || data.accessToken,
      user: {
        id: data.user?.id || data.userId || data.id,
        username: data.user?.username || data.username || username,
        name: data.user?.name || data.user?.nickname || data.name || data.nickname || '用户',
        email: data.user?.email || data.email,
        avatar: data.user?.avatar || data.avatar
      }
    }
  } catch (error) {
    // 网络错误处理
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接')
    }
    throw error
  }
}

// 获取用户信息API
export const getUserInfoAPI = async () => {
  try {
    const response = await createRequest(API_CONFIG.ENDPOINTS.USER_INFO, {
      method: 'GET'
    })
    
    return await handleResponse(response)
  } catch (error) {
    throw error
  }
}

// 登出API
export const logoutAPI = async () => {
  try {
    const response = await createRequest(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: 'POST'
    })
    
    // 清除本地存储
    localStorage.removeItem('userToken')
    localStorage.removeItem('userInfo')
    
    return await handleResponse(response)
  } catch (error) {
    // 即使API调用失败，也要清除本地存储
    localStorage.removeItem('userToken')
    localStorage.removeItem('userInfo')
    throw error
  }
}

export default API_CONFIG

// 发送邮箱验证码API
export const sendVerificationCodeAPI = async (email) => {
  try {
    const response = await createRequest(API_CONFIG.ENDPOINTS.SEND_CODE, {
      method: 'POST',
      body: JSON.stringify({
        email
      })
    })
    
    const data = await handleResponse(response)
    
    return {
      success: true,
      message: data.message || '验证码发送成功',
      data
    }
  } catch (error) {
    // 网络错误处理
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接')
    }
    throw error
  }
}

// 验证邮箱验证码API
export const verifyCodeAPI = async (email, code) => {
  try {
    const response = await createRequest(API_CONFIG.ENDPOINTS.VERIFY_CODE, {
      method: 'POST',
      body: JSON.stringify({
        email,
        code
      })
    })
    
    const data = await handleResponse(response)
    
    return {
      success: true,
      message: data.message || '验证码验证成功',
      data
    }
  } catch (error) {
    // 网络错误处理
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接')
    }
    throw error
  }
}

// 用户注册API
export const registerAPI = async (username, password, email, verificationCode) => {
  try {
    // 加密密码
    const encryptedPassword = encryptPassword(password)
    
    const response = await createRequest(API_CONFIG.ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({
        username,
        password: encryptedPassword,  // 发送加密后的密码
        email,
        verification_code: verificationCode
      })
    })
    
    const data = await handleResponse(response)
    
    // 标准化返回数据格式
    return {
      success: true,
      message: data.message || '注册成功',
      user: {
        id: data.user?.id || data.userId || data.id,
        username: data.user?.username || data.username || username,
        name: data.user?.name || data.user?.nickname || data.name || data.nickname || username,
        email: data.user?.email || data.email || email,
        avatar: data.user?.avatar || data.avatar
      }
    }
  } catch (error) {
    // 网络错误处理
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接')
    }
    throw error
  }
}

// ==================== OAuth2 相关函数 ====================

// 发起GitHub OAuth2授权
export const initiateGithubOAuth = async () => {
  try {
    // 方法1: 尝试通过API获取重定向URL
    try {
      const response = await createRequest(API_CONFIG.ENDPOINTS.GITHUB_OAUTH, {
        method: 'GET'
      })
      
      const data = await handleResponse(response)
      
      // 从后端响应中获取重定向URL
      const redirectUrl = data.redirectUrl || data.url || data.authUrl
      
      if (redirectUrl) {
        // 验证URL是否为GitHub域名
        const url = new URL(redirectUrl)
        if (url.hostname.includes('github.com')) {
          // 使用setTimeout确保在下一个事件循环中执行重定向
          setTimeout(() => {
            window.location.href = redirectUrl
          }, 0)
          return
        }
      }
    } catch (apiError) {
      console.warn('API方式获取GitHub授权URL失败，尝试直接重定向方式:', apiError.message)
    }
    
    // 方法2: 如果API方式失败，直接导航到后端接口让后端处理重定向
    // 这种方式可以避免CORS问题
    const backendRedirectUrl = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.GITHUB_OAUTH
    window.location.href = backendRedirectUrl
    
  } catch (error) {
    console.error('GitHub OAuth2授权失败:', error)
    
    // 如果是网络错误，可能是后端接口问题
    if (error.message.includes('网络连接失败')) {
      throw new Error('无法连接到授权服务器，请检查网络连接或稍后重试')
    }
    
    throw new Error(error.message || 'GitHub授权失败')
  }
}

// 处理GitHub OAuth2回调
export const handleGithubCallback = async (code, state) => {
  try {
    // 向后端发送授权码
    const response = await createRequest(API_CONFIG.ENDPOINTS.GITHUB_CALLBACK, {
      method: 'POST',
      body: JSON.stringify({
        code,
        state
      })
    })
    
    const data = await handleResponse(response)
    
    // 标准化返回数据格式
    return {
      token: data.token || data.accessToken || data.access_token,
      refreshToken: data.refreshToken || data.refresh_token,
      user: {
        id: data.user?.id || data.userId || data.id,
        username: data.user?.username || data.username || data.login,
        name: data.user?.name || data.user?.nickname || data.name || data.nickname,
        email: data.user?.email || data.email,
        avatar: data.user?.avatar || data.user?.avatar_url || data.avatar || data.avatar_url,
        githubId: data.user?.githubId || data.github_id || data.user?.id
      }
    }
    
  } catch (error) {
    console.error('GitHub OAuth2回调处理失败:', error)
    // 网络错误处理
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接')
    }
    throw error
  }
}

// 导出加密函数供开发调试使用
export { encryptPassword }
