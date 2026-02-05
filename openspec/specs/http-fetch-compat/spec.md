# HTTP Fetch 跨平台兼容层 - 规范

## ADDED Requirements

### Requirement: 环境检测

系统 SHALL 能够准确检测当前应用的运行环境，包括开发/生产模式和 Tauri/Web 平台。

#### Scenario: 检测开发环境

- **WHEN** 应用在开发模式下运行（通过 `import.meta.env.DEV` 判断）
- **THEN** 系统识别为开发环境

#### Scenario: 检测生产环境 Tauri 平台

- **WHEN** 应用在生产模式下运行且 `window.__TAURI__` 对象存在
- **THEN** 系统识别为生产 Tauri 环境

#### Scenario: 检测生产环境 Web 平台

- **WHEN** 应用在生产模式下运行且 `window.__TAURI__` 对象不存在
- **THEN** 系统识别为生产 Web 环境

### Requirement: 统一 Fetch API

系统 SHALL 提供统一的 `fetch` 函数接口，其 API 签名与标准 Web Fetch API 和 Tauri Fetch API 兼容。

#### Scenario: 调用 fetch 发起 GET 请求

- **WHEN** 调用 `fetch(url)` 发起 GET 请求
- **THEN** 系统返回 Promise<Response> 对象，符合标准 Fetch API 规范

#### Scenario: 调用 fetch 发起 POST 请求

- **WHEN** 调用 `fetch(url, { method: 'POST', body: data })` 发起 POST 请求
- **THEN** 系统使用指定方法发起请求，并返回响应对象

#### Scenario: 调用 fetch 带完整配置选项

- **WHEN** 调用 `fetch(url, options)` 并传入完整配置选项（headers、mode、credentials 等）
- **THEN** 系统将配置选项传递给底层 fetch 实现，并返回响应对象

### Requirement: 开发环境自动使用 Web Fetch

系统 SHALL 在开发环境中始终使用原生 Web `fetch` API，无论是否在 Tauri 容器中运行。

#### Scenario: 开发环境发起请求

- **WHEN** 应用运行在开发模式（`import.meta.env.DEV === true`）
- **THEN** 系统使用原生 `window.fetch` 发起 HTTP 请求
- **AND** 不尝试加载或调用 `@tauri-apps/plugin-http`

### Requirement: 生产环境 Web 平台使用 Web Fetch

系统 SHALL 在生产环境的 Web 浏览器中运行时，使用原生 Web `fetch` API。

#### Scenario: 生产 Web 环境发起请求

- **WHEN** 应用运行在生产模式且 `window.__TAURI__` 不存在（Web 浏览器环境）
- **THEN** 系统使用原生 `window.fetch` 发起 HTTP 请求
- **AND** 不尝试加载或调用 `@tauri-apps/plugin-http`

### Requirement: 生产环境 Tauri 平台使用 Tauri Fetch

系统 SHALL 在生产环境的 Tauri 桌面应用中运行时，使用 `@tauri-apps/plugin-http` 的 `tauriFetch`。

#### Scenario: 生产 Tauri 环境发起请求

- **WHEN** 应用运行在生产模式且 `window.__TAURI__` 存在（Tauri 桌面环境）
- **THEN** 系统使用顶层 await 动态导入 `@tauri-apps/plugin-http` 的 `fetch` 函数
- **AND** 模块加载时会等待导入完成（约 10-50ms 一次性延迟）
- **AND** 如果导入失败，降级到 Web fetch 并记录警告日志
- **AND** 导入成功后，后续请求使用 Tauri fetch 发起 HTTP 请求
- **AND** 利用 Tauri 的系统代理、证书管理等原生能力

### Requirement: 类型安全

系统 SHALL 提供完整的 TypeScript 类型定义，确保编译时类型检查通过。

#### Scenario: fetch 函数类型定义

- **WHEN** 开发者使用 `fetch` 函数
- **THEN** TypeScript 类型系统识别其为 `(input: RequestInfo, init?: RequestInit) => Promise<Response>`
- **AND** 支持与标准 Fetch API 相同的类型推导

### Requirement: 错误处理

系统 SHALL 在 fetch 请求失败时抛出标准的错误对象，错误信息包含失败原因。

#### Scenario: 网络请求失败

- **WHEN** fetch 请求因网络错误失败
- **THEN** 系统抛出包含错误信息的 Error 对象或 TypeError

#### Scenario: HTTP 错误响应

- **WHEN** 服务器返回 4xx 或 5xx 状态码
- **THEN** 系统返回 Response 对象，`ok` 属性为 `false`
- **AND** 开发者可通过 `response.status` 访问状态码

### Requirement: 兼容层导出

系统 SHALL 在 `@/utils/tauriCompat` 模块中导出 fetch 函数，便于统一导入使用。

#### Scenario: 从兼容层导入 fetch

- **WHEN** 开发者使用 `import { fetch } from '@/utils/tauriCompat'`
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
- **AND** 注入的 fetch 函数会自动根据环境选择正确的实现

#### Scenario: 使用 getFetchFunc 封装自定义请求方法

- **WHEN** 开发者需要封装自定义的请求方法
- **THEN** 可使用 `const fetchFunc = getFetchFunc()` 获取 fetch 函数
- **AND** 在自定义方法中调用 `fetchFunc(url, options)` 发起请求
- **AND** 封装的方法自动获得跨平台兼容能力

### Requirement: RequestInfo 类型定义

系统 SHALL 定义并导出自定义 `RequestInfo` 类型，兼容 Web 和 Tauri fetch 的输入参数类型。

#### Scenario: RequestInfo 类型定义

- **WHEN** 开发者查看 `RequestInfo` 类型定义
- **THEN** 类型定义为 `type RequestInfo = string | URL | Request`
- **AND** 支持字符串 URL、URL 对象、Request 对象三种输入形式

#### Scenario: RequestInfo 类型导出和使用

- **WHEN** 开发者使用 `import { RequestInfo } from '@/utils/tauriCompat'`
- **THEN** 系统导出 RequestInfo 类型
- **AND** TypeScript 类型系统识别其为联合类型 `string | URL | Request`

### Requirement: 原生类型复用

系统 SHALL 对于 RequestInit、Response、Headers 等类型，直接使用原生类型定义，避免重复定义。

#### Scenario: RequestInit 使用原生类型

- **WHEN** 开发者在 fetch 调用中传入配置对象
- **THEN** 配置对象类型为原生 `RequestInit` 类型
- **AND** 支持所有标准 RequestInit 属性（method、headers、body、mode 等）

#### Scenario: Response 使用原生类型

- **WHEN** fetch 请求成功返回
- **THEN** 返回类型为原生 `Response` 对象
- **AND** 支持所有标准 Response 属性和方法（status、json()、text() 等）

#### Scenario: Headers 使用原生类型

- **WHEN** 开发者操作请求或响应头
- **THEN** Headers 类型为原生 `Headers` 对象
- **AND** 支持所有标准 Headers 方法（get、set、has 等）
