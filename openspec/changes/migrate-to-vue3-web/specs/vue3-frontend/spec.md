# Spec Delta

## Purpose

定义前端框架由 React 迁移至 Vue 3（组合式 API）后必须满足的架构与兼容性要求，确保迁移不改变用户可见行为、URL 路由结构与既有 Web 用户数据的可用性。

## ADDED Requirements

### Requirement: Vue 3 组合式 API 技术栈

系统前端 SHALL 基于 Vue 3 组合式 API（`<script setup>` 单文件组件与组合式函数）实现，SHALL NOT 保留任何 React 运行时依赖。

#### Scenario: 依赖清单与产物无 React 运行时

- **WHEN** 检查迁移后的 package.json 依赖与生产构建产物
- **THEN** 不存在 react、react-dom、react-redux、react-router-dom、react-i18next 等 React 生态依赖
- **AND** 页面由 Vue 运行时渲染

#### Scenario: 组件与状态逻辑以组合式 API 编写

- **WHEN** 开发者新增或修改组件与跨组件状态逻辑
- **THEN** 使用 `<script setup>` 单文件组件与组合式函数（composables）实现

### Requirement: URL 路由结构兼容

迁移后应用 SHALL 保持既有 URL 路由结构与重定向行为不变，并保持子路径部署（GitHub Pages）支持。

#### Scenario: 根路径重定向

- **WHEN** 用户访问 `/`
- **THEN** 被重定向到 `/chat`

#### Scenario: 嵌套路由索引重定向

- **WHEN** 用户访问 `/model` 或 `/setting`
- **THEN** 分别被重定向到 `/model/table` 与 `/setting/common`

#### Scenario: 未知路径兜底

- **WHEN** 用户访问未定义的路径
- **THEN** 被重定向到 `/404` 并展示 404 页面

#### Scenario: 子路径部署下路由正常

- **WHEN** 应用部署在 GitHub Pages 子路径（如 `/multi-chat/`）
- **THEN** 路由 basename 遵循部署 base 路径，所有路由可直接访问且刷新后不 404

#### Scenario: 页面级懒加载保持

- **WHEN** 构建生产包
- **THEN** 各页面组件保持按路由懒加载分包，初始加载不包含全部页面代码

### Requirement: 既有用户数据免迁移兼容

迁移后应用 SHALL 在不执行任何数据迁移脚本的前提下，直接读取并继续写入既有 Web 版数据：IndexedDB 库 `multi-chat-store` 与 `multi-chat-keyring`，以及全部 localStorage 键（含 `multi-chat-keyring-seed`、`keyring-data-version`、`multi-chat-security-warning-dismissed` 与 `multi-chat-` 前缀的语言缓存等）。

#### Scenario: 既有聊天数据完整呈现

- **GIVEN** 用户在迁移前的 Web 版本中存在聊天会话与模型配置
- **WHEN** 迁移后的应用启动完成
- **THEN** 聊天列表与模型配置完整呈现，可正常继续既有会话

#### Scenario: 主密钥可解密既有加密数据

- **GIVEN** 既有 IndexedDB 中存储了加密的主密钥与加密的模型 API Key 字段
- **WHEN** 迁移后的应用启动并初始化主密钥
- **THEN** 使用既有种子派生的密钥成功解密，加密数据读写正常

#### Scenario: 用户设置保留

- **GIVEN** 用户在迁移前设置过界面语言与其他应用设置
- **WHEN** 迁移后的应用启动
- **THEN** 界面语言与应用设置与迁移前一致，无需重新设置

### Requirement: 状态持久化时机等价

状态管理迁移后，应用状态变化触发持久化的时机 SHALL 与迁移前保持一致：聊天会话数据变更即保存、模型列表变更即保存、默认语言变更即保存。

#### Scenario: 会话变更即时持久化

- **WHEN** 用户发送消息、重命名或删除会话
- **THEN** 对应 IndexedDB 存储在本次变更内完成写入，刷新页面后状态不丢失

#### Scenario: 模型变更即时持久化

- **WHEN** 用户新增、修改或删除模型配置
- **THEN** 模型数据（含加密的 API Key 字段）即时持久化，刷新页面后保留

### Requirement: 国际化行为等价

迁移 SHALL 保留 i18next 核心与全部语言资源文件（en/zh/fr × 8 命名空间），并保持现有加载策略：英文资源同步打包，其余语言按需懒加载并缓存。

#### Scenario: 切换语言按需加载

- **WHEN** 用户从英文切换到中文
- **THEN** 中文各命名空间资源按需加载并渲染，重复切换命中缓存

#### Scenario: 语言资源不随迁移修改

- **WHEN** 迁移完成后对比语言资源 JSON
- **THEN** 键结构与译文内容与迁移前一致，翻译键无需变更

### Requirement: UI 交互行为等价

UI 组件库替换后，用户可见的交互行为 SHALL 保持一致，包括：模态对话框的打开/关闭与焦点管理、下拉与表单控件的键盘可达性、Toast 队列的展示与去重、虚拟滚动列表的滚动行为，以及亮/暗主题切换。

#### Scenario: 主题切换保持

- **WHEN** 用户在设置中切换亮色/暗色主题
- **THEN** 主题立即生效并持久化，刷新后保持

#### Scenario: Toast 队列行为保持

- **WHEN** 连续触发多个 Toast 通知
- **THEN** 展示顺序、去重与自动消失行为与迁移前一致

### Requirement: 聊天核心流程回归可用

迁移后 SHALL 保持聊天核心用户流程可用：创建会话、选择模型、发送消息、流式渲染回复（含推理内容展示）、停止生成、重新生成、会话自动命名与删除会话。

#### Scenario: 流式回复正常

- **WHEN** 用户在会话中发送消息且所选模型 API 端点可访问
- **THEN** 回复以流式增量渲染，生成过程可中断，完成后消息与用量元数据正确持久化

#### Scenario: 会话自动命名

- **WHEN** 新会话完成首轮回复
- **THEN** 会话按既有自动命名规则获得标题

### Requirement: 测试栈迁移与回归保障

UI 层测试 SHALL 迁移至 Vue 测试栈（Vue Test Utils）并延续项目既有测试约定（测试用户可见行为、仅 mock 系统边界）；框架无关层（服务、工具、存储）的既有测试 SHALL 保留并在适配导入路径后通过。

#### Scenario: 框架无关测试保留通过

- **WHEN** 迁移完成后运行完整测试套件
- **THEN** 服务层与工具层既有测试在适配导入路径后全部通过

#### Scenario: UI 层关键行为有等价覆盖

- **WHEN** 迁移后的组件与页面发生行为回归
- **THEN** 存在对应的 Vue 测试栈用例能够捕获该回归
