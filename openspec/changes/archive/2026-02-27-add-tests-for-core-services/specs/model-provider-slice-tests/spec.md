# Model Provider Slice 测试规格

本规格定义了 `modelProviderSlice.ts` 模块的单元测试要求，确保 Redux Thunk、状态管理和错误降级策略的正确性。

## ADDED Requirements

### Requirement: 测试初始化 Thunk 成功场景
系统应当测试 `initializeModelProvider` Thunk 在成功获取远程数据时的状态转换。

#### Scenario: 成功初始化并更新状态
- **WHEN** 调用 `dispatch(initializeModelProvider())` 且远程 API 返回成功
- **THEN** 系统将 `loading` 设置为 `false`
- **AND** 系统更新 `providers` 为过滤后的供应商数据
- **AND** 系统更新 `lastUpdate` 为当前 ISO 8601 时间戳
- **AND** 系统将 `error` 设置为 `null`

### Requirement: 测试初始化 Thunk 缓存降级
系统应当测试 `initializeModelProvider` Thunk 在远程请求失败时降级到缓存的场景。

#### Scenario: 远程请求失败但缓存可用
- **WHEN** 调用 `dispatch(initializeModelProvider())` 且远程 API 失败
- **AND** 缓存中存在有效数据
- **THEN** 系统将 `loading` 设置为 `false`
- **AND** 系统从缓存加载并更新 `providers`
- **AND** 系统将 `lastUpdate` 设置为 `null`（表示数据来自缓存）
- **AND** 系统设置 `error` 为降级提示消息

#### Scenario: 远程请求失败且缓存不存在
- **WHEN** 调用 `dispatch(initializeModelProvider())` 且远程 API 失败
- **AND** 缓存中不存在数据
- **THEN** 系统将 `loading` 设置为 `false`
- **AND** 系统将 `providers` 设置为空数组
- **AND** 系统将 `error` 设置为严重错误消息

### Requirement: 测试刷新 Thunk 成功场景
系统应当测试 `refreshModelProvider` Thunk 在手动刷新时成功获取数据。

#### Scenario: 手动刷新成功
- **WHEN** 调用 `dispatch(refreshModelProvider())`
- **AND** 远程 API 返回成功
- **THEN** 系统将 `loading` 设置为 `false`
- **AND** 系统更新 `providers` 和 `lastUpdate`
- **AND** 系统更新缓存（保存完整的 API 响应）

### Requirement: 测试刷新 Thunk 失败场景
系统应当测试 `refreshModelProvider` Thunk 在请求失败时的错误处理。

#### Scenario: 刷新请求失败
- **WHEN** 调用 `dispatch(refreshModelProvider())` 且远程 API 失败
- **THEN** 系统将 `loading` 设置为 `false`
- **AND** 系统不修改 `providers` 和 `lastUpdate`（保留上次数据）
- **AND** 系统设置 `error` 为失败消息

### Requirement: 测试刷新支持取消功能
系统应当测试 `refreshModelProvider` Thunk 支持 AbortSignal 中止请求。

#### Scenario: 取消刷新请求
- **WHEN** 调用 `dispatch(refreshModelProvider())` 并传递 `signal`
- **AND** 在请求过程中触发 `signal.abort()`
- **THEN** 系统中止网络请求
- **AND** Thunk 被拒绝，错误类型为 `ABORTED`

### Requirement: 测试 Reducer 清除错误
系统应当测试 `clearError` action 清除错误信息。

#### Scenario: 清除错误状态
- **WHEN** 调用 `dispatch(clearError())`
- **THEN** 系统将 `error` 设置为 `null`
- **AND** 其他状态（providers、loading、lastUpdate）保持不变

### Requirement: 测试加载状态转换
系统应当验证 Thunk 在 pending、fulfilled、rejected 状态下的 loading 状态。

#### Scenario: 初始化过程中 loading 状态
- **WHEN** 调用 `dispatch(initializeModelProvider())`
- **THEN** 系统立即将 `loading` 设置为 `true`
- **AND** 清除之前的 `error`

#### Scenario: 刷新过程中 loading 状态
- **WHEN** 调用 `dispatch(refreshModelProvider())`
- **THEN** 系统立即将 `loading` 设置为 `true`
- **AND** 清除之前的 `error`

### Requirement: 测试 Mock 服务层依赖
系统应当正确 Mock `modelRemoteService` 的函数以隔离 Redux 逻辑测试。

#### Scenario: Mock fetchRemoteData
- **WHEN** 测试 Redux Thunk
- **THEN** Mock `fetchRemoteData` 返回模拟数据或抛出错误
- **AND** 验证 Thunk 调用了 `saveCachedProviderData`（成功时）

#### Scenario: Mock loadCachedProviderData
- **WHEN** 测试缓存降级场景
- **THEN** Mock `loadCachedProviderData` 返回缓存的供应商数据或抛出 NO_CACHE 错误

### Requirement: 测试 Redux 状态不可变性
系统应当验证所有 reducer 和 extraReducers 不直接修改 state 对象。

#### Scenario: Reducer 不修改原始 state
- **WHEN** 调用任何 reducer action
- **THEN** 原始 state 对象保持不变
- **AND** 返回新的 state 对象

#### Scenario: ExtraReducer 不修改原始 state
- **WHEN** Thunk 触发 extraReducer
- **THEN** Redux Toolkit 的 Immer 确保状态不可变性
- **AND** 可以直接修改 state draft（Immer 自动处理不可变性）

### Requirement: 测试 rejectWithValue 处理
系统应当测试 Thunk 使用 `rejectWithValue` 返回自定义错误 payload。

#### Scenario: 远程失败时返回错误和缓存数据
- **WHEN** `initializeModelProvider` 远程失败但缓存存在
- **THEN** Thunk 使用 `rejectWithValue` 返回包含 `providers` 和 `error` 的对象
- **AND** extraReducer 读取 `action.payload` 并更新 state

#### Scenario: 刷新失败时返回错误消息
- **WHEN** `refreshModelProvider` 请求失败
- **THEN** Thunk 使用 `rejectWithValue` 返回包含 `error` 的对象
- **AND** extraReducer 更新 `error` 字段
