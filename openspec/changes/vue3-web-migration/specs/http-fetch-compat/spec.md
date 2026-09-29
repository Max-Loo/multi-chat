# Spec Delta

## ADDED Requirements

### Requirement: 运行模式检测

系统 SHALL 能够准确检测当前应用的运行环境（开发/生产模式），不再区分 Tauri/Web 平台。

#### Scenario: 检测开发环境

- **WHEN** 应用在开发模式下运行（通过 `import.meta.env.DEV` 判断）
- **THEN** 系统识别为开发环境

#### Scenario: 检测生产环境

- **WHEN** 应用在生产模式下运行
- **THEN** 系统识别为生产环境
- **AND** 系统不检测 `window.__TAURI__`，不存在 Tauri 平台分支

### Requirement: 跨域请求错误处理

由于请求全部经由浏览器原生 `fetch` 发出，系统 SHALL 按 Web 安全模型处理跨域（CORS）失败：跨域被拦截时 SHALL 产出可捕获的错误并进入现有错误处理与用户提示流程，不出现未捕获异常。

#### Scenario: CORS 拦截产生可捕获错误

- **WHEN** 浏览器因 CORS 策略拦截某模型供应商 API 请求
- **THEN** fetch 调用 SHALL 以 TypeError 形式 reject
- **AND** 调用方 SHALL 按现有错误处理流程提示用户
- **AND** 应用不崩溃、不出现未处理的 Promise rejection

## MODIFIED Requirements

### Requirement: 开发环境自动使用 Web Fetch

系统 SHALL 在开发环境中使用原生 Web `fetch` API。

#### Scenario: 开发环境发起请求

- **WHEN** 应用运行在开发模式（`import.meta.env.DEV === true`）
- **THEN** 系统使用原生 `window.fetch` 发起 HTTP 请求
- **AND** 代码库中不存在任何 `@tauri-apps/plugin-http` 的加载或调用代码

### Requirement: 生产环境 Web 平台使用 Web Fetch

系统 SHALL 在生产环境使用原生 Web `fetch` API。

#### Scenario: 生产 Web 环境发起请求

- **WHEN** 应用运行在生产模式
- **THEN** 系统使用原生 `window.fetch` 发起 HTTP 请求
- **AND** 代码库中不存在任何 `@tauri-apps/plugin-http` 的加载或调用代码

### Requirement: 兼容层导出

系统 SHALL 在 `@/utils/webRuntime` 模块中导出 fetch 函数，便于统一导入使用。

#### Scenario: 从兼容层导入 fetch

- **WHEN** 开发者使用 `import { fetch } from '@/utils/webRuntime'`
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
- **AND** 注入的函数即为浏览器原生 fetch 实现

#### Scenario: 使用 getFetchFunc 封装自定义请求方法

- **WHEN** 开发者需要封装自定义的请求方法
- **THEN** 可使用 `const fetchFunc = getFetchFunc()` 获取 fetch 函数
- **AND** 在自定义方法中调用 `fetchFunc(url, options)` 发起请求

## REMOVED Requirements

### Requirement: 环境检测
**Reason**: 原含"检测生产环境 Tauri 平台"与"检测生产环境 Web 平台"两个按 `window.__TAURI__` 区分的场景；Tauri 移除后平台维度消失，故以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 仅保留开发/生产模式检测。

### Requirement: 生产环境 Tauri 平台使用 Tauri Fetch
**Reason**: Tauri 桌面端被移除，不存在使用 `@tauri-apps/plugin-http` 的运行环境。
**Migration**: 所有环境的请求统一使用浏览器原生 `fetch`，无需动态导入插件或降级逻辑。
