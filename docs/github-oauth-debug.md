# GitHub OAuth2 调试指南

## 问题诊断

如果遇到 `strict-origin-when-cross-origin` 错误，请按以下步骤排查：

### 1. 检查后端接口

测试后端GitHub OAuth接口是否正常：

```bash
# 测试获取GitHub授权URL
curl -X GET http://localhost:8080/oauth2/github/login \
  -H "Content-Type: application/json"
```

**期望响应：**
```json
{
  "redirectUrl": "https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=...&state=..."
}
```

### 2. 检查后端CORS配置

确保后端已正确配置CORS头：

```javascript
// Express.js 示例
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
```

### 3. 检查GitHub应用配置

在GitHub OAuth App设置中确认：
- **Authorization callback URL**: `http://localhost:5173/auth/github/callback`
- **Homepage URL**: `http://localhost:5173`

### 4. 调试步骤

1. **打开浏览器开发者工具**
2. **检查Network标签页**
3. **点击GitHub登录按钮**
4. **查看请求详情**

**正常流程：**
```
1. GET /api/oauth2/github/login → 200 OK
2. 页面重定向到 github.com
```

**异常流程：**
```
1. GET /api/oauth2/github/login → CORS错误
或
1. GET /api/oauth2/github/login → 200 OK
2. 重定向到 github.com → CORS错误
```

### 5. 解决方案

#### 方案1: 修复后端CORS配置
```javascript
// 添加GitHub域名到CORS白名单（如果需要）
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://github.com'  // 如果后端需要与GitHub通信
  ]
}));
```

#### 方案2: 检查代理配置
确保vite.config.js中的代理配置正确：

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

#### 方案3: 检查请求头
确保前端请求包含正确的头信息：

```javascript
// 在createRequest函数中
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Origin': 'http://localhost:5173'  // 明确指定来源
}
```

### 6. 常见错误和解决方案

#### 错误1: 后端接口返回CORS错误
```
Access to fetch at 'http://localhost:8080/oauth2/github/login' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**解决方案：** 检查后端CORS配置

#### 错误2: GitHub重定向CORS错误
```
strict-origin-when-cross-origin
```

**解决方案：** 这通常不是真正的错误，GitHub重定向是正常的跨域行为

#### 错误3: 代理配置问题
```
404 Not Found
```

**解决方案：** 检查vite代理配置和后端路由

### 7. 测试命令

```bash
# 启动前端开发服务器
npm run dev

# 在另一个终端测试后端接口
curl -X GET http://localhost:8080/oauth2/github/login

# 检查CORS头
curl -X OPTIONS http://localhost:8080/oauth2/github/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

### 8. 浏览器调试

打开浏览器控制台，运行以下代码测试：

```javascript
// 测试后端接口
fetch('/api/oauth2/github/login')
  .then(response => response.json())
  .then(data => console.log('GitHub OAuth URL:', data))
  .catch(error => console.error('Error:', error));

// 检查当前域名
console.log('Current origin:', window.location.origin);
```

### 9. 应急方案

如果仍然无法解决，可以临时使用后端重定向方案：

```javascript
// 在后端直接返回重定向响应
app.get('/oauth2/github/login', (req, res) => {
  const authUrl = `https://github.com/login/oauth/authorize?...`;
  res.redirect(authUrl);  // 直接重定向，而不是返回JSON
});
```

然后修改前端：
```javascript
// 直接导航到后端接口，让后端处理重定向
window.location.href = '/api/oauth2/github/login';
```
