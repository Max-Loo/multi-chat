# 渐进式加载能力规格

## Purpose

本 capability 定义 Web 应用启动时的渐进式加载机制，确保在弱网环境下也能提供良好的首次加载体验。通过将应用拆分为 HTML Spinner → 初始化动画 → 主应用三个阶段，实现渐进式显示。

## Requirements

### Requirement: HTML 内联 Spinner

系统 SHALL 在 HTML 文档中提供内联的加载动画，在 JavaScript 加载完成前显示。

**技术要求**：
- 使用纯 CSS 实现转圈动画
- 内联在 `index.html` 的 `<div id="root">` 中
- React 渲染后自动替换为实际内容

#### Scenario: 页面加载时立即显示 Spinner

- **WHEN** 用户访问 Web 应用
- **THEN** 系统在 HTML 解析完成后立即显示转圈动画
- **AND** 转圈动画在 JavaScript 加载完成前持续显示

#### Scenario: React 渲染后 Spinner 被替换

- **WHEN** React 应用完成首次渲染
- **THEN** Spinner 被 React 组件内容替换
- **AND** 替换过程无视觉闪烁

---

### Requirement: 初始化动画优先加载

系统 SHALL 将初始化动画相关代码独立打包，使其能够尽快加载和显示。

**技术要求**：
- InitializationController、initSteps 及相关 UI 组件统一打包为 `chunk-init`
- chunk-init 体积目标 ~60KB（gzip 后），上限 120KB
- chunk-init 不包含 store 等重型依赖
- 主应用代码不阻塞初始化动画的显示

#### Scenario: initSteps 与初始化 UI 统一加载
- **WHEN** App 组件挂载
- **THEN** 系统加载 `chunk-init`（包含 initSteps 和初始化 UI 组件）
- **AND** 用户在此期间仍看到 HTML Spinner
- **AND** chunk-init 加载完成后开始初始化流程

#### Scenario: 初始化动画独立加载
- **WHEN** chunk-init 加载完成
- **THEN** 系统渲染 InitializationController
- **AND** 初始化动画立即显示

#### Scenario: 主应用延迟加载
- **WHEN** 初始化动画显示中
- **THEN** 主应用代码（router 等）尚未完全加载
- **AND** 主应用在初始化完成后才开始加载

---

### Requirement: 主应用按需加载

系统 SHALL 将重型依赖（Redux store、React Router、业务组件）延迟到初始化完成后加载。

**技术要求**：
- 创建独立的 `MainApp.tsx` 文件包含主应用组件
- 使用动态 `import()` 加载主应用
- 通过 React 状态管理加载流程

#### Scenario: 初始化完成后加载主应用

- **WHEN** InitializationController 完成所有初始化步骤
- **THEN** 系统开始动态加载主应用 chunk
- **AND** 主应用加载完成后渲染主界面

#### Scenario: 弱网环境下渐进式体验

- **WHEN** 用户在弱网环境（如 Slow 3G）下访问应用
- **THEN** 用户在 <100ms 内看到 HTML Spinner
- **AND** 用户在 1-3 秒内看到初始化动画
- **AND** 初始化完成后加载主应用

---

### Requirement: 错误处理

系统 SHALL 在 chunk 加载失败时提供友好的错误提示和重试机制。

**技术要求**：
- 捕获动态 import 错误
- 显示友好的错误提示界面
- 提供重试按钮

#### Scenario: chunk-init 加载失败

- **WHEN** 浏览器无法加载 chunk-init 文件
- **THEN** 系统显示"加载失败，请检查网络连接"提示
- **AND** 提供"重试"按钮
- **AND** 点击重试后重新加载页面

#### Scenario: 主应用 chunk 加载失败

- **WHEN** 初始化完成后主应用 chunk 加载失败
- **THEN** 系统显示"应用加载失败"提示
- **AND** 提供"重试"按钮
- **AND** 点击重试后重新加载主应用 chunk

---

### Requirement: InitializationController 无 store 依赖

系统 SHALL 确保 InitializationController 不直接依赖 Redux store，以实现轻量化打包。

**技术要求**：
- InitializationController 不导入 store
- InitializationController 接收 initSteps 作为 prop（而非静态导入）
- modelProvider 状态通过 InitResult 回调传递
- 保持 InitializationController 的 API 最小变更

#### Scenario: 状态通过回调传递

- **WHEN** modelProvider 初始化步骤完成
- **THEN** 状态信息通过 InitResult.modelProviderStatus 传递
- **AND** InitializationController 从 result 中读取状态
- **AND** 不访问 Redux store

#### Scenario: 无可用模型供应商提示

- **WHEN** modelProvider 加载失败且错误为网络问题
- **THEN** InitializationController 显示"无可用的模型供应商"提示
- **AND** 该判断基于 InitResult.modelProviderStatus.isNoProvidersError

---

### Requirement: 无循环 chunk 依赖

`manualChunks` 配置 SHALL NOT 产生循环 chunk 依赖。

#### Scenario: 构建成功无循环 chunk 报错
- **WHEN** 执行 `pnpm tauri build`
- **THEN** 构建成功完成，不出现 `Circular chunk` 错误

#### Scenario: 运行时无因 chunk 循环导致的错误
- **WHEN** 应用启动并加载初始化模块
- **THEN** 不出现因 chunk 循环依赖导致的 ReferenceError

---

### Requirement: 无失效的 manualChunks 规则

`manualChunks` 配置 SHALL NOT 包含无法匹配当前代码库路径的规则。

#### Scenario: 无失效匹配规则
- **WHEN** 检查 `vite.config.ts` 的 `manualChunks` 配置
- **THEN** 每条路径匹配规则都能在 `src/` 目录下找到对应的文件或目录

---

### Requirement: CSS 样式加载策略

系统 SHALL 确保 CSS 样式在渲染前加载完成，避免 FOUC（Flash of Unstyled Content）。

**技术要求**：
- main.css 保持在入口文件中静态导入
- 初始化动画依赖的 Tailwind 工具类在首次渲染前可用
- 不延迟加载 CSS

#### Scenario: 初始化动画样式正常

- **WHEN** 初始化动画组件渲染
- **THEN** 所有 Tailwind 样式已加载完成
- **AND** 动画布局和样式正确显示
- **AND** 无样式闪烁（FOUC）

#### Scenario: HTML Spinner 样式独立

- **WHEN** HTML Spinner 显示
- **THEN** Spinner 样式通过内联 CSS 实现
- **AND** 不依赖外部 CSS 文件
- **AND** 不受 main.css 加载影响
