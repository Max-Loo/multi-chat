## ADDED Requirements

### Requirement: 变异测试 SHALL 验证 isSupported 多条件 AND 逻辑
测试套件 SHALL 杀死 `typeof indexedDB !== 'undefined' && typeof crypto !== 'undefined'` 的条件变异体。

#### Scenario: Web 环境有 IndexedDB 和 Crypto 返回 true
- **WHEN** indexedDB 和 crypto.subtle 都可用
- **THEN** SHALL isSupported() 返回 true

#### Scenario: Web 环境无 IndexedDB 返回 false
- **WHEN** indexedDB 为 undefined
- **THEN** SHALL isSupported() 返回 false

#### Scenario: Web 环境无 Crypto 返回 false
- **WHEN** crypto.subtle 为 undefined
- **THEN** SHALL isSupported() 返回 false

### Requirement: 变异测试 SHALL 验证 resetState 行为差异
测试套件 SHALL 杀死 `resetState` 中 `if (this.db)` 和赋值变异体。

#### Scenario: Web 环境 resetState 清除加密密钥
- **WHEN** WebKeyringCompat 初始化后调用 resetState
- **THEN** SHALL db 被关闭、encryptionKey 被清除

#### Scenario: Tauri 环境 resetState 不抛错
- **WHEN** TauriKeyringCompat 实例调用 resetState
- **THEN** SHALL 不抛出错误（duck typing 空操作）

### Requirement: 变异测试 SHALL 验证 close 别名行为
测试套件 SHALL 杀死 `close()` 调用 `resetState()` 的委托变异体。

#### Scenario: close 等同于 resetState
- **WHEN** 调用 WebKeyringCompat.close()
- **THEN** SHALL 行为等同于 resetState()（关闭 DB、清除密钥）

### Requirement: 变异测试 SHALL 验证 createKeyringAPI duck typing
测试套件 SHALL 杀死 `'resetState' in impl` 的条件变异体。

#### Scenario: Web 环境调用 keyring.resetState 执行实际方法
- **WHEN** keyring 实例基于 WebKeyringCompat 调用 resetState
- **THEN** SHALL 执行 WebKeyringCompat.resetState()

#### Scenario: Tauri 环境调用 keyring.resetState 为空操作
- **WHEN** keyring 实例基于 TauriKeyringCompat 调用 resetState
- **THEN** SHALL 不抛出错误

### Requirement: 变异测试 SHALL 验证 WebKeyringCompat.init 种子变化检测
测试套件 SHALL 杀死 `this.currentSeed !== seed` 的条件变异体。

#### Scenario: 种子未变化时重新初始化不重新派生密钥
- **WHEN** 连续两次 init 使用相同种子
- **THEN** SHALL 第二次不重新派生密钥（encryptionKey 引用不变）

#### Scenario: 种子变化时重新初始化重新派生密钥
- **WHEN** init 后改变 localStorage 中的种子再调用 init
- **THEN** SHALL 重新派生密钥

### Requirement: 变异测试 SHALL 验证 WebKeyringCompat.setPassword 加密存储
测试套件 SHALL 杀死 `createdAt: getCurrentTimestampMs()` 的赋值变异体。

#### Scenario: 存储记录包含 createdAt 时间戳
- **WHEN** 调用 setPassword 后从 IndexedDB 读取记录
- **THEN** SHALL record.createdAt 为接近当前时间的毫秒时间戳

### Requirement: 变异测试 SHALL 验证 WebKeyringCompat.ensureInitialized
测试套件 SHALL 杀死 `if (!this.db || !this.encryptionKey)` 的条件变异体。

#### Scenario: 未初始化时调用 getPassword 自动初始化
- **WHEN** 未调用 init() 直接调用 getPassword
- **THEN** SHALL 自动调用 init() 完成初始化后继续执行

### Requirement: 变异测试 SHALL 验证 Tauri 环境密钥删除
测试套件 SHALL 杀死 deletePassword 参数透传变异体。

#### Scenario: deletePassword 正确传递参数
- **WHEN** 调用 keyring.deletePassword('service', 'user')
- **THEN** SHALL tauriDeletePassword 被调用且参数为 ('service', 'user')
