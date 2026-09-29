# Spec Delta

## Purpose

定义应用迁移到 Vue 3（组合式 API）后的前端架构要求：组件模型、状态管理、路由、组合式函数与应用启动流程，确保迁移后对外行为与现有 React 版本保持一致。

## ADDED Requirements

### Requirement: Vue 3 应用挂载与组件模型

应用 SHALL 基于 Vue 3 挂载与组织 UI：入口使用 `createApp` 创建应用实例并挂载到根节点；所有 UI 组件 SHALL 使用单文件组件（`.vue`）与 `<script setup lang="ts">` 组合式 API 编写，并保持 TypeScript 严格模式下的类型安全。

#### Scenario: 应用挂载

- **WHEN** 应用启动
- **THEN** 系统 SHALL 通过 Vue 3 的 `createApp(...).mount(...)` 将根组件挂载到 `index.html` 的根节点
- **AND** 不存在任何 React 挂载调用（如 `ReactDOM.createRoot`）

#### Scenario: 组件采用 SFC 与组合式 API

- **WHEN** 实现 UI 组件
- **THEN** 组件 SHALL 以 `.vue` 单文件组件形式存在
- **AND** 逻辑块 SHALL 使用 `<script setup lang="ts">`
- **AND** 不使用 Vue 2 风格的 Options API 编写新组件

#### Scenario: 组件类型安全

- **WHEN** 定义组件的 props 与 emits
- **THEN** SHALL 使用基于类型的声明获得编译期类型检查
- **AND** `pnpm tsc`（或等价类型检查命令）通过，无类型错误

### Requirement: 组合式函数组织共享逻辑

原 React hooks 形式的共享逻辑 SHALL 迁移为 Vue 组合式函数（命名以 `use` 开头），保持等价的输入输出行为；与框架无关的纯工具函数 SHALL 保持为普通 TypeScript 模块，不强行包装为组合式函数。

#### Scenario: hooks 迁移为 composables

- **WHEN** 迁移现有自定义 hook（如自适应滚动、自动增高文本域、防抖、响应式断点）
- **THEN** 系统 SHALL 提供同名语义的组合式函数（如 `useAutoResizeTextarea`）
- **AND** 副作用清理 SHALL 通过响应式作用域自动完成或显式注销，不产生监听器泄漏

#### Scenario: 框架无关逻辑不包装

- **WHEN** 逻辑不依赖组件生命周期或响应式系统（如时间戳工具、加密工具、聊天服务层）
- **THEN** 该逻辑 SHALL 保持为普通 TypeScript 模块
- **AND** 不为迁移而引入不必要的包装层

### Requirement: Pinia 状态管理

应用状态 SHALL 使用 Pinia 管理：每个现有 Redux slice 对应一个 Pinia store，selector 语义以 getter/computed 等价实现；现有持久化中间件行为（聊天列表、模型列表、默认语言的自动保存）SHALL 保持不变。

#### Scenario: 领域 store 覆盖

- **WHEN** 任何 UI 读取或修改全局状态
- **THEN** SHALL 通过对应的 Pinia store 完成（模型、聊天、聊天页、应用配置、模型供应商、设置页、模型页）
- **AND** 代码库中不存在 Redux store、`useDispatch`/`useSelector` 或 Redux Toolkit 依赖

#### Scenario: 状态变更自动持久化行为保持

- **WHEN** 聊天列表或模型列表发生变更，或用户修改默认语言
- **THEN** 系统 SHALL 以与迁移前相同的触发时机和持久化目标保存数据
- **AND** 页面刷新后状态恢复行为与迁移前一致

### Requirement: vue-router 路由

应用 SHALL 使用 vue-router 提供与现有 react-router 等价的路由行为：路由结构（`/chat`、`/model/table`、`/model/add`、`/setting/common`、`/setting/key-management`、`/404` 及重定向）、页面级懒加载、以及 GH Pages 子路径 basename 支持 SHALL 全部保持。

#### Scenario: 路由结构等价

- **WHEN** 用户访问根路径
- **THEN** 系统 SHALL 重定向到 `/chat`
- **AND** 访问 `/model` 重定向到 `/model/table`，访问 `/setting` 重定向到 `/setting/common`
- **AND** 未匹配路径重定向到 `/404`

#### Scenario: 页面懒加载保持

- **WHEN** 构建应用
- **THEN** 各页面 SHALL 保留路由级代码分割（动态导入）
- **AND** 初始加载的 JS 体积不因路由合并而显著增加

#### Scenario: 子路径部署支持

- **WHEN** 应用部署在 GH Pages 子路径（如 `/multi-chat/`）
- **THEN** 路由 SHALL 以配置的 base 正确解析
- **AND** 刷新非根路径不产生 404 之外的降级行为

### Requirement: 应用分阶段启动流程

应用启动 SHALL 保持现有分阶段加载行为：HTML 静态 Spinner → 动态加载 initSteps → 初始化动画（InitializationController 等价物，含进度展示与三级错误处理）→ 动态加载主应用 → 渲染主界面；任一阶段失败 SHALL 展示与现有等价的错误界面与重试入口。

#### Scenario: 正常启动流程

- **WHEN** 用户打开应用且初始化全部成功
- **THEN** 系统 SHALL 依次呈现静态 Spinner、初始化进度界面、主应用
- **AND** 主应用在初始化完成后才开始加载

#### Scenario: 阶段失败展示错误界面

- **WHEN** initSteps 加载失败或主应用加载失败
- **THEN** 系统 SHALL 显示错误信息与"重试"入口
- **AND** 重试行为与迁移前一致（刷新页面）

### Requirement: i18n 组合式访问

国际化 SHALL 保留 i18next 核心与现有语言资源、按需加载、缓存校验与翻译完整性检查行为；组件 SHALL 通过 Vue 组合式 API 获取翻译函数，语言切换 SHALL 实时更新所有已渲染组件的文案。

#### Scenario: 组件内翻译

- **WHEN** 组件需要展示文案
- **THEN** SHALL 通过组合式函数（如 `useTranslation` 等价物）获取 `t` 函数
- **AND** 不再依赖 `react-i18next`

#### Scenario: 语言切换实时生效

- **WHEN** 用户在设置中切换界面语言
- **THEN** 所有已挂载组件的文案 SHALL 无需刷新页面即更新
- **AND** 选择持久化行为与迁移前一致
