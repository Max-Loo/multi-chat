## 1. 分支与工具链切换

- [x] 1.1 从 main 切出 `feat/vue3` 分支并推送，验证分支存在且与 main 一致
- [x] 1.2 替换依赖：移除 react/react-dom/react-redux/react-router-dom/@radix-ui/*（13 个）/react-i18next/lucide-react/sonner/next-themes/@tanstack/react-form/@tanstack/react-table/@reduxjs/toolkit/react-masonry-css/react-resizable-panels 及 babel-plugin-react-compiler，新增 vue/pinia/vue-router/reka-ui/@vueuse/core/vue-sonner/lucide-vue-next/@tanstack/vue-form/@tanstack/vue-table/splitpanes，验证 `pnpm install` 成功
- [x] 1.3 Vite 切换 `@vitejs/plugin-vue`，更新 manualChunks（vendor-react/redux/router 分组 → vue/pinia/vue-router/@vueuse/reka-ui 分组），保留 chunk-init 与 highlight.js 分包，验证 `pnpm web:build` 产出新分包
- [x] 1.4 tsconfig 移除 `jsx: react-jsx`，`pnpm tsc` 脚本替换为 `vue-tsc --noEmit`，验证类型检查命令可运行

## 2. 应用骨架与核心基础设施

- [x] 2.1 迁移入口：`main.tsx` → `main.ts`（保留顶层 await initSteps 与版本日志），`App.vue` 实现启动状态机（HTML Spinner → 初始化动画 → 主应用 + 错误重试界面），验证启动冒烟与 InitializationController 测试迁移通过
- [x] 2.2 迁移 `MainApp.vue` + `createMainApp` 工厂（动态加载重型依赖、初始化 warnings toast、静默刷新、安全警告、KeyRecoveryDialog 挂载），验证动态分包与 MainApp 测试迁移通过
- [x] 2.3 建立 vue-router 路由表（`/`→chat、model/table、setting/common 重定向、`/:pathMatch(.*)*` → 404、页面懒加载、dev-only toast-test、BASE_URL basename），迁移 `Layout.vue`（嵌套 RouterView），验证 `__test__/router/` 配置测试全部通过
- [x] 2.4 将 7 个 Redux slice 映射为 Pinia setup store（models/chat/chatPage/appConfig/modelProvider/settingPage/modelPage），以现有 `__test__/store/slices/` 测试断言为基准移植，验证 store 单测全部通过
- [x] 2.5 用 `watch`/`$subscribe` 重建 3 个持久化中间件语义（聊天列表、模型、语言偏好自动保存），以现有 middleware 测试为基准移植，验证持久化触发与防抖语义测试通过
- [x] 2.6 将 `store/selectors/` 迁移为 computed 工厂并接入各 store，验证 selectors 测试通过
- [x] 2.7 新增 `composables/useT.ts`（languageChanged 触发响应式更新），从 `services/i18n.ts` 移除 initReactI18next（其余逻辑零改动），验证现有 i18n 单测与 lint:i18n 通过、切换语言界面即时更新
- [ ] 2.8 搭建测试基建：引入 @testing-library/vue，重写 render helper（Pinia 注入替代 redux Provider）与 Vue 版 mocks（router/virtua/panelLayout/navigation/i18n/tauriCompat），验证 mock 自检测试通过

## 3. UI 基建与通用组件

- [ ] 3.1 落位 shadcn-vue 基础组件（button/input/label/textarea/checkbox/switch/radio-group/select/dialog/alert-dialog/dropdown-menu/popover/tooltip 等 + cn/cva 工具保留），验证 Tailwind v4 样式与迁移前视觉一致
- [ ] 3.2 落位 shadcn-vue 复杂组件（data-table/form/sheet/avatar/badge/card/pagination/progress/skeleton/spinner/table），验证组件可被页面正常引用编译
- [ ] 3.3 主题系统：next-themes → `useDark`，实测并对齐既有 localStorage 键与 light/dark/system 取值，验证迁移前保存的主题偏好被正确读取
- [ ] 3.4 重写 `ToasterWrapper` 为 vue-sonner（toastQueue 纯 TS 层不动），验证 toast 队列与集成测试通过
- [ ] 3.5 迁移纯逻辑 hooks → composables（useDebounce/useMediaQuery/useResponsive/useScrollContainer/useAdaptiveScrollbar/useAutoResizeTextarea/useDebouncedFilter），验证对应测试全部通过
- [ ] 3.6 迁移业务 composables（useConfirm/useNavigateToPage/useNavigateToExternalSite/useCreateChat/useCurrentSelectedChat/useExistingChatList/useExistingModels/useIsChatSending/useTypedSelectedChat/useResetDataDialog/useBasicModelTable），验证对应测试全部通过
- [ ] 3.7 迁移通用组件（AnimatedLogo/FatalErrorScreen/NoProvidersAvailable/Skeleton 系列/ProviderLogo/FilterInput/BottomNav/MobileDrawer/Sidebar/OpenExternalBrowserButton），验证组件测试全部迁移通过

## 4. Chat 页面迁移（最重页面）

- [ ] 4.1 迁移 ChatSidebar（ChatButton/ToolsBar）与 useBoard/useIsSending/useSelectedChat，验证组件与 hook 测试通过
- [ ] 4.2 迁移 Panel 布板（Header/Sender/Detail/Title/Grid/Skeleton），用 splitpanes 落地 Splitter 分栏并验证拖拽行为与迁移前对等
- [ ] 4.3 迁移消息渲染（ChatBubble/StreamingContent/ThinkingSection），markdown-it/highlight.js/dompurify 管线零改动接入，验证渲染测试与流式渲染性能测试通过
- [ ] 4.4 接入 `virtua/vue` 虚拟滚动，验证长列表滚动行为与 render 计数性能测试通过
- [ ] 4.5 迁移 ModelSelect（含 Skeleton），落地 masonry 方案（CSS columns 或 vue-masonry-wall），验证组件测试通过
- [ ] 4.6 组装 Chat 页面（Content/Placeholder/Chat/index），迁移 Chat 页面全部组件测试与 `__test__/pages/Chat/` 测试，验证页面级冒烟可用

## 5. Model 页面迁移

- [ ] 5.1 迁移 ModelTable（@tanstack/vue-table + data-table）与 ModelProviderDisplay，验证表格测试通过
- [ ] 5.2 迁移 EditModelModal 与 ModelConfigForm（@tanstack/vue-form），验证表单校验与提交测试通过
- [ ] 5.3 迁移 CreateModel（ModelHeader/ModelSidebar）与 ModelSelect，验证页面测试通过

## 6. Setting 与剩余页面迁移

- [ ] 6.1 迁移 GeneralSetting（LanguageSetting/AutoNamingSetting/ChatExportSetting），验证语言切换即时生效与设置测试通过
- [ ] 6.2 迁移 ModelProviderSetting 全套（ProviderCard 系列/ModelSearch/ModelList/ErrorAlert/ProviderHeader/ProviderGrid/ProviderMetadata），验证供应商卡片测试通过
- [ ] 6.3 迁移 KeyManagementSetting 与 KeyRecoveryDialog，验证密钥恢复集成测试通过
- [ ] 6.4 迁移 SettingSidebar/SettingHeader/ToastTest（dev-only）与 NotFound 页面，验证对应测试通过

## 7. 清理、门禁与验收

- [ ] 7.1 删除全部残留 React 文件（.tsx/旧 hooks/旧 store 绑定）与死代码，验证 knip 无未用导出
- [ ] 7.2 更新覆盖率配置（include 增加_src/**/*.vue、排除清单对齐 shadcn-vue 路径、分模块阈值不降），验证 `pnpm test:coverage` 达标
- [ ] 7.3 落定 lint 方案（oxlint 管 .ts；如 .vue 支持不足则引入 eslint-plugin-vue），验证 `pnpm validate`（lint + lint:i18n）通过
- [ ] 7.4 迁移全部集成测试（app-loading/auto-naming/bottom-nav/drawer-state/master-key-recovery/model-config/responsive-layout-switching/settings-change/toast-system），验证 `pnpm test:integration:run` 全部通过
- [ ] 7.5 评估性能（visualizer 对比 bundle 基线、流式渲染/虚拟列表性能测试）与 Stryker 变异测试范围，记录结论并调整配置
- [ ] 7.6 验证 React 依赖清零：package.json、锁定文件与依赖树中无任何 React 系直接/间接依赖
- [ ] 7.7 执行 `pnpm tauri build` 生产构建，桌面端手动冒烟：聊天收发、模型增删改、设置变更、主题切换、语言切换、数据重启恢复
- [ ] 7.8 同步文档：AGENTS.md、README 双语版、docs/design/ 相关设计文档，验证双语章节结构一致
- [ ] 7.9 对照 `specs/vue-frontend/spec.md` 逐场景核对验收，运行 `openspec validate migrate-react-to-vue3` 通过
