# Proposal

## Why

项目当前是 Tauri + React 桌面应用，但双目标维护成本高：`tauriCompat` 兼容层为每个 Tauri 插件维护 Web 降级实现，且桌面端 Rust 后端仅有 21 行壳代码（无自定义命令）。同时团队技术方向转向 Vue3 生态，希望将项目收敛为纯 Web 端应用，降低维护面、统一技术栈，并以静态站点（GitHub Pages）作为唯一分发渠道。

## What Changes

- **BREAKING** 移除 Tauri 桌面运行时：删除 `src-tauri/` 目录、`@tauri-apps/*` 与 `tauri-plugin-keyring-api` 依赖、`tauri` 相关 npm scripts（`dev`/`build`/`tauri`）；应用仅在浏览器中运行。
- **BREAKING** 移除 `tauriCompat` 兼容层及其双环境分支：`isTauri()` 环境检测、Tauri 原生分支全部删除；HTTP 改用原生 `fetch`，密钥存储仅保留 IndexedDB + AES-256-GCM 的 Web 实现，外链跳转改用 `window.open`，语言检测改用 `navigator.language`。
- **BREAKING** 前端框架由 React 19 迁移至 Vue 3（组合式 API）：约 100 个 React 组件（含 28 个 shadcn/ui 基础组件）重写为 Vue SFC（`<script setup>`），用户可见行为保持对等。
- 状态管理由 Redux Toolkit + react-redux 迁移至 Pinia：6 个 slice、3 个 middleware、selectors 对应转换为 Pinia store 与组合式函数。
- 路由由 React Router v7 迁移至 vue-router（路由结构保持不变）；国际化由 react-i18next 迁移至 vue-i18n（翻译键、语言资源与懒加载策略保持不变）。
- UI 基础组件由 Radix UI（shadcn/ui React 版）替换为 Reka UI（shadcn-vue 体系）；图标由 `lucide-react` 替换为 `lucide-vue-next`；Toast 由 `sonner` 替换为 `vue-sonner`。
- 表单与表格由 `@tanstack/react-form` / `@tanstack/react-table` 替换为 `@tanstack/vue-form` / `@tanstack/vue-table`；虚拟滚动 `virtua`、主题方案改为 Vue 组合式实现。
- 构建链保留 Vite + Tailwind CSS v4：`@vitejs/plugin-react` 替换为 `@vitejs/plugin-vue`，移除 `babel-plugin-react-compiler`（Vue 响应式系统不需要编译期优化）。
- 测试体系保留 Vitest：React Testing Library 替换为 Vue Test Utils / Testing Library Vue，测试行为断言（现有 OpenSpec 场景）保持不变。
- 框架无关代码保持不动：`src/services/chat/`（AI SDK 核心调用，未使用 `useChat` React hook）、`src/utils/crypto.ts`、`src/locales/`、类型定义与业务工具函数原样保留。
- 同步更新文档：AGENTS.md 技术栈描述、`docs/design/cross-platform.md`（跨平台兼容层 → Web 专用实现）、`docs/conventions/tauri-commands.md`（删除）、README 双语版本。

## Capabilities

### New Capabilities

- `vue3-frontend`: Vue 3 组合式 API 前端架构约束 —— 组件形态（SFC + `<script setup>`）、Pinia 状态管理、vue-router 路由、vue-i18n 国际化、Reka UI 基础组件，以及与原 React 版应用的用户可见行为对等要求。
- `web-only-runtime`: 纯 Web 运行时要求 —— 无 Tauri 运行时与依赖、原生 `fetch` 网络访问、IndexedDB 密钥存储为唯一实现、浏览器环境检测、静态站点部署为目标形态。

### Modified Capabilities

- `tauri-plugin-web-compat`: 整体移除 —— "Tauri 环境检测"、各插件"Tauri 环境使用原生实现"分支、双环境测试验证等需求全部删除，兼容层概念不复存在；保留的 Web 行为（IndexedDB 存储、`window.open` 外链等）由其他规格承接。
- `web-keyring-compat`: 移除 Keyring 的 Tauri 原生分支需求，IndexedDB + AES-256-GCM 成为唯一密钥存储实现，API 面保持不变；安全性提示文案去除"桌面版"表述。
- `web-store-compat`: 移除 Store 插件的 Tauri 原生分支需求，IndexedDB 成为唯一数据持久化实现；错误提示文案去除"使用桌面版"表述。

注：`tauri-compat-shared-modules` 中的 `initIndexedDB`/`encrypt`/`decrypt` 等共享函数行为不变，仅模块位置从 `tauriCompat` 命名空间迁移（属实现细节，见 design.md），无需求级变更。

## Impact

- **代码**：`src/` 下全部 100 个 `.tsx` 组件重写为 `.vue`；`src/store/`（Redux → Pinia）；`src/router/`、`src/main.tsx`、`src/hooks/`（转为组合式函数）；`src/utils/tauriCompat/` 收敛为 Web 专用模块；`src-tauri/` 整目录删除。
- **依赖**：移除 react/react-dom/react-redux/react-router-dom/react-i18next/lucide-react/next-themes/@radix-ui/* 等约 30 个 React 生态依赖及 5 个 Tauri 依赖；新增 vue/pinia/vue-router/vue-i18n/reka-ui/lucide-vue-next/vue-sonner/@tanstack/vue-form/@tanstack/vue-table 等。
- **测试**：全部组件测试迁移到 Vue 测试栈；集成测试与 mutation 测试配置同步调整；`src/__test__/helpers/mocks/tauriCompat.ts` 等 mock 更新。
- **文档**：AGENTS.md、docs/design/、docs/conventions/、README（双语同步）。
- **不可变区**：`src/services/chat/`、`src/services/modelRemote/`、`src/utils/crypto.ts`、`src/locales/` 业务逻辑不改动（仅调整导入路径）。
- **风险**：桌面端用户失去系统级 Keychain 安全存储（主密钥降级为浏览器内加密存储）；AI 供应商 API 的 CORS 限制在纯浏览器环境的可达性需在设计中说明。
