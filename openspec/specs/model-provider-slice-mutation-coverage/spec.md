## Purpose

验证 modelProvider slice 变异测试覆盖率要求，确保关键条件分支、错误处理路径和状态管理逻辑能杀死所有注入的变异体。

## Requirements

### Requirement: 变异测试 SHALL 验证 initializeModelProvider 缓存快速路径条件
测试套件 SHALL 杀死 `!Array.isArray(cachedData) || cachedData.length === 0` 的条件变异体。

#### Scenario: 缓存为非数组时降级到远程请求
- **WHEN** `loadCachedProviderData` 返回非数组值（如对象或 null）
- **THEN** SHALL 抛出错误，触发降级到远程请求路径

#### Scenario: 缓存为空数组时降级到远程请求
- **WHEN** `loadCachedProviderData` 返回空数组 `[]`
- **THEN** SHALL 降级到远程请求路径

#### Scenario: 缓存有效时使用快速路径
- **WHEN** `loadCachedProviderData` 返回有效非空数组
- **THEN** SHALL 使用缓存数据，lastUpdate 为 null，不调用 fetchRemoteData

### Requirement: 变异测试 SHALL 验证 initializeModelProvider lastUpdate 差异
测试套件 SHALL 杀死缓存路径 `lastUpdate: null` vs 远程路径 `lastUpdate: new Date().toISOString()` 的对象字面量变异体。

#### Scenario: 缓存路径 lastUpdate 为 null
- **WHEN** 使用缓存快速路径初始化成功
- **THEN** SHALL state.lastUpdate 为 null

#### Scenario: 远程路径 lastUpdate 为 ISO 时间戳
- **WHEN** 通过远程请求初始化成功
- **THEN** SHALL state.lastUpdate 匹配 ISO 8601 格式

### Requirement: 变异测试 SHALL 验证 silentRefreshModelProvider 静默失败
测试套件 SHALL 杀死 `rejectWithValue({})` 空 payload 的变异体。

#### Scenario: 静默刷新失败时保持所有状态不变
- **WHEN** fetchRemoteData 失败
- **THEN** SHALL rejected 处理器不修改 providers、lastUpdate、error

### Requirement: 变异测试 SHALL 验证 silentRefreshModelProvider 条件清除错误
测试套件 SHALL 杀掉 `if (state.error !== null)` 的条件变异体。

#### Scenario: 有错误时 fulfilled 清除错误
- **WHEN** state.error 不为 null 且 silentRefresh 成功
- **THEN** SHALL 清除 error 为 null

#### Scenario: 无错误时 fulfilled 不影响 error
- **WHEN** state.error 为 null 且 silentRefresh 成功
- **THEN** SHALL error 保持 null

### Requirement: 变异测试 SHALL 验证 refreshModelProvider RemoteDataError 类型检查
测试套件 SHALL 杀死 `error instanceof RemoteDataError` 的条件变异体。

#### Scenario: RemoteDataError 使用自定义错误消息
- **WHEN** fetchRemoteData 抛出 RemoteDataError
- **THEN** SHALL 使用 error.message 作为 state.error

#### Scenario: 非 RemoteDataError 使用默认错误消息
- **WHEN** fetchRemoteData 抛出普通 Error（如 TypeError）
- **THEN** SHALL 使用 "刷新失败，请稍后重试" 作为 state.error

### Requirement: 变异测试 SHALL 验证 triggerSilentRefreshIfNeeded 守卫条件
测试套件 SHALL 杀死 `!modelProviderState.backgroundRefreshing` 的条件变异体。

#### Scenario: backgroundRefreshing 为 false 时触发刷新
- **WHEN** state.modelProvider.backgroundRefreshing 为 false
- **THEN** SHALL 调用 store.dispatch(silentRefreshModelProvider())

#### Scenario: backgroundRefreshing 为 true 时跳过刷新
- **WHEN** state.modelProvider.backgroundRefreshing 为 true
- **THEN** SHALL 不调用 store.dispatch

### Requirement: 变异测试 SHALL 验证 backgroundRefreshing 锁的获取和释放
测试套件 SHALL 杀死 pending 设置 `true` 和 fulfilled/rejected 设置 `false` 的赋值变异体。

#### Scenario: pending 设置 backgroundRefreshing 为 true
- **WHEN** silentRefreshModelProvider 进入 pending 状态
- **THEN** SHALL state.backgroundRefreshing 为 true

#### Scenario: fulfilled 释放 backgroundRefreshing 为 false
- **WHEN** silentRefreshModelProvider 进入 fulfilled 状态
- **THEN** SHALL state.backgroundRefreshing 为 false

#### Scenario: rejected 释放 backgroundRefreshing 为 false
- **WHEN** silentRefreshModelProvider 进入 rejected 状态
- **THEN** SHALL state.backgroundRefreshing 为 false

### Requirement: 变异测试 SHALL 验证 initializeModelProvider rejected 无 payload 处理
测试套件 SHALL 杀死 rejected 处理器中 `action.error.message || "Failed to..."` 的条件变异体。

#### Scenario: rejected 无 payload 时使用 error.message
- **WHEN** initializeModelProvider 被 rejected 且无 payload
- **THEN** SHALL 使用 action.error.message 作为 state.error
