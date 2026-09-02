## Purpose

定义前端从 React 迁移至 Vue 3 后视图层必须满足的行为契约：应用骨架、路由、状态持久化、UI 交互、国际化均与迁移前对等，且 React 相关依赖完全清零。

## ADDED Requirements

### Requirement: Vue 3 应用骨架与启动流程

前端应用 SHALL 基于 Vue 3（Composition API + 单文件组件 + TypeScript）构建。启动流程 SHALL 与迁移前对等：静态 HTML Spinner → 初始化步骤动画 → 主应用。

#### Scenario: 正常启动

- **WHEN** 用户启动应用且全部初始化步骤成功
- **THEN** 依次呈现 HTML Spinner、初始化动画，最终进入主应用聊天页面

#### Scenario: 初始化失败与重试

- **WHEN** 初始化步骤或主应用加载失败
- **THEN** 显示错误界面与"重试"按钮，点击后重新加载应用

#### Scenario: 版本号日志

- **WHEN** 应用启动
- **THEN** 控制台打印带样式的应用版本号标识

### Requirement: 路由对等

路由系统 SHALL 保持与迁移前完全一致的 URL 结构、重定向与兜底行为，并支持子路径部署。

#### Scenario: 索引路由重定向

- **WHEN** 访问 `/`、`/model` 或 `/setting`
- **THEN** 分别重定向至 `/chat`、`/model/table`、`/setting/common`

#### Scenario: 未定义路径兜底

- **WHEN** 访问任何未定义的路径
- **THEN** 重定向至 `/404` 并显示未找到页面

#### Scenario: 页面懒加载

- **WHEN** 生产构建应用
- **THEN** 各页面为独立 chunk，仅在路由命中时按需加载

#### Scenario: 子路径部署

- **WHEN** 应用以子路径（GitHub Pages BASE_PATH）部署
- **THEN** 所有路由与静态资源以该前缀正常工作

### Requirement: 状态管理与自动持久化对等

全局状态 SHALL 由 Vue 生态状态管理方案承载，且持久化副作用与迁移前一致：聊天列表、模型配置、语言偏好在变更后自动写入既有存储层，数据格式不变。

#### Scenario: 聊天数据自动保存

- **WHEN** 聊天列表或消息内容发生变更
- **THEN** 变更自动持久化至既有存储层，重启应用后可恢复

#### Scenario: 模型数据自动保存

- **WHEN** 新增、修改或删除模型配置
- **THEN** 变更自动持久化至既有存储层

#### Scenario: 语言偏好持久化

- **WHEN** 用户切换界面语言
- **THEN** 语言选择被持久化，下次启动应用时自动应用

#### Scenario: 状态跨页面共享

- **WHEN** 在路由间切换页面
- **THEN** 聊天、模型等全局状态保持连续，不因导航而丢失

### Requirement: UI 行为与视觉对等

迁移后应用的界面视觉与交互行为 SHALL 与迁移前保持一致，包括弹层、表单、表格、虚拟滚动、分栏、瀑布流布局、深浅色主题与响应式断点。

#### Scenario: 深浅色主题切换

- **WHEN** 用户切换深浅色主题或跟随系统
- **THEN** 根元素 class 即时切换、偏好被持久化，且读取迁移前已保存的主题偏好不丢失

#### Scenario: 响应式布局切换

- **WHEN** 视口在桌面与移动断点之间变化
- **THEN** 侧边栏、抽屉、底部导航按既有断点规则切换

#### Scenario: 复杂布局组件行为

- **WHEN** 使用可拖拽分栏、瀑布流、虚拟列表等布局能力
- **THEN** 拖拽、滚动与渲染行为与迁移前一致

### Requirement: 国际化行为对等

界面文本翻译系统 SHALL 保持既有行为：英文资源静态打包、其他语言按需加载、切换即时生效、缺失回退英文。

#### Scenario: 语言切换即时生效

- **WHEN** 用户切换界面语言且该语言资源加载完成
- **THEN** 所有已渲染界面文本即时更新，无需刷新或重启

#### Scenario: 语言资源按需加载与重试

- **WHEN** 切换到英文以外的语言
- **THEN** 仅加载该语言资源包；加载失败时按既有重试策略重试

#### Scenario: 翻译缺失回退

- **WHEN** 某条翻译键在目标语言中缺失
- **THEN** 界面显示英文回退文本，并遵循既有缺失告警规则

### Requirement: React 依赖清零

迁移完成后，项目依赖树与构建产物中 SHALL 不存在任何 React 系依赖。

#### Scenario: 依赖树检查

- **WHEN** 检查 package.json 与锁定文件
- **THEN** 不存在 react、react-dom、react-redux、react-router 等任何 React 相关直接或间接依赖

#### Scenario: 桌面应用构建

- **WHEN** 执行 Tauri 生产构建
- **THEN** 构建成功，产出的桌面应用可正常启动并使用全部功能

### Requirement: 质量门禁对等

迁移后项目 SHALL 保持既有质量门禁：单元/集成测试通过、lint 与类型检查通过、分模块覆盖率阈值不降低。

#### Scenario: 测试套件通过

- **WHEN** 运行既有单元测试与集成测试命令
- **THEN** 全部通过，且组件级测试覆盖与迁移前对等

#### Scenario: Lint 与类型检查

- **WHEN** 运行 lint 与 TypeScript 类型检查
- **THEN** 通过且无错误，国际化资源完整性校验脚本通过

#### Scenario: 覆盖率阈值

- **WHEN** 运行测试覆盖率统计
- **THEN** 分模块覆盖率阈值配置与迁移前一致且达标
