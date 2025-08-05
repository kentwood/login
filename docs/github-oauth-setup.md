# GitHub OAuth2 登录配置指南

本项目已集成GitHub OAuth2登录功能，按照以下步骤完成配置：

## 1. GitHub应用配置

### 1.1 创建GitHub OAuth App
1. 登录GitHub，进入 Settings > Developer settings > OAuth Apps
2. 点击 "New OAuth App"
3. 填写应用信息：
   - **Application name**: 你的应用名称
   - **Homepage URL**: `http://localhost:5173` (开发环境) 或你的生产域名
   - **Authorization callback URL**: `http://localhost:5173/auth/github/callback` (开发环境)
4. 创建完成后获取 `Client ID` 和 `Client Secret`

### 1.2 配置环境变量
由于GitHub OAuth配置现在由后端管理，前端不再需要配置GitHub相关的环境变量。

## 2. 后端API接口

### 2.1 GitHub OAuth2登录接口
```javascript
GET /oauth2/github/login
```

**响应格式：**
```json
{
  "redirectUrl": "https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=...&state=..."
}
```

### 2.2 GitHub OAuth2回调接口
```javascript
POST /oauth2/github/callback
```

**请求参数：**
```json
{
  "code": "GitHub授权码",
  "state": "CSRF防护状态码（可选，由后端验证）"
}
```

**响应格式：**
```json
{
  "token": "JWT访问令牌",
  "refreshToken": "刷新令牌（可选）",
  "user": {
    "id": "用户ID",
    "username": "用户名",
    "name": "显示名称",
    "email": "邮箱",
    "avatar": "头像URL",
    "githubId": "GitHub用户ID"
  }
}
```

### 2.3 后端实现要点

1. **GitHub OAuth2登录接口** (`GET /oauth2/github/login`)：
   - 生成随机state参数（CSRF防护）
   - 构建GitHub授权URL
   - 返回重定向URL给前端

2. **GitHub OAuth2回调接口** (`POST /oauth2/github/callback`)：
   - 验证state参数（如果使用）
   - 使用授权码交换访问令牌
   - 获取GitHub用户信息
   - 创建或绑定本地用户账户
   - 生成JWT令牌返回

### 2.4 示例后端实现（Node.js/Express）

```javascript
// GitHub OAuth2登录接口
app.get('/oauth2/github/login', async (req, res) => {
  try {
    // 生成随机state参数
    const state = crypto.randomBytes(16).toString('hex');
    
    // 可以将state保存到缓存中，用于后续验证
    // await saveStateToCache(state);
    
    // 构建GitHub授权URL
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', process.env.GITHUB_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'user:email');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('allow_signup', 'true');
    
    res.json({
      redirectUrl: authUrl.toString()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GitHub OAuth2回调处理
app.post('/oauth2/github/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    // 1. 验证state参数（可选）
    // const isValidState = await validateStateFromCache(state);
    // if (!isValidState) {
    //   throw new Error('Invalid state parameter');
    // }
    
    // 2. 交换访问令牌
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description);
    }
    
    // 3. 获取GitHub用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'User-Agent': 'your-app-name'
      }
    });
    
    const githubUser = await userResponse.json();
    
    // 4. 创建或查找本地用户
    let user = await findUserByGithubId(githubUser.id);
    if (!user) {
      user = await createUserFromGithub(githubUser);
    }
    
    // 5. 生成JWT令牌
    const jwtToken = generateJWT(user);
    
    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        githubId: user.githubId
      }
    });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## 3. 前端使用方式

### 3.1 发起GitHub登录
用户点击"GitHub 登录"按钮后，系统会：
1. 调用后端 `/oauth2/github/login` 接口获取GitHub授权URL
2. 后端生成state参数并构建完整的GitHub授权URL
3. 前端接收重定向URL并跳转到GitHub授权页面

### 3.2 处理授权回调
当用户在GitHub完成授权后：
1. GitHub重定向到 `/auth/github/callback` 页面
2. 前端获取授权码和state参数
3. 调用后端 `/oauth2/github/callback` 接口完成登录
4. 后端验证授权码并返回JWT令牌
5. 前端保存JWT令牌并跳转到成功页面

### 3.3 错误处理
系统会处理以下错误情况：
- 用户拒绝授权
- 网络连接问题
- 后端验证失败
- 授权码无效或过期

## 4. 安全考虑

### 4.1 CSRF防护
- 后端生成随机state参数
- 可选择在后端缓存中保存state用于验证
- 所有OAuth流程在后端完成，提高安全性

### 4.2 环境变量安全
- GitHub Client ID和Client Secret均在后端配置
- 前端不再需要配置GitHub相关敏感信息
- 生产环境使用安全的随机字符串

### 4.3 令牌安全
- JWT令牌存储在localStorage
- 支持刷新令牌机制
- 实现令牌过期自动刷新

## 5. 测试步骤

1. **配置后端GitHub应用**：确保后端环境变量正确配置
2. **启动后端服务**：确保 `/oauth2/github/login` 和 `/oauth2/github/callback` 接口可用
3. **启动前端开发服务器**：`npm run dev`
4. **访问登录页面**：点击"GitHub 登录"按钮
5. **完成GitHub授权**：在GitHub页面授权应用
6. **验证登录结果**：检查是否成功跳转到成功页面

## 6. 常见问题

### Q1: "后端未返回GitHub授权URL"错误
**解决方案**：检查后端 `/oauth2/github/login` 接口是否正常运行，确保返回包含 `redirectUrl` 字段

### Q2: 回调页面显示"授权被拒绝"
**解决方案**：用户在GitHub页面点击了"Cancel"，重新发起授权即可

### Q3: "缺少授权码参数"错误
**解决方案**：GitHub回调URL可能配置错误，检查GitHub应用的回调URL设置

### Q4: 网络连接失败
**解决方案**：检查网络连接和后端服务状态

## 7. 相关文件

- **前端登录页面**：`src/views/Login.vue`
- **OAuth回调页面**：`src/views/OAuthCallback.vue`
- **API接口文件**：`src/api/auth.js`
- **路由配置**：`src/router/index.js`
- **环境变量**：`.env.development`、`.env.production`

## 8. GitHub API文档

- [GitHub OAuth2文档](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [GitHub API文档](https://docs.github.com/en/rest/users/users#get-the-authenticated-user)
