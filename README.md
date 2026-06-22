# AI 文章排版工具

> 输入文章 → AI 分析 → 自动生成精美 HTML 排版页面，支持导出 HTML 和 PNG 长图。

## 特点

- **零门槛** — 下载解压即用，无需安装 Node.js，无需命令行
- **完全免费** — 仅消耗 AI 提供商 API 额度（个人使用极低）
- **安全** — 文章内容直连 AI API，不经过任何第三方服务器
- **无需登录** — 纯本地运行，无数据库

> **⚠️ 重要提醒：切勿直接双击 `out/index.html` 或项目中的任何 HTML 文件！**
> Next.js 的静态导出使用绝对路径引用资源（如 `/_next/static/...`），在 `file://` 协议下所有 JS/CSS 会加载失败，导致页面空白或 404。
> **必须**使用下方的启动脚本（`start.command` / `start.bat`）启动本地服务器后访问 `http://localhost:3000`。

## 快速开始

### Mac 用户

1. 下载 `ai-article-layout.zip` 并解压
2. 双击 `start.command`
3. 浏览器打开 http://localhost:3000

### Windows 用户

1. 下载 `ai-article-layout.zip` 并解压
2. 双击 `start.bat`
3. 浏览器打开 http://localhost:3000

> 启动脚本依赖 Python 3（Mac 已预装，Windows 如未装请先到 [python.org](https://www.python.org/downloads/) 下载）。

## 使用方法

1. 首次使用点击右上角「⚙ 设置」，选择 AI 提供商并填入 API Key（保存在浏览器本地，不会上传）
2. 在左侧文本框粘贴文章内容（支持中英文，最少 50 字）
3. 选择排版风格（或选择「自定义」编写你自己的设计师 Prompt）
4. 点击「开始智能排版」，右侧实时预览
5. 顶部操作栏可导出 HTML、复制源码、导出长图，或生成「卡片图套装」

## 卡片图套装

完成一次智能排版后，点击顶部「卡片图套装」，可以把文章自动转成适合小红书 / 抖音 / 朋友圈滑动浏览的多图卡片：

- **平台尺寸**：小红书 3:4、小红书 1:1、抖音图文 3:4 / 9:16、朋友圈 1:1，或自定义宽高
- **自动分页**：长文章按段落自动拆分成多张卡片，用真实浏览器布局测量保证每张卡片都不会溢出
- **一键套装**：自动生成「封面图 + 正文图 N 张 + 结尾引导图」，封面带标题/摘要/字数阅读时长，结尾带点赞收藏关注引导和账号名
- **配色**：默认跟随当前排版风格自动取色，也可以单独选择 8 种卡片配色
- 生成后可单张下载，也可以「下载全部 (ZIP)」一次拿走整套图

## 支持的 AI 提供商

| 提供商 | 推荐模型 | 免费额度 | 费用参考 |
|--------|----------|----------|----------|
| **Google Gemini** | Gemini 1.5 Flash | 每天免费 | 最推荐新手 |
| **DeepSeek** | DeepSeek V3 | 极便宜 | 每次约 ¥0.01 |
| **Anthropic Claude** | Claude Sonnet 4.6 | 无 | 每次约 ¥0.15 |
| **OpenAI** | GPT-4o mini | 无 | 每次约 ¥0.05 |

### 获取 API Key

- **Google Gemini（推荐，免费）**: https://aistudio.google.com/app/apikey
- **DeepSeek（最便宜）**: https://platform.deepseek.com/api_keys
- **Anthropic**: https://console.anthropic.com/settings/keys
- **OpenAI**: https://platform.openai.com/api-keys

## 预设排版风格

| 类型 | 风格 |
|------|------|
| 科技 | 极简科技风，深色背景，亮色点缀 |
| 财经 | 商业杂志风，海军蓝+金色 |
| 旅行 | 旅行杂志风，温暖橙棕色系 |
| 教程 | Notion 风，步骤清晰，卡片式 |
| 故事 | Medium 风，优雅阅读体验 |
| 新闻 | 报纸风，多栏布局 |
| 自定义 | 自由编写设计师 Prompt，打造个性风格 |

## 开发者

如果你需要修改源码或自己构建：

```bash
npm install
npm run dev        # 开发模式
npm run build      # 构建静态文件到 out/
npm run pack       # 构建 + 打包为 dist/ai-article-layout.zip
npm test           # 运行单元测试
```
