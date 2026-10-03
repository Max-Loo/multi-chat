# Spec Delta

## Purpose

定义应用收敛为纯 Web 站点后的运行时行为：平台层仅保留浏览器实现，构建、部署与外部链接处理均为纯 Web 形态，不再存在桌面壳分支。

## ADDED Requirements

### Requirement: 纯 Web 构建

系统 SHALL 仅通过 Vite 完成开发与构建，构建产物为纯静态 Web 站点，不包含任何桌面壳运行时。

#### Scenario: 开发服务器启动

- **WHEN** 开发者运行开发命令（统一后的 `pnpm dev`）
- **THEN** 系统启动 Vite 开发服务器
- **AND** 不再依赖 Rust 工具链或桌面壳进程

#### Scenario: 生产构建

- **WHEN** 开发者运行构建命令（统一后的 `pnpm build`）
- **THEN** 系统产出纯静态站点资源（HTML/JS/CSS）
- **AND** 产物可在任意静态托管服务上直接部署

#### Scenario: 构建产物无桌面壳痕迹

- **WHEN** 检查生产构建产物
- **THEN** 产物中不包含桌面壳运行时代码或环境探测注入对象（如 `window.__TAURI__` 相关逻辑）

### Requirement: 平台层依赖边界

项目 SHALL 不再包含桌面壳工程及其任何客户端依赖，业务代码 SHALL 不导入桌面壳相关模块。

#### Scenario: 依赖清单

- **WHEN** 检查 `package.json` 的依赖与开发依赖
- **THEN** 不存在任何 `@tauri-apps/*` 或桌面壳 keyring 相关的依赖包

#### Scenario: 源码导入边界

- **WHEN** 静态检查 `src/` 下的全部源码
- **THEN** 不存在对 `@tauri-apps/*` 模块的导入
- **AND** `src-tauri/` 工程目录不存在

### Requirement: 外部链接打开

系统 SHALL 使用浏览器原生方式在新标签页打开外部 URL，并防止反向标签页劫持。

#### Scenario: 打开外部站点

- **GIVEN** 用户在模型供应商详情等场景点击外部链接
- **WHEN** 系统处理该跳转
- **THEN** 系统使用浏览器原生 API 在新标签页打开该 URL
- **AND** 新标签页无法通过 `window.opener` 操纵原页面（使用 `noopener`/`noreferrer`）

### Requirement: 语言偏好检测

系统 SHALL 基于浏览器语言偏好完成界面语言的首次检测，检测逻辑与迁移前的 Web 端行为一致。

#### Scenario: 首次访问语言检测

- **GIVEN** 用户首次访问应用（无已持久化的语言偏好）
- **WHEN** 应用初始化语言设置
- **THEN** 系统依据浏览器语言偏好（如 `zh-CN` → 中文、`en` → 英文）初始化界面语言

### Requirement: HTTP 请求

系统 SHALL 使用浏览器原生 `fetch` 发起全部 HTTP 请求（模型数据获取、LLM API 调用等），请求行为与迁移前的 Web 端一致。

#### Scenario: LLM API 请求

- **WHEN** 应用向 LLM 供应商发起聊天流式请求
- **THEN** 请求由浏览器原生 `fetch` 直接发出
- **AND** 受浏览器 CORS 策略约束

#### Scenario: 请求失败处理

- **WHEN** 网络请求因 CORS 或网络原因失败
- **THEN** 系统按现有错误处理机制向用户呈现错误提示，不崩溃

### Requirement: 静态部署

系统 SHALL 保持现有静态托管部署流程（GitHub Pages）与基础路径（BASE_PATH）配置不变。

#### Scenario: GH Pages 部署

- **WHEN** 执行部署流程
- **THEN** 部署产物在配置的基础路径下可正常访问
- **AND** 深层路由直接访问与刷新行为与迁移前一致
