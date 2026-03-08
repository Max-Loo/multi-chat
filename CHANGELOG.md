# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.2.2] - 2026-03-08

### ⚡ 性能优化

- **模型供应商 SDK 按需加载**：实现通用资源加载器，减少初始 bundle 大小约 125KB（gzipped）
- **国际化按需加载**：优化语言资源加载策略，减少 33%-67% 初始加载量
- **代码高亮优化**：常用语言固定打包 + 不常用语言按需加载，显著提升加载性能

### ✨ 新功能

- **聊天标题自动生成**：支持 AI 自动生成聊天标题，并提供 UI 开关控制
- **聊天重命名验证**：增强聊天重命名的输入验证机制
- **法语支持**：新增法语国际化支持（`fr`）
- **供应商 Logo**：在模型供应商卡片中显示品牌标识
- **Review 方案命令**：新增 `/review-proposal` 命令用于审查设计方案
- **完善 Skill 配置**：新增 OpenSpec 相关的 11 个 skill 配置

### 🔧 重构

- **聊天服务层模块化**：将 `chatService` 重构为多文件架构
  - `messageTransformer.ts` - 消息转换
  - `metadataCollector.ts` - 元数据收集
  - `providerFactory.ts` - 供应商工厂
  - `streamProcessor.ts` - 流式处理

### 🐛 Bug 修复

- 修复聊天页面「滚动到底部按钮」定位错误
- 修复密钥输入框同时展示两个「显示/隐藏」按钮
- 修复删除聊天后 `selectedChatId` 未正确清除的问题

### 🎨 其他变更

- 调整默认窗口大小（1200×800 → 1280×780）

---

**统计**：15 个 commit，新增 11 个新功能，2 个性能优化，1 个重构，3 个 bug 修复
