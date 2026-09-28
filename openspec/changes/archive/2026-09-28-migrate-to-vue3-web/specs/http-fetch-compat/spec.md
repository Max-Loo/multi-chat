# Spec Delta

## ADDED Requirements

### Requirement: 恒用原生 Web Fetch

系统 SHALL 在所有环境（开发与生产）统一使用浏览器原生 `window.fetch` 发起 HTTP 请求，SHALL NOT 加载或引用任何桌面运行时 HTTP 插件。

#### Scenario: 任意环境发起请求

- **WHEN** 应用在开发或生产环境发起 HTTP 请求
- **THEN** 请求经原生 `window.fetch` 发出
- **AND** 模块加载不引入 `@tauri-apps/plugin-http` 等桌面 HTTP 依赖

## MODIFIED Requirements

### Requirement: 环境检测

系统 SHALL 能够准确检测当前应用的运行环境（开发/生产模式），SHALL NOT 依赖桌面容器标识（如 `window.__TAURI__`）进行环境分支。

#### Scenario: 检测开发环境

- **WHEN** 应用在开发模式下运行（通过 `import.meta.env.DEV` 判断）
- **THEN** 系统识别为开发环境

#### Scenario: 检测生产环境

- **WHEN** 应用在生产模式下运行（`import.meta.env.DEV` 为假）
- **THEN** 系统识别为生产环境

### Requirement: 兼容层导出

系统 SHALL 在统一的平台层模块中导出 fetch 函数，便于统一导入使用。

#### Scenario: 从兼容层导入 fetch

- **WHEN** 开发者使用 `import { fetch } from '@/platform'`
- **THEN** 系统导出符合本规范所有要求的 fetch 函数

### Requirement: getFetchFunc 方法

系统 SHALL 提供 `getFetchFunc()` 方法，用于获取 fetch 函数实例，适用于第三方库 fetch 注入或自定义请求方法封装场景。

#### Scenario: 调用 getFetchFunc 获取 fetch 函数

- **WHEN** 开发者调用 `getFetchFunc()` 方法
- **THEN** 系统返回与直接调用 `fetch` 完全相同的函数实例
- **AND** 返回的函数类型为 `(input: RequestInfo, init?: RequestInit) => Promise<Response>`

#### Scenario: 使用 getFetchFunc 注入第三方库

- **WHEN** 开发者需要为第三方库注入 fetch 函数
- **THEN** 可通过 `getFetchFunc()` 获取并注入
- **AND** 注入的 fetch 函数为原生 Web Fetch

#### Scenario: 使用 getFetchFunc 封装自定义请求方法

- **WHEN** 开发者需要封装自定义的请求方法
- **THEN** 可使用 `const fetchFunc = getFetchFunc()` 获取 fetch 函数
- **AND** 在自定义方法中调用 `fetchFunc(url, options)` 发起请求

## REMOVED Requirements

### Requirement: 生产环境 Tauri 平台使用 Tauri Fetch

**Reason**: Tauri 桌面端随本变更整体移除，浏览器环境不存在绕过 CORS 的桌面 HTTP 通道，该要求描述的运行时分支不再存在。

**Migration**: 生产环境直连 LLM API 将受浏览器 CORS 约束（与现状 gh-pages 版本一致）；开发环境继续使用 Vite 开发代理。如需在生产绕过 CORS，用户应使用支持浏览器直连的 API 端点或自建反向代理（本变更不提供代理方案）。

### Requirement: 开发环境自动使用 Web Fetch

**Reason**: 「恒用原生 Web Fetch」要求覆盖全部环境，本要求不再有独立意义。

**Migration**: 无需迁移，行为不变。

### Requirement: 生产环境 Web 平台使用 Web Fetch

**Reason**: 被「恒用原生 Web Fetch」要求取代，不再需要按平台分支。

**Migration**: 无需迁移，行为不变。

### Requirement: 运行平台检测

**Reason**: 该要求描述按 `window.__TAURI__` 判定 Tauri/Web 平台容器；桌面端随本变更整体移除，平台容器分支不再存在，环境检测由「环境检测」要求按开发/生产维度定义。

**Migration**: 无需迁移。应用仅以浏览器 SPA 形式运行，环境检测仅区分开发/生产模式（`import.meta.env.DEV`）。
