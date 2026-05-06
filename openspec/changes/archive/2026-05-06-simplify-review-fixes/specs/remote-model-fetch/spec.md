## MODIFIED Requirements

### Requirement: 本地缓存策略

系统 MUST 将远程获取的供应商数据保存到独立的 Store 文件 `remote-cache.json` 中。缓存 Store SHALL 使用模块级单例，SHALL NOT 每次调用时创建新的 Store 实例。

#### Scenario: 成功保存远程数据到缓存
- **WHEN** 从 models.dev API 成功获取完整的供应商数据
- **THEN** 系统使用模块级单例 Store 保存完整 API 响应
- **AND** 缓存文件包含 `apiResponse` 和 `metadata` 字段

#### Scenario: 从缓存加载数据
- **WHEN** 网络请求失败且本地存在缓存文件
- **THEN** 系统使用同一个模块级单例 Store 加载缓存数据
- **AND** 系统 SHALL NOT 创建新的 Store 实例

#### Scenario: 缓存不存在时抛出错误
- **WHEN** 网络请求失败且本地不存在缓存文件
- **THEN** 抛出 `RemoteDataError.NO_CACHE` 错误
