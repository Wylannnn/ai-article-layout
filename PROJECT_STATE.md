# PROJECT_STATE.md
更新日期: 2026-06-18
版本/里程碑: v0.4.0（开发中，未发版）

## 已完成

- 核心排版流程：左侧输入文章 → AI 分析 → AI 流式生成 HTML → 右侧 iframe 预览 → 导出 HTML/复制/导出长图
- 6 种预设排版风格（tech/finance/travel/tutorial/story/news），各含真实品牌参考方向
- 自定义风格模式：用户编写设计师 Prompt，支持重置默认、编辑后提示重新生成
- 多 AI 提供商支持：Anthropic / OpenAI / Gemini / DeepSeek，前端直连
- API Key 存储在 localStorage，首次使用弹出 ProviderSettings 配置面板
- PNG 导出用 `html-to-image`（SVG foreignObject 方案），解决圆角/字体丢失
- exportPNG 注入强制可见 CSS + 隐藏侧边目录/进度条，保证长图完整
- `cleanHTMLOutput()` 剥离 Markdown 代码块标记，兜底清理模型输出污染
- 流式生成过程不更新 iframe 预览，避免 srcDoc 全量重载闪屏，结束后一次性加载
- 风格/Prompt 改动触发黄色提示横幅（`styleDirty`），提醒重新生成
- 工具界面浅色/深色切换（Moon/Sun 按钮），仅影响工具界面，不影响 AI 生成内容
- iframe 沙箱：`sandbox="allow-scripts allow-same-origin"` + `referrerPolicy="no-referrer"`
- 左侧面板 420px 宽，输入框 180px 高
- **画框感布局**：body 浅灰底色 + 内容区白色卡片(780px) + box-shadow，桌面端两侧留白形成画框衬纸效果
- **侧边悬浮目录**：position:fixed 定位在内容卡片右侧灰色留白中，视口≥1180px 显示，窄屏自动隐藏，不与正文重叠
- AI 生成的 HTML 固定浅色模式，不再包含 `@media prefers-color-scheme: dark`
- **分析阶段 JSON 输出保障**：ANALYSIS_SYSTEM 改为英文 + prefill `{` 机制 + `response_format: json_object`（OpenAI/DeepSeek）+ extractJSON 兜底
- **长文章排版修复**：generate-html 的 maxTokens 从 8000 提升到 16000
- `cleanHTMLOutput` / `extractJSON` 提取为独立 lib 模块 `src/lib/html-utils.ts`
- **46 个单元测试**（vitest 4 + jsdom），覆盖 html-utils / storage / templates / types 四大模块
- 部署到 GitHub，版本号 v0.3.0
- **v0.3.1 静态导出与打包分发**：Next.js `output: 'export'`，删除死代码 API 路由，`npm run pack` 构建 zip 包（235KB），附带 Mac `.command` / Windows `.bat` 启动脚本，Python 即开即用。README 重写为零门槛用户视角
- **v0.4.0 卡片图套装（小红书/抖音/朋友圈）**：
  - 新增顶部「卡片图套装」按钮 + `CardDeckPanel` 弹层组件，独立于原有的"长图导出"流程
  - 平台尺寸预设 `CARD_PLATFORMS`（types/index.ts）：小红书 3:4 / 1:1、抖音图文 3:4 / 9:16、朋友圈 1:1，支持自定义宽高
  - 8 套卡片配色 `CARD_THEMES`（lib/card-themes.ts），其中 6 套与现有排版风格色调呼应，"跟随排版风格"为默认选项
  - 自动分页 `lib/card-paginate.ts`：用真实 DOM 渲染测量文字高度（而不是人工估算字符数）来决定每张卡片放多少内容，保证不溢出；超长段落按句末标点二次拆分兜底
  - 卡片模板 `lib/card-templates.ts`：封面卡 / 正文卡 / 结尾引导卡共用同一套外壳 CSS 与字号体系，字号按卡片宽度等比缩放
  - 编排逻辑 `lib/card-deck.ts`：组装完整卡片 HTML 序列（封面 + N 张正文 + 结尾）
  - 渲染管线 `lib/render-png.ts`：复用「导出长图」验证过的 iframe + html-to-image 方案，逐张转 PNG
  - 单张下载 + `jszip` 打包「下载全部」
  - 卡片设置（平台/配色/账号名/结尾文案）持久化到 localStorage（`lib/storage.ts` 新增 `saveCardSettings`/`loadCardSettings`）
  - 新增 12 个单元测试覆盖分页与配色解析的纯函数部分（`card-paginate.test.ts`）

## 进行中

（无）

## 待办

- 移动端布局未专门验证过
- 卡片图套装目前只在本地浏览器构建中验证过 build + 单元测试，尚未在真实浏览器里逐张肉眼检查排版效果，建议发版前用几篇不同长度/语言混排的文章实测一遍
- 考虑增加"历史记录"功能，保存最近的排版结果在 localStorage（低优先级）
- 考虑打包成 Electron/Tauri 桌面应用，让用户连 Python 都不需要装（观望用户反馈后再判断）

## 已知问题

- 模型偶尔无视 prompt 中"禁止代码块包裹"的约束，在输出中夹带 ` ```html ` / ` ``` ` 标记 — 已通过 `cleanHTMLOutput` 兜底清理
- AI 生成的 HTML 质量高度依赖模型能力和 prompt 遵循度，同一篇文章多次生成结果差异大（是正常的，已通过提示横幅告知用户）
- 部分模型（如 DeepSeek）的 SSE 流式输出格式与 OpenAI 协议存在微小差异，极端情况下可能丢失最后几个 token
- 卡片图分页依赖浏览器真实 DOM 测量（`scrollHeight`/`clientHeight`），在 jsdom 等非真实渲染环境中该逻辑不可测（jsdom 永远返回 0），因此 `card-paginate.test.ts` 只覆盖了不依赖 DOM 测量的纯函数部分

## 关键技术决策

1. **2026-06-17：画框感布局** — 内容区 max-width 780px，body 浅灰底色 + 白色卡片 + box-shadow，形成"白色卡纸悬浮在灰色衬纸上"的画框层次感。侧边目录固定定位在灰色留白区域，仅宽屏显示。

2. **2026-06-17：分析阶段 prefill 机制** — 在对话末尾追加 assistant 消息 `{` 强制 AI 从此处续写 JSON。配合 `response_format: json_object`（OpenAI/DeepSeek）和英文 ANALYSIS_SYSTEM Prompt，三层保障解决 DeepSeek 等模型返回对话文本而非 JSON 的问题。

3. **2026-06-17：maxTokens 8000→16000** — 2200 字中文文章约 4400 tokens，加上 CSS、SVG 插画、JS 动画、HTML 结构，8000 tokens 不够导致正文后半截断。16000 可支持约 4000 字中文 + 完整排版元素。

4. **2025-06-17：html2canvas 换成 html-to-image** — html2canvas 对 border-radius/flex-wrap/字体渲染还原不完整；html-to-image 用 SVG foreignObject 包裹 DOM 再转图，还原度高。代价：导出前需构造离屏 iframe。

5. **2025-06-17：exportPNG 注入"强制可见"CSS + 清除 inline 隐藏样式** — AI 页面用 IntersectionObserver 驱动动画，离屏 iframe 无滚动导致元素停留在 opacity:0。注入样式 + inline 清理双重保障。

6. **2025-06-17：流式生成过程中不更新 iframe 预览** — srcDoc 每次 setHTML 都是完整文档重载，无论频率多低都有抖动。生成中用进度条，结束后一次性展示。

7. **2025-06-17：多提供商从前端直连 AI API** — 避免服务端 Key 管理复杂度。API Key 暴露在浏览器，不适合公网部署。

8. **2025-06-17：默认 Prompt 从 imports 拆分为内联常量** — DEFAULT_CUSTOM_PROMPT 在 page.tsx 内联，自定义风格 reset 可直接引用。templates.ts 只保留系统级 prompt。

9. **2026-06-17：静态导出 + zip 打包分发** — Next.js `output: 'export'` 编译为纯静态文件，删除服务端 API 路由。用户解压 zip 后双击启动脚本即可用，无需 git clone / npm install / Node.js，仅需 Python（Mac 预装，Windows 可一键安装）。

10. **2026-06-18：卡片图分页不调用 AI，纯本地计算** — 卡片图需要"绝对不溢出"的硬约束（不像长图可以无限往下滚），而模型偶尔不遵守像素级约束（见已知问题）。改为本地用真实 DOM 测量文字高度做分页，零 API 成本、零延迟、零溢出风险；只有标题/摘要/分类等元信息复用已有的 AI 分析结果（`analysis`），不新增任何 AI 调用。

11. **2026-06-18：用真实 DOM 渲染测量代替人工估算字符数** — 没有用"每行约 X 字 × 每页约 Y 行"的估算公式，而是把候选内容真实渲染进一个隐藏 div 读 `scrollHeight`，和渲染卡片外壳读 `.content-area` 的 `clientHeight` 比较。这样卡片视觉样式（字号/行高/padding）以后无论怎么调整，分页逻辑都自动跟着布局结果走，不需要同步改两套数字。

12. **2026-06-18：封面/结尾卡用模板而不是新增 AI 调用生成** — 考虑过让 AI 单独设计封面/结尾卡片以追求更强的创意感，但权衡后放弃：会引入"AI 生成内容超出固定像素尺寸导致溢出"的风险（这正是卡片图和长图最大的不同点），且会增加 API 成本和等待时间。当前方案用文章已有的 title/summary/category（来自已有的智能排版分析步骤）驱动模板，配色跟随排版风格自动匹配，足够满足"一键生成"的诉求；如果后续用户反馈卡片设计感不够，可以再加一个可选的"AI 精修封面"按钮，按需调用。
