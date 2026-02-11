# 参考文档

此目录包含项目开发过程中参考的外部文档和教程。

## 文档列表

### [ai-sdk-llms.md](./reference/ai-sdk-llms.md)

Vercel AI SDK 官方教程集合，包含：

- **RAG Agent Guide** - 检索增强生成 (Retrieval-Augmented Generation) 实现教程
  - 向量数据库集成
  - Embeddings 生成与存储
  - 知识库检索
  - Agent 工具调用

- **Multi-Modal Agent** - 多模态 AI Agent 教程
  - 图像处理与视觉理解
  - PDF 文档解析
  - 文件上传与 Data URL 转换
  - 多格式消息处理

- **Slackbot Agent** - Slack 集成指南
  - Slack App 配置
  - Bot 权限设置
  - Webhook 处理
  - 消息格式转换

## 使用说明

⚠️ **重要提示**：这些文档基于 **Next.js** 框架编写，与本项目使用的 **Tauri + React** 架构不同。

**适用场景**：
- 📚 学习 AI Agent 设计概念和架构思路
- 🎯 了解功能实现的可能方案
- 🔧 参考工具调用、多模态处理等技术细节

**不适用的部分**：
- ❌ API Routes / Server Actions（本项目使用 Tauri Commands）
- ❌ Next.js 特定功能（如 App Router、Server Components）
- ❌ PostgreSQL / pgvector（本项目使用 JSON 文件存储）

## 适配指南

将 Next.js 代码迁移到 Tauri 的关键转换：

| Next.js | Tauri |
|---------|-------|
| `app/api/xxx/route.ts` | `src-tauri/src/lib.rs` (Commands) |
| Server Actions | `invoke('command_name')` |
| Server Components | React Client Components |
| PostgreSQL | JSON 文件 + IndexedDB |
| `process.env` | Tauri 插件配置 |

## 相关资源

- [AGENTS.md](../../AGENTS.md) - 项目开发指南
- [README.md](../../README.md) - 项目说明
