# Spec Delta

## MODIFIED Requirements

### Requirement: 统一 Fetch API

系统 SHALL 提供统一的 `fetch` 函数接口，其 API 签名与标准 Web Fetch API 一致。

#### Scenario: 调用 fetch 发起 GET 请求

- **WHEN** 调用 `fetch(url)` 发起 GET 请求
- **THEN** 系统返回 Promise<Response> 对象，符合标准 Fetch API 规范

#### Scenario: 调用 fetch 发起 POST 请求

- **WHEN** 调用 `fetch(url, { method: 'POST', body: data })` 发起 POST 请求
- **THEN** 系统使用指定方法发起请求，并返回响应对象

#### Scenario: 调用 fetch 带完整配置选项

- **WHEN** 调用 `fetch(url, options)` 并传入完整配置选项（headers、mode、credentials 等）
- **THEN** 系统将配置选项传递给底层 fetch 实现，并返回响应对象

### Requirement: 生产环境 Web 平台使用 Web Fetch

系统 SHALL 在所有环境（开发与生产）中使用原生 Web `fetch` API 发起 HTTP 请求。

#### Scenario: 任意环境发起请求

- **WHEN** 应用在开发模式或生产模式下运行
- **THEN** 系统使用原生 `window.fetch` 发起 HTTP 请求
- **AND** 不尝试加载或调用任何桌面端 HTTP 插件
- **AND** 开发环境的供应商 API 请求经 Vite proxy 转发以规避 CORS

### Requirement: 兼容层导出

系统 SHALL 在 `@/utils/platform` 模块中导出 fetch 函数，便于统一导入使用。

#### Scenario: 从平台层导入 fetch

- **WHEN** 开发者使用 `import { fetch } from '@/utils/platform'`
- **THEN** 系统导出符合本规范所有要求的 fetch 函数

### Requirement: getFetchFunc 方法

系统 SHALL 提供 `getFetchFunc()` 方法，用于获取 fetch 函数实例，适用于第三方库 fetch 注入或自定义请求方法封装场景。

#### Scenario: 调用 getFetchFunc 获取 fetch 函数

- **WHEN** 开发者调用 `getFetchFunc()` 方法
- **THEN** 系统返回与直接调用 `fetch` 完全相同的函数实例
- **AND** 返回的函数类型为 `(input: RequestInfo, init?: RequestInit) => Promise<Response>`

#### Scenario: 使用 getFetchFunc 注入 AI SDK

- **WHEN** 开发者为 AI SDK 的 provider 工厂注入 fetch 函数
- **THEN** 可使用 `createProvider({ apiKey, baseURL, fetch: getFetchFunc() })` 方式注入
- **AND** 注入的函数行为与原生 fetch 一致

#### Scenario: 使用 getFetchFunc 封装自定义请求方法

- **WHEN** 开发者需要封装自定义的请求方法
- **THEN** 可使用 `const fetchFunc = getFetchFunc()` 获取 fetch 函数
- **AND** 在自定义方法中调用 `fetchFunc(url, options)` 发起请求

### Requirement: RequestInfo 类型定义

系统 SHALL 定义并导出自定义 `RequestInfo` 类型，兼容标准 fetch 的输入参数类型。

#### Scenario: RequestInfo 类型定义

- **WHEN** 开发者查看 `RequestInfo` 类型定义
- **THEN** 类型定义为 `type RequestInfo = string | URL | Request`
- **AND** 支持字符串 URL、URL 对象、Request 对象三种输入形式

#### Scenario: RequestInfo 类型导出和使用

- **WHEN** 开发者使用 `import { RequestInfo } from '@/utils/platform'`
- **THEN** 系统导出 RequestInfo 类型
- **AND** TypeScript 类型系统识别其为联合类型 `string | URL | Request`

## REMOVED Requirements

### Requirement: 环境检测

**Reason**: fetch 不再按"Tauri/Web 平台 × 开发/生产模式"分支选择实现，环境检测逻辑整体移除。
**Migration**: 无需替代——所有环境统一使用原生 Web fetch（见"生产环境 Web 平台使用 Web Fetch"需求的修订版）。

### Requirement: 开发环境自动使用 Web Fetch

**Reason**: 该需求描述的"开发环境 vs 其他环境"分支选择不复存在，所有环境行为统一。
**Migration**: 由修订后的"生产环境 Web 平台使用 Web Fetch"需求（现覆盖所有环境）承接。

### Requirement: 生产环境 Tauri 平台使用 Tauri Fetch

**Reason**: `@tauri-apps/plugin-http` 依赖随纯 Web 迁移移除，不存在"Tauri 桌面环境使用插件 fetch 绕过 CORS/使用系统代理"的场景。
**Migration**: 生产环境直连供应商 API（线上 GitHub Pages 版本已验证各主流供应商 API 可被浏览器直连）；开发环境经 Vite proxy 转发。
