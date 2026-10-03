# Spec Delta

## ADDED Requirements

### Requirement: 所有环境统一使用原生 fetch

系统 SHALL 在全部环境（开发、生产）中使用浏览器原生 `fetch` API 发起网络请求。

#### Scenario: 任意环境发起请求

- **WHEN** 应用在开发或生产环境发起网络请求
- **THEN** 系统使用原生 `window.fetch` 发起请求
- **AND** 不尝试加载或调用任何桌面运行时的 HTTP 实现

## MODIFIED Requirements

### Requirement: 统一 Fetch API

系统 SHALL 提供统一的 `fetch` 函数接口，其 API 签名与标准 Web Fetch API 兼容。

#### Scenario: 调用 fetch 发起 GET 请求

- **WHEN** 调用 `fetch(url)` 发起 GET 请求
- **THEN** 系统返回 Promise<Response> 对象，符合标准 Fetch API 规范

#### Scenario: 调用 fetch 发起 POST 请求

- **WHEN** 调用 `fetch(url, { method: 'POST', body: data })` 发起 POST 请求
- **THEN** 系统使用指定方法发起请求，并返回响应对象

#### Scenario: 调用 fetch 带完整配置选项

- **WHEN** 调用 `fetch(url, options)` 并传入完整配置选项（headers、mode、credentials 等）
- **THEN** 系统将配置选项传递给底层 fetch 实现，并返回响应对象

### Requirement: getFetchFunc 方法

系统 SHALL 提供 `getFetchFunc()` 方法，用于获取 fetch 函数实例，适用于第三方库 fetch 注入或自定义请求方法封装场景。

#### Scenario: 调用 getFetchFunc 获取 fetch 函数

- **WHEN** 开发者调用 `getFetchFunc()` 方法
- **THEN** 系统返回与直接调用 `fetch` 完全相同的函数实例
- **AND** 返回的函数类型为 `(input: RequestInfo, init?: RequestInit) => Promise<Response>`

#### Scenario: 使用 getFetchFunc 注入第三方库

- **WHEN** 开发者需要为 AI SDK 等第三方库注入 fetch 函数
- **THEN** 可通过 `getFetchFunc()` 获取函数并传入 provider 配置
- **AND** 注入的 fetch 函数为原生浏览器 fetch

#### Scenario: 使用 getFetchFunc 封装自定义请求方法

- **WHEN** 开发者需要封装自定义的请求方法
- **THEN** 可使用 `const fetchFunc = getFetchFunc()` 获取 fetch 函数
- **AND** 在自定义方法中调用 `fetchFunc(url, options)` 发起请求
- **AND** 封装的方法直接使用原生浏览器 fetch

### Requirement: 兼容层导出

系统 SHALL 在统一的网络模块中导出 fetch 相关 API，便于统一导入使用。

#### Scenario: 从兼容层导入 fetch

- **WHEN** 开发者从统一网络模块导入 `fetch`
- **THEN** 系统导出符合本规范所有要求的 fetch 函数

## REMOVED Requirements

### Requirement: 环境检测
**Reason**: 环境三态检测（开发/生产 Tauri/生产 Web）的唯一目的是在多个 fetch 实现间选择；纯 Web 平台下仅存在原生 fetch，该检测不再有消费方。
**Migration**: 无需迁移，`isTauri()` 等平台检测调用点随 Tauri 移除一并删除。

### Requirement: 开发环境自动使用 Web Fetch
**Reason**: 纯 Web 平台下所有环境均使用原生 fetch，该分支不再有区分意义，由"所有环境统一使用原生 fetch"取代。
**Migration**: 无需迁移，行为与统一后的新需求一致。

### Requirement: 生产环境 Web 平台使用 Web Fetch
**Reason**: 纯 Web 平台下所有环境均使用原生 fetch，由"所有环境统一使用原生 fetch"取代。
**Migration**: 无需迁移，行为与统一后的新需求一致。

### Requirement: 生产环境 Tauri 平台使用 Tauri Fetch
**Reason**: Tauri 桌面运行时已整体移除，不存在使用桌面 HTTP 插件的运行环境。
**Migration**: 无需迁移，桌面专属 fetch 通道随 Tauri 依赖一并删除。
