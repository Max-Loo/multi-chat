# Proposal

## Why

项目当前是 Tauri + React 双模式桌面/Web 应用，但双轨维护成本高：业务代码约 2 万行被"跨平台兼容层"约束，每个 Tauri 插件都要维护 Web 降级实现，且 React 侧需为 Radix UI、React Compiler 等生态持续投入。项目已有在线运行的 GitHub Pages 纯 Web 版本（`deploy:gh-pages`），证明纯 Web 形态完全可用。将项目收敛为 **Vue3（组合式 API）+ 纯 Web 端** 可消除双环境分支逻辑、删除整个 Rust 后端与 Tauri 依赖，大幅降低维护面。

## What Changes

### Vue3 迁移（**BREAKING**：前端框架整体替换）

- 前端框架从 React 19 迁移至 Vue 3（组合式 API、`<script setup>` SFC）
- 状态管理从 Redux Toolkit（7 个 slice + 3 个持久化中间件）迁移至 Pinia
- 路由从 react-router-dom v7 迁移至 vue-router 4（保留懒加载与 GitHub Pages basename 支持）
- UI 组件体系从 shadcn/ui（Radix UI，28 个原子组件）迁移至 shadcn-vue（reka-ui）；Tailwind CSS v4 样式原样保留
- 16 个 React hooks 迁移为 composables；`@tanstack/react-form` / `react-table` 替换为 `@tanstack/vue-form` / `vue-table`
- 图标 `lucide-react` → `lucide-vue-next`；Toast `sonner` → `vue-sonner`；主题 `next-themes` → 自研 `useTheme` composable
- 保留 i18next 核心与懒加载服务层（框架无关），仅用自研 `useI18n` composable 替换 react-i18next 的 `useTranslation`
- AI SDK（`ai` v6 + 各 provider）与 Web Crypto 加密层（100% `crypto.subtle`）框架无关，原样复用
- 测试体系：组件测试从 @testing-library/react 重写为 @vue/test-utils（约 178 个单测文件受影响）；store/services/utils 逻辑测试平移
- 移除 React Compiler 与 `@vitejs/plugin-react`，改用 `@vitejs/plugin-vue` + `vue-tsc`

### 移除 Tauri（**BREAKING**：桌面端不再发布）

- 删除 `src-tauri/` 整个 Rust 后端（无自定义 `#[tauri::command]`，纯插件注册，删除无功能损失）
- 移除全部 `@tauri-apps/*` 与 `tauri-plugin-keyring-api` 依赖（5 个运行时依赖 + CLI）
- `src/utils/tauriCompat/` 兼容层收敛为纯 Web 实现：删除每个模块的 Tauri 分支与 `isTauri()` 环境检测，Web 实现（IndexedDB 存储、Web Crypto keyring、原生 fetch、`navigator.language`、`window.open`）成为唯一实现，模块 API 形状保持不变以最小化 10 个业务消费方的改动
- `package.json` 脚本收敛：`dev`/`build` 直接指向 Vite（即现 `web:dev`/`web:build`），删除 `tauri` 脚本
- 开发期 CORS 继续由 Vite proxy 处理（/deepseek、/kimi、/zhipuai 等已配置），生产环境直连供应商 API（线上 GitHub Pages 版本已验证可行）

### 明确不做（Non-goals）

- 不做桌面版用户数据（plugin-store JSON 文件、系统 keyring）到浏览器的自动迁移——浏览器无法读取本地桌面数据；现有 master key 手动导入功能（`importMasterKeyWithValidation`）保留作为迁移通道
- 不改变任何面向用户的业务行为：聊天、模型管理、设置、导出、i18n 交互逻辑均保持不变
- 不引入 SSR/SSG，保持纯 SPA

## Capabilities

### New Capabilities

- `vue-app-framework`: Vue3 组合式 API 应用框架规范——应用入口与初始化状态机、SFC 组件组织、composables 约定、Pinia 状态管理（含持久化）、vue-router 路由、shadcn-vue 组件体系
- `pure-web-runtime`: 纯 Web 运行时规范——零 Tauri 依赖约束、Vite 构建、GitHub Pages 部署、CORS 处理策略（开发 proxy / 生产直连）、浏览器存储与 Web Crypto 能力基线

### Modified Capabilities

- `tauri-plugin-web-compat`: 兼容层从"Tauri/Web 双环境"收敛为纯 Web 平台层——移除环境检测（isTauri）、Shell Tauri 分支、各插件的 Tauri 原生实现场景与向后兼容性需求
- `http-fetch-compat`: fetch 从三分支环境选择收敛为原生 Web fetch 唯一实现；移除环境检测与 `@tauri-apps/plugin-http` 动态导入需求
- `os-locale-compat`: `locale()` 的 Tauri 原生实现分支移除，`navigator.language` 成为唯一实现；UserAgent 平台检测逻辑保留
- `web-store-compat`: IndexedDB 存储从"Web 环境降级实现"升级为唯一持久化实现；移除与 Tauri 原生实现对齐的需求
- `web-keyring-compat`: IndexedDB + AES-256-GCM 加密存储升级为唯一密钥存储实现；安全警告提示成为标准行为而非降级提示
- `vitest-framework`: 组件测试从 @testing-library/react 迁移至 @vue/test-utils；jest-dom 断言体系对应调整
- `tauri-compat-env-testing`: 移除 `isTauri()` 环境检测测试需求（isTestEnvironment 与 getPBKDF2Iterations 测试保留）

## Impact

- **代码**：`src/` 全部 `.tsx` 文件（约 189 个，含 100 个非测试组件/页面）重写为 `.vue` SFC；`src/store/`（Redux → Pinia）；`src/utils/tauriCompat/`（11 文件删减 Tauri 分支）；`src-tauri/` 整目录删除
- **依赖**：移除 react/react-dom/react-redux/@reduxjs/toolkit/react-router-dom/@radix-ui/*（13 个）/lucide-react/sonner/next-themes/babel-plugin-react-compiler/@vitejs/plugin-react/@tauri-apps/*（6 个）/tauri-plugin-keyring-api 等；新增 vue/pinia/vue-router/shadcn-vue 体系/lucide-vue-next/vue-sonner/@vue/test-utils 等
- **测试**：`src/__test__/` 约 178 个单测文件中组件测试需按 Vue 测试范式重写；vitest 配置、stryker、fake-indexeddb 保留
- **文档**：AGENTS.md（技术栈、架构、快速查找表）、docs/design/cross-platform.md（重写为纯 Web 平台层说明）、docs/conventions/tauri-commands.md（删除）、README 双语同步
- **CI/部署**：`deploy:gh-pages` 流程不变；桌面构建流程移除
- **风险**：React 与 Vue 无法渐进混用，本变更为一次性整体迁移（在独立分支完成）；迁移期间功能冻结，以现有 spec 与测试作为行为基线
