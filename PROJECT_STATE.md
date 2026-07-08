# PROJECT_STATE.md
更新日期: 2026-06-28
版本/里程碑: v0.4.1 — 内容注入补完：pickStyleHintSnippet 实际实现 + 集成

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

- **内容注入式排版（方案A，从机制上杜绝 AI 篡改原文）**：
  - 新增 `lib/content-blocks.ts`：按章节切分原文为逐字内容块，支持按标题定位（≥4字符防误匹配）+ 均分句子边界兜底，含完整性自检（`checkSplitIntegrity`）
  - 新增 `lib/inject-content.ts`：占位符 `<div class="section-content" data-block-id="block_N">` 宽松正则匹配，HTML 转义防 XSS，三类异常处理（孤立占位符移除/缺失追加到 `</body>` 前/完全降级 `buildFallbackHTML`）
  - `HTML_SYSTEM_PROMPT` 头部新增占位符规则，明确模型只排版不写正文
  - `userPrompt` 不再传原文全文，只传章节清单（标题+block_id），模型物理上拿不到原文
  - `userPrompt` 新增可选风格参考片段（`pickStyleHintSnippet`，最长 300 字），解决模型看不到原文后设计同质化问题
  - 新增 21 个单元测试覆盖切分/注入/容错/防XSS/降级路径，TypeScript 编译 + build 通过
- **耗时打点**：`startLayout()` 关键步骤增加 `console.time/timeEnd`，覆盖分析LLM、内容切分、排版LLM流式、cleanHTMLOutput、injectContentBlocks 各阶段
- **v0.4.1 pickStyleHintSnippet 实际实现**：
  - `content-blocks.ts` 新增 `pickStyleHintSnippet` 函数：从每节取首个有意义的段落原文片段，逐节拼接直到 300 字上限
  - `page.tsx` 集成：排版 userPrompt 末尾追加【风格参考】段落，模型据此感知原文写作语气/节奏
  - 新增 6 个单元测试覆盖字符截断/空块/短段落/跨段落选择等边界

## 进行中

- 卡片图套装正在真实浏览器手动测试验收（测试用例见 TC-01 ~ TC-11），通过后创建 GitHub Release

## 待办

- [ ] **v0.5.0 架构重构**：AI 做信息架构，模板做视觉（详见上方规划）
  - [ ] 设计语义 JSON Schema（`SemanticLayout` 类型定义）
  - [ ] 新建 `lib/template-engine.ts`：接收语义 JSON + 内容块 → 渲染完整 HTML
  - [ ] 开发首个模板「杂志风 editorial」
  - [ ] 升级 AI 分析 prompt：输出每块的 semanticType + emphasis
  - [ ] 前端新增"模板排版 / AI 排版"切换开关
- [ ] 移动端布局未专门验证过
- [ ] 考虑增加"历史记录"功能，保存最近的排版结果在 localStorage（低优先级）
- [ ] 考虑打包成 Electron/Tauri 桌面应用（观望用户反馈后再判断）

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

14. **2026-06-24：内容注入式排版（方案A）** — 从"让模型生成完整HTML"改为"模型只生成排版骨架（含占位符），正文由代码精确注入"，从机制上杜绝 AI 转写导致的原文丢失。模型在流式生成阶段看不到原文全文，只收到章节标题和 block_id 列表。核心新增两个模块：`content-blocks.ts` 按章节切分原文（按标题定位/均分句子边界兜底），`inject-content.ts` 替换占位符（宽松正则容错/HTML转义/三类异常处理/完全降级模板）。同时新增 `pickStyleHintSnippet` 从原文精选一段"风格参考片段"传给模型，弥补模型看不到原文后设计同质化的副作用。

15. **2026-06-24：耗时打点** — 在 `startLayout()` 的分析LLM/内容切分/排版LLM流式/cleanHTMLOutput/injectContentBlocks 各阶段插入 `console.time/timeEnd`。双样本实测对比（Claude Sonnet 4.6）：

| 阶段 | 6000字文章 | 200字文章 | 差异 |
|---|---|---|---|
| 分析LLM | 6.7s | 2.7s | 固定开销~2.5s |
| 排版LLM | ~76s | 45.5s | 与骨架体积正相关 |
| 本地计算 | ≤10ms | ≤5ms | 可忽略 |
| **总耗时** | **83s** | **48s** | 骨架越大越慢 |
| 骨架字符数 | 47,867 | 18,845 | SVG/CSS 占大头 |

结论：排版阶段耗时与**文章长度关系不大**，与模型生成的 HTML 骨架体积（SVG 插画 + CSS 动画 + JS）正相关。即使 200 字短文，模型仍需生成 19k 字符的完整排版骨架。本地计算占比 <0.01%，不构成瓶颈。

---

## 下一版本规划：v0.5.0 — 架构重构：AI 做信息架构，模板做视觉

**更新时间：2026-07-07**

### 核心洞察

经过 v0.4.1 的实践和复盘，发现排版工具的根本问题不在于"AI 不够强"，而在于**职责边界画错了**：

- **AI 擅长**：理解内容结构（这是什么类型的文章、这段是引言还是步骤、哪些是重点信息）
- **AI 不擅长**：视觉审美（配色和谐度、排版节奏、字体层次、留白控制）

v0.4.1 的"内容注入式排版"已经在**内容安全**上画对了边界（AI 不碰原文），但在**视觉设计**上仍然让 AI 负责生成 CSS/SVG/布局。结果是：排版同质化（模型缺乏设计多样性）、不可控（每次结果差异大）、成本高（76s 排版时间 99% 花在生成 CSS/SVG 上）。

### 新架构

```
用户输入 Markdown
      ↓
AI 分析阶段（保留，优化）→ 输出语义 JSON
  - 文章类型（教程/观点/故事/报道/产品介绍）
  - 章节结构（标题层级）
  - 每个内容块的语义类型（引言/callout/步骤/对比/数据/总结/过渡段落）
  - 每个块的视觉权重（强调级别、是否需要突出数据、是否适合配图）
      ↓
模板引擎（新增，替代 AI 排版阶段）
  - 预设 8-10 个由人设计的排版模板（CSS + 布局框架）
  - 每个模板定义：引言样式、步骤样式、callout 样式、卡片样式、强调样式、数据可视化样式
  - 模板接收语义 JSON → 渲染为完整 HTML
      ↓
内容注入（保留 v0.4.1 的逻辑）
  - 原文逐块注入到对应占位符
      ↓
静态 HTML 输出（预览 + 导出）
```

### 与 v0.4.1 的关键区别

| 维度 | v0.4.1（当前） | v0.5.0（规划） |
|------|---------------|---------------|
| AI 分析 | 输出章节结构 + 分类 | 输出章节结构 + **每块的语义类型 + 视觉权重** |
| 排版阶段 | AI 生成 HTML 骨架（含 CSS/SVG） | **模板引擎**：人设计模板，程序填充 |
| 视觉质量 | 依赖模型能力，不可控，同质化 | 人设计模板，像素级可控 |
| AI 耗时 | 分析 6.7s + 排版 76s = 83s | 分析 ~8s + 模板渲染 <10ms ≈ **8s** |
| 设计迭代 | 改 prompt → 期待 AI 变聪明 | 改模板 CSS → 即刻生效 |
| 审美归属 | AI 的审美 | **人的审美** |

### 模板系统设计方向

不追求数量，追求差异化。初期 4-6 个模板即可覆盖主流文章类型：

1. **杂志风（editorial）** — 大标题 + 宽留白 + 首字下沉，适合观点/深度长文
2. **教程风（tutorial）** — 步骤编号 + 代码块 + tips callout，适合教程/指南
3. **极简风（minimal）** — 窄栏 + 大字号 + 无装饰，适合随笔/故事
4. **科技风（tech）** — 等宽字体标题 + 数据卡片 + 暗色代码区，适合技术文章
5. **小红书风（social）** — emoji 标题 + 短段落 + 高密度信息，适合社交媒体分发

每个模板 = 一个函数 `renderTemplate(semanticJSON, contentBlocks) → HTML string`。

### 语义 JSON Schema（草案）

AI 输出的不再是 HTML 骨架，而是这个：

```typescript
interface SemanticLayout {
  articleType: 'opinion' | 'tutorial' | 'story' | 'news' | 'product';
  title: string;
  sections: Section[];
}

interface Section {
  heading?: string;        // 章节标题
  headingLevel: number;     // 1-4
  blocks: Block[];
}

interface Block {
  id: string;              // 对应 content-blocks.ts 的 block_id
  semanticType: 'prose' | 'callout' | 'steps' | 'comparison' | 'data' | 'quote' | 'transition';
  emphasis: 'normal' | 'high' | 'subtle';
  // 仅 semanticType='data' 时有值：
  dataPoints?: { label: string; value: string }[];
  // 仅 semanticType='callout' 时有值：
  calloutLabel?: string;   // "提示" / "警告" / "重点"
}
```

### AI 分析阶段的 Prompt 变化

- **分析阶段（AI）**：从"分析文章结构"升级为"分析文章结构 + 标注每块的语义类型和视觉权重"
- **排版阶段（模板）**：不再调用 AI，由模板引擎在本地渲染
- **风格参考片段**：AI 分析时仍然会参考原文语气，但只用于判断语义类型（如"这段语气强烈→callout"），不用于生成视觉样式

### 迁移策略

1. **先建模板系统**（核心新模块 `lib/template-engine.ts`），与现有 AI 排版流程并行运行
2. **新增切换开关**：用户在"AI 排版"和"模板排版"之间切换
3. **逐步增加模板**：从 2 个模板起步，验证流程后再增加
4. **不删除 AI 排版流程**：作为"自定义风格"模式的备选方案保留

### 排期建议

- **v0.5.0**：模板引擎核心 + 2 个模板（杂志风 + 教程风）+ 前端切换开关
- **v0.5.1**：补充 3-4 个模板 + 语义分析 prompt 优化
- **v0.5.2**：卡片图套装接入模板引擎（复用同一套语义 JSON）

### 关键决策记录

16. **2026-07-07：架构重构方向 — AI 做信息架构，模板做视觉** — 核心认知是"AI 擅长处理信息和逻辑，但不擅长视觉审美"。当前 v0.4.1 虽然通过内容注入解决了 AI 篡改原文的问题，但视觉设计（CSS/SVG/布局）仍然由 AI 生成，导致排版同质化、不可控、且排版阶段耗时 76s 中 99% 花在生成视觉效果上。新架构将排版拆为两个独立阶段：AI 只负责理解内容并输出语义 JSON（文章类型、每块的语义类型和视觉权重），模板引擎（人设计的 CSS）负责将语义 JSON 渲染为好看的 HTML。这不仅提升了视觉质量（审美由人控制），还将排版耗时从 83s 降到 ~8s（排版阶段 AI 调用完全移除）。这个方向与 Ch8 的洞察一致——封面图用 Canva 而不是让 AI 生成，同样的逻辑现在应用到文章排版本身。
