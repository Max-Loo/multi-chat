# Vue 3 框架能力规范（增量）

## Purpose

定义应用 UI 层全面构建于 Vue 3（组合式 API）之上的框架级约束：框架与状态/路由选型、等功能迁移基线、UI 生态映射与 i18n 绑定方式，确保迁移后用户可见行为不回退且不残留 React 运行时依赖。

## ADDED Requirements

### Requirement: 框架与运行时

应用 UI 层 SHALL 使用 Vue 3 组合式 API（`<script setup>` 单文件组件）实现，状态管理 SHALL 使用 Pinia，路由 SHALL 使用 vue-router；应用源码与构建产物 SHALL NOT 包含 React 运行时及其配套绑定库。

#### Scenario: 源码无 React 依赖

- **WHEN** 在 `src/` 目录中检索 `react`、`react-dom`、`@reduxjs/toolkit`、`react-router-dom`、`react-i18next` 等包的导入
- **THEN** 不存在任何匹配项

#### Scenario: 构建产物无 React 运行时

- **WHEN** 执行生产构建并分析产物
- **THEN** 构建产物中不包含 React、ReactDOM 或 react-redux 的运行时代码
- **AND** Vue 运行时以独立 vendor chunk 形式分包

#### Scenario: 组件与组合式函数范式

- **WHEN** 编写或评审页面、组件与可复用逻辑
- **THEN** 组件使用 `<script setup>` 与组合式 API
- **AND** 可复用逻辑以组合式函数（composables）组织，对应迁移前的自定义 hooks

### Requirement: 等功能迁移基线

框架迁移 SHALL 为等功能重写：迁移完成后，所有既有用户可见功能的行为保持不变，不新增、不删减、不修改任何面向用户的功能语义。

#### Scenario: 核心流程行为等价

- **WHEN** 在迁移前后分别执行核心用户流程（创建聊天、发送消息、流式渲染回复、重命名/删除聊天、管理模型与供应商、切换语言与主题、导出聊天、导入导出密钥）
- **THEN** 各流程的交互结果与界面反馈保持一致
- **AND** 不出现迁移引入的新行为差异

#### Scenario: 路由与导航等价

- **WHEN** 在迁移后的应用中访问既有路由（首页、聊天详情、设置等）
- **THEN** 路由路径、重定向规则与导航行为与迁移前一致

#### Scenario: 移动端与响应式行为等价

- **WHEN** 在移动端视口使用应用
- **THEN** 底部导航、抽屉、响应式布局等既有行为与迁移前一致

### Requirement: UI 生态映射

UI 层 SHALL 按既定映射替换 React 生态组件库为 Vue 生态等价物：shadcn/ui（Radix）基础组件对应 shadcn-vue（reka-ui），图标库对应 lucide-vue-next，toast 对应 vue-sonner，主题切换对应自研主题组合式函数；替换后各 UI 能力的外部行为保持不变。

#### Scenario: 基础组件行为等价

- **WHEN** 使用对话框、下拉菜单、气泡提示、开关、选择器等基础组件
- **THEN** 打开/关闭、焦点管理、键盘导航与无障碍语义与迁移前行为等价

#### Scenario: 主题切换行为等价

- **WHEN** 用户切换浅色/深色主题或跟随系统
- **THEN** 主题即时生效并持久化，刷新后保持用户选择

#### Scenario: 通知与提示行为等价

- **WHEN** 应用触发成功、失败或警告提示
- **THEN** toast 的展示位置、排队与自动消失行为与迁移前一致

### Requirement: 国际化绑定

应用 SHALL 继续以 i18next 为国际化核心（沿用既有语言资源、按需加载与完整性检查体系），其 Vue 绑定层 SHALL 提供响应式的翻译能力：语言切换后界面文本即时更新。

#### Scenario: 语言资源复用

- **WHEN** 迁移 i18n 层
- **THEN** 既有语言资源文件与命名空间不做破坏性变更
- **AND** 按需加载与缓存校验机制保持有效

#### Scenario: 语言切换即时生效

- **WHEN** 用户在设置中切换应用语言
- **THEN** 全部界面文本立即切换为目标语言，无需刷新页面

### Requirement: 测试体系延续

测试体系 SHALL 延续 vitest + happy-dom + 覆盖率阈值 + 变异测试的基础设施；组件与页面测试 SHALL 使用 `@testing-library/vue` 重写，框架无关层（服务、store、工具）的既有测试 SHALL 保留并保持通过。

#### Scenario: 框架无关测试保留

- **WHEN** 迁移完成
- **THEN** 服务层、状态层、工具层的既有测试在最小适配后继续通过
- **AND** 覆盖率阈值体系继续生效

#### Scenario: 组件测试以 Vue 形态重写

- **WHEN** 为迁移后的组件编写测试
- **THEN** 使用 `@testing-library/vue` 以用户交互视角验证行为
- **AND** 不依赖组件内部实现细节
