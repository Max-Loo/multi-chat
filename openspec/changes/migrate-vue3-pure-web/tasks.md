# Tasks

> 依据 design.md 的 Migration Plan 组织；每阶段的验收命令写在对应任务内。阶段 2–4 在 `feat/vue3` 分支进行，阶段 1 独立 PR 合入 `main`。

## 1. 阶段 0：基线

- [x] 1.1 确认迁移前全量测试通过（`pnpm test:run`、`pnpm test:integration:run`），记录通过数量作为回归基线
- [x] 1.2 执行 `pnpm web:build` 并通过 rollup-plugin-visualizer 记录构建产物体积基线（总 JS 体积与最大分包）

## 2. 阶段 1：Tauri 移除（React 保持不变，独立 PR）

- [x] 2.1 删除 `src-tauri/` 目录；验证：目录与 Cargo 工程文件不存在，`pnpm tsc` 通过
- [x] 2.2 从 package.json 移除 `@tauri-apps/cli`、`@tauri-apps/plugin-http`、`@tauri-apps/plugin-os`、`@tauri-apps/plugin-shell`、`@tauri-apps/plugin-store`、`tauri-plugin-keyring-api` 并执行 `pnpm install`；验证：安装成功、`pnpm analyze:unused`（knip）无未用依赖报错
- [x] 2.3 将 `src/utils/tauriCompat/` 重命名为 `src/utils/platform/`，同步更新全部业务导入与测试 mock 路径；验证：`pnpm tsc` 通过、`pnpm test:run` 平台层相关测试通过
- [x] 2.4 删除 Shell 兼容层（`shell.ts` 及 `Command`/`shell` 导出）；`useNavigateToExternalSite` 改用浏览器原生 `window.open(url, "_blank", "noopener,noreferrer")`；验证：该 hook 测试更新并通过、grep 确认无 `Command`/`shell` 残留导入
- [x] 2.5 删除平台层各模块（os/http/store/keyring/keyringMigration）内的 Tauri 原生分支与 `@tauri-apps` 导入，`isTauri()` 改为恒返回 `false`（API 保留）；验证：`pnpm test:run` 全绿、grep 确认 `src/` 无 `@tauri-apps` 导入
- [x] 2.6 脚本收敛：`dev` → `vite`，`build` → `tsc && vite build`，删除 `tauri`/`web:*` 系列脚本（`deploy:gh-pages` 保持）；验证：`pnpm dev` 启动正常、`pnpm build` 产出可部署静态资源
- [x] 2.7 同步更新文档中的 Tauri/桌面端描述：`AGENTS.md`、`README.md` 与 `README.zh-CN.md`（双语结构一致）、`docs/` 受影响篇目；验证：`pnpm validate` 通过、文档 grep 无"桌面端使用"类残留指引
- [x] 2.8 阶段 1 验收：全量测试通过、构建体积与基线对比记录、`vite preview` 冒烟（首页 + 深层路由刷新）
- [ ] 2.9 以独立 PR 合入 `main`，更新版本号

## 3. 阶段 2：Vue 基础设施（`feat/vue3` 分支）

- [ ] 3.1 创建 `feat/vue3` 分支；新增 `vue`、`pinia`、`vue-router`、`@vitejs/plugin-vue`、`vue-tsc`、`@testing-library/vue` 及映射表所需目标库（见 design.md D4）；验证：`pnpm install` 成功
- [ ] 3.2 Vite/TS 配置切换：`@vitejs/plugin-vue` 替换 `@vitejs/plugin-react`，移除 `babel-plugin-react-compiler`，类型检查交给 `vue-tsc`，SFC 类型声明就位；验证：`vite` 启动无配置报错
- [ ] 3.3 新建 Vue 入口（`main.ts` + 根 `App.vue` + `createApp` 挂载），接入既有 `InitializationManager` 与启动加载/Logo 动画；验证：应用启动时初始化步骤按既有顺序执行并渲染根组件
- [ ] 3.4 迁移路由表到 `vue-router`：保留既有 7 条路由、懒加载、basename 处理与重定向/404 规则；验证：各路由导航正常、深层 URL 直达与刷新正常、开发环境 toast-test 路由仅 DEV 存在
- [ ] 3.5 实现主题 `useTheme` composable（亮/暗/跟随系统 + 持久化 + `matchMedia` 监听）；验证：切换即时生效、刷新后保持、系统模式跟随 OS 变化
- [ ] 3.6 实现 i18n 响应式绑定组合函数（`ref` 语言状态 + `languageChanged` 事件同步 + `useTranslation` 导出），保留 i18next 服务层与 locales 不动；验证：语言切换后已渲染文案即时更新、`pnpm lint:i18n` 与 i18n 类型生成脚本通过
- [ ] 3.7 安装 Pinia 并创建 7 个 store 骨架（chat、chatPage、model、modelPage、modelProvider、setting、appConfig，字段与现有 slices 对齐）；验证：devtools 中全部 store 可见且字段完整
- [ ] 3.8 阶段 2 验收：应用可完整启动（初始化 → 路由 → 主题 → i18n 手动冒烟通过），`vue-tsc` 无类型错误

## 4. 阶段 3：状态层完整迁移（Pinia）

- [ ] 4.1 迁移 `appConfigSlices` + `appConfigMiddleware` → appConfig store 与 `$subscribe` 持久化联动；验证：应用语言/推理传输/自动命名设置的持久化测试通过
- [ ] 4.2 迁移 `chatSlices` + `chatMiddleware` + `chatSelectors` → chat store；验证：聊天列表装载、按 key 存储、原始数据保留等既有测试语义通过
- [ ] 4.3 迁移页面局部状态（`chatPageSlices`、`settingPageSlices`、`modelPageSlices`）→ 对应 store；验证：模块状态重置行为测试通过
- [ ] 4.4 迁移 `modelSlice` + `modelMiddleware`、`modelProviderSlice` → model/modelProvider store；验证：模型初始化、远程获取衔接与加密谓词测试通过
- [ ] 4.5 更新 `src/config/initSteps.ts` 各初始化步骤改接 Pinia store 装载；验证：启动初始化端到端（keyring → i18n → 主密钥 → 模型 → 聊天列表 → 应用配置 → 供应商）通过
- [ ] 4.6 状态层测试全部迁移完成；验证：`pnpm test:run` 状态层相关套件全绿、派生状态（选中聊天、发送中）语义与迁移前一致

## 5. 阶段 3：基础组件库

- [ ] 5.1 按 design.md D4 映射表引入 shadcn-vue/reka-ui 组件（Dialog、AlertDialog、DropdownMenu、Select、Popover、Tooltip、Switch、Checkbox、RadioGroup、Progress、Label、Avatar、Slot、Splitter），保留 `cva`/`tailwind-merge`/`clsx` 工具链；验证：每个组件有渲染冒烟测试
- [ ] 5.2 图标替换为 `lucide-vue-next`；验证：grep 无 `lucide-react` 残留、亮/暗主题下图标视觉一致
- [ ] 5.3 `vue-sonner` 对接既有 Toast 队列服务；验证：Toast 队列单测重写并通过（顺序展示、自动消失、手动关闭、移动端定制）
- [ ] 5.4 消息虚拟滚动切换到 `@virtua/vue`；验证：长列表虚拟滚动测试通过（可视区渲染、滚动位置恢复、底部跟随）
- [ ] 5.5 模型表格与表单切换到 `@tanstack/vue-table`/`vue-form`；验证：排序、分页、表单校验测试通过
- [ ] 5.6 Provider 网格瀑布流改用 CSS columns 方案；验证：列数随视口自适应、与迁移前布局一致
- [ ] 5.7 基础组件 a11y 验收：对话框 Escape/遮罩关闭与焦点管理、下拉键盘导航、警告对话框描述关联；验证：对应组件测试通过

## 6. 阶段 3：布局与导航

- [ ] 6.1 重写 `Layout`、自适应侧边栏、顶部栏；验证：侧边栏收展与标题/按钮行为冒烟通过
- [ ] 6.2 重写移动端底部导航与抽屉（含遮罩与开合状态）；验证：抽屉状态单测通过
- [ ] 6.3 响应式断点迁移（`useResponsive`/`useMediaQuery` → `@vueuse/core` 等价 composable）；验证：断点切换布局行为测试通过
- [ ] 6.4 全局错误处理（`app.config.errorHandler` + `onErrorCaptured` 等价错误边界）；验证：注入渲染异常的用例不白屏
- [ ] 6.5 布局域测试重写完成；验证：桌面/移动两形态手动冒烟通过

## 7. 阶段 3：Chat 页域

- [ ] 7.1 重写聊天页骨架与消息列表（接入虚拟滚动与流式渲染管线）；验证：流式增量渲染既有性能测试语义通过
- [ ] 7.2 重写消息气泡与消息操作（Markdown/代码高亮/复制、重新生成、备忘等既有规格项）；验证：渲染与操作测试通过、不安全 HTML 被净化
- [ ] 7.3 重写输入区（自动高度 textarea、发送表单、快捷键行为）；验证：输入区测试通过
- [ ] 7.4 重写聊天侧栏交互（重命名校验、删除与 URL 同步、自动命名）；验证：对应测试通过
- [ ] 7.5 验证聊天服务层（框架无关）零改动接线：发送、流式、标题生成、元数据收集；验证：chat-flow 集成测试通过
- [ ] 7.6 Chat 域测试重写完成；验证：手动冒烟（发送/流式/重命名/删除/导出）通过

## 8. 阶段 3：Model 页域

- [ ] 8.1 重写模型页与 Provider 网格（卡片头、详情视图、logo 显示）；验证：Provider 相关组件测试通过
- [ ] 8.2 重写模型表格页与创建/编辑表单；验证：模型管理 UI 测试通过
- [ ] 8.3 验证 `modelRemote` 远程获取服务（框架无关）零改动接线；验证：远程模型获取测试通过
- [ ] 8.4 Model 域测试重写完成；验证：手动冒烟（供应商浏览、模型增删改查）通过

## 9. 阶段 3：Setting 页域

- [ ] 9.1 重写设置页骨架与通用设置（语言切换、主题、数据重置确认流）；验证：设置变更集成测试通过
- [ ] 9.2 重写密钥管理设置（主密钥导入、恢复对话框、验证、导出显示）；验证：密钥管理 UI 测试通过
- [ ] 9.3 重写聊天导出设置与 DEV toast-test 页面；验证：导出设置行为冒烟通过
- [ ] 9.4 Setting 域测试重写完成；验证：设置项变更后刷新持久化冒烟通过

## 10. 阶段 4：收尾与合入

- [ ] 10.1 移除全部 React 生态依赖与残留文件（react、react-dom、react-redux、@reduxjs/toolkit、react-router-dom、react-i18next、Radix 全家桶、@tanstack/react-*、lucide-react、sonner、next-themes、virtua（react 版）、react-masonry-css、react-resizable-panels、@testing-library/react、@types/react*、babel-plugin-react-compiler）；验证：`pnpm analyze:unused` 干净、grep 无 react 导入、`pnpm build` 成功
- [ ] 10.2 测试基础设施收尾：oxlint 适配 Vue SFC、msw/stryker/fake-indexeddb 配置核对、测试目录与 mock 工厂更新；验证：`pnpm test:all`（单测 + 集成 + 变异）全绿
- [ ] 10.3 构建产物体积与阶段 0 基线对比；验证：总体积无超过 10% 的回归（超出需分析说明并优化）
- [ ] 10.4 文档同步：`AGENTS.md`（技术栈、架构、快速查找表）、`README.md`/`README.zh-CN.md` 双语同步、`docs/design/` 受影响篇目（initialization、chat-service、i18n-system、cross-platform 等）；验证：文档无 React/Tauri 残留描述、双语章节结构一致
- [ ] 10.5 核对本变更 delta specs 与主 specs 的归档就绪状态（archive 后新能力 Purpose 无 TBD 占位）；验证：`openspec validate` 通过
- [ ] 10.6 最终验收：全量测试 + 构建体积报告 + 手动全流程冒烟（聊天/模型/设置/主题/语言/密钥），PR 审查后合入 `main` 并更新版本号
