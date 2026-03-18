## ADDED Requirements

### Requirement: ToastQueue 队列机制

ToastQueue 系统 SHALL 在 Toaster 组件未就绪时将 Toast 请求加入队列，并在 Toaster 就绪后按顺序执行。

#### Scenario: 初始化前调用 Toast 入队
- **WHEN** 在 `markReady()` 调用前调用 `toastQueue.success('消息')`
- **THEN** Toast 不立即显示，而是加入队列等待

#### Scenario: markReady 后队列刷新
- **WHEN** 调用 `markReady()` 且队列中有待执行的 Toast
- **THEN** 队列中的所有 Toast 按顺序执行
- **AND** 每个 Toast 执行间隔 500ms

#### Scenario: markReady 后新 Toast 立即显示
- **WHEN** 调用 `markReady()` 后再调用 `toastQueue.success('消息')`
- **THEN** Toast 立即显示，不进入队列

#### Scenario: 空队列调用 markReady
- **WHEN** 调用 `markReady()` 且队列为空
- **THEN** 不抛出错误，正常返回

### Requirement: ToastQueue 响应式位置

ToastQueue 系统 SHALL 根据设备类型自动设置 Toast 的显示位置。

#### Scenario: 移动端强制 top-center
- **WHEN** `isMobile` 为 `true` 时调用 `toastQueue.success('消息', { position: 'bottom-right' })`
- **THEN** Toast 显示在 `top-center` 位置
- **AND** 忽略用户传入的 position 参数

#### Scenario: 桌面端默认 bottom-right
- **WHEN** `isMobile` 为 `false` 且未传入 position 时调用 `toastQueue.success('消息')`
- **THEN** Toast 显示在 `bottom-right` 位置

#### Scenario: 桌面端保留用户 position
- **WHEN** `isMobile` 为 `false` 且传入 position 时调用 `toastQueue.success('消息', { position: 'top-center' })`
- **THEN** Toast 显示在用户指定的 `top-center` 位置

#### Scenario: 未设置 isMobile 默认桌面端
- **WHEN** 未调用 `setIsMobile()` 时调用 `toastQueue.success('消息')`
- **THEN** 使用桌面端默认位置 `bottom-right`

### Requirement: ToastQueue 异步 Promise

ToastQueue 系统 SHALL 为所有 Toast 方法返回 Promise，在 Toast action 执行时 resolve。

#### Scenario: Toast 方法返回 Promise
- **WHEN** 调用 `toastQueue.success('消息')`
- **THEN** 返回一个 Promise

#### Scenario: Toaster 就绪时 Promise 立即 resolve
- **WHEN** Toaster 已就绪时调用 `toastQueue.success('消息')`
- **THEN** Promise 在 toast action 执行后 resolve
- **AND** resolve 值为 toast ID

#### Scenario: Toaster 未就绪时 Promise 延迟 resolve
- **WHEN** Toaster 未就绪时调用 `toastQueue.success('消息')` 后调用 `markReady()`
- **THEN** Promise 在 toast action 执行后 resolve

### Requirement: ToastQueue 错误处理

ToastQueue 系统 SHALL 在 toast action 执行失败时优雅处理错误，不抛出异常。

#### Scenario: action 执行失败不抛出异常
- **WHEN** toast action 执行时抛出错误
- **THEN** Promise resolve undefined
- **AND** 不抛出未捕获的异常

#### Scenario: action 执行失败记录错误日志
- **WHEN** toast action 执行时抛出错误
- **THEN** 在控制台记录错误信息

### Requirement: ToastQueue 所有 Toast 类型

ToastQueue 系统 SHALL 支持 success、error、warning、info、loading 五种 Toast 类型。

#### Scenario: success 类型
- **WHEN** 调用 `toastQueue.success('成功消息')`
- **THEN** 调用 sonner 的 `toast.success()` 方法

#### Scenario: error 类型
- **WHEN** 调用 `toastQueue.error('错误消息')`
- **THEN** 调用 sonner 的 `toast.error()` 方法

#### Scenario: warning 类型
- **WHEN** 调用 `toastQueue.warning('警告消息')`
- **THEN** 调用 sonner 的 `toast.warning()` 方法

#### Scenario: info 类型
- **WHEN** 调用 `toastQueue.info('信息消息')`
- **THEN** 调用 sonner 的 `toast.info()` 方法

#### Scenario: loading 类型
- **WHEN** 调用 `toastQueue.loading('加载中')`
- **THEN** 调用 sonner 的 `toast.loading()` 方法

### Requirement: ToastQueue dismiss 和 promise 方法

ToastQueue 系统 SHALL 提供 dismiss 和 promise 方法，这两个方法不加入队列，立即执行。

#### Scenario: dismiss 立即执行
- **WHEN** 调用 `toastQueue.dismiss(id)`
- **THEN** 立即调用 sonner 的 `toast.dismiss(id)`
- **AND** 不经过队列机制

#### Scenario: promise 立即执行
- **WHEN** 调用 `toastQueue.promise(promise, options)`
- **THEN** 立即调用 sonner 的 `toast.promise(promise, options)`
- **AND** 不经过队列机制
