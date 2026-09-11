# 提案：迁移至 Vue 3 并移除 Tauri，转为纯 Web 应用

## Why

项目决定放弃桌面端形态，专注于纯 Web 部署（gh-pages 渠道已存在且可用）。当前为支撑双环境维护了一整套 Tauri 兼容层与 Rust 后端（`src-tauri/`、5 个 Tauri 插件、`tauriCompat` 双环境分支），同时前端绑定在 React 生态（React 19 + Redux Toolkit + react-router + react-i18next + Radix/shadcn）。统一到 Vue 3（组合式 API）并移除 Tauri 栈，可以删除整个 Rust 后端与双环境分支，显著降低维护面。

## What Changes

- **BREAKING**：移除 Tauri 桌面端 —— 删除 `src-tauri/`、`@tauri-apps/*` 插件依赖、`tauri-plugin-keyring-api`、Tauri CLI、`tauri.conf.json` 及桌面打包/发布流程。
- **BREAKING**：前端框架由 React 19 迁移至 Vue 3（组合式 API、`<script setup>`、`vite` + `@vitejs/plugin-vue`）。所有组件、页面、hooks 以 Vue 惯用法重写；用户可见功能行为保持不变。
- 生态替换（详细映射见 design.md）：Redux Toolkit → Pinia；react-router-dom → vue-router；react-i18next → 保留 i18next 核心 + 自定义响应式组合式函数；Radix/shadcn(ui) → shadcn-vue（reka-ui）；lucide-react → lucide-vue-next；sonner → vue-sonner；next-themes → 主题组合式函数；`@tanstack/react-form`/`react-table` → 对应 Vue 适配版。
- `tauriCompat` 兼容层收缩为纯 Web 实现：保留既有公开 API 形态（`createLazyStore`、`keyring`、`fetch`、`locale`、`Command`）以控制改动面，删除全部 Tauri 分支与 `isTauri()`/`window.__TAURI__` 检测；shell 插件兼容层直接移除。
- 测试栈：`@testing-library/react` → `@testing-library/vue`；vitest、happy-dom、stryker 变异测试与覆盖率阈值体系保留；随迁移重写组件/钩子测试。
- 构建脚本与配置：`dev`/`build` 不再经 Tauri CLI（`web:*` 别名并入主脚本）；vite 手动分包映射从 React 生态改为 Vue 生态；AI 供应商开发代理保留。
- 部署：gh-pages 自动部署流程保留，移除"与桌面版本同步发布"的语义。

## Capabilities

### New Capabilities

- `framework-vue3`：应用 UI 层全面构建于 Vue 3 组合式 API 之上 —— 组件/页面/组合式函数的框架要求、状态管理（Pinia）、路由（vue-router）、i18n 绑定方式，以及"不残留 React 运行时依赖"的约束。
- `web-only-platform`：应用为纯 Web 应用 —— 不存在 Tauri 运行时、依赖与代码；存储、密钥、HTTP、语言检测等平台能力一律由 Web 标准 API 提供；构建与部署产物为静态 Web 资源。

### Modified Capabilities

- `tauri-plugin-web-compat`：移除"Tauri 环境检测"与"Shell 插件兼容层"等 Tauri 分支需求；兼容层不再区分运行环境。
- `web-keyring-compat`：keyring 兼容层改为仅 Web 实现（IndexedDB + Web Crypto），删除"Tauri 环境使用原生实现"场景。
- `web-store-compat`：Store 兼容层改为仅 IndexedDB 实现，删除 Tauri 原生分支场景。
- `http-fetch-compat`：fetch 统一为原生 Web fetch；环境检测不再区分"生产 Tauri 平台"。
- `os-locale-compat`：`locale()` 仅返回 `navigator.language`，删除 Tauri 原生分支场景。
- `gh-pages-auto-deployment`：移除"Web 版本与桌面应用版本同步发布"语义；构建命令更名（`web:build` 并入 `build`）。

## Impact

- **代码**：`src/` 全部 UI 层（约 189 个 .tsx、16 个 hooks、store 绑定层）以 Vue 重写；`src/services/chat` 聊天服务层、加密工具、i18next 资源与懒加载体系等框架无关代码保留复用；`src-tauri/` 整体删除。
- **依赖**：移除 React/Tauri 相关约 20 个包（react、react-dom、@reduxjs/toolkit、react-redux、react-router-dom、react-i18next、@radix-ui/*、next-themes、sonner、lucide-react、@tauri-apps/*、tauri-plugin-keyring-api、@vitejs/plugin-react、babel-plugin-react-compiler、@testing-library/react 等）；新增 Vue 生态包（vue、pinia、vue-router、vue-i18n 或 i18next 绑定、reka-ui/shadcn-vue、lucide-vue-next、vue-sonner、@tanstack/vue-form、@tanstack/vue-table、@virtua/vue、@vitejs/plugin-vue、@testing-library/vue 等）。
- **脚本/CI**：`package.json` scripts 与 vite 配置改造；gh-pages workflow 内构建命令同步更新。
- **测试**：组件/页面/hooks 测试随重写；覆盖率阈值在迁移完成后重新校准（React 专属排除项失效）。
- **文档**：AGENTS.md、README 双语、docs/design/ 架构文档随迁移同步更新。
- **已知约束（不在本变更解决）**：移除桌面端后，生产 Web 环境下直连不支持 CORS 的 AI 供应商 API 将受浏览器同源策略限制（与现状 gh-pages Web 版一致，桌面端曾可借助 plugin-http 绕过；开发环境继续使用 vite 代理）。若需生产级解法（自建代理/边缘函数），作为独立后续变更。

## 决策与假设

- **迁移策略**：单分支集中迁移、分模块推进（先 Tauri 移除，再 Vue 基座，再逐页面迁移），不做 React/Vue 双栈长期共存（复杂性高于收益，个人项目可接受集中迁移窗口）。
- **i18n**：保留 i18next 核心（资源、懒加载、完整性检查、类型生成等既有体系均基于它），仅替换 react-i18next 绑定层；不引入 vue-i18n，避免重写既有 i18n 基础设施。
- **行为基线**：迁移是等功能重写，不新增/修改用户可见功能；以现有功能与测试为验收基线。
- **既有规格清理**：除上述 6 个 Modified 外，另有约 22 个既有规格在场景文本中引用 Tauri 环境（多为测试约定类），其失效场景待迁移完成后由专门的规格清理变更批量修订，本变更不逐个展开以保持聚焦。
