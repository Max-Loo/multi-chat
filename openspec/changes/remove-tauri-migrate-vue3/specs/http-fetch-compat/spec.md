# Spec Delta：http-fetch-compat（移除 fetch 兼容层需求）

## REMOVED Requirements

### Requirement: 环境检测
**Reason**: 纯 Web 化后不再存在开发/生产 × Tauri/Web 的环境矩阵判定，环境检测分支被移除。
**Migration**: 由 `pure-web-platform` 的"无 Tauri 运行时残留"需求约束。

### Requirement: 统一 Fetch API
**Reason**: 其目的是封装"Tauri fetch / Web fetch"双实现为统一签名；Tauri fetch 移除后直接使用浏览器原生 fetch，包装层失去存在意义。
**Migration**: 由 `pure-web-platform` 的"网络请求使用浏览器原生 fetch"需求承载。

### Requirement: 开发环境自动使用 Web Fetch
**Reason**: "开发环境选择 Web fetch"是环境分支逻辑的一部分；环境分支整体移除后，所有环境都使用原生 fetch，该需求不再需要。
**Migration**: 由 `pure-web-platform` 的"网络请求使用浏览器原生 fetch"需求承载。

### Requirement: 生产环境 Web 平台使用 Web Fetch
**Reason**: 同上——该需求描述的是环境选择矩阵中的一支；环境选择逻辑整体移除。
**Migration**: 由 `pure-web-platform` 的"网络请求使用浏览器原生 fetch"需求承载。

### Requirement: 生产环境 Tauri 平台使用 Tauri Fetch
**Reason**: Tauri 桌面形态及其 HTTP 插件被完全移除，该需求的对象不复存在。
**Migration**: 无替代——生产环境唯一路径为浏览器原生 fetch（受 CORS 语义约束，与既有 Web 版一致）。

### Requirement: 类型安全
**Reason**: 其约束对象是兼容层包装函数的类型定义；包装层移除后直接使用全局标准 `fetch` 类型，无需自定义类型契约。
**Migration**: 直接使用 TypeScript 标准库 DOM 类型。

### Requirement: 兼容层导出
**Reason**: 兼容层模块中不再导出 `fetch` 包装函数。
**Migration**: 调用方直接使用全局 `fetch`。

### Requirement: getFetchFunc 方法
**Reason**: 该方法用于向第三方库注入"按环境选择"的 fetch 实现；环境选择消失后注入失去意义。
**Migration**: 需要显式注入的场景（如 AI SDK）直接传入全局 `fetch`。

### Requirement: RequestInfo 类型定义
**Reason**: 该自定义类型为兼容层包装函数服务；包装层移除后使用全局 `RequestInfo` 类型。
**Migration**: 直接使用 TypeScript 标准库 DOM 类型。

### Requirement: 原生类型复用
**Reason**: 其约束的是兼容层包装函数对 `RequestInit`/`Response`/`Headers` 的类型复用方式；包装层移除后该约束失去对象。
**Migration**: 调用方直接使用标准 DOM 类型，自然满足"原生类型复用"。

保留说明：本规范中的"错误处理"需求（网络失败抛出原生错误、HTTP 4xx/5xx 时 `response.ok` 为 `false`）描述标准 Fetch API 语义，在纯 Web 实现下继续成立，故保留不删除。
