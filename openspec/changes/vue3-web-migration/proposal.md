# Proposal

## Why

项目已通过 `src/utils/tauriCompat/` 兼容层完整实现了 Web 端运行（IndexedDB 持久化、Web Crypto 加密、浏览器 fetch、gh-pages 部署），Tauri 桌面壳（`src-tauri/` 仅为插件初始化，无自定义 Rust 命令）已不承载任何独有业务逻辑，双环境兼容与双份测试矩阵成为纯粹的维护成本。同时，项目所有者决定将前端技术栈统一迁移到 Vue 3（组合式 API），以简化状态管理与组件模型。借此迁移一并移除 Tauri，使项目收敛为单一目标的纯 Web 应用。

## What Changes

- **BREAKING**：移除 Tauri 桌面端 —— 删除 `src-tauri/` 目录、`@tauri-apps/*` 与 `tauri-plugin-keyring-api` 依赖、`tauri` 构建脚本与桌面分发渠道；项目不再产出桌面应用。
- **BREAKING**：前端框架从 React 19 迁移到 Vue 3（组合式 API + `<script setup>` SFC），全部 `.tsx` 组件重写为 `.vue` 单文件组件。
- 状态管理：Redux Toolkit + react-redux（7 个 slices + 3 个持久化 middleware）→ Pinia store（保持同等持久化行为）。
- 路由：react-router-dom v7 → vue-router 4（保持现有路由结构、懒加载与 GH Pages basename 行为）。
- UI 组件：Radix UI + shadcn 风格组件（28 个 `src/components/ui/`）→ reka-ui + shadcn-vue 等价实现，保持 Tailwind 4 样式与视觉行为。
- i18n：保留 i18next 核心，`react-i18next` 替换为 Vue 组合式桥接（保持按需加载、缓存校验、翻译完整性检查等现有行为）。
- 兼容层收敛：`tauriCompat` 各模块删除 Tauri 分支，Web 实现成为唯一实现，重组为纯 Web 运行时模块；`isTauri()` 环境检测移除。
- 构建链：`@vitejs/plugin-react` + babel-plugin-react-compiler → `@vitejs/plugin-vue`；Vite 分包策略按 Vue 生态重排。
- 测试：`@testing-library/react` → `@testing-library/vue`，React 组件测试重写；框架无关的服务层/工具层测试保留。
- 业务功能行为保持不变：聊天（流式响应）、模型管理、多供应商、字段级加密、密钥管理、导出、国际化、响应式布局等继续按现有 specs 工作。

## Capabilities

### New Capabilities

- `vue3-app-framework`: Vue 3 组合式 API 应用架构要求 —— SFC 组件模型、Pinia 状态管理、vue-router 路由、组合式函数（composables）、应用分阶段启动流程。
- `pure-web-runtime`: 纯 Web 运行时要求 —— 无 Tauri 依赖、仅使用浏览器 API、构建产物为纯静态 Web 应用、仅 Web 部署渠道。

### Modified Capabilities

- `tauri-plugin-web-compat`: 双环境兼容层架构 → 移除环境检测 `isTauri()` 与各插件的 Tauri 原生分支，Web 实现成为唯一实现。
- `http-fetch-compat`: 统一 fetch 的双环境选择 → 仅浏览器 fetch 实现。
- `os-locale-compat`: `locale()` 双环境实现 → 仅 `navigator.language` 实现。
- `secure-key-storage`: 主密钥按环境选择存储后端（OS 钥匙串 / IndexedDB）→ 仅 Web 加密存储（IndexedDB + AES-256-GCM）。
- `web-keyring-compat`: Keyring 兼容层从"Tauri 与 Web 双环境可用"变为唯一 Keyring 实现，API 形状保留。
- `web-store-compat`: Store 兼容层从双环境可用变为唯一持久化 KV 实现，API 形状保留。
- `keyring-public-api`: keyring 实例行为移除 Tauri 环境场景，`resetState` 等仅针对 Web 实现。
- `keyring-migration`: V1→V2 迁移移除"Tauri 环境跳过迁移"场景，仅保留 Web 迁移路径。
- `tauri-compat-env-testing`: 移除 `isTauri` 环境检测测试要求，保留 `isTestEnvironment`、PBKDF2 迭代等测试要求。

## Impact

- **代码**：`src/` 全部 React 代码（约 414 个 TS/TSX 文件）重写为 Vue SFC 与组合式函数；`src-tauri/` 整体删除；`vite.config.ts`、`tsconfig`、`package.json` scripts 全面调整。
- **依赖移除**：react、react-dom、react-redux、@reduxjs/toolkit、react-router-dom、@radix-ui/*、react-i18next、lucide-react、@tanstack/react-form、@tanstack/react-table、sonner、react-masonry-css、react-resizable-panels、@tauri-apps/plugin-*、tauri-plugin-keyring-api、@tauri-apps/cli、babel-plugin-react-compiler、@vitejs/plugin-react、@testing-library/react 等。
- **依赖新增**：vue、pinia、vue-router、reka-ui、lucide-vue-next、vue-sonner、@vitejs/plugin-vue、@testing-library/vue 等 Vue 生态等价物；virtua（Vue 支持）保留。
- **不受影响**：`services/chat`、`services/modelRemote`、`services/initialization`、`utils/crypto.ts`、`store/storage` 持久化层、`utils/utils.ts` 等框架无关模块；全部业务行为 specs。
- **测试**：组件测试全部重写为 Vue 版；Stryker 变异测试、vitest 配置迁移；框架无关测试保留。
- **文档**：AGENTS.md、README（双语同步）、docs/design/* 中 React/Tauri 相关章节同步更新。
- **用户影响（BREAKING）**：桌面端停止发布，桌面用户需转用 Web 版；桌面端本地数据（Tauri 本地存储/系统钥匙串）无法被浏览器访问，不做迁移。
