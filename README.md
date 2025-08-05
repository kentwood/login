# Vue 登录应用

这是一个基于 Vue 3 + Vite 构建的简单登录应用，包含用户登录和登录成功页面。

## 功能特性

- 🔐 用户登录功能（用户名/密码验证）
- 🔒 **SHA256+盐值密码加密**（前端加密后传输）
- ✅ 登录成功页面展示
- 🎨 响应式设计，支持移动端
- 🛡️ 路由守卫，防止未授权访问
- 💾 本地存储用户登录状态
- 🌐 完整的API集成（支持真实后端对接）

## 技术栈

- **Vue 3** - 使用 Composition API 和 `<script setup>` 语法
- **Vue Router** - 单页面应用路由管理
- **Vite** - 快速的前端构建工具
- **Crypto-JS** - SHA256密码加密
- **CSS3** - 现代CSS样式和渐变效果

## 项目结构

```
src/
├── api/             # API接口层
│   └── auth.js      # 认证相关API（含密码加密）
├── views/           # 页面组件
│   ├── Login.vue    # 登录页面
│   └── Success.vue  # 登录成功页面
├── router/          # 路由配置
│   └── index.js     # 路由定义和守卫
├── App.vue          # 根组件
└── main.js          # 应用入口
```

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 使用说明

1. **登录功能**：
   - 用户名：`admin`
   - 密码：`123456`
   - 输入正确的用户名和密码即可登录成功

2. **页面功能**：
   - 登录页面：表单验证、加载状态、错误提示
   - 成功页面：用户信息展示、退出登录功能

3. **路由保护**：
   - 未登录用户无法直接访问成功页面
   - 登录状态保存在本地存储中

## API 配置

### 接口地址
- **登录接口**: `POST /auth/v1/login`
- **登出接口**: `POST /auth/v1/logout`
- **用户信息**: `GET /auth/v1/user`

### 登录接口参数
```json
{
  "username": "用户名",
  "password": "密码"
}
```

### 登录接口返回格式
```json
{
  "message": "登录成功",
  "token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "email": "admin@example.com",
    "avatar": "头像URL"
  }
}
```

### 环境配置
项目支持不同环境的API配置：

**开发环境** (`.env.development`):
```
VITE_API_BASE_URL=http://localhost:3000
```

**生产环境** (`.env.production`):
```
VITE_API_BASE_URL=https://your-api-domain.com
```

### 错误处理
- `400`: 请求参数错误
- `401`: 用户名或密码错误
- `403`: 权限不足
- `404`: 请求的资源不存在
- `500`: 服务器内部错误
- `502`: 网关错误
- `503`: 服务暂时不可用

## 安全特性

### 密码加密
- 使用 **SHA256** 算法对密码进行加密
- 固定盐值确保加密一致性
- 前端加密后传输，增强安全性
- 密码明文永不在网络中传输

### 配置说明
- 盐值配置在 `src/api/auth.js` 中的 `API_CONFIG.CRYPTO.SALT`
- 生产环境建议使用环境变量管理盐值
- 支持开发环境模拟验证和生产环境真实API

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 开发指南

本项目使用 Vue 3 的最新特性：
- Composition API
- `<script setup>` 语法糖
- 响应式设计原则

更多关于 Vue 3 的信息，请查看 [Vue 官方文档](https://vuejs.org/)。

## API 集成说明

### 开发环境
- 使用模拟API进行演示和测试
- 密码经过SHA256+盐值加密后验证
- 支持完整的登录流程测试

### 生产环境配置
1. 配置真实的API基础URL在环境变量中
2. 后端需要接收SHA256加密后的密码
3. 实现JWT令牌处理和刷新机制
4. 添加完善的错误处理和状态管理

### 密码加密流程
```javascript
// 前端加密流程
const saltedPassword = password + SALT
const hashedPassword = SHA256(saltedPassword).toString()
// 发送 hashedPassword 到后端
```

### 后端对接要求
- 接收加密后的密码字段
- 使用相同的盐值和算法验证密码
- 返回标准的JSON响应格式
- 支持JWT令牌认证机制
