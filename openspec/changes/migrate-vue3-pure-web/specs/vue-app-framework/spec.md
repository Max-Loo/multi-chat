# Spec Delta

## Purpose

定义应用前端以 Vue 3 组合式 API 构建的行为契约：应用入口与启动状态机、组件组织、composables、Pinia 状态管理、路由与国际化、主题系统的对外行为，确保迁移后用户可感知行为与迁移前保持一致。

## ADDED Requirements

### Requirement: 应用启动状态机

应用 SHALL 以三态状态机启动：加载中（loading）→ 初始化中（initializing）→ 就绪（ready）；初始化失败时进入致命错误（fatal）状态。

#### Scenario: 初始化成功进入主应用

- **WHEN** 应用启动且所有初始化步骤（keyring 数据迁移、主密钥初始化、i18n、模型加载、聊天数据加载）成功完成
- **THEN** 系统渲染主应用界面，用户可正常使用聊天、模型、设置功能
- **AND** 主应用代码按需动态加载，不阻塞启动画面

#### Scenario: 初始化失败显示致命错误

- **WHEN** 任一关键初始化步骤抛出不可恢复错误
- **THEN** 系统显示致命错误界面，包含错误信息与重试入口
- **AND** 不渲染主应用界面

#### Scenario: 启动期间显示加载状态

- **WHEN** 初始化步骤仍在执行
- **THEN** 系统显示加载动画与品牌标识
- **AND** 不出现白屏或未样式化内容闪烁

### Requirement: 组件模型

应用 SHALL 使用 Vue 3 单文件组件（SFC）与 `<script setup>` 组合式 API 组织全部界面代码。

#### Scenario: 组件文件组织

- **WHEN** 开发者查看源码结构
- **THEN** 页面组件位于 `src/pages/`，功能组件位于 `src/components/`，UI 原子组件位于 `src/components/ui/`
- **AND** 组件以 `.vue` 单文件组件形式实现（脚本、模板、样式同文件）

#### Scenario: 组合式 API 使用

- **WHEN** 组件需要响应式状态或生命周期逻辑
- **THEN** 组件使用 `ref`、`reactive`、`computed`、`watch`、生命周期钩子等组合式 API 实现
- **AND** 不使用选项式 API（`data`、`methods`、`computed` 选项）

#### Scenario: UI 原子组件行为一致

- **WHEN** 用户与对话框、下拉菜单、开关、tooltip 等基础 UI 组件交互
- **THEN** 组件的可见行为（打开/关闭、键盘导航、焦点管理、无障碍属性）与迁移前的 shadcn/ui 组件一致
- **AND** UI 原子组件基于 shadcn-vue（reka-ui）实现，Tailwind CSS 样式类名原样保留

### Requirement: Composables 约定

可复用状态逻辑 SHALL 以 `use` 前命名的 composables 形式组织，等价替代迁移前的自定义 hooks。

#### Scenario: composable 命名与位置

- **WHEN** 开发者创建可复用逻辑（如防抖、响应式断点、聊天创建）
- **THEN** 该逻辑以 `useXxx` 命名的函数实现于 `src/composables/` 或就近模块
- **AND** 多组件共享的逻辑 SHALL 提取为独立 composable，不在组件内重复实现

#### Scenario: 既有 hooks 等价迁移

- **WHEN** 迁移前的自定义 hook（如 useDebounce、useMediaQuery、useConfirm、useCreateChat）在迁移后使用
- **THEN** 等价 composable 提供相同的输入输出契约与触发时机
- **AND** 防抖延迟、断点阈值、确认对话框行为等参数默认值保持不变

### Requirement: Pinia 状态管理

应用 SHALL 使用 Pinia 管理全局状态，领域 store 与迁移前的 Redux slice 一一对应（模型、聊天、聊天页、应用配置、模型供应商、设置页、模型页）。

#### Scenario: 状态读取与变更

- **WHEN** 组件读取或变更全局状态（如切换当前聊天、更新模型列表）
- **THEN** 通过对应领域 store 的 state、getters、actions 完成
- **AND** 状态变更后所有依赖该状态的组件同步更新

#### Scenario: 持久化时机一致

- **WHEN** 聊天列表、模型列表、默认应用语言发生变更
- **THEN** 系统在变更生效时将数据写入浏览器持久化存储（IndexedDB）
- **AND** 持久化时机与迁移前的 Redux 持久化中间件一致，不额外增加防抖延迟

#### Scenario: 启动时状态水合

- **WHEN** 应用启动初始化
- **THEN** 系统从 IndexedDB 加载聊天与模型数据填充 store
- **AND** 加密字段（如供应商 apiKey）使用主密钥解密后进入 store

### Requirement: 路由行为

应用 SHALL 使用 vue-router 提供与迁移前一致的路由行为。

#### Scenario: 路由结构与懒加载

- **WHEN** 用户访问聊天、模型、设置页面或未知路径
- **THEN** 路由分别渲染对应页面组件、未知路径渲染 404 页面
- **AND** 页面组件按需懒加载，路由切换不整包重新下载

#### Scenario: 子路径部署

- **WHEN** 应用部署在 GitHub Pages 子路径（如 `/multi-chat/`）下
- **THEN** 路由基于构建时 base 路径正确解析
- **AND** 刷新或直接访问子路径 URL 时应用正常加载

#### Scenario: 聊天删除后 URL 同步

- **WHEN** 用户删除当前 URL 所指向的聊天
- **THEN** 路由同步跳转到有效的默认页面
- **AND** 不停留在指向已删除聊天的 URL

### Requirement: 国际化集成

应用 SHALL 通过组合式 API 集成 i18next，保留现有按需加载与缓存行为。

#### Scenario: 语言切换即时生效

- **WHEN** 用户在设置中切换界面语言
- **THEN** 全部界面文本立即切换到目标语言
- **AND** 选择持久化到 localStorage，下次启动沿用

#### Scenario: 命名空间按需加载

- **WHEN** 某语言的功能模块翻译尚未加载
- **THEN** 系统按命名空间懒加载翻译资源并缓存
- **AND** 加载期间界面显示既有回退文本，不阻塞用户操作

### Requirement: 主题切换

应用 SHALL 提供亮色/暗色/跟随系统三种主题模式。

#### Scenario: 主题切换与持久化

- **WHEN** 用户切换主题模式
- **THEN** 界面配色立即生效，根元素主题 class 同步更新
- **AND** 选择持久化到 localStorage，下次启动沿用

#### Scenario: 跟随系统偏好

- **WHEN** 主题模式为"跟随系统"且系统外观变化
- **THEN** 应用主题跟随系统亮暗变化实时切换

### Requirement: TypeScript 严格模式

应用代码 SHALL 在 vue-tsc 严格模式下无类型错误通过编译。

#### Scenario: 类型检查通过

- **WHEN** 开发者执行类型检查命令
- **THEN** 全部 `.vue` 与 `.ts` 文件编译通过，无类型错误
