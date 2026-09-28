# Tasks

## 1. 阶段 0：前置准备（在 main 进行）

- [x] 1.1 归档前序变更 `migrate-to-vue3-web`（其阶段 0 代码已合入 main），并按 design D10 处理重复增量：若归档时已同步平台规格，删除本变更中 `specs/http-fetch-compat`、`specs/web-store-compat`、`specs/web-keyring-compat` 三个增量文件；验证 `openspec list` 不再显示该变更且 `openspec validate "migrate-to-svelte-web"` 通过
- [ ] 1.2 在 main 发布纯 Web React 最终基线版本并打版本 tag（v0.5.x 系列），验证 gh-pages 线上版本功能正常；该版本作为后续回退锚点与阶段 5 数据兼容验证的数据源

## 2. 阶段 1：Svelte 脚手架与构建链切换（`feat/svelte-web` 分支）

- [ ] 2.1 创建 `feat/svelte-web` 分支；安装 Svelte 生态依赖（svelte、@sveltejs/vite-plugin-svelte、svelte-check、bits-ui、@lucide/svelte、svelte-sonner、paneforge、@tanstack/svelte-form、@tanstack/svelte-table、@testing-library/svelte），逐一冒烟验证 Svelte 5 兼容性；移除 React 生态依赖（react、react-dom、@reduxjs/toolkit、react-redux、react-router-dom、react-i18next、@radix-ui/* 14 项、@tanstack/react-form、@tanstack/react-table、lucide-react、sonner、next-themes、react-masonry-css、react-resizable-panels、babel-plugin-react-compiler、@vitejs/plugin-react、@testing-library/react 及配套 @types/*）；验证 `pnpm install` 成功且 `pnpm ls react` 无结果
- [ ] 2.2 构建链切换：vite.config.ts 换 svelte 插件、按 chunk-splitting 规格的「包名精确提取」策略重写 manualChunks 映射（vendor-react/vendor-redux/vendor-radix → vendor-svelte/vendor-bits-ui 等）；tsconfig 移除 jsx 配置并支持 `.svelte`；`build` 改为 `svelte-check && vite build`；验证最小 Svelte 应用（空白 App.svelte 挂载）`pnpm dev` 与 `pnpm build` 成功，产物中无 react 运行时引用
- [ ] 2.3 测试栈切换：vitest 适配 `.svelte` 组件（@testing-library/svelte 挂载与 cleanup），`src/__test__/helpers/` 工厂与 mock 移除 Tauri Mock 并适配 Svelte 测试栈；验证新增一个冒烟 Svelte 组件测试通过
- [ ] 2.4 Lint 与编辑器配置：`.oxlintrc.json` 移除 react 专属规则，实测 `.svelte` 解析支持（不支持则显式排除出 lint 范围，由 svelte-check 兜底，结论记入 AGENTS.md）；`.vscode/extensions.json` 移除 tauri-vscode / rust-analyzer 推荐、补 Svelte 扩展；验证 `pnpm lint` 通过

## 3. 阶段 2：路由、状态与 i18n 基建

- [ ] 3.1 自研 runes 路由基建：HTML5 history + BASE_URL basename + 路由表（`/`→chat 重定向、`/model`→table、`/setting`→common 索引重定向、`*`→`/404` 兜底、DEV-only `toast-test`、页面级 `lazy()` 分包）+ 与 `public/404.html` 回退的配合；为每个路由场景编写专项测试（含 `/multi-chat/` 子路径直访与刷新）；验证 svelte-frontend 规格「URL 路由结构兼容」全部场景
- [ ] 3.2 状态层 runes 化：7 个 Redux slice（chat / chatPage / model / modelPage / modelProvider / settingPage / appConfig）1:1 映射为 7 个 `.svelte.ts` 状态模块，selectors 改 `$derived`，`RootState` 手写类型改模块状态类型推导；验证状态模块单元测试通过
- [ ] 3.3 持久化等价迁移：3 个持久化 middleware（saveChatList / saveModels / saveDefaultAppLanguage）改为状态模块内显式保存调用点，写入时机等价（变更即保存），**存储布局不变**（chat_index + chat_<id> 分键、模型 apiKey 加密字段、语言缓存键）；验证 chatStorage / modelStorage 既有测试通过
- [ ] 3.4 i18n 封装：`services/i18n.ts` 核心与 24 个语言 JSON 原样保留，新增 runes 响应式封装（订阅 `languageChanged` 导出响应式 `t` 与当前语言状态）；验证语言检测链、按需懒加载、缓存行为与 `pnpm lint:i18n` 通过
- [ ] 3.5 聊天服务接入：`streamChatCompletion`（async generator，框架无关原样保留）在 runes 状态模块中消费，AbortSignal 中断与流式节流行为不变；验证 chat 服务层既有测试通过
- [ ] 3.6 初始化入口迁移：`src/main.tsx` → `src/main.ts`（index.html Spinner → InitializationManager 原样保留 → 完成后动态挂载 `App.svelte`）；验证启动初始化各步骤行为与进度 UI 不变，框架无关测试全绿（`pnpm test:run && pnpm test:integration:run`）

## 4. 阶段 3：UI 层分域迁移

- [ ] 4.1 UI 基建：28 个 shadcn/ui 组件迁移为 shadcn-svelte（bits-ui 内核，Tailwind 样式 class 复用）；自研 runes 主题模块替代 next-themes（localStorage 主题键兼容既有用户设置，实测确认键名）；验证对话框/下拉/表单的键盘导航与焦点管理符合 component-accessibility 既有规格
- [ ] 4.2 Layout 域迁移：Layout、Sidebar、BottomNav、MobileDrawer、TopBar 等价迁移（paneforge 替代 react-resizable-panels、响应式断点 hooks → runes 模块、自适应侧栏）；验证 responsive 相关既有行为测试以 Svelte 测试栈等价重写并通过
- [ ] 4.3 Chat 域迁移：19 个页面文件与 chat 组件、相关 hooks → runes 模块（流式渲染、推理内容展示、代码块高亮与复制、virtua Svelte 版虚拟滚动、会话自动命名、移动端抽屉）；手动回归聊天全流程；验证 chat-panel / chat-sidebar / mobile-drawer 等既有行为测试等价重写并通过
- [ ] 4.4 Model 域迁移：9 个页面文件（表格换 @tanstack/svelte-table、表单用 @tanstack/svelte-form、模型 apiKey 字段经主密钥加密读写）；验证 model-management 相关既有行为测试等价重写并通过
- [ ] 4.5 Setting 域迁移：20 个页面文件（常规设置、密钥管理含导出/导入/恢复对话框、数据重置）；验证 settings-change 相关既有测试等价重写并通过
- [ ] 4.6 收尾组件迁移：NotFound、Skeleton、AnimatedLogo、Toast 队列（svelte-sonner，保留 `toastQueue` 封装层）、瀑布流改 CSS columns；验证 toast-queue / mobile-toast 既有行为测试等价重写并通过

## 5. 阶段 4：清理、回归与发布

- [ ] 5.1 Tauri 残留代码清理：清理 6 处源码 Tauri 注释（`src/utils/clipboard.ts`、`src/services/global.ts`、`src/services/chat/types.ts`、`src/store/storage/chatStorage.ts`、`src/store/storage/storeUtils.ts`、`src/components/ui/pagination.tsx`）、`stryker.config.json` 中 tauriCompat / src-tauri 失效排除路径、测试文档中的 Tauri 表述；验证 `grep -ri tauri src/ stryker.config.json` 无残留
- [ ] 5.2 React 死代码清理：knip 扫描并移除未用导出与残留 React 文件（main.tsx、MainApp.tsx 等）；验证 `pnpm analyze:unused` 无未用项且构建产物中无 react 引用（符合 svelte-frontend 规格「Svelte 5 runes 技术栈」场景）
- [ ] 5.3 变异测试恢复：按新文件路径重建 stryker.config.json 的 mutate 清单与 vite.config.ts 覆盖率排除清单；验证 `pnpm test:mutation` 通过
- [ ] 5.4 数据兼容验证：使用 1.2 基线版本构建产物预造完整用户数据（IndexedDB `multi-chat-store` / `multi-chat-keyring` + localStorage 全部键），Svelte 版启动验证聊天列表、模型配置（含加密 apiKey 解密）、界面语言、主题、安全警告 dismissed 状态全部延续；验证 svelte-frontend 规格「既有用户数据免迁移兼容」全部场景
- [ ] 5.5 全量回归与规格验收：`pnpm test:all` 通过；手动回归聊天全流程（创建/流式/停止/重生成/命名/删除/导出）、主题切换、语言切换；逐条核对 svelte-frontend 规格场景（聊天核心流程、UI 交互等价、国际化等价）
- [ ] 5.6 主规格修复与文档同步：修复 `openspec/specs/tauri-compat-tests/spec.md` 的历史 delta 格式（规范化为 Purpose + `## Requirements` 主规格结构，使本变更 REMOVED 增量可在归档时应用）；AGENTS.md（Svelte 架构 / 开发命令 / 快速查找表）、README.md 与 README.zh-CN.md 双语同步、`docs/design/` 相关文档更新；验证 README 双语章节结构一致且 `openspec validate "migrate-to-svelte-web" --strict` 通过
- [ ] 5.7 合入发布：`feat/svelte-web` 合入 main 并打新版本 tag；验证 gh-pages 自动部署成功、线上版本为 Svelte 构建、路由直访与刷新正常、`openspec archive` 顺利应用全部规格增量
