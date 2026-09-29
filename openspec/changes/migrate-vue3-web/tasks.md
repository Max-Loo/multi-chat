# Tasks

## 1. 阶段 1：移除 Tauri 运行时（独立可交付，先行合入 main）

- [ ] 1.1 删除 `src-tauri/` 目录与 `@tauri-apps/*`、`tauri-plugin-keyring-api`、`@tauri-apps/cli` 依赖；`package.json` 中 `dev`/`build` 改为 `vite`/`vite build`，删除 `tauri`、`web:build:tauri` scripts；验证 `pnpm install && pnpm dev` 正常启动且 lockfile 无 tauri 条目
- [ ] 1.2 按 design D2 溶解 `src/utils/tauriCompat/`：`keyring.ts`/`keyringMigration.ts` 迁至 `src/utils/keyring/`，`store.ts` 迁至 `src/utils/webStore/`，共享函数迁至 `src/utils/webCommon/`，删除 `http.ts`/`os.ts`/`shell.ts` 与 `isTauri()` 分支；验证 `pnpm tsc` 通过
- [ ] 1.3 更新 16 个调用点（`config/initSteps.ts`、`services/chat/providerFactory.ts`、`services/modelRemote/index.ts`、`services/global.ts`、`store/keyring/masterKey.ts`、`store/storage/*`、`utils/resetAllData.ts`、`hooks/useNavigateToExternalSite.ts`）：网络请求改全局 `fetch`、外链改 `window.open`、语言检测改 `navigator.language`；验证各文件对应单测通过
- [ ] 1.4 迁移测试 mock 基建：`src/utils/tauriCompat/__mocks__/` 与 `src/__test__/helpers/mocks/tauriCompat.ts` 改指向新模块；验证 `pnpm test:run && pnpm test:integration:run` 全绿
- [ ] 1.5 在 main 打 tag `last-react-tauri`（React + 纯 Web 状态），阶段 1 合入 main；验证 gh-pages 预览部署正常

## 2. 阶段 2：Vue 3 基础设施（`feat/vue3-web` 分支）

- [ ] 2.1 创建 `feat/vue3-web` 分支；安装 Vue 生态依赖（vue、pinia、vue-router、vue-i18n、reka-ui、lucide-vue-next、vue-sonner、@tanstack/vue-form、@tanstack/vue-table、splitpanes、virtua 保留），移除 React 依赖与 `@vitejs/plugin-react`、`babel-plugin-react-compiler`；验证 `pnpm install` 成功
- [ ] 2.2 改造 `vite.config.ts`：换用 `@vitejs/plugin-vue`，删除 `TAURI_DEV_HOST`，`packageChunkMap` 更新为 Vue 生态映射（design D7）；验证 `pnpm build` 产出 chunk 分组正确（visualizer 报告核对）
- [ ] 2.3 配置 vue-tsc 与工具链：`build` script 改 `vue-tsc --noEmit && vite build`，tsconfig 纳入 `.vue` 类型，oxlint/knip 配置覆盖 `.vue` 与新依赖；验证 `pnpm tsc`（vue-tsc）与 `pnpm lint` 通过
- [ ] 2.4 新建 Vue 入口：`src/main.ts`（替代 `main.tsx`）装配 pinia、router、i18n，`index.html` 挂载点更新；验证空壳应用 `pnpm dev` 可渲染
- [ ] 2.5 将 7 个 Redux slice 转换为 Pinia store（design D3：selectors → computed，持久化在 action 内显式调用 chatStorage/modelStorage/语言存储）；验证 store 层单测（迁移 `src/__test__/store/`）通过
- [ ] 2.6 重写 i18n 初始化为 vue-i18n（design D6）：语言检测、按需加载、缓存、持久化平移，复用 `src/locales/` JSON；审计复数键语法差异并修正；验证 `pnpm lint:i18n` 与 i18n 相关规格场景（`i18n-lazy-loading`、`language-detection`）测试通过
- [ ] 2.7 以 shadcn-vue（Reka UI）重建 28 个基础组件至 `src/components/ui/`（design D5），保留项目自有封装（password-input、data-table、form 等）的差异适配；验证基础组件测试与 `component-accessibility` 场景通过
- [ ] 2.8 重建路由：vue-router `createWebHistory` + BASE_URL basename，路由表与懒加载逐一平移（含 dev-only toast-test 路由与 404）；验证路由相关规格场景（`chat-redirect-on-not-found` 等）通过
- [ ] 2.9 重建测试基建：`createTestingPinia` 渲染工厂（替代 `render/redux.tsx`）、memory-history router mock、vue-i18n 测试实例、virtua Vue mock；验证示例组件测试在基建上运行通过

## 3. 阶段 3：布局与导航骨架

- [ ] 3.1 迁移 `Layout`、`Sidebar`、`BottomNav`、`MobileDrawer`、`Splitter`（splitpanes 替换 react-resizable-panels）；验证 `adaptive-sidebar`、`bottom-navigation`、`mobile-drawer` 规格场景通过
- [ ] 3.2 迁移初始化链路：`InitializationController`、`FatalErrorScreen`、`KeyRecoveryDialog`、`AnimatedLogo`、Skeleton 组件与 `config/initSteps.ts` 接线；验证 `init-progress-ui`、`master-key-recovery.integration` 场景通过
- [ ] 3.3 迁移通用组合式函数：17 个 hooks → composables（useDebounce、useResponsive、useMediaQuery、useScrollContainer、useAutoResizeTextarea、useAdaptiveScrollbar 等）+ 自研 `useTheme`；验证对应 hooks 测试（`src/__test__/hooks/`）平移后通过
- [ ] 3.4 迁移 Toast 体系：`vue-sonner` 替换 sonner、ToasterWrapper 重写、services/toast 队列逻辑平移；验证 `toast-api`、`toast-queue-unit-tests`、`mobile-toast` 场景通过

## 4. 阶段 4：Chat 页（核心）

- [ ] 4.1 迁移聊天侧栏：ChatSidebar、ChatButton、ToolsBar（virtua Vue 虚拟列表）；验证 `chat-sidebar-testing`、`responsive-chat-button` 场景通过
- [ ] 4.2 迁移面板容器：Panel、Grid、Header、Placeholder、Splitter 集成；验证 `chat-panel-testing`、`masonry-layout`（CSS multi-column 替换 react-masonry-css）场景通过
- [ ] 4.3 迁移消息渲染：ChatBubble、StreamingContent、ThinkingSection、markdown/highlight/dompurify 渲染链路平移；验证 `chat-raw-data-preservation`、`streaming-render-perf-tests`、`code-block-copy` 场景通过
- [ ] 4.4 迁移发送器与输入：Sender、useCreateChat、useTypedSelectedChat 等聊天组合式函数（AI SDK 服务层不动）；验证 `sender-form-submit`、`chat-flow-integration`、`auto-naming.integration` 场景通过
- [ ] 4.5 迁移模型选择组件：ModelSelect（Chat 页与 Model 页共用的选择器）；验证 `model-select-testing` 场景通过

## 5. 阶段 5：Model 页与 Setting 页

- [ ] 5.1 迁移 Model 页容器与表格：ModelTable、EditModelModal（@tanstack/vue-table 替换）、分页；验证 `model-management-ui-tests`、`shadcn-pagination` 场景通过
- [ ] 5.2 迁移模型创建/编辑表单：CreateModel、ModelConfigForm（@tanstack/vue-form 替换）、ModelSidebar、ModelHeader；验证 `model-config-integration` 场景通过
- [ ] 5.3 迁移 Setting 页通用与供应商设置：SettingHeader、SettingSidebar、GeneralSetting、ModelProviderSetting 全部子组件（ProviderCard 系列、ModelSearch、ModelList）、ProviderLogo；验证 `settings-change-integration`、`provider-logo-display`、`provider-detail-view` 场景通过
- [ ] 5.4 迁移设置页其余组件：LanguageSetting、AutoNamingSetting、ChatExportSetting、KeyManagementSetting、ToastTest、NotFound 页；验证 `french-i18n`、`key-management-card-layout` 场景通过

## 6. 阶段 6：工程收尾

- [ ] 6.1 清理 React 残留：删除全部 `.tsx` 文件与 `MainApp.tsx`，grep 确认无 react/@radix/lucide-react 引用；验证 `pnpm validate` 与依赖树检查（`pnpm why react` 报不存在）
- [ ] 6.2 测试与覆盖率收账：迁移剩余集成/性能/基线测试，恢复全部 vitest workspace 配置；验证 `pnpm test:all`（含 mutation）在既有 `coverage-threshold-policy` 阈值下通过
- [ ] 6.3 清理死代码与配置：knip 未用导出清零、stryker 配置更新、`vite.config.ts` chunk 复核、`src/@types` 类型声明更新；验证 `pnpm analyze:unused` 无报告项
- [ ] 6.4 全量行为回归：执行既有规格场景映射的测试全集（组件 + 集成 + mutation），核对 `vue3-frontend` 规格全部需求（组件形态、行为对等、依赖清零、工作流）；验证四类命令 `pnpm dev/build/test:run/test:integration:run` 全绿

## 7. 阶段 7：文档与发布

- [ ] 7.1 更新文档：AGENTS.md（技术栈、快速查找表、行数复核 ≤250）、改写 `docs/design/cross-platform.md` 为 Web 专用实现、删除 `docs/conventions/tauri-commands.md`、`docs/README.md` 索引同步；验证文档内无 tauriCompat/React 引用
- [ ] 7.2 README 双语同步更新（安装、开发、部署说明，章节结构中英一致）；验证 `readme-i18n` 检查通过
- [ ] 7.3 发布验收：CHANGELOG 记录 BREAKING（桌面端下线、主密钥存储降级说明与数据迁移指引），gh-pages 自动部署触发并验证深链接/刷新可用（`gh-pages-auto-deployment`、`web-only-runtime` 规格）；验证线上冒烟：创建聊天 → 流式回复 → 刷新后数据仍在
- [ ] 7.4 合并 `feat/vue3-web` 至 main 并打版本 tag；验证 main 上 `pnpm build` 与部署流水线全绿
