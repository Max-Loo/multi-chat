## ADDED Requirements

### Requirement: 变异测试 SHALL 验证 WebStoreCompat.get 值提取条件
测试套件 SHALL 杀死 `result.value !== undefined` 的条件变异体。

#### Scenario: 存储有效值后 get 返回精确值
- **WHEN** 调用 set('key', 'value') 后调用 get('key')
- **THEN** SHALL 返回 'value'（精确值匹配，非仅定义检查）

#### Scenario: 键不存在时 get 返回 null
- **WHEN** 调用 get('non-existent-key')
- **THEN** SHALL 返回 null

#### Scenario: get 读取错误时返回 null
- **WHEN** IndexedDB get 请求触发 error 事件
- **THEN** SHALL resolve 为 null（不 reject）

### Requirement: 变异测试 SHALL 验证 WebStoreCompat.set 写入成功
测试套件 SHALL 杀死 `objectStore.put({ key, value })` 的调用变异体。

#### Scenario: set 后数据可被 get 检索
- **WHEN** 调用 set('test-key', { name: 'test' })
- **THEN** SHALL get('test-key') 返回 { name: 'test' }

### Requirement: 变异测试 SHALL 验证 WebStoreCompat.delete 删除生效
测试套件 SHALL 杀死 `objectStore.delete(key)` 的调用变异体。

#### Scenario: delete 后 get 返回 null
- **WHEN** 调用 set('key', 'value') 后调用 delete('key')
- **THEN** SHALL get('key') 返回 null

### Requirement: 变异测试 SHALL 验证 WebStoreCompat.keys 返回正确键列表
测试套件 SHALL 杀死 `request.result as string[]` 的类型转换变异体。

#### Scenario: 设置多个键后 keys 返回完整列表
- **WHEN** 调用 set('a', 1)、set('b', 2) 后调用 keys()
- **THEN** SHALL 返回包含 'a' 和 'b' 的数组

### Requirement: 变异测试 SHALL 验证 WebStoreCompat.close 关闭数据库
测试套件 SHALL 杀死 `if (this.db)` 和 `this.db.close()` 的变异体。

#### Scenario: close 后 get 抛出错误
- **WHEN** 调用 close() 后调用 get('any-key')
- **THEN** SHALL 抛出包含"未初始化"的错误

### Requirement: 变异测试 SHALL 验证 WebStoreCompat.isSupported
测试套件 SHALL 杀死 `typeof indexedDB !== 'undefined'` 的条件变异体。

#### Scenario: Web 环境 isSupported 返回 true
- **WHEN** 在 fake-indexedDB 环境下调用 isSupported()
- **THEN** SHALL 返回 true

### Requirement: 变异测试 SHALL 验证 createLazyStore 环境分发
测试套件 SHALL 杀死 `isTauri() ? TauriStoreCompat : WebStoreCompat` 的条件变异体。

#### Scenario: Web 环境创建 WebStoreCompat 实例
- **WHEN** 在 Web 环境调用 createLazyStore
- **THEN** SHALL 返回的实例 init 后支持 CRUD 操作
