# Spec Delta：vue3-app-foundation（新能力）

## Purpose

定义应用从 React 19 迁移到 Vue3（组合式 API）后的应用骨架契约：入口、路由、全局状态、i18n 集成、UI 组件体系与测试栈的 Vue3 形态，以及与既有功能的行为对等要求。

## ADDED Requirements

### Requirement: Vue3 应用入口

系统 SHALL 以 Vue3 应用实例作为唯一入口启动，全部组件使用组合式 API（`<script setup>` + TypeScript）编写，且产物中不包含 React 运行时。

#### Scenario: 应用启动
- **WHEN** 用户在浏览器中打开应用
- **THEN** 应用由 Vue3 应用实例挂载并正常渲染界面
- **AND** 初始化流程（初始化管理器、国际化、存储）在挂载前正常完成

#### Scenario: 无 React 残留
- **WHEN** 检查源码与构建产物
- **THEN** 不存在 React、react-dom 及其 JSX 运行时依赖
- **AND** 组件不使用类组件、JSX 或 React hooks

### Requirement: 路由结构对等

系统 SHALL 使用 vue-router 承载与既有版本等价的路由结构（聊天、模型管理、设置、404），保持既有 URL 语义与导航行为。

#### Scenario: 页面可达
- **WHEN** 用户访问聊天、模型管理、设置页面
- **THEN** 对应页面正常渲染，URL 与既有版本的路径语义一致

#### Scenario: 聊天选中与 URL 同步
- **GIVEN** 用户在聊天页面选中某个会话
- **WHEN** 用户刷新页面或复制 URL 到新标签页打开
- **THEN** 应用恢复到同一会话的选中状态

#### Scenario: 未匹配路由
- **WHEN** 用户访问不存在的路径
- **THEN** 应用显示 404 页面并提供返回入口

### Requirement: 全局状态管理对等

系统 SHALL 使用 Pinia 承载既有全局状态语义（页面导航状态、模型供应商配置、聊天会话状态等），状态的读写、派生与重置行为与既有版本对等。

#### Scenario: 状态读写
- **WHEN** 用户修改模型供应商配置或切换会话
- **THEN** 相关组件响应式地反映最新状态，且持久化行为与既有版本一致

#### Scenario: 状态重置
- **WHEN** 用户执行数据重置操作
- **THEN** 相关状态模块恢复到初始状态，持久化数据同步清理

### Requirement: i18n 响应式集成

系统 SHALL 保留 i18next 核心与既有翻译资源，通过 Vue 响应式组合式封装向组件提供翻译能力：语言切换即时生效于全部组件，翻译完整性检查脚本保持可用。

#### Scenario: 语言切换即时生效
- **GIVEN** 应用正在显示任意页面
- **WHEN** 用户切换界面语言
- **THEN** 全部已渲染组件的文案立即更新为新语言，无需刷新页面

#### Scenario: 翻译缺失回退
- **WHEN** 某个翻译键在当前语言下缺失
- **THEN** 系统按既有回退策略显示回退语言文案

#### Scenario: 翻译完整性检查
- **WHEN** 执行 `pnpm lint:i18n`
- **THEN** 检查脚本基于既有翻译文件正常运行并给出一致的结果

### Requirement: UI 组件体系对等

系统 SHALL 使用 Reka UI（shadcn-vue 风格）与 Tailwind 提供既有全部 UI 基础组件的对等能力，保持视觉样式一致与可访问性行为（键盘导航、焦点管理、ARIA 属性）。

#### Scenario: 对话框键盘操作
- **GIVEN** 任一对话框（确认、设置等）处于打开状态
- **WHEN** 用户使用键盘（Tab、Esc、Enter）操作
- **THEN** 焦点被困在对话框内、Esc 可关闭、Enter 可确认
- **AND** 行为与既有 Radix 版本一致

#### Scenario: 下拉与选择组件
- **WHEN** 用户使用下拉菜单或选择器组件
- **THEN** 支持键盘导航与选择，ARIA 属性正确

#### Scenario: 视觉样式一致
- **WHEN** 对比迁移前后的界面
- **THEN** 布局、配色、间距、明暗主题表现保持一致

### Requirement: 核心功能行为对等

迁移后系统 SHALL 保持核心功能行为与既有版本一致：聊天（流式响应渲染、消息操作、会话自动命名、导出）、模型管理（供应商卡片、远程模型获取）、设置（语言、主题、数据管理）。

#### Scenario: 流式聊天渲染
- **WHEN** 用户发送消息并收到流式响应
- **THEN** 响应内容逐步渲染，Markdown 代码块高亮与复制功能正常

#### Scenario: 会话自动命名
- **WHEN** 用户创建新会话并完成首轮对话
- **THEN** 会话按既有策略自动生成标题

#### Scenario: 远程模型获取
- **WHEN** 用户在模型管理页触发远程模型获取
- **THEN** 模型列表按既有缓存与重试策略展示

#### Scenario: 设置即时生效
- **WHEN** 用户修改设置项（语言、主题等）
- **THEN** 变更立即生效并持久化

### Requirement: 测试栈迁移

系统 SHALL 将组件与行为测试迁移到 vitest + Vue Testing Library，保持既有测试语义（行为断言而非实现细节），测试套件完整通过。

#### Scenario: 组件测试渲染断言
- **WHEN** 执行迁移后的组件测试
- **THEN** 测试基于 Vue 渲染树进行用户视角断言
- **AND** 不依赖 React 测试工具

#### Scenario: 测试套件通过
- **WHEN** 执行 `pnpm test:run`
- **THEN** 全部测试通过，覆盖率满足既有阈值策略
