# Cloudflare Pages 部署指南

## 方式一：通过 Cloudflare Dashboard（推荐）

### 1. 创建 Cloudflare Pages 项目

1. 访问: https://dash.cloudflare.com
2. 进入 **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
3. 选择 GitHub 上的 `browerscan/awesome-mac` 仓库

### 2. 配置构建设置

```
Build command: npm run build:data && npm run build:web
Build output directory: .next
Root directory: (leave empty)
```

### 3. 环境变量（可选）

```
NODE_ENV = production
NEXT_PUBLIC_GA_MEASUREMENT_ID = G-XXXXXXXXXX
```

### 4. 部署

点击 **Save and Deploy**，Cloudflare 会自动：

- 构建项目
- 部署到全球 CDN
- 分配域名: `https://awesome-mac.pages.dev`

---

## 方式二：使用 Wrangler CLI

### 安装 Wrangler

```bash
npm install -g wrangler
```

### 登录

```bash
wrangler login
```

### 本地构建并部署

```bash
# 构建
npm run build:cloudflare

# 部署
wrangler pages deploy .next --project-name=awesome-mac
```

---

## 项目已创建

- **项目名称**: awesome-mac
- **预览域名**: https://awesome-mac.pages.dev

---

## GitHub Actions (可选)

当前配置因 API token 权限问题暂时无法使用。如需启用：

1. 访问 Cloudflare Dashboard > My Profile > API Tokens
2. 创建新 token，权限包括：
   - Account > Cloudflare Pages > Edit
   - Account > Account Settings > Read
3. 更新 GitHub Secret: `CLOUDFLARE_API_TOKEN`

---

## 故障排除

### 构建失败

```bash
# 本地测试构建
npm run build:web
```

### Token 权限错误

- 确保账号 ID 正确
- 确保 token 有 Cloudflare Pages 编辑权限

### 文件大小超过 25MB

- Cloudflare Pages 单文件限制 25MB
- 检查 .next 目录是否包含缓存文件
