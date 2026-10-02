# Tasks

## 1. 阶段一：依赖与构建链清理（Tauri 移除）

- [x] 1.1 从 `package.json` 移除 Tauri 相关依赖（`@tauri-apps/cli`、`@tauri-apps/plugin-http/os/shell/store`、`tauri-plugin-keyring-api`）；验证 `pnpm install` 成功且 `pnpm why @tauri-apps` 无结果
- [x] 1.2 删除 `src-tauri/` 目录；验证目录不存在且构建不再引用（含桌面构建工作流 `build-and-release.yml` 与 `update-version.js` 的 src-tauri 引用）
- [x] 1.3 收敛 `package.json` scripts：`dev` → `vite`、`build` → `tsc && vite build`、`preview` 保留，移除 `tauri`/`web:dev`/`web:build`/`web:build:tauri` 双轨脚本（`deploy:gh-pages` 改用新 build）；验证 `pnpm dev` 启动 Vite dev server、`pnpm build` 产出 `dist/`
- [x] 1.4 清理 `vite.config.ts` 中 Tauri 痕迹（`TAURI_DEV_HOST` 等）；验证构建通过且无相关告警

## 2. 阶段一：tauriCompat 兼容层收敛为纯 Web 实现

- [x] 2.1 `env.ts` 删除 `isTauri`（保留 `isTestEnvironment`/`getPBKDF2Iterations` 及缓存行为），移除全部调用点；验证 `grep -r "isTauri" src/` 无匹配、`tauri-compat-env-testing` 相关测试通过
- [x] 2.2 `store.ts` 删除 `TauriStoreCompat` 原生分支，Web（IndexedDB）实现成为唯一实现，`createLazyStore`/`StoreCompat` 导出签名不变；验证 `web-store-compat`、`indexeddb-init-testing` 相关测试通过
- [x] 2.3 `keyring.ts` 删除 Tauri 原生分支，Web（IndexedDB + AES-256-GCM）实现成为唯一实现，`keyring` 实例与 `KeyringPublicAPI` 导出不变；验证 `web-keyring-compat`、`keyring-public-api`、`keyring-migration` 相关测试通过
- [x] 2.4 `shell.ts`/`os.ts` 收敛为纯 Web 实现（`window.open` 封装、`navigator.language`），保留 `isSupported()` 能力检测语义；验证 `shell`/`os-locale-compat` 相关测试通过
- [x] 2.5 删除 `http.ts` fetch 包装层，全部调用点（`providerFactory`、`modelRemote`、`global.ts`、`resetAllData.ts`、`initSteps.ts`、storage 层等）改用全局 `fetch` 或移除注入；验证 `grep -r "tauriCompat/http\|getFetchFunc" src/` 无匹配、类型检查与相关测试通过

## 3. 阶段一：验证、文档与规格卫生

- [x] 3.1 全量验证：`pnpm lint`、`pnpm tsc`、`pnpm test:run`、`pnpm build` 全部通过
- [x] 3.2 浏览器冒烟：`pnpm dev` 启动后聊天发送、语言切换、模型列表加载、外链打开均正常（阶段二 Vue 版浏览器走查覆盖同一验收路径）
- [x] 3.3 文档同步：AGENTS.md 移除 Tauri/桌面相关描述、`docs/design/cross-platform.md` 标注纯 Web 收敛、README 双语同步（开发命令变化）；验证文档中无 `tauri dev` 等失效指引
- [x] 3.4 规格卫生：清理 `web-keyring-compat`、`web-store-compat`、`tauri-compat-*` 等 spec 中已失效的 Tauri 分支场景；验证 `openspec validate` 通过且无 Tauri 双栈需求残留

## 4. 阶段二：Vue3 基础设施（独立分支）

- [x] 4.1 创建迁移分支；引入 `vue`、`vue-router`、`pinia`、`@vitejs/plugin-vue`、`vue-tsc`、`@testing-library/vue`；验证最小 Vue 组件挂载渲染成功
- [x] 4.2 调整 `vite.config.ts`（plugin-vue、manualChunks 更新为 vue/pinia/router 分组）与 `tsconfig`（移除 JSX 随 10.2 React 摘除后执行，当前以 `*.vue` 模块声明保证共存期 tsc 可用）；验证 `vue-tsc --noEmit` 通过
- [x] 4.3 i18n 改造：`services/i18n.ts` 移除 `initReactI18next`，实现 `useTranslation` 组合式函数（`languageChanged` 事件驱动响应式更新）；验证语言切换响应性单元测试通过
- [x] 4.4 实现主题 `useTheme` 组合式函数（`dark` class 策略 + localStorage 持久化 + 系统偏好跟随）；验证主题切换测试通过

## 5. 阶段二：应用骨架

- [x] 5.1 重写 `main.ts` 四阶段入口（顶层 `await import(initSteps)` → 初始化控制器 Vue 组件 → `FatalErrorScreen` → 动态加载主应用）；验证初始化流程测试与错误界面测试通过（浏览器实测完整启动链路；initSteps 测试已迁移为 Pinia 语义 8/8 通过）
- [x] 5.2 `router/` 重写为 vue-router（chat/model/setting/404、路由懒加载、`BASE_URL` basename 处理、聊天选中 URL 同步）；验证路由测试（页面可达、刷新恢复会话、未匹配路由）通过（三场景均经浏览器实测：/chat?chatId 刷新恢复、未知路径重定向 /404）
- [x] 5.3 Redux slices 迁移为 Pinia stores（appConfig/chatPage/chat/modelPage/modelProvider/model/settingPage 七个）+ middleware 行为映射（chat/model/appConfig）；验证既有 store 语义测试迁移后全部通过
- [x] 5.4 迁移 Layout/Sidebar/TopBar/BottomNav/MobileDrawer；验证导航、抽屉、响应式布局测试通过（浏览器实测桌面侧栏与移动端 BottomNav/汉堡菜单布局；Sheet 组件交互有专项测试）

## 6. 阶段二：UI 基础组件库（Reka UI）

- [x] 6.1 重写 `src/components/ui/` 全部组件（button/dialog/dropdown-menu/select/popover/tooltip/form/table 等 27 个），导出 API 与 props 语义对齐旧版；验证交互测试（对话框键盘导航与焦点陷阱、下拉键盘选择、ARIA 属性）通过（Reka UI 版交互测试 7/7 通过，浏览器全组件实际使用）
- [x] 6.2 Toast 体系迁移：vue-sonner 渲染组件 + 既有 `toastQueue` 服务对接；验证 `toast-api`/`mobile-toast` 相关测试通过（toastQueue 测试切 vue-sonner 后全部通过；浏览器实测 Toast 弹出）
- [x] 6.3 布局型组件替换：resizable（Reka Splitter/paneforge 语义）、masonry（自研 round-robin 分列组件，min-width 断点按 spec 实现）、虚拟滚动（virtua Vue 版）；验证 `virtual-scroll`/`masonry-layout` 对应场景验收通过（Masonry 测试 7/7；聊天列表 VList 与消息 Virtualizer 浏览器实测）

## 7. 阶段二：Chat 页面纵向切片

- [x] 7.1 迁移 Chat 页面组件树（消息列表流式渲染、发送输入、消息操作、会话自动命名、聊天导出、自定义聊天组件）；验证流式渲染与消息操作测试通过（浏览器实测：发送消息、用户气泡渲染、复制/编辑/重新生成按钮、刷新恢复；流式渲染逻辑复用框架无关服务层）
- [x] 7.2 迁移 Chat 相关 hooks 为 composables（useCreateChat/useCurrentSelectedChat/useExistingChatList/useSelectedChat/useIsSending/useBoard 等）；验证对应测试通过（对应 store/composable 测试套件全部通过）
- [x] 7.3 迁移 Chat 测试套件（`__test__/pages/Chat`、chat 面板与侧栏测试）；验证 `pnpm test:run` 中 chat 相关全部通过（16 个测试文件 159 个用例全部通过：ChatPage/ChatSidebar/ChatButton/ToolsBar/Detail/Title/Grid/Splitter/PanelSkeleton/Header/Sender/ChatPanel/Content/Placeholder/composables/应用级 Sidebar；迁移中发现并修复两个 Vue 版迁移回归：useDebouncedFilter 初始值为空数组致首屏闪空、Detail 流式自动跟随 watch 缺深度监听致流式更新不触发跟随）

## 8. 阶段二：Model 页面纵向切片

- [x] 8.1 迁移 Model 页面（供应商卡片与详情、`@tanstack/vue-table` 模型表格、`@tanstack/vue-form` 创建表单、远程模型获取入口）；验证模型管理交互测试通过（浏览器实测：模型表格、编辑/删除气泡、创建表单 zod 校验、Setting 供应商瀑布流远程数据）
- [x] 8.2 迁移 Model 测试套件；验证 `pnpm test:run` 中 model 相关全部通过（7 个测试文件 43 个用例全部通过：CreateModel/ModelHeader/ModelSidebar/ModelTable/ModelProviderDisplay/EditModelModal/ModelSelect；迁移中发现并修复两个 Vue 版迁移回归：ModelTable 删除确认气泡 trigger 用命名插槽致删除按钮不可渲染（UI 删除功能不可用）、ModelSelect 误用 error.value 致无错误时渲染崩溃）

## 9. 阶段二：Setting 页面纵向切片

- [x] 9.1 迁移 Setting 页面（通用设置、语言/主题切换、密钥管理与恢复对话框、数据重置、dev toast 测试页）；验证设置变更即时生效测试通过（浏览器实测：语言切换即时生效于全站文案、供应商刷新、密钥导出对话框渲染）
- [x] 9.2 迁移 Setting 测试套件；验证 `pnpm test:run` 中 setting 相关全部通过（14 个测试文件 86 个用例全部通过：SettingPage/SettingSidebar/SettingHeader/GeneralSetting/LanguageSetting/AutoNamingSetting/ChatExportSetting/ModelProviderSetting/ErrorAlert/ProviderCard/ProviderHeader/ProviderGrid/ProviderCardDetails/ProviderCardSummary+Metadata/KeyManagementSetting；迁移中发现并修复第 4 个迁移回归：useDebounce 丢失定时器清理致防抖失效）

## 10. 阶段二：React 摘除与全量验证

- [x] 10.1 移除 React 生态依赖（react/react-dom/@radix-ui/*/@reduxjs/toolkit/react-redux/react-router-dom/@tanstack/react-form/@tanstack/react-table/lucide-react/sonner/next-themes/react-masonry-css/react-resizable-panels/@vitejs/plugin-react/babel-plugin-react-compiler/@testing-library/react）；验证 `pnpm why react` 无结果、`pnpm install` 与构建成功（react 仅剩 virtua 的 peer 声明，已配 ignoreMissing；产物无 React 运行时）
- [x] 10.2 删除残留 .tsx/JSX 文件与 `hooks/redux.ts`；验证 `grep -r "from \"react\"\|from 'react'" src/` 无匹配（src 下 0 个 .tsx、0 处 react 导入）
- [x] 10.3 更新 `src/__test__/README.md` 测试规范与 mock 工厂文档，恢复 stryker 全量范围并复核覆盖率阈值；验证 `pnpm test:all` 按新配置可执行（stryker mutate 范围迁移至 stores/composables 路径；README 重写为 Vue 测试规范）
- [x] 10.4 全量验证：`pnpm lint`、`pnpm lint:i18n`、`vue-tsc --noEmit`、`pnpm test:run`、`pnpm build` 全部通过（lint 0 错误、翻译完整、1030 测试通过、构建成功）
- [x] 10.5 浏览器冒烟走查 spec 验收场景：流式聊天、自动命名、模型管理与远程获取、设置即时生效、语言切换即时刷新、旧数据兼容读取（IndexedDB 既有聊天/模型/密钥可用）（已验证：发送/刷新恢复/语言切换/设置即时生效/旧数据兼容 + 真实浏览器 e2e 补验：流式 AI 回复内容逐步渲染（5 个递增采样点）、Markdown 粗体/代码块、自动命名（命名请求触发且标题更新）、刷新后会话/消息/代码块完整恢复、零 pageError；走查中发现并修复两个回归：PasswordInput 缺 v-model 同步致创建模型表单校验永远失败（4.1 任务附测试）、store.set 写入响应式 Proxy 抛 DataCloneError 致聊天数据持久化静默失败，已分别在 set 入口规范化）
- [ ] 10.6 合并主干并验证 `deploy:gh-pages` 部署产物可访问（含 history 深链刷新回退）（已完成：本地 main 合并 feat/vue3-migration（--no-ff，含 origin/main 全部提交无分叉）；`pnpm deploy:gh-pages` 构建并发布成功；线上真实验证 4 项全过——首页可访问、深链 /chat 与 /setting/common 直达恢复、/chat 刷新回退、零 pageError（GitHub Pages 404.html → sessionStorage → replaceState 机制）；遗留：仓库规则禁止直接 push main，feat 分支已推送，需在 GitHub 创建并合并 PR（https://github.com/Max-Loo/multi-chat/compare/main...feat/vue3-migration?expand=1），合并后部署产物即与主干一致）
