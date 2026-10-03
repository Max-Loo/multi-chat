# Proposal

## Why

项目当前是 Tauri + React 双轨架构，但实际发布渠道以 GitHub Pages Web 版为主，且 Rust 后端零自定义命令（仅 21 行插件初始化代码），Tauri 层已名存实亡，双平台兼容层（tauriCompat，1751 行）与双份测试带来的维护成本与其价值不再匹配。用户决定将技术栈统一收敛为纯 Web 项目，并将前端框架从 React 19 迁移至 Vue3（组合式 API），以单一目标平台和偏好的框架降低长期维护成本。

## What Changes

- **BREAKING** 前端框架从 React 19 整体迁移至 Vue3（组合式 API）：
  - 状态管理从 Redux Toolkit（7 个 slice + 3 个监听中间件）迁移至 Pinia，保留持久化与数据流行为
  - 路由从 react-router-dom 迁移至 vue-router，路由结构与 URL 保持不变
  - UI 组件体系从 Radix UI + shadcn/ui（React 版，28 个原子组件）迁移至 shadcn-vue（reka-ui）
  - react-i18next 迁移为 i18next 核心 + vue 绑定层，保留现有懒加载、缓存、重试机制
  - 表单/表格迁移至 @tanstack/vue-form、@tanstack/vue-table；图标迁移至 lucide-vue-next；toast 迁移至 vue-sonner；主题切换以 VueUse（useDark）替代 next-themes
- **BREAKING** 移除 Tauri 桌面运行时，项目成为纯 Web 应用：
  - 删除 `src-tauri/` 目录、`@tauri-apps/*` 与 `tauri-plugin-keyring-api` 全部依赖
  - tauriCompat 兼容层收敛为纯 Web 实现：IndexedDB 存储、IndexedDB + AES-256-GCM keyring、原生 fetch、`window.open` 外链、`navigator.language` 语言检测；移除 `isTauri()` 双轨分支
  - 删除 `build-and-release.yml` 桌面构建工作流；`dev`/`build` 脚本统一为现有 `web:dev`/`web:build` 工作流
- 测试体系迁移：@testing-library/react 换为 Vue 测试方案（@testing-library/vue + happy-dom），框架无关层（services、storage、utils 纯逻辑）测试尽量平移，组件与 hooks 测试按同等行为验收标准重写
- 现有全部用户可见功能（聊天、模型管理、密钥管理、导出、国际化、初始化流程）在迁移后行为保持不变

### 明确不做（Non-goals）

- 不做 React/Vue 渐进式共存迁移，而是一次性切换（无自定义后端 IPC，双框架共存的复杂度高于一次性重写）
- 不改变任何业务行为、数据格式、加密算法、IndexedDB 库结构与 localStorage 键名
- 不新增后端服务；不做 Tauri 桌面数据向 Web 的迁移工具（Web 端数据本就在浏览器本地）

## Capabilities

### New Capabilities

- `vue3-frontend-architecture`: Vue3 组合式 API 前端架构——应用入口与启动初始化挂载、Pinia 状态管理（替代 Redux）、vue-router 路由（结构与 URL 不变）、shadcn-vue 组件体系、Vue 测试基础设施的行为要求
- `web-only-platform`: 纯 Web 运行时平台——项目无桌面运行时，tauriCompat 收敛为纯 Web 存储模块，数据持久化仅依赖 IndexedDB/localStorage，网络请求仅用原生 fetch，npm 脚本与 CI 仅保留 Web 工作流

### Modified Capabilities

- `web-keyring-compat`: 移除"Tauri 环境使用系统钥匙串"分支与相关可用性/安全性场景，IndexedDB + AES-256-GCM 成为唯一实现路径；安全性警告文案不再引导"使用桌面版"
- `web-store-compat`: 移除 Tauri plugin-store 分支与"从 Tauri 端迁移数据"需求，IndexedDB 为唯一持久化实现
- `keyring-migration`: 移除"Tauri 环境跳过迁移"场景，V1→V2 迁移逻辑对全部用户无条件执行
- `http-fetch-compat`: 移除环境三态检测与"Tauri 平台使用 plugin-http"需求，统一为原生 fetch
- `vitest-framework`: "支持 React 组件测试"改为"支持 Vue 组件测试"，其余 Vitest 基础设施需求不变
- `gh-pages-auto-deployment`: 移除"与桌面应用构建并行触发、版本同步"需求，版本 tag 仅触发 Web 部署

## Impact

- **代码**：`src/` 全部 191 个非测试文件（约 21040 行）中，框架无关层（types、services、store/storage、utils 非 UI 部分、locales）大部分可平移；pages（49 文件）、components（50 文件）、hooks（16 文件）、store/slices + middleware（10 文件）需按 Vue3 重写；`src-tauri/` 整目录删除
- **依赖**：移除 react、react-dom、react-redux、@reduxjs/toolkit、react-router-dom、@radix-ui/*（14 个）、react-i18next、@tanstack/react-form、@tanstack/react-table、lucide-react、sonner、next-themes、react-masonry-css、react-resizable-panels、@tauri-apps/*（5 个）、tauri-plugin-keyring-api、@tauri-apps/cli、babel-plugin-react-compiler、@vitejs/plugin-react、@testing-library/react 等；新增 vue、pinia、vue-router、shadcn-vue 体系（reka-ui 等）、i18next-vue、@tanstack/vue-form、@tanstack/vue-table、lucide-vue-next、vue-sonner、@vueuse/core、@testing-library/vue、@vitejs/plugin-vue 等
- **测试**：187 个测试文件（约 51509 行）需迁移或重写；覆盖率阈值策略与 Stryker 变异测试配置随目录结构调整
- **构建/CI**：vite.config.ts（React 插件、react-compiler、manualChunks 的 vendor-react 等分包）、tsconfig（react-jsx）、oxlint 配置、`build-and-release.yml` 工作流、`scripts/update-version.js`（同步 tauri.conf.json/Cargo.toml 版本）均需调整
- **数据兼容性**：Web 端现有用户数据（IndexedDB、localStorage）不受影响；桌面版用户的本地数据（plugin-store 文件、系统钥匙串）在迁移后不再可访问，属于有意的**BREAKING**取舍
- **文档**：AGENTS.md、README（双语）、docs/design/、docs/conventions/ 中涉及 React/Tauri 的描述需同步更新
