# Model Remote Service 测试规格

本规格定义了 `modelRemoteService.ts` 模块的单元测试要求，确保远程数据获取、缓存管理、重试机制和错误处理的可靠性。

## ADDED Requirements

### Requirement: 测试远程数据获取成功场景
系统应当测试 `fetchRemoteData` 函数在成功从远程 API 获取数据时的行为。

#### Scenario: 成功获取并返回数据
- **WHEN** 调用 `fetchRemoteData()` 且远程 API 返回有效响应
- **THEN** 系统返回完整的 API 响应和过滤后的供应商数据
- **AND** 过滤后的数据仅包含白名单中定义的供应商

### Requirement: 测试网络超时处理
系统应当测试 `fetchWithTimeout` 函数在请求超时时的错误处理机制。

#### Scenario: 请求超时抛出错误
- **WHEN** 网络请求在指定超时时间内未完成
- **THEN** 系统抛出 `RemoteDataError`，类型为 `NETWORK_TIMEOUT`
- **AND** 错误消息包含超时时长信息

#### Scenario: 超时后取消请求
- **WHEN** 请求超时
- **THEN** AbortController 中止挂起的请求
- **AND** 清除超时定时器

### Requirement: 测试重试机制和指数退避
系统应当测试 `fetchRemoteData` 函数在可重试错误时的重试行为和延迟策略。

#### Scenario: 网络错误重试成功
- **WHEN** 首次请求失败（网络错误），第二次请求成功
- **THEN** 系统在延迟后重试请求
- **AND** 延迟时间使用指数退避算法（第一次：baseDelay，第二次：baseDelay * 2）
- **AND** 最终返回成功的响应数据

#### Scenario: 服务器 5xx 错误重试
- **WHEN** 远程 API 返回 500 状态码
- **THEN** 系统识别为可重试错误
- **AND** 按照最大重试次数进行重试

#### Scenario: 达到最大重试次数后失败
- **WHEN** 所有重试尝试均失败
- **THEN** 系统抛出最后一次的错误
- **AND** 不再继续重试

### Requirement: 测试客户端错误不重试
系统应当验证 4xx 客户端错误不会触发重试机制。

#### Scenario: 404 错误不重试
- **WHEN** 远程 API 返回 404 状态码
- **THEN** 系统立即抛出 `RemoteDataError`，类型为 `SERVER_ERROR`
- **AND** 不进行任何重试尝试

### Requirement: 测试缓存保存功能
系统应当测试 `saveCachedProviderData` 函数正确保存完整的 API 响应。

#### Scenario: 成功保存缓存
- **WHEN** 调用 `saveCachedProviderData(apiResponse)`
- **THEN** 系统将完整的 API 响应保存到缓存存储
- **AND** 保存当前的 ISO 8601 时间戳
- **AND** 标记数据来源为 'remote'

### Requirement: 测试缓存加载功能
系统应当测试 `loadCachedProviderData` 函数从缓存加载并过滤数据。

#### Scenario: 成功加载并过滤缓存
- **WHEN** 调用 `loadCachedProviderData(allowedProviders)`
- **THEN** 系统从缓存存储加载完整的 API 响应
- **AND** 使用白名单过滤供应商数据
- **AND** 返回过滤后的供应商数组

#### Scenario: 缓存不存在抛出错误
- **WHEN** 缓存存储中没有缓存数据
- **THEN** 系统抛出 `RemoteDataError`，类型为 `NO_CACHE`

### Requirement: 测试数据适配器
系统应当测试 `adaptApiResponseToInternalFormat` 函数正确转换 API 响应格式。

#### Scenario: 正确过滤和转换数据
- **WHEN** API 响应包含多个供应商，其中部分不在白名单中
- **THEN** 系统仅保留白名单中的供应商
- **AND** 将供应商的 `models` 对象转换为数组格式
- **AND** 映射字段名称（id → modelKey，name → modelName）

### Requirement: 测试请求取消功能
系统应当测试通过 AbortSignal 取消正在进行的请求。

#### Scenario: 取消请求抛出中止错误
- **WHEN** 在请求过程中调用 `abort()`
- **THEN** 系统抛出 `RemoteDataError`，类型为 `ABORTED`
- **AND** 不会触发重试机制

### Requirement: 测试组合信号功能
系统应当测试 `combineSignals` 函数正确组合多个 AbortSignal。

#### Scenario: 任意信号中止时组合信号中止
- **WHEN** 组合了多个信号，其中任一信号触发中止
- **THEN** 组合信号立即进入中止状态
- **AND** 所有信号的事件监听器被正确清理

### Requirement: 测试错误分类
系统应当测试错误正确分类为 `RemoteDataError` 类型。

#### Scenario: 网络连接失败分类
- **WHEN** fetch 抛出网络连接错误（非超时）
- **THEN** 系统将其转换为 `RemoteDataError`，类型为 `NETWORK_ERROR`

#### Scenario: JSON 解析失败分类
- **WHEN** API 响应的 JSON 解析失败
- **THEN** 系统将其转换为 `RemoteDataError`，类型为 `PARSE_ERROR`
