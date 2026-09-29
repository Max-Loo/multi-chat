# Tasks

## 1. 迁移基线固化（Phase 0）

- [x] 1.1 在 main 上运行 `pnpm validate && pnpm test:basic:all && pnpm web:build` 并记录结果（测试数量、通过率、构建产物体积）作为迁移基线，基线不绿先修复再迁移
- [x] 1.2 用 `rollup-plugin-visualizer` 产出当前 `web:build` 的体积分析报告并存档（`dist/stats.html` 或等价物），作为 Phase 2 体积对比基线

## 2. Phase 1：纯 Web 化（React 上移除 Tauri）

- [ ] 2.1 新建分支 `feat/pure-web`；将 `src/utils/tauriCompat/` 更名为 `src/utils/webRuntime/`（含 `__mocks__`），全局替换导入路径 `@/utils/tauriCompat` → `@/utils/webRuntime`，验证 `pnpm tsc` 与测试通过
- [ ] 2.2 收敛 `webRuntime/env.ts`：删除 `isTauri()`，保留 `isTestEnvironment()`、`getPBKDF2Iterations()` 与 PBKDF2 常量；更新对应测试（删除 isTauri 测试，见 specs/tauri-compat-env-testing delta），验证 `pnpm test:run` 通过
- [ ] 2.3 收敛 `webRuntime/http.ts`：删除 `@tauri-apps/plugin-http` 动态导入与环境分支，`fetch`/`getFetchFunc` 收敛为原生 `window.fetch` 薄封装，保留导出形状与 `RequestInfo` 类型；更新 http 相关测试并通过
- [ ] 2.4 收敛 `webRuntime/shell.ts` 与 `os.ts`：删除 Tauri 原生分支，`Command` 保持 Null Object、`shell.open()` 用 `window.open()`、`locale()` 用 `navigator.language`；`ChildProcess` 等类型改为项目内定义；更新测试并通过
- [ ] 2.5 收敛 `webRuntime/store.ts`、`keyring.ts`、`keyringMigration.ts`、`crypto-helpers.ts`、`indexedDB.ts`：删除各 Tauri 分支与 `@tauri-plugin-keyring-api` 引用，Web 实现成为唯一路径；跑 keyring/crypto/storage 相关全部测试（`src/__test__` 对应用例）通过
- [ ] 2.6 删除 `src-tauri/` 目录与 Tauri 配置（`tauri.conf.json`、capabilities 等）；从 `package.json` 移除 `@tauri-apps/*`、`@tauri-apps/cli`、`tauri-plugin-keyring-api` 依赖，删除 `tauri`/`web:dev`/`web:build:tauri` 脚本并将 `dev`/`build` 指向 Vite 命令；验证 `pnpm install && pnpm dev && pnpm build` 成功
- [ ] 2.7 清理代码中残留的 Tauri 引用：全局搜索 `__TAURI__`、`@tauri-apps`、`isTauri`、`tauriCompat` 确认无匹配；`pnpm validate && pnpm test:basic:all` 全绿
- [ ] 2.8 更新文档：AGENTS.md（项目概述、架构、快速查找表中的 Tauri 描述改为纯 Web 运行时）、README.md 与 README.zh-CN.md（双语同步，标注 BREAKING：桌面版停止发布、CORS 约束说明）、`docs/design/cross-platform.md` 等相关 docs；验证 `pnpm lint:i18n` 通过
- [ ] 2.9 用 `BASE_PATH=/multi-chat/ pnpm build && gh-pages` 流程在预发验证 gh-pages 部署可用（或验证 deploy 脚本 dry-run），确认子路径构建产物正确
- [ ] 2.10 合并 Phase 1 分支至 main 并发布版本（`v0.6.0`），发布说明包含 BREAKING 声明与桌面用户迁移指引

## 3. Phase 2：Vue 3 工程基建

- [ ] 3.1 新建长分支 `feat/vue3-migration`；安装 `vue`、`pinia`、`vue-router`、`@vueuse/core`、`reka-ui`、`lucide-vue-next`、`vue-sonner`、`@vitejs/plugin-vue`、`vue-tsc`、`@testing-library/vue`（及 `@tanstack/vue-table`、`@tanstack/vue-form`）；验证 `pnpm install` 成功
- [ ] 3.2 配置构建与类型链：`vite.config.ts` 换用 `@vitejs/plugin-vue`、manualChunks 重排（vendor-vue/vendor-router 等，见 design D7）；`tsconfig` 增加 `.vue` 支持并将 `tsc` 脚本切到 `vue-tsc --noEmit`；验证一个最小 `.vue` 组件可构建且类型检查通过
- [ ] 3.3 配置 lint 与测试基建：oxlint 覆盖 `.ts`；若 oxlint 对 `.vue` 支持不足则引入 eslint + eslint-plugin-vue 仅处理 `.vue` 并在 `pnpm lint` 聚合；vitest 配置适配 Vue SFC 与 `@testing-library/vue`；验证示例组件测试可运行
- [ ] 3.4 实现入口骨架：`main.ts`（`createApp` 挂载 + 顶层 await 加载 initSteps）、`App.vue`（三阶段状态机：loading → initializing → ready + 错误界面与重试）、`InitializationController.vue`（进度动画与三级错误处理，行为对齐现有组件）；验证启动流程测试对齐 `vue3-app-framework` spec 的启动场景
- [ ] 3.5 迁移 Pinia：按 design D2 将 7 个 Redux slices 转为 7 个 Pinia store，selector 转 getter，3 个持久化 middleware 转为订阅/显式持久化调用（持久化目标与时机不变）；为每个 store 迁移/重写单测并全部通过
- [ ] 3.6 实现路由：vue-router 路由表 1:1 迁移（index 重定向、嵌套 children、404 兜底、DEV-only toast-test、BASE_PATH basename），页面组件懒加载；验证 `chat-deletion-url-sync`、`chat-redirect-on-not-found` 相关行为测试通过
- [ ] 3.7 实现 i18n 桥接：`composables/useI18n.ts`（t 函数、computed 语言、languageChanged 订阅），保留 i18next 核心/资源/加载器/校验脚本；验证语言切换实时生效与 `pnpm lint:i18n` 通过
- [ ] 3.8 搭建 UI 底座：迁移 `cn`/`cva` 工具与 Tailwind 配置（应无需改动，确认即可），按 shadcn-vue/reka-ui 重写 28 个 `components/ui/` 基础组件（button、input、dialog、select、dropdown-menu、alert-dialog、table、data-table、form 等逐个移植并保留类名与可访问性行为）；每个组件附最小渲染测试

## 4. Phase 2：页面域迁移（每域完成即测试通过）

- [ ] 4.1 迁移 `hooks/` → `composables/`（design D6）：生命周期类 hooks 重写为组合式函数，纯逻辑 hooks 平移并把 Redux 访问换成 Pinia；`useConfirm`、`useResetDataDialog` 等对话框类 hooks 改为 Vue 实现；对应单测通过
- [ ] 4.2 迁移全局框架组件：`Layout`、`Sidebar`（含 adaptive-sidebar/mobile-drawer 行为）、`BottomNav`、`MobileDrawer`、`TopBar`、`AnimatedLogo`、`FatalErrorScreen`、`KeyRecoveryDialog`、`OpenExternalBrowserButton`、`ToasterWrapper`（vue-sonner 适配）；布局与响应式行为测试通过
- [ ] 4.3 迁移 Chat 页面域：`pages/Chat` 全部组件（ChatBubble、StreamingContent、ThinkingSection、发送表单、虚拟滚动 virtua、代码块复制/高亮、自动命名、再生等），聊天服务层不动；迁移 chat-flow 相关行为测试并通过
- [ ] 4.4 迁移 Model 页面域：`pages/Model`（ModelTable、CreateModel 表单、供应商卡片/网格/详情、logo 展示），模型服务与存储层不动；model-management 相关行为测试通过
- [ ] 4.5 迁移 Setting 页面域：`pages/Setting`（GeneralSetting、KeyManagementSetting、密钥导出/导入/恢复对话框、数据重置），keyring/crypto 层不动；settings-change 与 key 管理相关测试通过
- [ ] 4.6 迁移 `pages/NotFound` 与兜底路由；404 行为测试通过
- [ ] 4.7 删除全部 React 代码与依赖（design D7 清单：react、react-dom、react-redux、@reduxjs/toolkit、react-router-dom、@radix-ui/*、react-i18next、lucide-react、@tanstack/react-*、sonner、next-themes、react-masonry-css、react-resizable-panels、babel-plugin-react-compiler、@vitejs/plugin-react、@testing-library/react、@types/react*），删除 `src/hooks`、旧 slices、`MainApp.tsx`、`main.tsx` 等残留；验证 `pnpm tsc`、`pnpm validate` 通过且全局无 `from "react"` 引用

## 5. 收尾与发布

- [ ] 5.1 全量回归：`pnpm test:all`（单测 + 集成 + 变异测试）全绿；对照第 1 组基线核对测试覆盖的行为面无缺失，修复回归
- [ ] 5.2 体积与性能核对：`visualizer` 产出对比报告，首屏 JS 不超 Phase 1 基线 10%（超出则按 manualChunks 排查）；`pnpm build` 产物为纯静态资源
- [ ] 5.3 `pnpm analyze:unused`（knip）清理未使用导出与死代码；复查无 Tauri/React 残留引用
- [ ] 5.4 文档全面更新：AGENTS.md（技术栈、架构、快速查找表改为 Vue3/Pinia/vue-router/webRuntime）、README 双语同步、`docs/design/` 新增 Vue3 架构说明并修订 initialization/chat-service/i18n-system 等文档中的 React 表述；检查 README 中英文结构一致
- [ ] 5.5 手动验收清单：GH Pages 部署后走查核心流程（首次启动密钥生成与安全警告、新建聊天与流式响应、模型增删改、语言切换、密钥导出导入、数据重置、暗色模式、移动端布局），全部符合预期
- [ ] 5.6 合并 `feat/vue3-migration` 至 main，发布 `v1.0.0`，发布说明包含迁移摘要、BREAKING 声明与桌面用户指引
