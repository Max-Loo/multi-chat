# Spec Delta

## Purpose

定义前端框架由 React 19 迁移至 Vue 3（组合式 API）后的架构约束与行为对等要求，确保迁移后用户可见行为、既有规格场景与开发工作流保持一致。

## ADDED Requirements

### Requirement: Vue 3 组合式 API 组件形态

前端 SHALL 使用 Vue 3 组合式 API 编写全部组件：组件以单文件组件（`.vue` SFC）形式组织，脚本部分使用 `<script setup lang="ts">` 语法；项目 SHALL 不存在任何 React 组件文件（`.tsx`/`.jsx`）。

#### Scenario: 组件文件形态
- **WHEN** 检查 `src/` 目录下的全部组件文件
- **THEN** 所有组件均为 `.vue` 单文件组件
- **AND** 脚本块均使用 `<script setup lang="ts">` 组合式 API 语法
- **AND** 不存在 `.tsx`/`.jsx` 组件文件

#### Scenario: 组合式函数替代自定义 Hook
- **WHEN** 原 React 自定义 Hook（如 `useDebounce`、`useResponsive`、`useMediaQuery`）被迁移
- **THEN** 对应逻辑以 `use` 前命名的 Vue 组合式函数提供
- **AND** 调用方在 `<script setup>` 中以相同语义使用（响应式状态、副作用、返回值）

### Requirement: Pinia 状态管理

应用全局状态 SHALL 由 Pinia 管理，替代 Redux Toolkit：原有 Redux slice 的状态字段、action 行为与派生选择器语义 SHALL 在对应 Pinia store 中保持等价；与存储层（IndexedDB）同步的 middleware 行为 SHALL 保留。

#### Scenario: 状态模块对等
- **WHEN** 对照迁移前的 Redux slice（appConfig、chat、model、modelProvider 及各页面状态）与迁移后的 Pinia store
- **THEN** 每个原 slice 至少存在一个行为等价的 Pinia store 或组合式函数
- **AND** 状态字段初始值与更新语义一致

#### Scenario: 持久化行为保留
- **WHEN** 聊天记录、模型配置、应用配置发生变更
- **THEN** 持久化时机与写入的数据格式与迁移前一致（IndexedDB 中的既有数据无需迁移即可继续读取）

#### Scenario: DevTools 可观测
- **WHEN** 在开发环境安装 Vue DevTools
- **THEN** 可以查看各 Pinia store 的状态与变更历史

### Requirement: 路由结构与导航行为对等

应用 SHALL 使用 vue-router 提供与迁移前 React Router 相同的路由结构：路由路径、参数命名、懒加载分包与重定向行为保持不变。

#### Scenario: 路由表对等
- **WHEN** 对照迁移前后的路由定义
- **THEN** 路由路径与层级完全一致（首页、聊天页、模型页、设置页、404 页）
- **AND** 动态路由参数（如聊天 ID）语义一致
- **AND** 各路由的懒加载策略保留

#### Scenario: 未匹配路由跳转 404
- **WHEN** 用户访问未定义的路由路径
- **THEN** 应用渲染 404 页面，行为与迁移前一致

#### Scenario: 编程式导航
- **WHEN** 业务代码执行页面跳转（如创建聊天后跳转到聊天页）
- **THEN** 跳转目标与迁移前一致，浏览器历史记录行为一致

### Requirement: 国际化行为对等

应用 SHALL 使用 vue-i18n 提供与迁移前 react-i18next 相同的国际化行为：支持语言（简体中文、英语、法语）、翻译键、按需加载与缓存策略、语言切换持久化行为保持不变；现有翻译资源文件不经修改直接复用。

#### Scenario: 语言资源复用
- **WHEN** 迁移完成后检查 `src/locales/` 下的翻译资源
- **THEN** 各语言的翻译键与译文与迁移前一致，未发生键名变更或丢失

#### Scenario: 语言切换
- **WHEN** 用户在设置页切换界面语言
- **THEN** 界面文本立即切换为新语言
- **AND** 选择被持久化，刷新后保持

#### Scenario: 缺失翻译回退
- **WHEN** 某翻译键在当前语言下不存在
- **THEN** 系统按既有回退策略显示回退语言的译文

### Requirement: 用户可见行为对等

迁移 SHALL 保持全部用户可见行为对等：既有 OpenSpec 规格中描述的 UI 行为场景（聊天收发与流式渲染、模型管理、设置页、Toast、响应式布局、可访问性等）在迁移后继续成立。

#### Scenario: 既有规格场景继续成立
- **WHEN** 将既有规格（如 chat-panel-testing、mobile-drawer、responsive-layout、toast-api 等）的场景用 Vue 测试栈重新执行
- **THEN** 行为断言与迁移前等价

#### Scenario: 流式聊天渲染
- **WHEN** 用户发送消息并收到流式响应
- **THEN** 消息气泡实时增量渲染，Markdown 与代码高亮行为与迁移前一致

#### Scenario: 键盘可达性与焦点管理
- **WHEN** 用户以键盘操作对话框、下拉菜单等交互组件
- **THEN** 焦点圈定、Esc 关闭、Tab 顺序等可访问性行为与迁移前一致

### Requirement: UI 基础组件库等价替换

shadcn/ui 风格的基础组件（对话框、下拉菜单、选择器、开关、表格等）SHALL 由基于 Reka UI 的 Vue 实现等价替换，组件的视觉样式、交互行为与可访问性语义保持不变；图标 SHALL 由 `lucide-vue-next` 提供同名图标。

#### Scenario: 基础组件清单覆盖
- **WHEN** 对照迁移前的 `src/components/ui/` 组件清单
- **THEN** 迁移后每个基础组件均有对应的 Vue 版本
- **AND** 组件的 props 命名与默认行为语义一致（按 Vue 惯例转换命名约定后）

#### Scenario: 图标等价
- **WHEN** 迁移使用到 `lucide-react` 图标的组件
- **THEN** 对应使用 `lucide-vue-next` 中的同名图标，视觉呈现一致

### Requirement: React 生态依赖清零

迁移完成后，`package.json` 的依赖与开发依赖中 SHALL 不存在任何 React 生态包（react、react-dom、react-redux、react-router、react-i18next、@radix-ui/*、lucide-react、@testing-library/react、@vitejs/plugin-react、babel-plugin-react-compiler 等）。

#### Scenario: 依赖清单检查
- **WHEN** 检查迁移后的 `package.json` 与 lockfile
- **THEN** 依赖树中不存在上述 React 生态包
- **AND** 构建产物中不包含 React 运行时代码

### Requirement: 开发与构建工作流

项目 SHALL 保留 Vite + TypeScript + Tailwind CSS 构建链：开发服务器、类型检查、生产构建、测试、代码检查命令均正常工作，命令语义与迁移前的 Web 工作流一致。

#### Scenario: 开发服务器
- **WHEN** 执行 `pnpm dev`
- **THEN** 启动 Vite 开发服务器并在浏览器中正常预览应用
- **AND** 热更新（HMR）对 `.vue` 文件生效

#### Scenario: 类型检查与构建
- **WHEN** 执行 `pnpm tsc` 与 `pnpm build`
- **THEN** 类型检查通过，生产构建成功产出静态资源

#### Scenario: 测试与代码检查
- **WHEN** 执行 `pnpm test:run`、`pnpm test:integration:run` 与 `pnpm lint`
- **THEN** 全部命令在 Vue 测试栈下正常执行
