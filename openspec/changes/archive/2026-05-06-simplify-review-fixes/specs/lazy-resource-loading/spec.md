## MODIFIED Requirements

### Requirement: 按需加载资源

系统 MUST 提供 `ResourceLoader<T>` 通用类，支持按需动态加载任意类型的资源。`load()` 方法的缓存检查 SHALL 使用 `cache.has(key)` 替代 `get(key)`，语义更清晰，避免不必要的函数调用层级。

#### Scenario: 从缓存获取已加载资源
- **WHEN** 调用 `resourceLoader.load('deepseek')` 且该资源已被加载
- **THEN** 系统直接从缓存返回资源
- **AND** 系统不执行动态导入操作

#### Scenario: 缓存未命中加载资源
- **WHEN** 调用 `resourceLoader.load('deepseek')` 且资源未缓存
- **THEN** 系统执行动态导入
- **AND** 加载成功后通过 `setCache()` 触发 LRU 更新
