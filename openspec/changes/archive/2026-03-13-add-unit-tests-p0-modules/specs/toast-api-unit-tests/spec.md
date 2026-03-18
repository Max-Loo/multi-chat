## ADDED Requirements

### Requirement: Toast API 正确代理

Toast 模块导出的 API SHALL 正确代理到 toastQueue 单例的方法。

#### Scenario: toastQueue 导出
- **WHEN** 从 `@/lib/toast` 导入 `toastQueue`
- **THEN** 获取到 toastQueue 单例对象

#### Scenario: rawToast 导出
- **WHEN** 从 `@/lib/toast` 导入 `rawToast`
- **THEN** 获取到 sonner 的原始 toast 对象

### Requirement: Toast API 方法返回值

Toast 模块导出的 API SHALL 返回与 sonner 库兼容的返回值。

#### Scenario: toastQueue 方法返回 Promise
- **WHEN** 调用 `toastQueue.success()`, `error()`, `warning()`, `info()`, `loading()` 方法
- **THEN** 返回值可以被 await
- **AND** resolve 后的值为 toast ID（字符串或数字）

#### Scenario: dismiss 不返回 Promise
- **WHEN** 调用 `toastQueue.dismiss()`
- **THEN** 返回值为 undefined

#### Scenario: promise 不返回 Promise
- **WHEN** 调用 `toastQueue.promise()`
- **THEN** 返回值为 undefined

> **注**：类型正确性由 TypeScript 编译器保证，不需要运行时测试。如需类型断言测试，可使用 `tsd` 或 `expect-type` 库在单独的类型测试文件中进行。
