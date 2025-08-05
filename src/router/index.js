import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Success from '../views/Success.vue'
import Register from '../views/Register.vue'
import OAuthCallback from '../views/OAuthCallback.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '用户登录'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: '用户注册'
    }
  },
  {
    path: '/success',
    name: 'Success',
    component: Success,
    meta: {
      title: '登录成功',
      requiresAuth: true
    }
  },
  {
    path: '/auth/github/callback',
    name: 'GitHubCallback',
    component: OAuthCallback,
    meta: {
      title: 'GitHub登录处理中'
    }
  },
  // 重定向未知路由到登录页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // 检查是否需要登录权限
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('userToken')
    // 检查URL参数中是否有token（用于OAuth回调）
    const urlToken = to.query.token
    
    if (!token && !urlToken) {
      // 没有登录，跳转到登录页
      next('/')
      return
    }
  }
  
  next()
})

export default router
