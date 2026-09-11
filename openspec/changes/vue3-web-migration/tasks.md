# 任务：迁移至 Vue 3 并移除 Tauri

## 1. 阶段 0：基线

- [x] 1.1 创建迁移分支 `feat/vue3-web-migration`，运行 `pnpm test:run` 确认全量通过，记录测试数量与覆盖率基线数值（基线：169 文件 / 2391 通过 + 4 跳过；覆盖率 All files：Stmts 92.48%、Branch 76.75%、Funcs 88.61%、Lines 93.24%）
- [x] 1.2 运行 `pnpm web:dev` 与 `pnpm web:build` 确认迁移前 Web 形态构建、运行正常，截图留存对照基线（build 成功 5.25s；dev server HTTP 200 且挂载点/入口确认；留证为 HTML 快照 baseline/index-web-dev.html + dist 构建产物）

## 2. 阶段 1：Tauri 移除（与框架无关，先行）

- [x] 2.1 将 `src/utils/tauriCompat/` 目录改名为 `src/utils/platform/`，同步更新全部导入路径与对应测试文件路径，验证 `pnpm test:run` 中平台层与 crypto/keyring/store 相关测试全部通过
- [x] 2.2 收缩 `platform/env.ts`：删除 `isTauri()` 与 `window.__TAURI__` 检测，保留 `isTestEnvironment`、`getPBKDF2Iterations` 及 PBKDF2 常量，验证 env 相关单测与加密测试通过
- [x] 2.3 删除 `platform/shell.ts`（`Command`/`shell`），将外部链接打开调用方（如 `useNavigateToExternalSite`）改为 `window.open`，验证外部链接行为测试通过且 shell 测试删除
- [x] 2.4 将 `http.ts`、`store.ts`、`keyring.ts`、`keyringMigration.ts`、`os.ts` 内的双环境分支收敛为唯一 Web 实现，保留公开 API 签名，验证对应测试重写后通过，并用集成测试验证可读取既有 IndexedDB 加密数据（数据格式不变）
- [x] 2.5 收敛 `src/utils/resetAllData.ts` 与 `src/store/keyring/masterKey.ts` 中残留的 `isTauri()` 分支，验证 data-reset 与主密钥相关测试通过
- [x] 2.6 删除 `src-tauri/` 目录、`tauri.conf.json` 及 `index.html` 中的 Tauri 注入脚本引用，验证 `grep -r "tauri" index.html` 无残留、构建产物中不存在 `__TAURI__` 探测
- [x] 2.7 更新 `package.json`：移除 `@tauri-apps/*`、`tauri-plugin-keyring-api`、`@tauri-apps/cli` 依赖；`dev`/`build`/`preview` 直接指向 Vite，删除 `tauri` 与 `web:*` 脚本，验证 `pnpm install && pnpm build` 成功且 `pnpm dev` 可启动
- [x] 2.8 清理 `vite.config.ts`：移除 `TAURI_DEV_HOST`、`clearScreen`、`src-tauri` watch 忽略与 Tauri 分包分支（保留 AI 供应商代理），验证构建成功且代理生效（开发环境请求供应商 API 正常）
- [x] 2.9 更新 CI：`.github/workflows` 中 gh-pages 构建命令 `web:build` → `build`；直接编辑主规格 `openspec/specs/gh-pages-auto-deployment/spec.md` 的 Purpose 移除"与桌面同步发布"表述；删除桌面发布 workflow（如 `build-and-release.yml`），验证 workflow 语法检查通过
- [x] 2.10 阶段 1 验收：全量测试通过、`pnpm build` 产物 `grep -r "__TAURI__\|@tauri-apps" dist/` 无匹配，提交并确认本阶段可独立合并

## 3. 阶段 2：Vue 基座

- [x] 3.1 安装 Vue 生态依赖（`vue`、`pinia`、`vue-router`、`@vitejs/plugin-vue`、`@testing-library/vue`、`lucide-vue-next`、`vue-sonner`、`reka-ui`、`@tanstack/vue-form`、`@tanstack/vue-table`、`@virtua/vue`），接入 plugin-vue，验证最小 Vue SFC 组件在 dev/build 下编译渲染成功
- [x] 3.2 基于 shadcn-vue（reka-ui）生成基础组件（Button、Dialog、AlertDialog、DropdownMenu、Select、Popover、Tooltip、Switch、Checkbox、RadioGroup、Input、Textarea、Label、Table、Skeleton、Progress、Avatar、Badge、Card、Splitter、Form），验证各组件冒烟渲染测试通过
- [x] 3.3 创建 Vue 新入口（`main.ts` + App 壳）与 vue-router 路由表（`createWebHistory(import.meta.env.BASE_URL)`，按 `src/router/index.tsx` 一一映射路径、重定向、懒加载与 dev-only toast-test 路由），验证全部路由可达、重定向与 404 行为和迁移前一致
- [x] 3.4 将 Redux slices 迁移为 Pinia setup stores（chat/model/provider/page/settings 等，selectors → getters，middleware 逻辑下沉），验证框架无关 store 测试经最小适配后全部通过
- [x] 3.5 实现响应式 i18n 绑定组合式函数（订阅 `i18next.languageChanged`），接入既有 i18n 服务初始化与懒加载，验证语言切换集成测试：切换后界面文本即时更新、无需刷新
- [x] 3.6 实现主题组合式函数（明/暗/跟随系统 + localStorage 持久化）替换 next-themes，验证主题切换与刷新持久化测试通过
- [x] 3.7 接入 vue-sonner 并保留既有 toast 服务层适配，验证 toast 展示、排队与自动消失行为测试通过
- [x] 3.8 以 Vue 重写初始化壳组件（InitializationController、AnimatedLogo/canvas-logo、FatalErrorScreen、NoProvidersAvailable、进度组件），对接 InitializationManager 逻辑不变，验证初始化流程集成测试通过
- [x] 3.9 验证 oxlint 对 `.vue` SFC 的检查效果，若覆盖不足则引入 `eslint` + `eslint-plugin-vue` 补位，验证 `pnpm lint` 通过
- [x] 3.10 验证 `@tanstack/vue-form` 满足 `ModelConfigForm` 需求；不满足则按 design D5 降级为基于 zod 的自研轻量表单组合式函数，并在本文件记录最终选择

## 4. 阶段 3：模块迁移（每项 = 实现重写 + 测试重写通过）

- [ ] 4.1 迁移布局与通用组件（Layout、TopBar、底部导航、移动端抽屉、自适应侧栏、Skeleton 骨架屏等），重写对应组件测试
- [ ] 4.2 迁移聊天通用组件（消息气泡、流式内容渲染、markdown/高亮/代码块复制、虚拟滚动、瀑布流），重写对应测试并验证长对话滚动性能与迁移前相当
- [ ] 4.3 迁移 Chat 页面（Sidebar、Panel、Detail、ModelSelect、消息操作、重新生成、自动命名 hooks 链、URL 同步），重写对应测试并验证核心聊天流程行为等价
- [ ] 4.4 迁移 Model 页面（ModelTable、CreateModel、ModelConfigForm、ProviderGrid、ProviderDetail），重写对应测试并验证模型增删改查与远程模型获取流程等价
- [ ] 4.5 迁移 Setting 页面（GeneralSetting、KeyManagementSetting、语言/主题设置、导出设置、ToastTest dev 路由），重写对应测试并验证设置项保存与生效流程等价
- [ ] 4.6 将 `src/hooks/` 下全部 React hooks 迁移为组合式函数（含 redux.ts 适配为 Pinia 版本），重写对应测试
- [ ] 4.7 迁移剩余页面与组件（NotFound、错误边界、FatalError 兜底等），重写对应测试
- [ ] 4.8 为迁移前无测试覆盖的组件补充冒烟级渲染测试，验证阶段 3 涉及组件均有最低行为保障

## 5. 阶段 4：清理收尾

- [ ] 5.1 删除 React 树与依赖：旧入口（`MainApp.tsx`、`main.tsx`）、全部 `.tsx` 组件、`src/hooks` React 版本、`@reduxjs/toolkit`/`react-redux`/`react-router-dom`/`react-i18next`/`@radix-ui/*`/`next-themes`/`sonner`/`lucide-react`/`@tanstack/react-form`/`react-table`/`react-resizable-panels`/`virtua`/`react-masonry-css`/`@testing-library/react`/`babel-plugin-react-compiler`/`@vitejs/plugin-react`，验证 `grep -ri "react" package.json src/` 无运行时残留、`pnpm install && pnpm build` 成功
- [ ] 5.2 重写 `vite.config.ts` manualChunks 为 Vue 生态映射（vendor-vue、vendor-pinia、vendor-router、vendor-i18n、vendor-ai 等目标结构），验证构建分包符合预期、chunk-init 独立且无超限告警
- [ ] 5.3 重写覆盖率配置中 React 专属排除项（`main.tsx` → 新入口、shadcn-vue 生成物路径等），运行 `pnpm test:coverage` 确认各分级阈值全部达标
- [ ] 5.4 运行 `pnpm test:mutation`（stryker）全量确认配置对 Vue 代码生效，记录变异得分基线
- [ ] 5.5 运行 `pnpm test:basic:all`（单元 + 集成）全量通过；运行 `pnpm validate`（lint + i18n 完整性检查）通过
- [ ] 5.6 运行 `pnpm analyze:unused`（knip）清理未使用的导出与文件，验证 knip 无未跟踪死代码
- [ ] 5.7 将 proposal 中声明的约 22 个待批量修订的既有规格清单（引用 Tauri 场景的测试约定类规格）记录到本变更目录 `followup-spec-cleanup.md`，供后续清理变更使用

## 6. 文档与发布

- [ ] 6.1 更新 `AGENTS.md`：技术栈（React → Vue 3）、架构入口、快速查找表（`tauriCompat` → `platform`）、文档索引，验证行数不超过 250 行
- [ ] 6.2 同步更新 `README.md` 与 `README.zh-CN.md` 双语版本（移除桌面端说明、更新脚本与平台说明），验证两版本章节结构一致
- [ ] 6.3 更新受影响的 `docs/design/` 文档（`cross-platform.md` 重写为纯 Web 平台层说明，`chat-service.md`/`i18n-system.md`/`initialization.md` 等核对框架引用），验证 `docs/README.md` 索引一致
- [ ] 6.4 触发 gh-pages 部署（手动或 tag）并对线上站点做冒烟验证（首页加载、创建聊天、发送消息、切换语言/主题），验证线上行为与本地一致
- [ ] 6.5 核对全部增量规格的验收场景（`openspec/changes/vue3-web-migration/specs/`），确认无未满足项后运行 `openspec validate --change vue3-web-migration` 通过
