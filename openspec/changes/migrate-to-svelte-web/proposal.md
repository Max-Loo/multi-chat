# Proposal

## Why

前端以 React 19 + Redux Toolkit + Radix UI 全家桶构建，依赖虚拟 DOM diff 与大量样板代码（Provider 嵌套、selector 记忆化、React Compiler 补偿优化），运行时体积与心智负担高。迁移到 Svelte 5 可获得编译期细粒度响应式：无虚拟 DOM、无手动 memo、状态即变量，显著降低运行时开销与代码量。同时，前序变更 `migrate-to-vue3-web` 的阶段 0（Tauri 移除 + 平台层收敛）已合入 main，但其框架迁移方向（Vue）尚未开始，且主规格与代码中仍残留 Tauri 痕迹（需求正文、注释、构建排除、VS Code 推荐）。本变更以 **Svelte 取代 Vue 方向**，并一次性完成「单一框架 + 纯 Web 端」的最终收敛。

## What Changes

- **BREAKING** 前端框架由 React 19 迁移至 **Svelte 5（runes 模式）**：`components/`、`pages/`、`hooks/` 全量重写为 `.svelte` 组件与 `.svelte.ts` runes 模块；移除 React Compiler（`babel-plugin-react-compiler`）——Svelte 编译器内建响应式，无需补偿优化层。
- **BREAKING** 移除全部 React 生态依赖（react / react-dom / @reduxjs/toolkit / react-redux / react-router-dom / react-i18next / @radix-ui/* 14 项 / @tanstack/react-form / @tanstack/react-table / lucide-react / sonner / next-themes / react-masonry-css / react-resizable-panels / @vitejs/plugin-react / @testing-library/react 等）。
- 技术栈等价替换：Redux Toolkit → Svelte runes 状态模块（`.svelte.ts`）；react-router-dom → 自研轻量 runes 路由（**保持既有 URL 路径结构**，非 hash 路由）；Radix/shadcn → shadcn-svelte（bits-ui 内核）；lucide-react → @lucide/svelte；sonner → svelte-sonner；next-themes → 自研 runes 主题模块（localStorage 键兼容）；@tanstack/react-form / react-table → @tanstack/svelte-form / svelte-table；virtua 保留（官方 Svelte 版本）；react-resizable-panels → paneforge；react-i18next → i18next 核心 + runes 响应式封装（i18next 核心与 24 个语言 JSON 原样保留）。
- 框架无关层原样保留：`src/services/chat/`（ai SDK 核心流式调用）、`src/services/modelRemote/`、`src/platform/`、`src/store/storage/`、`src/utils/`、加密与主密钥逻辑、Tailwind CSS 4、markdown 渲染管线（markdown-it + highlight.js + dompurify）。
- **完成 Tauri 残留清理（收尾前序变更阶段 0）**：清理 6 处源码注释、`stryker.config.json` 失效排除路径、`.vscode/extensions.json` 桌面端扩展推荐、测试 Mock 工厂中的 Tauri Mock、过时的 `tauri-compat-tests` 主规格，以及 `http-fetch-compat` / `web-keyring-compat` / `web-store-compat` / `gh-pages-auto-deployment` 四个主规格中残留的 Tauri 需求正文。
- 既有 Web 用户数据免迁移兼容：不变更存储布局，直接读写现有 IndexedDB 库（`multi-chat-store`、`multi-chat-keyring`）与全部 localStorage 键。
- 已知限制（非目标）：生产环境 LLM API 直连受浏览器 CORS 约束（与现状一致，开发环境沿用 Vite 代理）；不提供桌面版数据迁移工具。
- 变更关系说明：本变更与 `migrate-to-vue3-web` 互斥（Svelte 取代 Vue 方向）。该变更已于本变更实施前归档（`archive/2026-09-28-migrate-to-vue3-web`），其平台规格增量（http-fetch-compat / web-keyring-compat / web-store-compat / gh-pages-auto-deployment 的 Tauri 需求移除）已随归档同步进主规格；本变更不再重复携带这三个平台增量，仅保留 gh-pages-auto-deployment（构建命令随框架切换的增量修改）与 tauri-compat-tests（能力移除）。

## Capabilities

### New Capabilities

- `svelte-frontend`: Svelte 5（runes 模式）前端架构与迁移兼容性要求——技术栈约束、URL 路由结构兼容（路径式路由 + 404.html 回退 + 子路径部署）、既有用户数据免迁移兼容、状态管理与持久化时机等价、i18n 行为等价（保留 i18next 核心）、UI 交互行为等价、聊天核心流程回归可用、测试栈迁移与回归保障。

### Modified Capabilities

- `gh-pages-auto-deployment`: 移除「与桌面应用构建并行触发、版本号一致」要求；Web 构建是唯一构建产物，构建入口保持 `pnpm build`（类型检查命令随框架切换为 svelte-check）。
- `tauri-compat-tests`: 移除整个能力——其要求针对的 `src/utils/tauriCompat/` 测试文件已随平台层收敛更名为 `src/platform/` 测试，同名能力不再有存在意义；测试质量约束由 `behavior-driven-testing` 等既有能力继续覆盖。

（注：`http-fetch-compat` / `web-keyring-compat` / `web-store-compat` 三个能力的 Tauri 需求移除已随 `migrate-to-vue3-web` 归档同步完成，本变更不再携带其增量。）

## Impact

- **代码**：`src/` UI 层全量重写——components（约 50 文件）、pages（46 文件）、hooks（16 文件，其中 3 个 tsx）→ Svelte 组件 / runes 模块；`src/store/` Redux 体系（slices 7 个 + middleware + selectors + index）→ runes 状态模块（持久化逻辑与存储布局等价迁移）；`main.tsx` / `MainApp.tsx` → `main.ts` + `App.svelte`；框架无关层保留复用。
- **依赖**：移除约 25 项 React 生态依赖与 babel-plugin-react-compiler；新增 svelte、@sveltejs/vite-plugin-svelte、svelte-check、bits-ui（shadcn-svelte 系）、@lucide/svelte、svelte-sonner、paneforge、@tanstack/svelte-form、@tanstack/svelte-table、@testing-library/svelte；保留 ai、i18next、tailwindcss 4、virtua、vitest、happy-dom、fake-indexeddb、dayjs、markdown-it、dompurify、highlight.js、es-toolkit、zod。
- **测试**：`src/__test__/` 177 个测试文件中组件 / hooks / pages 类（约 60+）作废并按 @testing-library/svelte 重写；服务层、存储层、工具层测试保留并适配 mock 导入路径；`src/__test__/helpers/` 工厂与 mock 适配 Svelte 测试栈并移除 Tauri Mock；Stryker mutate 清单重建（移除 tauriCompat 死路径）。
- **构建 / 配置**：`vite.config.ts`（React 插件与 React Compiler → svelte 插件；vendor-react / vendor-redux / vendor-radix 分包重写为 vendor-svelte / vendor-bits-ui 等，延续 chunk-splitting 规格的包名精确提取策略）；`tsconfig.json`（jsx 移除，svelte-check 接管 .svelte 类型检查）；`.oxlintrc.json`（react 插件规则调整）；`.vscode/extensions.json`（移除 tauri-vscode / rust-analyzer 推荐，补 Svelte 扩展）；`stryker.config.json`（清理失效路径）。
- **规格 / 文档**：主规格 5 项增量修改（见 Capabilities）；AGENTS.md 技术栈与架构描述、README 双语同步、`docs/design/` 相关设计文档更新。
