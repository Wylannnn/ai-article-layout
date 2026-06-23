# PROJECT_STATE.md
更新日期: 2026-06-23
版本/里程碑: v0.4.0 + 截断修复补丁

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
- **v0.4.0 卡片图套装（杂志风格模板方案，零 AI 成本）**：
  - 新增顶部「卡片图套装」按钮 + `CardDeckPanel` 弹层组件，独立于原有的"长图导出"流程
  - 平台尺寸预设 `CARD_PLATFORMS`（types/index.ts）：小红书 3:4 / 1:1、抖音图文 3:4 / 9:16、朋友圈 1:1，支持自定义宽高
  - 配色方案：6 套按文章分类自动匹配（`CARD_THEMES_BY_CATEGORY`）+ 2 套额外配色（极简灰/暖阳），默认"自动匹配"跟随文章类型
  - 3 种内容排版模板：文章风（引用卡片+段落排版）、步骤风（编号步骤列表）、数据信息图风（统计数据网格）
  - 自动分页 `lib/card-paginate.ts`：按段落/步骤拆分卡片，超长段落按字符数兜底拆分（不用 DOM 测量，降低复杂度）
  - 卡片模板 `lib/card-templates.ts`：封面卡（彩色色带+标题+摘要）、正文卡（章节标记+内容）、结尾引导卡（账号+引导语+图标按钮）
  - 编排逻辑 `lib/card-deck.ts`：解析章节 → 按模板拆分 → 组装完整卡片序列（封面 + N 张正文 + 结尾）
  - 渲染管线 `lib/render-png.ts`：复用「导出长图」验证过的 iframe + html-to-image 方案，逐张转 PNG
  - 单张下载 + `jszip` 打包「下载全部」
  - 卡片设置（平台/配色/账号名/结尾文案）持久化到 localStorage（`lib/storage.ts` 新增 `saveCardSettings`/`loadCardSettings`）
  - 新增 11 个单元测试覆盖分页与配色的纯函数部分（`card-paginate.test.ts`）

- **截断检测与报错防护**：
  - 第一步 JSON 分析 maxTokens 从 1500 提升到 3000，增加结构完整性校验（title/sections 不为空），截断时直接报错终止，不浪费第二步调用
  - 第二步 HTML 生成 maxTokens 从 16000 提升到 32000，增加 `</html>`/`</body>` 闭合性校验，截断时 throw Error 绝不渲染残缺内容到 iframe — 核心红线
  - 第一步若原始响应未以 `}` 结尾但 JSON.parse 兜底成功，显示非阻塞黄色提示警告
  - 所有截断错误显示可操作建议（换简单风格/缩短文章/重试），复用已有的 error 状态变量

## 进行中

- 卡片图套装正在真实浏览器手动测试验收（测试用例见 TC-01 ~ TC-11），通过后创建 GitHub Release

## 待办

- 移动端布局未专门验证过
- 移动端布局未专门验证过
- 考虑增加"历史记录"功能，保存最近的排版结果在 localStorage（低优先级）
- 考虑打包成 Electron/Tauri 桌面应用，让用户连 Python 都不需要装（观望用户反馈后再判断）
- 考虑增加 AI 单卡生成高级模式（方向 A），按需启用，额外消耗 API 费用

## 已知问题

- 模型偶尔无视 prompt 中"禁止代码块包裹"的约束，在输出中夹带 ` ```html ` / ` ``` ` 标记 — 已通过 `cleanHTMLOutput` 兜底清理
- AI 生成的 HTML 质量高度依赖模型能力和 prompt 遵循度，同一篇文章多次生成结果差异大（是正常的，已通过提示横幅告知用户）
- 部分模型（如 DeepSeek）的 SSE 流式输出格式与 OpenAI 协议存在微小差异，极端情况下可能丢失最后几个 token
- 卡片图分页采用字符数估算 + 按段落/步骤拆分，非真实 DOM 测量，极端情况下（如全英文长尾单词）可能导致内容溢出。如出现需要后续优化为 DOM 测量或自适应字符数

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

10. **2026-06-22：卡片图方向选择 — 杂志风格模板系统（方向 B）而非 AI 单卡生成（方向 A）** — 项目已开源，绝大多数用户对免费敏感。AI 排版已消耗 API 费用，卡片图如果继续走 AI 生成会增加使用阻力。方向 B 采用预设 CSS 模板：封面（彩色色带+标题+摘要）、正文（文章/步骤/数据三种布局）、结尾（引导关注），零 AI 成本、像素级可控、瞬间出图。等用户量起来后可考虑将方向 A 作为高级功能按需开启。

11. **2026-06-22：内容分页策略 — 字符数估算 + 段落/步骤拆分，不用 DOM 测量** — 相比旧版"DOM 渲染测量 scrollHeight 决定每张卡片放多少内容"，新版更简单：按段落拆分，每卡控制在 600 字符以内，超长段落按字符数均分。缺点是对全英文/极端词长的排版不如 DOM 测量精确，优点是实现简单、不需要离屏渲染预测量、不依赖浏览器环境。

12. **2026-06-22：封面/结尾卡用模板，内容卡分三种布局** — 所有卡片均使用预设 CSS 模板（零 AI 调用）。封面和结尾固定布局，保证一致性和品牌感；正文卡片根据内容自动检测排版风格（含编号 → steps、含数据 → data、纯叙述 → article），用户也可手动切换。

13. **2026-06-23：截断检测与报错防护** — maxTokens 从 1500/16000 提升到 3000/32000，降低触发截断的概率。第一步增加 JSON 结构完整性校验（title/sections），结构残缺时直接报错终止，不浪费第二步 token 开销。第二步增加 `</html>`/`</body>` 闭合性校验，这是最核心的红线——任何情况下残缺 HTML 绝不进入 iframe 预览。第一步检测到原始响应被截断（未以 `}` 结尾）但解析成功时，显示非阻塞黄色提示。
