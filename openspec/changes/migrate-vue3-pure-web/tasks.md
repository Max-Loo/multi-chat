# Tasks

## 1. 阶段 0：准备

- [x] 1.1 修复 4 个旧格式主 spec：`openspec/specs/{tauri-plugin-web-compat,http-fetch-compat,os-locale-compat,tauri-compat-env-testing}/spec.md` 的 `## ADDED Requirements` 改为 `## Requirements` 并补 `## Purpose` 段（内容不变）；验证 `openspec show <id> --type spec --json` 对全部 4 个 spec 无结构错误
- [x] 1.2 基于 main 创建迁移分支 `feat/migrate-vue3-pure-web`；验证 `git branch` 存在该分支且工作区干净

## 2. 阶段 1：纯 Web 化（React 保持可用）

- [x] 2.1 `git mv src/utils/tauriCompat src/utils/platform`，全局替换导入路径 `@/utils/tauriCompat` → `@/utils/platform`（含测试与 `__mocks__`）；验证 `pnpm tsc` 通过且 `grep -r "tauriCompat" src/` 无结果
- [x] 2.2 `platform/http.ts` 删除 Tauri fetch 动态导入与环境分支，统一为原生 `window.fetch`（保留 `getFetchFunc`/`RequestInfo` 导出）；验证 http 测试删除 Tauri 用例后通过
- [x] 2.3 删除各模块 Tauri 分支：`store.ts` 仅留 IndexedDB 实现、`keyring.ts` 仅留加密实现、`os.ts` 的 `locale()` 直接读 `navigator.language`、`shell.ts` 删除 `Command` 保留 `open()`、`env.ts` 删除 `isTauri()`、`index.ts` 同步导出；验证对应模块单测通过
- [x] 2.4 按 design D9 更新 keyring 安全警告文案（浏览器本地存储说明 + 主密钥备份建议），保留"不再提示"标记逻辑；验证警告相关测试更新后通过
- [x] 2.5 删除 `src-tauri/` 目录；`package.json` 移除 `@tauri-apps/*`（5 个）、`tauri-plugin-keyring-api`、`@tauri-apps/cli`；脚本收敛为 `dev: vite`、`build: tsc && vite build`，删除 `tauri`/`web:build:tauri`/重复脚本；验证 `pnpm install && pnpm dev` 启动正常、`package.json` 无 tauri 依赖
- [x] 2.6 `vite.config.ts` 清理：移除 `TAURI_DEV_HOST`、`src-tauri` watch ignore、`vendor-tauri` chunk，覆盖率排除路径更新为 `platform/`；验证 `pnpm build` 成功且产物无 tauri 代码
- [x] 2.7 平移/修剪受影响测试（路径 mock、Tauri 环境用例删除）；验证 `pnpm test:run` 全绿

## 3. 阶段 1 验收与合并

- [x] 3.1 手工冒烟：聊天发送（流式渲染）、模型增删改与 apiKey 加密存储、设置与语言切换、主题切换、主密钥导出/导入、外部链接打开；并用迁移前版本产生的 IndexedDB 数据验证升级兼容（数据无损、可解密）；验收记录附于 PR 描述（记录见本目录 `smoke-report.md`；注：主题切换 UI 为阶段 2 任务 5.4 交付物，本版本尚无入口，未纳入本次冒烟）
- [x] 3.2 文档同步：AGENTS.md 更新技术栈与快速查找表（`src/utils/platform/`）、`docs/design/cross-platform.md` 重写为纯 Web 平台层设计、删除 `docs/conventions/tauri-commands.md`、更新 `docs/README.md` 索引；验证 `grep -rn "tauriCompat\|src-tauri" AGENTS.md docs/` 无过时引用
- [ ] 3.3 提交阶段 1 PR 并合并到 main；验证 CI 通过、`pnpm deploy:gh-pages` 发布后线上版本可用

## 4. 阶段 2：Vue 工具链与应用骨架

- [ ] 4.1 依赖切换：安装 `vue@^3.5` `pinia` `vue-router@^4` `@vitejs/plugin-vue` `vue-tsc` `lucide-vue-next` `vue-sonner`；卸载 react 全家桶（react、react-dom、@types/react*、@vitejs/plugin-react、babel-plugin-react-compiler、react-redux、@reduxjs/toolkit、react-router-dom、lucide-react、sonner、next-themes、react-masonry-css、react-resizable-panels、@radix-ui/react-*、@testing-library/react）；验证 `pnpm install` 成功且 `package.json` 无 react 依赖
- [ ] 4.2 构建配置切换：vite 换用 `@vitejs/plugin-vue`、manualChunks 重组 `vendor-vue`、tsconfig 支持 `.vue`（shims 与 include）；`pnpm tsc` 脚本指向 `vue-tsc`；验证最小 Vue 入口 `pnpm build` 成功
- [ ] 4.3 应用入口重写：`src/main.ts` 创建 Vue 应用与三态启动状态机（loading → initializing → ready/fatal），`InitializationController`、`FatalErrorScreen` 组件化，保留 `createMainApp` 分步初始化流程与主应用动态加载；验证启动冒烟（初始化步骤日志与就绪渲染）
- [ ] 4.4 vue-router 接入：Chat/Model/Setting/NotFound 4 路由 + 页面懒加载 + `import.meta.env.BASE_URL` basename + 聊天删除后 URL 跳转；验证各路由直接访问与子路径部署（preview 模式）正常

## 5. 阶段 2：状态管理与基础 composables

- [ ] 5.1 7 个 Redux slice → Pinia store 一一迁移（models/chat/chatPage/appConfig/modelProvider/settingPage/modelPage），3 个持久化中间件的写入逻辑移入对应 action；验证 store 单测按 Pinia 风格重写后通过
- [ ] 5.2 16 个 hooks → composables 迁移（useDebounce、useMediaQuery、useConfirm、useCreateChat、useResponsive 等），输入输出契约与默认值不变；验证各 composable 单测通过
- [ ] 5.3 `useI18n` composable（<30 行，`i18next.t` + 语言变更响应式触发）替换 `react-i18next`，`services/i18n.ts` 零改动复用；验证语言切换即时生效、`pnpm lint:i18n` 通过
- [ ] 5.4 `useTheme` composable 替代 next-themes（亮/暗/跟随系统 + localStorage 持久化 + `prefers-color-scheme` 监听）；验证三模式切换与刷新保持
- [ ] 5.5 vue-sonner Toast 与 ConfirmProvider（useConfirm）等价迁移；验证 Toast 队列与确认对话框交互冒烟

## 6. 阶段 2：UI 原子组件与页面迁移

- [ ] 6.1 28 个 UI 原子组件迁移为 shadcn-vue：分三批（基础 button/dialog 等 → 表单 select/checkbox 等 → 弹层 dropdown/popover/tooltip），Tailwind 类名复用、逐组件对照键盘导航与焦点行为；验证每批组件测试通过且视觉对照无回归
- [ ] 6.2 布局组件迁移：Layout、Sidebar、BottomNav、MobileDrawer 与响应式（含 macOS Safari 中文输入法处理逻辑）；验证桌面/移动断点行为
- [ ] 6.3 Chat 页面迁移：ChatBubble、StreamingContent、ThinkingSection、virtua 虚拟列表，流式内容采用 `shallowRef` 更新策略；验证流式渲染正常、长对话滚动性能无明显回退
- [ ] 6.4 Model 页面迁移：`@tanstack/vue-table` 表格与 `@tanstack/vue-form` 表单；验证模型增删改、apiKey 加密字段读写
- [ ] 6.5 Setting 页面迁移（最深 5 层嵌套）与 KeyRecoveryDialog；验证各设置项生效与主密钥导出/导入/验证流程
- [ ] 6.6 其余组件与渲染链路：Skeleton、ProviderLogo、AnimatedLogo、FilterInput、OpenExternalBrowserButton（`window.open`）与 markdown-it + highlight.js + dompurify 渲染、代码块复制；验证 Markdown/代码高亮/复制行为
- [ ] 6.7 布局特殊场景：masonry 改 CSS `columns`、可调面板改 splitpanes；验证相关页面布局与拖拽行为

## 7. 阶段 2：测试体系重建

- [ ] 7.1 vitest 接入 Vue：配置 `@vitejs/plugin-vue`、安装 `@vue/test-utils` + `@testing-library/vue`（保留 jest-dom 与 fake-indexeddb）；验证最小 Vue 组件测试运行通过
- [ ] 7.2 逻辑层测试平移收尾（store/services/utils/storage/crypto 的全部纯逻辑用例）；验证 `pnpm test:run` 全绿
- [ ] 7.3 组件测试按原测试意图分批重写（Chat → Model → Setting → 通用组件，`userEvent` 保留）；验证每批迁移后对应测试通过
- [ ] 7.4 11 个集成测试按行为场景重建（聊天流、模型管理、密钥、i18n 等）；验证 `pnpm test:integration:run` 通过
- [ ] 7.5 stryker 与 knip 配置校准（路径、忽略项）并空跑；验证 `pnpm test:mutation` 与 `pnpm analyze:unused` 可正常运行

## 8. 阶段 3：收尾

- [ ] 8.1 文档全面更新：AGENTS.md（技术栈、架构、查找表）、`docs/design/` 受影响文档（initialization/chat-service/lazy-loading 等中的 React 表述）、`src/__test__/README.md` 测试规范；README.md 与 README.zh-CN.md 双语同步更新；验证双语章节结构一致
- [ ] 8.2 残留清理：`grep -rniE "react|tauri" src/ package.json` 无实质残留（注释/依赖/类型）；knip 报告无未用依赖与导出
- [ ] 8.3 提交阶段 2 PR、合并、运行 `pnpm update-version` 发版；验证 CI 全绿
- [ ] 8.4 运行 `openspec archive migrate-vue3-pure-web`；验证 9 个能力的主 spec 合并结果与 delta 一致

## 9. 最终验收

- [ ] 9.1 全量验证：`pnpm validate`、`pnpm test:all`、`pnpm build`、`pnpm deploy:gh-pages` 全部通过，线上子路径部署版本冒烟可用（含旧数据升级场景）
- [ ] 9.2 行为基线对照：对照本变更 9 个 delta spec 逐条核验（vue-app-framework、pure-web-runtime 的全部 ADDED 场景 + 7 个修改能力的 MODIFIED/REMOVED 结果），在 PR 中记录核验结论
