# Proposal：移除 Tauri 并迁移至 Vue3（纯 Web 化）

## Why

项目当前以 Tauri 桌面应用为第一形态，同时维护桌面/Web 双运行路径：`tauriCompat` 兼容层为每个 Tauri 插件维护原生与 Web 两套实现，构建与测试需要覆盖 `tauri dev/build` 和 `web:dev/build` 两条链路。双栈的维护成本（兼容层、双份验证、Rust 工具链）已经超过桌面形态的价值；同时前端框架需要统一迁移到 Vue3（组合式 API）。两项工作合并为一个 change、分两个阶段交付，最终收敛为单一的纯 Web + Vue3 技术栈。

## What Changes

- **BREAKING** 移除桌面（Tauri）形态：删除 `src-tauri/` 目录、`@tauri-apps/*` 与 `tauri-plugin-keyring-api` 依赖、`tauri` 相关脚本与配置；`dev`/`build` 直接指向 Vite。
- 移除 `src/utils/tauriCompat/` 中的环境检测（`isTauri`）与全部 Tauri 原生实现分支；既有 Web 降级实现（IndexedDB store、IndexedDB + AES-256-GCM keyring、原生 fetch、`window.open`、`navigator.language`）升格为唯一实现，兼容层收敛为普通 Web 存储工具模块。
- **BREAKING** 前端框架从 React 19 迁移到 Vue3（组合式 API + `<script setup>`）：全部组件（约 189 个 .tsx 文件）、hooks、应用入口重写。
- 状态管理从 Redux Toolkit / react-redux 迁移到 Pinia；路由从 react-router-dom 迁移到 vue-router。
- UI 组件体系从 Radix UI（shadcn 风格）迁移到 Reka UI（shadcn-vue），CVA + tailwind-merge + Tailwind 样式体系保留复用。
- i18n 保留 i18next core 与现有翻译文件，`react-i18next` 替换为 Vue 响应式组合式封装；`lint:i18n` 完整性检查脚本继续可用。
- 生态库替换：`@tanstack/react-form` / `@tanstack/react-table` → TanStack 官方 Vue 适配；sonner → vue-sonner；lucide-react → lucide-vue-next；react-resizable-panels → Vue 端替代（paneforge）；virtua 保留（官方支持 Vue3）；next-themes → 自研轻量主题组合式函数。
- 测试栈保留 vitest，`@testing-library/react` → `@testing-library/vue`；移除 React Compiler（babel-plugin-react-compiler）及相关配置。
- 交付分两个阶段：阶段一移除 Tauri（保持 React Web 应用可运行、可验证），阶段二完成 React → Vue3 重写。

## Capabilities

### New Capabilities

- `pure-web-platform`：纯 Web 运行时。应用仅以浏览器 Web 应用形态构建、分发与运行；环境检测与原生分支移除；网络请求（原生 fetch）、外链打开（`window.open`）、语言检测（`navigator.language`）、数据持久化（IndexedDB + localStorage）仅依赖浏览器标准 API；用户既有数据保持兼容。
- `vue3-app-foundation`：Vue3 组合式 API 应用骨架。应用入口、路由（vue-router）、全局状态（Pinia）、i18n 集成（i18next + 响应式组合式封装）、UI 组件体系（Reka UI/shadcn-vue）与测试栈（@testing-library/vue）的 Vue3 形态，以及与既有功能（聊天、模型管理、设置）的行为对等要求。

### Modified Capabilities

- `tauri-plugin-web-compat`：移除双栈相关需求（`isTauri` 环境检测、Shell/Keyring 等 Tauri 原生实现分支、对 Tauri 桌面功能的向后兼容、双环境测试验证），兼容层收敛为纯 Web 模块。
- `os-locale-compat`：移除 Tauri 原生 `locale()` 分支与环境检测需求，语言检测收敛为 `navigator.language` 单一实现。
- `http-fetch-compat`：移除环境检测与生产 Tauri fetch 分支需求，HTTP 请求收敛为浏览器原生 fetch 单一实现。

注：`web-keyring-compat`、`web-store-compat`、`tauri-compat-shared-modules` 描述的 Web 侧行为（IndexedDB、加密存储、共享工具函数）在本 change 中保持不变，其 spec 中的 Tauri 分支场景在实施期做归档/合并清理（见 tasks）。

## Impact

- **代码**：`src/` 下全部组件与 hooks 重写为 Vue3；`src/store/`（Redux Toolkit）重写为 Pinia stores；`src/router/` 重写为 vue-router；`src/utils/tauriCompat/` 收敛（Web 实现保留，原生分支与 `isTauri` 移除，可更名为 `webStorage`/`webPlatform` 等普通模块）。
- **删除**：`src-tauri/`；依赖 `@tauri-apps/cli`、`@tauri-apps/plugin-http/os/shell/store`、`tauri-plugin-keyring-api`、`react`、`react-dom`、`react-redux`、`@reduxjs/toolkit`、`react-router-dom`、`@radix-ui/*`、`@tanstack/react-form`、`@tanstack/react-table`、`lucide-react`、`sonner`、`next-themes`、`react-masonry-css`、`react-resizable-panels`、`@vitejs/plugin-react`、`babel-plugin-react-compiler`、`@testing-library/react`。
- **构建**：`vite.config.ts` 换用 `@vitejs/plugin-vue`；`index.html` 入口调整；`package.json` scripts 重命名（`dev`/`build` → Vite，移除 `tauri`/`web:*` 双轨）；GH Pages 部署流程不变（产物仍为 `dist/`）。
- **测试**：约 178 个测试文件需迁移或重写；`src/__test__/README.md` 测试规范同步更新；变异测试（stryker）与覆盖率阈值配置相应调整。
- **数据兼容**：IndexedDB 数据库名称、对象存储与记录格式保持不变（`multi-chat-store`、`multi-chat-keyring`、localStorage 种子键），用户既有数据（聊天记录、模型配置、加密密钥）不受迁移影响。
- **行为注意**：Web 端长期存在的既定行为不变——Web 版安全存储级别低于系统钥匙串（已有 UI 提示）、浏览器直连 AI 供应商 API 受 CORS 语义约束（现状即如此，非本 change 引入）。
