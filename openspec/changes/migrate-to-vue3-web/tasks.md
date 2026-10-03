# Tasks

> 实施顺序遵循 design.md 的 Migration Plan：先做框架无关的 Tauri 移除与存储收敛，再切换工具链，最后重写 UI 层。全程在独立分支进行，main 保持 React 版本可发布直至合并。

## 1. Tauri 移除与纯 Web 存储收敛（框架无关，先行）

- [x] 1.1 创建迁移分支，删除 `src-tauri/` 整目录与 `.github/workflows/build-and-release.yml`，验证 `git grep -i tauri` 仅剩源码 import 与配置引用（下一步处理）
- [x] 1.2 从 package.json 移除 `@tauri-apps/*`、`tauri-plugin-keyring-api`、`@tauri-apps/cli` 依赖并移除/合并脚本（`dev`→`vite`、`build`→类型检查+`vite build`、删除 `web:build:tauri`），验证 `pnpm install` 成功且 `pnpm web:dev` 可启动
- [x] 1.3 将 `tauriCompat` 的存储类模块迁移为 `src/utils/webStorage/`（store、keyring、keyringMigration、indexedDB、crypto-helpers、env），删除全部 `isTauri()` 双轨分支与 `@tauri-apps/*` import，自维护 `KeyringPublicAPI`/`StoreCompat` 类型（签名不变），验证 webStorage 相关单测（平移后）全部通过
- [x] 1.4 将 `http.ts` 简化为 `src/utils/fetchProvider.ts`（导出原生 fetch 与 `getFetchFunc`），`shell.ts` 拆为 `src/utils/openExternal.ts`，`os.ts` 的 `locale()` 并入 `services/global.ts`，更新全部消费方 import（masterKey、resetAllData、initSteps、providerFactory、modelRemote、global、storage/*、useNavigateToExternalSite），验证 `pnpm tsc` 通过
- [x] 1.5 清理 vite.config 的 `TAURI_DEV_HOST`、`src-tauri` ignore、`vendor-tauri` 分包与 `scripts/update-version.js` 的 tauri.conf.json/Cargo.toml 同步，验证 `pnpm web:build` 产出纯静态 `dist/` 且 `pnpm update-version` 仅更新 package.json
- [x] 1.6 按 `web-keyring-compat`/`web-store-compat`/`keyring-migration`/`http-fetch-compat` delta 规格核对行为：API 一致性场景、`isSupported()` 浏览器能力判断、keyring V1→V2 无条件迁移、安全性警告文案（引导导出备份、无"桌面版"表述），验证对应单测断言更新后通过

## 2. Vue 工具链切换

- [x] 2.1 引入 `vue`、`pinia`、`vue-router`、`@vitejs/plugin-vue`、`vue-tsc`、`@testing-library/vue`、`i18next-vue`、`@tanstack/vue-form`、`@tanstack/vue-table`、`lucide-vue-next`、`vue-sonner`、`@vueuse/core`，移除全部 React 依赖（react、react-dom、react-redux、@reduxjs/toolkit、react-router-dom、14 个 @radix-ui/*、react-i18next、@tanstack/react-*、lucide-react、sonner、next-themes、react-masonry-css、react-resizable-panels、@vitejs/plugin-react、babel-plugin-react-compiler、@testing-library/react、@types/react*），验证 `pnpm install` 后 lockfile 中无 react 字样且 `pnpm vue-tsc --noEmit` 可运行
- [x] 2.2 vite.config 切换 `@vitejs/plugin-vue`，重划 manualChunks（vendor-vue/pinia/router，删除 vendor-react/vendor-tauri，radix 并入 reka-ui chunk），保留 1420 端口与 API 代理，验证 `pnpm web:build` 成功且 visualizer 报告无 React chunk
- [x] 2.3 tsconfig 调整（jsx 配置移除、`.vue` 模块声明）、`pnpm tsc` 脚本语义改为 vue-tsc、oxlint 保留 `.ts/.js` 并新增 eslint + eslint-plugin-vue 处理 `.vue`（lint 脚本聚合两者），验证 `pnpm lint` 与 `pnpm tsc` 通过
- [x] 2.4 Vitest 配置切换 Vue 测试环境（@testing-library/vue + happy-dom），更新 `src/__test__/setup/` 与 helpers（render 挂载 Vue 组件、mock 工厂路径），验证最小冒烟测试（挂载空组件）通过

## 3. 框架无关层平移与测试基线

- [ ] 3.1 平移 `types/`、`services/`（chat、initialization、modelRemote、toast、global、i18n 核心）、`store/storage/`、`store/keyring/`、`utils/`（crypto、utils、a11y 等）到新结构（仅 import 路径调整；i18n.ts 换 i18next-vue 初始化），验证这些目录的既有单测平移后全部通过（绿基线）
- [ ] 3.2 按平移档恢复 services/store-storage/utils 的覆盖率统计与既有阈值，验证 `pnpm test:coverage` 中非 UI 模块达到阈值

## 4. Pinia 状态管理

- [ ] 4.1 将 7 个 Redux slice 转写为 7 个 Pinia setup store（state→ref、reducers→actions、selectors→computed，行为逐条对照原 slice），验证 store 单测（转写自 chatSlices 等测试）通过
- [ ] 4.2 将 3 个 Redux 监听中间件转写为各 store 内的持久化副作用（聊天保存、模型保存、语言保存），验证既有持久化相关测试（saveChatListMiddleware 等）的转写版通过
- [ ] 4.3 删除 `src/hooks/redux.ts`，全项目检索确认无 Redux 残留引用，验证 `pnpm tsc` 通过

## 5. shadcn-vue 组件库与基础 UI

- [ ] 5.1 用 shadcn-vue CLI 按 `components.json` 等价配置重新生成 28 个原子组件到 `src/components/ui/`，验证 `pnpm tsc` 通过且 Tailwind 样式令牌（亮/暗主题类）与迁移前一致
- [ ] 5.2 实现 `useDark` 主题切换（对齐 next-themes 的 localStorage 键与 class 策略）、vue-sonner 的 ToasterWrapper（保留 toastQueue 队列行为），验证主题切换持久化与 Toast 队列单测通过
- [ ] 5.3 重写框架性组件：Layout/Sidebar/BottomNav/MobileDrawer/AnimatedLogo/FatalErrorScreen/InitializationController/KeyRecoveryDialog/FilterInput/Skeleton/ProviderLogo/OpenExternalBrowserButton，验证对应组件测试重写后通过
- [ ] 5.4 实现自研分割面板组件（pointer events + flex）与 CSS columns 瀑布流替代 react-resizable-panels/react-masonry-css，验证面板拖拽与布局的组件测试通过

## 6. 路由与页面重写

- [ ] 6.1 用 vue-router 重建路由表（`/chat`、`/model/table`、`/model/add`、`/setting/common`、`/setting/key-management`、404、DEV toast-test，全懒加载、basename 取 BASE_URL），编写 `main.ts` 启动流程（initSteps → 初始化动画 → 挂载主应用、外链拦截），验证路由测试（转写自 router/ 目录 4 个测试）通过且子路径 `/multi-chat/` 部署路由正确
- [ ] 6.2 重写聊天域：Chat 页面与 `components/chat/`（ChatBubble、StreamingContent、ThinkingSection 等）、聊天相关 composables（16 个 hooks 中聊天相关部分），对照 `chat-flow-integration`/`custom-chat-components`/`message-operations` 等既有规格逐场景核对，验证聊天域组件/页面测试重写后通过
- [ ] 6.3 重写模型域：模型表格页（@tanstack/vue-table）与新增页（@tanstack/vue-form），对照 `model-management-ui-tests`/`provider-detail-view` 等规格核对，验证模型域测试重写后通过
- [ ] 6.4 重写设置域：通用设置页与密钥管理页（含导入/导出/验证流程），对照 `settings-change-integration`/`key-recovery-dialog` 等规格核对，验证设置域测试重写后通过
- [ ] 6.5 全站走查（对照迁移前界面逐页操作：新建/删除/重命名聊天、发送/流式/重新生成、模型增删改、语言/主题切换、导出），验证用户可见行为与迁移前等价、无控制台错误

## 7. 测试体系恢复

- [ ] 7.1 迁移 9 个集成测试（聊天主流程等）到 Vue 版（`vitest.integration.config.ts` 沿用），验证 `pnpm test:integration:run` 全部通过
- [ ] 7.2 恢复全部单测与分模块覆盖率阈值（composables 90%/services 80%/store 80%/utils 80%/components 70% 目录重映射），验证 `pnpm test:run` 与 `pnpm test:coverage` 达标
- [ ] 7.3 更新 Stryker 配置（mutate 列表按新目录与核心文件重映射）并小规模试跑，验证 `pnpm test:mutation` 可执行且得分不低于基线的合理折减（记录数值）

## 8. 收尾与文档

- [ ] 8.1 更新 AGENTS.md（技术栈、目录表、`hooks→composables`、lint 分工）、README.md 与 README.zh-CN.md（双语同步、纯 Web 定位、桌面版数据不可达说明）、docs/design 与 docs/conventions 中涉 React/Tauri 的文档，验证 `pnpm lint:i18n` 与文档索引链接通过
- [ ] 8.2 全局检索残留（`grep -ri "react\|tauri\|redux" src/ package.json`），确认仅剩必要的说明性文字；验证 `pnpm validate`（lint + i18n）与完整测试链 `pnpm test:basic:all` 通过
- [ ] 8.3 推送分支并对照 `vue3-frontend-architecture`/`web-only-platform` 新能力规格与全部 delta 规格逐条验收，发起 PR 供用户审查合并
