# Spec: 统一 Toast API

## Purpose

提供统一的、Promise-based 的 Toast API，支持自动队列管理、异步错误处理和类型安全。

## Requirements

### Requirement: Promise-based 异步 API
系统 SHALL 在 `toastQueue` 类中提供 Promise-based 的异步方法：
- `success(message, options?): Promise<string | number>`
- `error(message, options?): Promise<string | number>`
- `warning(message, options?): Promise<string | number>`
- `info(message, options?): Promise<string | number>`
- `loading(message, options?): Promise<string | number>`
- `dismiss(id?): void`（同步方法）
- `promise(promise, options): void`（同步方法）

#### Scenario: 使用 success 方法
- **WHEN** 开发者调用 `await toastQueue.success('操作成功')`
- **THEN** 系统显示一个成功类型的 Toast，Promise 在 Toast 显示时 resolve

#### Scenario: 在 Toaster 未就绪时调用
- **WHEN** 开发者在 Toaster 组件挂载前调用 `toastQueue.success('操作成功')`
- **THEN** 系统将调用逻辑加入队列，等待 Toaster 就绪后显示，Promise 在显示时 resolve

#### Scenario: 不使用 await
- **WHEN** 开发者调用 `toastQueue.success('操作成功')` 而不使用 await
- **THEN** Toast 仍会正常显示，Promise 被 ignored（由调用者负责处理）

#### Scenario: 使用 loading 方法获取 ID
- **WHEN** 开发者调用 `const loadingId = await toastQueue.loading('加载中...')`
- **THEN** 系统显示加载 Toast，Promise 在 Toast 显示时 resolve 返回 toast ID

#### Scenario: 使用 loading ID 关闭 Toast
- **WHEN** 开发者在获得 loadingId 后调用 `toastQueue.dismiss(loadingId)`
- **THEN** 系统关闭指定的加载 Toast

---

### Requirement: 自动队列管理
系统 SHALL 自动判断 Toast 是否可以立即显示，如果不能则加入队列，开发者无需手动判断。

#### Scenario: Toaster 就绪时立即显示
- **WHEN** 开发者在 Toaster 组件已就绪后调用 `toastQueue.success('消息')`
- **THEN** 系统立即显示 Toast，不加入队列

#### Scenario: Toaster 未就绪时加入队列
- **WHEN** 开发者在 Toaster 组件未就绪时调用 `toastQueue.success('消息')`
- **THEN** 系统将调用逻辑加入队列

#### Scenario: 队列刷新
- **WHEN** Toaster 组件挂载并调用 `toastQueue.markReady()`
- **THEN** 系统按顺序执行队列中的所有调用逻辑，每个 Toast 间隔 500ms

#### Scenario: dismiss 和 promise 不加入队列
- **WHEN** 开发者调用 `toastQueue.dismiss()` 或 `toastQueue.promise()`
- **THEN** 系统立即执行，不加入队列

---

### Requirement: 异步错误处理
系统 SHALL 捕获 Toast 执行过程中的错误，避免 Promise 永久 pending。

#### Scenario: Toast 执行抛出错误
- **WHEN** `toast.success()` 等方法在执行时抛出异常
- **THEN** 系统捕获错误，记录到控制台，Promise resolve 为 `undefined`

#### Scenario: 避免 await 永久挂起
- **WHEN** Toast 执行失败
- **THEN** Promise 仍会 resolve（而不是 reject），避免外部 await 永久等待

---

### Requirement: 选项自动保护
系统 SHALL 在每个 API 方法中调用 `sanitizeOptions()`，移除 `position` 选项，防止覆盖全局配置。

#### Scenario: 自动移除 position
- **WHEN** 开发者调用任何 API 方法并传入 `position` 选项
- **THEN** 系统自动移除 `position` 选项，使用全局配置

#### Scenario: 保留其他选项
- **WHEN** 开发者调用 `toastQueue.success('消息', { description: '描述', duration: 5000 })`
- **THEN** 系统保留 `description` 和 `duration` 选项，仅移除 `position`

---

### Requirement: 统一导出
系统 SHALL 在 `src/lib/toast/index.ts` 中统一导出以下内容：
- `toastQueue`：Toast 队列单例（推荐使用）
- `rawToast`：原始 sonner API（特殊场景使用）
- `useToastQueue`：响应式状态同步 hook

#### Scenario: 导入 toastQueue
- **WHEN** 开发者使用 `import { toastQueue } from '@/services/toast'`
- **THEN** 系统导出 `toastQueue` 单例，开发者可以调用所有 API 方法

#### Scenario: 导入 rawToast
- **WHEN** 开发者使用 `import { rawToast } from '@/services/toast'`
- **THEN** 系统导出原始 sonner API，开发者可以自定义位置等选项

#### Scenario: 导入 useToastQueue
- **WHEN** 开发者使用 `import { useToastQueue } from '@/services/toast'`
- **THEN** 系统导出 `useToastQueue` hook，开发者可以在组件中同步响应式状态

---

### Requirement: 类型安全
系统 SHALL 为所有 API 方法提供完整的 TypeScript 类型定义。

#### Scenario: success 方法类型
- **WHEN** 开发者在 TypeScript 中调用 `await toastQueue.success('消息', { description: '描述' })`
- **THEN** IDE 提供完整的类型提示和自动补全，返回类型为 `Promise<string | number>`

#### Scenario: loading 方法类型
- **WHEN** 开发者在 TypeScript 中调用 `const id = await toastQueue.loading('加载中')`
- **THEN** IDE 提示返回类型为 `Promise<string | number>`，可用于后续 dismiss

#### Scenario: dismiss 方法类型
- **WHEN** 开发者在 TypeScript 中调用 `toastQueue.dismiss('id')`
- **THEN** IDE 提示 `id` 参数可以是 `string | number | undefined`

---

### Requirement: 与 sonner 类型兼容
系统 SHALL 确保 API 方法的签名与 sonner 的原始 API 兼容（除了返回 Promise）。

#### Scenario: 方法签名兼容
- **WHEN** 开发者熟悉 sonner API
- **THEN** 开发者可以直接使用 `toastQueue`，参数类型与 sonner 一致，只是返回 Promise

#### Scenario: 选项类型兼容
- **WHEN** 开发者传入 sonner 支持的选项（如 `description`, `duration`, `actionButton`）
- **THEN** 系统正确处理所有选项，类型定义与 sonner 一致

---

### Requirement: 响应式状态管理
系统 SHALL 通过 `useToastQueue` hook 同步移动端状态到 `toastQueue` 单例。

#### Scenario: Hook 实现
- **WHEN** 开发者在组件中调用 `useToastQueue()`
- **THEN** Hook 使用 `useResponsive` 获取 `isMobile` 状态，并同步到 `toastQueue.setIsMobile(isMobile)`

#### Scenario: 自动同步
- **WHEN** 组件渲染，`isMobile` 状态变化
- **THEN** Hook 自动调用 `toastQueue.setIsMobile()`，无需手动触发

#### Scenario: 在 ToasterWrapper 中使用
- **WHEN** `ToasterWrapper` 组件挂载
- **THEN** 组件调用 `useToastQueue()` hook，确保 `toastQueue` 的 `isMobile` 状态始终同步

---

### Requirement: 单例状态存储
系统 SHALL 在 `ToastQueue` 类中存储移动端状态（`isMobile: boolean | undefined`），提供 `setIsMobile()` 和 `getIsMobile()` 方法。

#### Scenario: setIsMobile 方法
- **WHEN** `useToastQueue` hook 调用 `toastQueue.setIsMobile(true)`
- **THEN** `toastQueue` 单例的 `isMobile` 状态更新为 `true`

#### Scenario: getIsMobile 方法 - 已初始化
- **WHEN** 代码调用 `toastQueue.getIsMobile()` 且 `isMobile` 已初始化
- **THEN** 方法返回实际的 `isMobile` 状态（`true` 或 `false`）

#### Scenario: getIsMobile 方法 - 未初始化
- **WHEN** 代码调用 `toastQueue.getIsMobile()` 且 `isMobile` 为 `undefined`
- **THEN** 方法返回 `false`（桌面端，保守策略）

#### Scenario: 单例状态一致性
- **WHEN** 多个组件使用 `toastQueue`
- **THEN** 所有组件访问的是同一个 `isMobile` 状态，确保一致性

#### Scenario: 早期 Toast 调用
- **WHEN** 在 `ToasterWrapper` 挂载前调用 `toastQueue.success('消息')`
- **THEN** 系统使用 `getIsMobile()` 的返回值（未初始化时为 `false`），Toast 显示在桌面端位置

---

### Requirement: 队列执行策略
系统 SHALL 在刷新队列时，按顺序执行所有待执行的 Toast 调用，每个间隔 500ms。

#### Scenario: 多个 Toast 按顺序显示
- **WHEN** 队列中有多个 Toast 等待显示
- **THEN** 系统按顺序执行每个 Toast 调用，每个间隔 500ms

#### Scenario: 间隔时间保证可读性
- **WHEN** 多个 Toast 连续显示
- **THEN** 500ms 间隔确保用户有时间阅读每个消息

#### Scenario: flush 执行期间的新消息
- **WHEN** `flush()` 正在执行时，有新的 Toast 调用
- **THEN** 新消息会被加入队列，在下一个 `markReady()` 或下一次 flush 时处理

---

### Requirement: dismiss 和 promise 特殊处理
系统 SHALL 对 `dismiss()` 和 `promise()` 方法采用立即执行策略，不加入队列。

#### Scenario: dismiss 立即执行
- **WHEN** 开发者调用 `toastQueue.dismiss(toastId)`
- **THEN** 系统立即关闭 Toast，不加入队列

#### Scenario: promise 立即执行
- **WHEN** 开发者调用 `toastQueue.promise(promise, options)`
- **THEN** 系统立即绑定 Promise 结果，不加入队列

#### Scenario: 特殊处理的理由
- **WHEN** 分析为什么这两个方法不加入队列
- **THEN** `dismiss()` 需要立即生效，`promise()` 需要立即绑定异步结果，加入队列没有意义

---

### Requirement: Toast API 正确代理

Toast 模块导出的 API SHALL 正确代理到 toastQueue 单例的方法。

#### Scenario: toastQueue 导出
- **WHEN** 从 `@/services/toast` 导入 `toastQueue`
- **THEN** 获取到 toastQueue 单例对象

#### Scenario: rawToast 导出
- **WHEN** 从 `@/services/toast` 导入 `rawToast`
- **THEN** 获取到 sonner 的原始 toast 对象

---

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
