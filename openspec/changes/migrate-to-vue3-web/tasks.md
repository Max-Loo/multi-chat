# Tasks

## 1. 阶段 0：平台层收敛与 Tauri 移除（独立可发布，在 main 进行）

- [x] 1.1 修复 `openspec/specs/http-fetch-compat/spec.md` 主规格的历史遗留格式（`## ADDED Requirements` → `## Requirements`，补充 Purpose），并验证 `openspec validate "migrate-to-vue3-web"` 不再出现该规格的结构性 INFO 警告
- [x] 1.2 平台层收敛：`src/utils/tauriCompat/` 更名为 `src/platform/` 并删除全部 Tauri 分支（`http.ts` 恒用原生 fetch 且删除顶层 `createFetch` 环境选择；`store.ts`/`keyring.ts` 仅保留 IndexedDB 实现并自持类型定义；`os.ts` 返回 `navigator.language`；`shell.ts` 删除 `Command.create` 保留 `window.open`；`env.ts` 删除 `isTauri()`），验证 tauriCompat 相关既有测试迁移到 `@/platform` 路径后全部通过
- [x] 1.3 更新 10 个消费方（initSteps、useNavigateToExternalSite、providerFactory、global、modelRemote、masterKey、chatStorage、modelStorage、storeUtils、resetAllData）与测试 mock 的导入路径为 `@/platform`，验证 `pnpm test:run` 通过
- [x] 1.4 移除 Tauri 依赖与构建面：package.json 删除 `@tauri-apps/*` 5 项、`tauri-plugin-keyring-api`、devDeps `@tauri-apps/cli`；scripts 收敛（`dev`=`vite`、`build`=`tsc && vite build`、删除 `tauri`/`web:dev`/`web:build`/`web:build:tauri`、`deploy:gh-pages` 改用主 build）；删除 `src-tauri/` 目录；验证 `pnpm install && pnpm dev && pnpm build` 成功
- [x] 1.5 CI 与构建配置清理：删除桌面构建 workflow；`deploy-to-gh-pages.yml` 构建命令改 `pnpm build`；`update-version.js` 仅同步 package.json；vite.config.ts 移除 Tauri 约定（1420 strictPort、watch ignore `src-tauri`、`TAURI_DEV_HOST`、`vendor-tauri` 分包）与 radix 分包调整；`.oxlintrc.json` ignore 移除 `src-tauri`；验证推送 tag 后 gh-pages 部署成功且 Actions 中无桌面构建触发
- [x] 1.6 文档同步：AGENTS.md（技术栈/开发命令/架构描述/快速查找表）、README.md 与 README.zh-CN.md 双语同步、`docs/design/cross-platform.md` 重写为平台服务层说明、删除 `docs/conventions/tauri-commands.md`；手动修正主规格 Purpose 中"Tauri 和 Web 环境均正常运行"类双环境表述（web-keyring-compat、web-store-compat、gh-pages-auto-deployment）；验证 README 双语章节结构一致且 `pnpm lint:i18n` 通过
- [ ] 1.7 在 main 发布纯 Web 化的 React 版本并打版本 tag，验证 gh-pages 线上版本为纯 Web 构建（无 Tauri 分支），作为 Vue 迁移前的稳定基线

## 2. 阶段 1：Vue 脚手架与构建链切换（`feat/vue3-web` 分支）

- [ ] 2.1 对 main 的 React 最后版本打回退 tag（v0.5.x 系列），创建 `feat/vue3-web` 分支；安装 Vue 生态依赖（vue、pinia、vue-router、@vitejs/plugin-vue、vue-tsc、@vue/test-utils、i18next-vue、lucide-vue-next、vue-sonner、vue-resizable-panels、@tanstack/vue-table、reka-ui 等）并移除 React 依赖（react、react-dom、@reduxjs/toolkit、react-redux、react-router-dom、react-i18next、@radix-ui/* 14 项、@tanstack/react-form、@tanstack/react-table、lucide-react、sonner、next-themes、react-masonry-css、react-resizable-panels、babel-plugin-react-compiler、@vitejs/plugin-react、@testing-library/react）；验证 `pnpm install` 成功且 `pnpm ls react` 无结果
- [ ] 2.2 构建链切换：vite.config.ts 换 `@vitejs/plugin-vue` 并重写 manualChunks（vendor-vue/pinia/vue-router/reka-ui）；tsconfig 移除 jsx 选项并支持 `.vue`；`tsc` 相关脚本改 `vue-tsc --noEmit`；验证最小 Vue 应用（空白 App.vue 挂载）`pnpm dev` 与 `pnpm build` 成功
- [ ] 2.3 测试栈切换：vitest 配置适配 `.vue` 单文件组件，`@vue/test-utils` 就位并更新 `src/__test__/helpers/` 工厂与 mock；验证新增一个冒烟 Vue 组件测试通过
- [ ] 2.4 Lint 切换：`.oxlintrc.json` react 插件换 vue 插件并适配规则；验证 `pnpm lint` 通过

## 3. 阶段 2：服务层与状态层接入

- [ ] 3.1 入口与初始化迁移：`src/main.tsx` → `src/main.ts`（index.html Spinner → InitializationManager（原样保留）→ 动态挂载 `App.vue`，createApp 注册 pinia/router/i18n 绑定）；验证启动初始化各步骤行为与进度 UI 不变（init-progress-ui 相关既有测试等价迁移通过）
- [ ] 3.2 i18n 接入：`i18next-vue` 绑定替换 react-i18next，`services/i18n.ts` 核心与 24 个语言 JSON 原样保留；验证语言检测链、懒加载、缓存与 `pnpm lint:i18n` 通过（i18n 核心既有测试保留通过）
- [ ] 3.3 Pinia 状态迁移：7 个 slice 1:1 映射为 7 个 store（RootState 手写类型改 store 类型推导），3 个持久化 middleware（saveChatList/saveModels/saveDefaultAppLanguage）改为 store 订阅保存且**存储布局不变**（chat_index + chat_<id> 分键、模型 apiKey 加密字段、语言缓存键）；验证 chatStorage/modelStorage 既有测试通过
- [ ] 3.4 聊天 action 迁移：chatSlices 内 3 处 `streamChatCompletion` thunk 调用改为 Pinia async action，AbortSignal 与流式节流行为不变；验证 chat 服务层既有测试通过
- [ ] 3.5 框架无关测试全绿：适配 mock 导入路径后运行 `pnpm test:run && pnpm test:integration:run`，全部通过

## 4. 阶段 3：UI 层逐域迁移

- [ ] 4.1 UI 基建：28 个 shadcn/ui 组件迁移为 shadcn-vue（reka-ui 内核，样式 class 复用）；自研 `useTheme` composable 替代 next-themes（localStorage 主题键兼容既有用户设置，实测确认键名，见 design 开放问题）；验证对话框/下拉/表单的键盘导航与焦点管理等可访问性行为符合 component-accessibility 既有规格
- [ ] 4.2 Layout 与路由域：Layout、Sidebar、BottomNav、MobileDrawer、TopBar 及 vue-router 路由树等价迁移（`/`→chat、`/model`→table、`/setting`→common 索引重定向、`*`→/404 兜底、DEV-only toast-test、BASE_URL basename、路由懒加载）；验证 vue3-frontend 规格「URL 路由结构兼容」全部场景（含 `/multi-chat/` 子路径直接访问与刷新）
- [ ] 4.3 Chat 域迁移：19 个页面文件与 chat 组件、16 个 hooks → composables（流式渲染、推理内容、代码块高亮与复制、virtua Vue 版虚拟滚动、自动命名、移动端抽屉与自适应侧栏）；验证 vue3-frontend 规格「聊天核心流程回归可用」场景，且 chat-panel/chat-sidebar/mobile-drawer/responsive-chat-button 等既有行为测试以 Vue 测试栈等价重写并通过
- [ ] 4.4 Model 域迁移：9 个页面文件（表格换 @tanstack/vue-table、表单用自研 composable、模型 apiKey 字段经主密钥加密读写）；验证 model-management/model-provider-display 等既有行为测试等价重写并通过
- [ ] 4.5 Setting 域迁移：20 个页面文件（常规设置、密钥管理含导出/导入/恢复对话框、数据重置）；安全警告改用新文案（"Web 版本使用浏览器本地加密存储，安全级别有限，建议定期导出主密钥并妥善备份"，沿用 `multi-chat-security-warning-dismissed` 键）；验证 web-keyring-compat 增量规格警告场景与 settings-change 相关测试等价重写通过
- [ ] 4.6 收尾组件：NotFound、Skeleton、AnimatedLogo、Toast 队列（vue-sonner，保留 toastQueue 封装）、瀑布流改 CSS columns、vue-resizable-panels；验证 toast-queue/mobile-toast 既有行为测试等价重写通过

## 5. 阶段 4：清理、回归与发布

- [ ] 5.1 死代码清理：knip 扫描并移除未用导出与残留 React 文件（main.tsx、MainApp.tsx 等）；验证 `pnpm analyze:unused` 无未用项且构建产物中无 react 引用（符合 vue3-frontend 规格「Vue 3 组合式 API 技术栈」场景）
- [ ] 5.2 变异测试恢复：按新文件路径重建 stryker.config.json 的 mutate 清单与 vite.config.ts 覆盖率排除清单（移除已失效的 tauriCompat 系统依赖排除项）；验证 `pnpm test:mutation` 通过
- [ ] 5.3 数据兼容验证：使用阶段 0 前的构建产物创建用户数据（IndexedDB `multi-chat-store`/`multi-chat-keyring` + localStorage 全部键），Vue 版启动验证聊天列表、模型配置（含加密 apiKey 解密）、界面语言、主题、安全警告 dismissed 状态全部延续；验证 vue3-frontend 规格「既有用户数据免迁移兼容」全部场景
- [ ] 5.4 全量回归与 CORS 文档化：`pnpm test:all` 通过，手动回归聊天全流程（创建/流式/停止/重生成/命名/删除/导出）；README 双语与错误提示中明确生产环境 CORS 限制（对应 http-fetch-compat 增量规格的 REMOVED Migration 说明）
- [ ] 5.5 文档与规格终态：AGENTS.md（Vue3 架构/命令/查找表）、README 双语、docs/ 全面更新；核对主规格无残留双环境表述；验证 `openspec validate "migrate-to-vue3-web" --strict` 通过
- [ ] 5.6 合并发布：`feat/vue3-web` 合入 main 并打新版本 tag；验证 gh-pages 自动部署成功、线上版本为 Vue 构建、Actions 中无桌面构建 workflow（对应 gh-pages-auto-deployment 增量规格）
