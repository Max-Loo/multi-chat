## Why

项目维护者决定将前端技术栈从 React 19 迁移至 Vue 3：统一个人项目技术栈至 Vue 生态、降低双框架心智负担，并利用 Vue 响应式系统替代 React Compiler 的手工优化。项目当前功能迭代稳定、测试覆盖完善（单元 + 集成 + 变异测试），是执行全量框架替换的最佳窗口期。迁移为**全量重写、独立分支（feat/vue3）**执行，完成后移除全部 React 依赖。

## What Changes

- **视图层重写**：约 100 个 `.tsx` 组件迁移为 Vue 3 SFC（Composition API + `<script setup lang="ts">`），React hooks 迁移为 composables
- **状态管理**：Redux Toolkit + react-redux → **Pinia**；7 个 slice、3 个持久化中间件（chat/models/appLanguage）、selectors 全部重写为 Pinia store；IndexedDB/Tauri 存储层（`store/storage/`）保持不变
- **路由**：react-router-dom v7 → **vue-router 4**，保持路由结构、懒加载、重定向、404 兜底与 GitHub Pages basename 行为对等
- **UI 组件**：Radix UI + shadcn 风格组件 → **Reka UI + shadcn-vue**（沿用现有 Tailwind v4 样式，视觉不变）；lucide-react → lucide-vue-next；sonner → vue-sonner；next-themes → @vueuse/core `useDark`（保留 localStorage 主题键）；@tanstack/react-form / react-table → 官方 Vue 适配版；virtua 保留（原生支持 Vue）；react-resizable-panels / react-masonry-css → Vue 等价方案
- **国际化**：保留 i18next 核心与全部语言资源、类型生成和 lint 脚本；移除 react-i18next，新增轻量 `useT()` composable 适配层（响应式语言切换）
- **构建工具链**：@vitejs/plugin-react + babel-plugin-react-compiler → @vitejs/plugin-vue；manualChunks、覆盖率排除清单、tsconfig（jsx 配置 → Vue 支持）同步调整
- **测试**：@testing-library/react → @testing-library/vue；约 89 个组件/hook 测试随组件重写；纯逻辑测试（services/utils/store-storage）保留
- **BREAKING（仅对开发者）**：视图层全量重写、依赖树大幅变更；**对终端用户无破坏**——UI 行为、数据格式（IndexedDB/加密存储）、路由 URL 全部保持不变
- Rust 后端（`src-tauri/`）与 Tauri 插件不受影响

## Capabilities

### New Capabilities

- `vue-frontend`: Vue 3 视图层实现要求——Vue 3 应用骨架（入口/初始化流程）、路由对等、Pinia 状态对等（含持久化副作用）、shadcn-vue UI 组件对等、i18next Vue 适配层、React 依赖清零与构建配置迁移

### Modified Capabilities

<!-- 现有能力（bottom-navigation、mobile-drawer、json-data-persistence、i18n-ui-text 等）的行为规格
     在迁移后保持不变，本次为实现层替换，无需修改其需求。 -->

## Impact

- **代码**：`src/` 全部视图层——`main.tsx`、`MainApp.tsx`、`components/`、`pages/`、`hooks/`（→ composables）、`router/`、`store/`（slices/middleware/selectors → Pinia stores）、`components/ui/`（→ shadcn-vue）
- **保持不变**：`src-tauri/`、`services/`（chat/initialization/modelRemote 纯 TS 层）、`store/storage/`、`store/keyring/`、`utils/`、`types/`、`locales/`
- **依赖**：移除 react、react-dom、react-redux、react-router-dom、@radix-ui/*（13 个）、react-i18next、lucide-react、sonner、next-themes、@tanstack/react-form、@tanstack/react-table、react-masonry-css、react-resizable-panels、@reduxjs/toolkit、babel-plugin-react-compiler 等约 30 个；新增 vue、pinia、vue-router、reka-ui、@vueuse/core、vue-sonner、lucide-vue-next、@tanstack/vue-form、@tanstack/vue-table 等
- **工具链**：`vite.config.ts`（插件/分包/测试配置）、`tsconfig.json`、`vitest.integration.config.ts`、stryker/knip/coverage 配置、`src/__test__/`（RTL mock → Vue 版）
- **文档**：AGENTS.md、README 双语版、docs/design/ 相关设计文档需同步更新
- **风险**：大规模全量重写，需在独立分支长期进行；以"页面为单位 + 行为对等测试"控制风险
