<div align="center">

# AI 文章排版工具

### 让每篇文章都拥有杂志级的阅读体验

[![GitHub Release](https://img.shields.io/github/v/release/Wylannnn/ai-article-layout?style=flat&label=Release)](https://github.com/Wylannnn/ai-article-layout/releases)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-46%20passed-brightgreen?style=flat)](#)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey?style=flat)](#)

**English** · [中文](README.md)

</div>

---

> 粘贴一篇文章 → AI 自动分析 → 生成杂志级 HTML 排版 → 导出为网页或社交媒体卡片图
>
> 一个内容创作者的 AI 排版助手：零安装，免费使用，本地运行，隐私安全。

---

## ✨ 它能做什么

**对内容创作者：**
- 把一篇普通文章变成精致排版的阅读页，适合发博客、Newsletter、知识星球
- 一篇文章自动拆成一套"卡片图"，直接发小红书、抖音图文、朋友圈
- 6 种预设风格 + 自定义设计师 Prompt，你的内容可以拥有自己的视觉语言

**对开发者：**
- 纯前端 + AI 排版引擎，设计模式清晰，代码可读性强
- 46 个单元测试，类型安全，CI 友好
- 内容注入式排版方案（Content Injection Architecture）—— 模型只设计排版骨架，原文由代码精确注入，从机制上杜绝 AI 篡改原文

---

## 🖼️ 效果预览

```
┌─────────────────────────────────────────────┐
│                                             │
│  🌟 卡片图套装 → 小红书 / 抖音 / 朋友圈      │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ 封面卡   │ │ 正文卡 1 │ │ 正文卡 2 │ ...  │
│  │ 标题     │ │ 章节    │ │ 段落    │      │
│  │ 摘要     │ │ 内容    │ │ 内容    │      │
│  │ 色带     │ │ 引用    │ │ 数据    │      │
│  └─────────┘ └─────────┘ └─────────┘      │
│                                             │
│  自动分页 · 多平台尺寸 · 零 AI 成本          │
│                                             │
└─────────────────────────────────────────────┘

  ┌─────────────────────────────────────────┐
  │                                         │
  │  杂志级 HTML 排版 — 6 种预设风格         │
  │                                         │
  │  科技 · 财经 · 旅行 · 教程 · 故事 · 新闻 │
  │                                         │
  │  支持深色模式 / 浅色模式 / 自定义 Prompt  │
  │                                         │
  └─────────────────────────────────────────┘
```

---

## 🚀 快速开始（零门槛，30 秒上手）

### 方式一：下载即用（无需任何开发环境）

1. 前往 [Releases](https://github.com/Wylannnn/ai-article-layout/releases) 下载最新版 `ai-article-layout.zip`
2. 解压后双击 `start.command`（Mac）或 `start.bat`（Windows）
3. 浏览器访问 `http://localhost:3000`
4. 在设置中填入 AI API Key（推荐 DeepSeek 或 Gemini，费用极低）

> 前提条件：仅需 Python 3（Mac 已预装，Windows 可到 [python.org](https://www.python.org/downloads/) 下载）

### 方式二：开发者模式

```bash
git clone https://github.com/Wylannnn/ai-article-layout.git
cd ai-article-layout
npm install
npm run dev
```

---

## 🎯 核心功能

| 功能 | 描述 |
|------|------|
| **AI 智能排版** | 输入文章，AI 自动分析内容结构并生成精美 HTML 排版 |
| **6 种预设风格** | 科技风、财经杂志风、旅行杂志风、Notion 教程风、Medium 故事风、报纸风 |
| **自定义风格** | 自由编写设计师 Prompt，打造你的专属视觉语言 |
| **卡片图套装** | 一篇文章自动拆成封面 + 正文 N 张 + 结尾引导卡，适配小红书/抖音/朋友圈 |
| **多平台导出** | 导出 HTML、复制源码、导出 PNG 长图、卡片图套装 ZIP 打包 |
| **多 AI 提供商** | 支持 Anthropic Claude、OpenAI GPT、Google Gemini、DeepSeek，前端直连 |
| **零服务器** | 纯静态应用，文章直连 AI API，不经过第三方服务器 |
| **零安装** | 下载解压即用，无需 Node.js、无需 npm、无需命令行知识 |

---

## 🏗️ 架构亮点

内容注入式排版（Content Injection）是本项目的核心架构决策：

```
                              ┌──────────────────┐
  ┌──────────┐   分析文章结构   │                  │   生成排版骨架
  │ 原文     │ ──────────────→ │   AI 排版引擎    │ ──────────────→ ┌──────────┐
  │ Markdown │                 │                  │                 │ 骨架 HTML │
  └──────────┘                 │ (看不到原文全文)  │                 │ (含占位符) │
       │                       └──────────────────┘                       │
       │                            ↑                                     │
       │                       章节标题列表                                │
       │                       风格参考片段                                │
       │                                                                 ▼
       └─────────────────────────────────────────────────────────→ ┌──────────────┐
                                                                    │ 内容注入引擎 │
                                                                    │              │
                                                                    │ 占位符替换   │
                                                                    │ HTML 转义    │
                                                                    │ 异常容错     │
                                                                    └──────────────┘
                                                                           │
                                                                           ▼
                                                                    ┌──────────────┐
                                                                    │ 完整 HTML    │
                                                                    │ 排版页面     │
                                                                    └──────────────┘
```

- **AI 模型在设计时看不到你的原文全文**，只收到章节标题列表和一段风格参考片段 —— 从物理上杜绝 AI 篡改原文
- 原文由代码精确注入到排版骨架的占位符中，保留原样
- 配合 HTML 转义、三类异常容错（孤立占位符 / 缺失占位符 / 完全降级），生产级健壮
- [了解更多 →](src/lib/content-blocks.ts)

---

## 🧪 代码质量

- 46 个单元测试覆盖：HTML 清理、JSON 解析、内容切分、占位符注入、卡片分页、配色匹配
- TypeScript 严格模式，全项目零 `any`
- 生产级容错设计：AI 输出格式不稳定时自动清理 + 重试 + 降级，绝不渲染残缺内容

---

## 🤝 为这个项目做贡献

如果这个工具对你产生了实际价值，欢迎：

- ⭐ Star 收藏 — 支持项目持续更新
- 🍴 Fork 研究 — 代码结构清晰，适合学习 AI + 前端的工程落地
- 🐛 提 Issue — 发现了 bug 或有功能建议
- 📤 分享 — 推荐给身边的内容创作者朋友

---

## 📄 License

MIT © [Wylannnn](https://github.com/Wylannnn)
