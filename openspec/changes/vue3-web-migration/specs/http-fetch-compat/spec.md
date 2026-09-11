# HTTP Fetch 能力规范（增量）

## ADDED Requirements

### Requirement: 统一使用原生 Web Fetch

系统 SHALL 在所有环境（开发、生产、测试）中统一使用原生 Web `fetch` API 发起 HTTP 请求，SHALL NOT 加载或调用任何 `@tauri-apps/plugin-http` 模块。

#### Scenario: 全环境统一实现

- **WHEN** 应用在开发或生产环境发起 HTTP 请求
- **THEN** 系统使用原生 `window.fetch` 发起请求
- **AND** 不存在按运行环境选择 fetch 实现的分支逻辑

#### Scenario: 环境检测收缩

- **WHEN** 审查 fetch 模块的环境判断逻辑
- **THEN** 仅保留开发/生产环境区分（`import.meta.env.DEV`）
- **AND** 不存在 `window.__TAURI__` 平台探测

## MODIFIED Requirements

### Requirement: 统一 Fetch API

系统 SHALL 提供统一的 `fetch` 函数接口，其 API 签名与标准 Web Fetch API 完全一致。

#### Scenario: 调用 fetch 发起 GET 请求

- **WHEN** 调用 `fetch(url)` 发起 GET 请求
- **THEN** 系统返回 Promise<Response> 对象，符合标准 Fetch API 规范

#### Scenario: 调用 fetch 发起 POST 请求

- **WHEN** 调用 `fetch(url, { method: 'POST', body: data })` 发起 POST 请求
- **THEN** 系统使用指定方法发起请求，并返回响应对象

#### Scenario: 调用 fetch 带完整配置选项

- **WHEN** 调用 `fetch(url, options)` 并传入完整配置选项（headers、mode、credentials 等）
- **THEN** 系统将配置选项传递给底层 fetch 实现，并返回响应对象

### Requirement: 兼容层导出

系统 SHALL 在 `@/utils/platform` 模块中导出 fetch 函数，便于统一导入使用。

#### Scenario: 从兼容层导入 fetch

- **WHEN** 开发者使用 `import { fetch } from '@/utils/platform'`
- **THEN** 系统导出符合本规范所有要求的 fetch 函数

### Requirement: getFetchFunc 方法

系统 SHALL 提供 `getFetchFunc()` 方法，用于获取 fetch 函数实例，适用于第三方库 fetch 注入或自定义请求方法封装场景。

#### Scenario: 调用 getFetchFunc 获取 fetch 函数

- **WHEN** 开发者调用 `getFetchFunc()` 方法
- **THEN** 系统返回与直接调用 `fetch` 完全相同的函数实例
- **AND** 返回的函数类型为 `(input: RequestInfo, init?: RequestInit) => Promise<Response>`

#### Scenario: 使用 getFetchFunc 注入第三方库

- **WHEN** 开发者需要为第三方库（如 Axios）注入 fetch 函数
- **THEN** 可使用 `const axiosInstance = axios.create({ adapter: getFetchFunc() })` 等方式注入
- **AND** 注入的 fetch 函数即为原生 Web fetch

#### Scenario: 使用 getFetchFunc 封装自定义请求方法

- **WHEN** 开发者需要封装自定义的请求方法
- **THEN** 可使用 `const fetchFunc = getFetchFunc()` 获取 fetch 函数
- **AND** 在自定义方法中调用 `fetchFunc(url, options)` 发起请求

## REMOVED Requirements

### Requirement: 环境检测

**Reason**: "开发/生产模式 + Tauri/Web 平台"的四象限检测随 Tauri 移除而失去平台维度，平台探测代码全部删除。

**Migration**: 环境（开发/生产）区分保留于"环境检测收缩"场景；平台检测需求由 `web-only-platform` 的"环境检测收缩"承接。

### Requirement: 开发环境自动使用 Web Fetch

**Reason**: fetch 实现已统一为原生 Web fetch，"开发环境选择 Web fetch"的分支语境不再存在。

**Migration**: 由 ADDED 需求"统一使用原生 Web Fetch"承接。

### Requirement: 生产环境 Web 平台使用 Web Fetch

**Reason**: fetch 实现已统一为原生 Web fetch，"生产 Web 平台选择 Web fetch"的分支语境不再存在。

**Migration**: 由 ADDED 需求"统一使用原生 Web Fetch"承接。

### Requirement: 生产环境 Tauri 平台使用 Tauri Fetch

**Reason**: Tauri 栈整体移除，`@tauri-apps/plugin-http` 的 `tauriFetch` 及其动态导入逻辑一并删除。

**Migration**: 生产环境统一使用原生 Web fetch；对不支持 CORS 的供应商 API，其可达性约束由 `web-only-platform` 的"生产环境网络约束"如实声明。

### Requirement: RequestInfo 类型定义

**Reason**: 自定义 `RequestInfo` 类型是为兼容 Tauri fetch 类型体系而引入；Tauri 移除后直接使用 DOM 标准 `RequestInfo` 类型。

**Migration**: 平台层导出改用 DOM 原生 `RequestInfo` 联合类型（`string | URL | Request`），调用方代码不受影响。
