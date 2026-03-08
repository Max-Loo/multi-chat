# fast-model-provider-init

快速模型供应商初始化能力。优化应用启动性能，通过"缓存优先 + 后台刷新"策略实现快速启动。

## Purpose

优化应用启动时 modelProvider 初始化的性能和用户体验。通过优先使用本地缓存数据实现快速启动（< 100ms），同时通过后台静默刷新机制保持数据新鲜度。

## Requirements

### Requirement: 优先使用缓存数据快速初始化

系统在应用启动时初始化模型供应商数据，SHALL 优先检查本地缓存。如果缓存存在，系统 MUST 立即返回缓存数据，不等待远程请求完成。

#### Scenario: 有缓存时快速启动

- **WHEN** 应用启动并执行 modelProvider 初始化步骤
- **WHEN** 本地存在有效的供应商缓存数据
- **THEN** `initializeModelProvider` Thunk 必须在 100ms 内完成初始化并返回缓存数据
- **THEN** `initializeModelProvider` Thunk 不得发起远程网络请求
- **THEN** Redux store 中的 `modelProvider.providers` 包含缓存数据
- **THEN** Redux store 中的 `modelProvider.error` 为 null
- **THEN** 系统必须在初始化流程完成后立即触发后台刷新（不受上述限制）

#### Scenario: 无缓存时等待远程请求

- **WHEN** 应用启动并执行 modelProvider 初始化步骤
- **WHEN** 本地不存在供应商缓存数据
- **THEN** 系统必须发起远程请求获取数据
- **THEN** 请求成功时保存数据到缓存并更新 Redux store
- **THEN** 请求失败时设置 error 为 "无法获取模型供应商数据，请检查网络连接"

#### Scenario: 缓存数据格式正确性

- **WHEN** 从缓存加载供应商数据
- **THEN** 系统必须验证缓存数据是有效的数组
- **THEN** 系统必须验证缓存数据非空（至少包含一个供应商）
- **WHEN** 缓存数据无效或为空
- **THEN** 系统必须丢弃缓存并尝试远程请求
- **THEN** 白名单过滤由 `loadCachedProviderData` 函数内部处理（不在本场景范围内）

### Requirement: 后台静默刷新机制

系统在应用初始化完成后，SHALL 异步触发后台刷新任务，静默更新模型供应商数据。后台刷新失败时 MUST 不显示任何错误提示。

#### Scenario: 初始化完成后自动触发后台刷新

- **WHEN** 应用初始化流程完成（无论 modelProvider 是否成功）
- **THEN** 系统必须立即触发 `silentRefreshModelProvider` Thunk
- **THEN** 后台刷新不得阻塞应用渲染
- **THEN** 用户可以正常使用应用

#### Scenario: 后台刷新去重避免并发

- **WHEN** 后台刷新任务准备执行
- **WHEN** Redux store 中的 `loading` 为 true（表示已有刷新任务在进行）
- **OR** Redux store 中的 `backgroundRefreshing` 为 true（表示已有后台刷新在进行）
- **THEN** 系统必须静默跳过后台刷新
- **THEN** 系统不得发起新的网络请求
- **WHEN** Redux store 中的 `loading` 为 false 且 `backgroundRefreshing` 为 false
- **THEN** 系统必须正常执行后台刷新
- **THEN** 在开始执行前设置 `backgroundRefreshing` 为 true
- **THEN** 在执行完成（成功或失败）后设置 `backgroundRefreshing` 为 false

#### Scenario: 后台刷新成功更新数据

- **WHEN** 后台刷新任务执行
- **WHEN** 远程请求成功返回数据
- **THEN** 系统必须更新 Redux store 中的 `modelProvider.providers`
- **THEN** 系统必须更新 Redux store 中的 `modelProvider.lastUpdate` 为当前时间
- **THEN** 系统必须保存最新数据到缓存
- **WHEN** Redux store 中的 `modelProvider.error` 不为 null
- **THEN** 系统必须清除 `modelProvider.error`（表示成功恢复）

#### Scenario: 后台刷新成功但数据未变化

- **WHEN** 应用使用缓存快速启动
- **WHEN** 后台刷新任务成功返回数据
- **WHEN** 远程数据与缓存数据完全相同
- **THEN** Redux store 中的 `modelProvider.providers` 更新为远程数据（即使相同）
- **THEN** Redux store 中的 `modelProvider.lastUpdate` 从 null 更新为 ISO 时间
- **THEN** 如果 Redux store 中的 `modelProvider.error` 不为 null，则清除错误
- **THEN** 系统保持稳定，不触发不必要的 UI 重新渲染

#### Scenario: 后台刷新失败静默处理

- **WHEN** 后台刷新任务执行
- **WHEN** 远程请求失败（网络错误、超时、服务器错误等）
- **THEN** 系统不得显示任何错误提示或 Toast
- **THEN** Redux store 的 `providers`、`lastUpdate`、`error`、`loading` 必须保持不变
- **THEN** 系统不得抛出未捕获的异常
- **THEN** 应用继续正常运行并使用当前数据

### Requirement: 保持数据新鲜度和容错性

系统 SHALL 在有缓存和无缓存场景下都能正常工作，确保数据及时性和应用可用性。

#### Scenario: 有缓存 + 后台刷新成功

- **WHEN** 应用使用缓存快速启动
- **WHEN** 后台刷新任务成功获取新数据
- **THEN** 用户立即看到缓存数据（快速启动）
- **THEN** 用户可能看到数据自动更新（如果远程数据与缓存不同）

#### Scenario: 有缓存 + 后台刷新失败

- **WHEN** 应用使用缓存快速启动
- **WHEN** 后台刷新任务失败
- **THEN** 应用继续使用缓存数据
- **THEN** 用户无感知（无错误提示）
- **THEN** 应用功能完全可用

#### Scenario: 无缓存 + 远程请求失败

- **WHEN** 应用启动且无缓存
- **WHEN** 远程请求失败
- **THEN** Redux store 中的 `modelProvider.providers` 为空数组
- **THEN** Redux store 中的 `modelProvider.error` 为 "无法获取模型供应商数据，请检查网络连接"
- **THEN** 应用必须显示 `NoProvidersAvailable` 组件
- **THEN** 用户可以通过刷新页面或进入设置页面手动刷新

### Requirement: 性能指标

系统在不同场景下 MUST 满足指定的性能指标。

#### Scenario: 有缓存场景的启动时间

- **WHEN** 应用启动且存在有效缓存
- **THEN** modelProvider 初始化步骤的 P50（中位数）必须在 100ms 内
- **THEN** modelProvider 初始化步骤的 P95 必须在 200ms 内
- **THEN** 应用整体启动时间应显著降低（相比之前的 5-12 秒）

#### Scenario: 无缓存场景的启动时间

- **WHEN** 应用启动且不存在缓存
- **THEN** modelProvider 初始化时间取决于网络请求（5 秒超时 + 最多 2 次重试）
- **THEN** 启动时间与当前实现保持一致

### Requirement: 与现有功能兼容

新的初始化逻辑 SHALL 不破坏现有的手动刷新功能和错误处理机制。

#### Scenario: 设置页面手动刷新

- **WHEN** 用户在设置页面点击"刷新"按钮
- **THEN** 系统必须调用 `refreshModelProvider` Thunk
- **THEN** 刷新成功时显示成功 Toast
- **THEN** 刷新失败时显示失败 Toast
- **THEN** 手动刷新的行为与优化前完全一致

#### Scenario: 错误处理流程保持不变

- **WHEN** modelProvider 初始化失败（无缓存且远程请求失败）
- **THEN** 应用必须显示 `NoProvidersAvailable` 组件
- **THEN** 用户可以通过点击"刷新"按钮重新加载页面
- **THEN** 错误处理流程与优化前完全一致
