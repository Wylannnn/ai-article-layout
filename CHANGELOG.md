# Changelog

## v0.3.1

### 新增

- Next.js `output: 'export'` 静态导出，生成的 `out/` 目录可脱离 Node.js 直接用 Python HTTP 服务运行
- `npm run pack` 打包脚本，生成 `dist/ai-article-layout.zip`（235KB），用户解压即用
- Mac `.command` / Windows `.bat` 启动脚本，双击即可启动本地服务器

### 变更

- 删除死代码 `src/app/api/analyze/` 和 `src/app/api/generate-html/`（前端直连 AI，不再走服务端路由）
- README 重写为零门槛用户视角：下载解压→双击启动→浏览器打开，移除 git clone 和 `.env.local` 误导

### 修复

- README 新增醒目警告：切勿直接双击 `out/index.html` 打开（Next.js 静态导出资源路径为绝对路径，`file://` 协议下所有 JS/CSS 加载失败导致 404 或空白页）
- 修复 `npm run pack` 打包脚本：`cp -r out dist/ai-article-layout/` 在目标目录不存在时会直接复制为 `dist/ai-article-layout` 而不是创建 `out/` 子目录，导致 `start.command --directory out` 找不到文件，所有请求返回 404
- 修复 `start.command` 和 `start.bat`：自动检测 `out/` 目录是否存在，不存在则直接从当前目录提供 HTTP 服务

## v0.3.0

### 新增

- 生成的文章页面采用"画框感"布局：正文区白色卡片悬浮在浅灰底色之上，两侧自然留白形成画框衬纸效果
- 悬浮目录定位在正文卡片右侧的灰色留白区域，仅当视口≥1180px时显示，窄屏自动隐藏，不与正文重叠
- 分析 Prompt 改为英文，新增 prefill 机制强制 AI 以 `{` 开头续写，大幅降低非 JSON 输出概率
- 新增 46 个单元测试（html-utils / storage / templates / types 四大模块），vitest + jsdom 框架

### 修复

- 修复长文章（2200+ 字）排版不完整的问题：生成 token 上限从 8000 提升到 16000
- 修复 DeepSeek 等模型在分析阶段返回对话文本而非 JSON 导致解析失败的问题
- 修复 JSON 提取逻辑在 prefill 模式下丢失前导 `{` 的边界情况

### 变更

- 文章内容区最大宽度从 720px 升级为 780px，排版更舒展
- 左侧面板宽度从 320px 加宽到 420px，输入体验更好
- AI 生成的文章页面不再要求暗黑模式适配（生成的 HTML 整体更简洁，画框感更统一）
- tech 风格预设固定为纯白背景，不再提供深色选项
- 自定义风格的默认设计师 Prompt 同步更新至 780px 宽度、移除暗黑模式约束
- cleanHTMLOutput / extractJSON 提取为独立 lib 模块

## v0.2.0

### ✨ Features

- 新增自定义排版风格（Custom Style），用户可自由编写设计师 Prompt
- 新增 Gemini 429 限流自动重试（根据响应 retryDelay 等待后重试）
- 新增 iframe 实时流式渲染 HTML，生成过程无闪烁
- 新增灵活 JSON 解析器，容错单引号键值和无引号键名
- 新增 PNG 导出时自动去除 body 外边距，截图不偏移
- 新增生成中占位提示"正在生成排版，请稍候..."

### 🛠 Improvements

- 全面重写 HTML 系统提示词：新增 WCAG 对比度规则（AA/AAA）、完整排版系统规范
- 配色系统升级：每次生成根据文章主题使用独特配色，不再依赖系统 dark/light mode
- 排版设计模板新增 custom 类型，支持任意自定义风格
- 封面与正文背景可独立配色，设计自由度更高

### 🐛 Bug Fixes

- 修复 CustomStyle 接口重复定义导致 TypeScript 编译警告
- 修复 .gitignore 包含异常条目 `{src`（shell glob 错误残留）

## v0.1.0

### ✨ Features

- 新增多 AI 提供商支持（Anthropic / OpenAI / Gemini / DeepSeek），界面自由切换
- 新增流式输出排版，边生成边预览
- 新增 6 种文章排版风格：科技、财经、旅行、教程、故事、新闻
- 新增 Provider 设置面板，浏览器 localStorage 保存 Key
- 新增 HTML 导出、PNG 长图导出、HTML 源码复制
- 新增 AI 文章分析（标题生成、摘要、关键词、分类、章节拆分）

### 🐛 Bug Fixes

- 修复 Gemini 流式返回 JSON 数组导致解析失败的问题
- 修复 Gemini 默认模型仍指向已弃用的 gemini-1.5-flash
- 修复空 API Key 配置时的权限错误提示不明确
- 修复文章不足 50 字时提交无反馈的问题
- 修复 `.env.local` 缺失时启动报错

### 🛠 Improvements

- 统一 SSE 流式处理层，各提供商共用 consumeSSE 解析器
- Provider 配置迁移到前端，API Key 不经过服务器
- 响应式布局适配移动端
- 排版模板抽象化，便于新增类型

### 🚀 Initial Release

项目第一版发布。
