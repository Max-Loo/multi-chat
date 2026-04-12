# Spec: Tauri Compat Shared Modules

本规范定义了 tauriCompat 层中跨模块共享的基础设施：IndexedDB 初始化、加解密函数、类型导出、环境检测及 PBKDF2 常量。

## Purpose

为 keyring、store、keyringMigration 等 tauriCompat 子模块提供统一的共享函数和常量，消除重复定义，确保行为一致。

## Requirements

### Requirement: initIndexedDB 公共函数

系统 SHALL 提供 `initIndexedDB(dbName: string, storeName: string, keyPath: string | string[]): Promise<IDBDatabase>` 公共函数，用于统一初始化 IndexedDB 数据库连接。函数 SHALL 通过参数化 keyPath 支持复合键和单一键两种场景。

#### Scenario: 使用复合键初始化 IndexedDB
- **WHEN** 调用 `initIndexedDB("keyringDB", "passwords", ["service", "user"])`
- **THEN** 返回已打开的 IDBDatabase 实例，且 objectStore 使用 `["service", "user"]` 作为 keyPath

#### Scenario: 使用单一键初始化 IndexedDB
- **WHEN** 调用 `initIndexedDB("appStore", "settings", "key")`
- **THEN** 返回已打开的 IDBDatabase 实例，且 objectStore 使用 `"key"` 作为 keyPath

#### Scenario: 数据库打开失败
- **WHEN** IndexedDB 打开请求抛出错误
- **THEN** 函数 SHALL reject 并抛出包含原始错误信息的 Error

#### Scenario: 数据库已存在时打开
- **WHEN** 目标数据库和 objectStore 已存在
- **THEN** 直接返回现有数据库连接，不重复创建 objectStore

### Requirement: encrypt 和 decrypt 公共函数

系统 SHALL 提供 `encrypt(plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }>` 和 `decrypt(ciphertext: string, iv: string, key: CryptoKey): Promise<string>` 公共函数，使用 AES-256-GCM 算法进行加解密。encrypt 返回包含 base64 编码密文和 IV 的对象，decrypt 接收密文、IV 和密钥三个参数。

#### Scenario: 加密后解密还原数据
- **WHEN** 使用相同 CryptoKey 对 "hello" 进行 encrypt 后再 decrypt
- **THEN** 解密结果 SHALL 等于原始字符串 "hello"

#### Scenario: 加密结果格式
- **WHEN** 对任意字符串调用 encrypt
- **THEN** 返回值 SHALL 为 `{ ciphertext: string, iv: string }` 对象，其中 ciphertext 和 iv 均为 base64 编码字符串

#### Scenario: 解密被篡改的数据
- **WHEN** 对被修改过的加密数据调用 decrypt
- **THEN** 函数 SHALL 抛出错误

### Requirement: PasswordRecord 类型导出

系统 SHALL 导出 `PasswordRecord` 接口，包含 `service: string`、`user: string`、`encryptedPassword: string`、`iv: string`、`createdAt: number` 五个字段。

#### Scenario: 类型可用性
- **WHEN** 其他模块从 crypto-helpers 导入 PasswordRecord
- **THEN** 可以使用该接口进行类型标注

### Requirement: 环境检测函数

系统 SHALL 提供 `isTestEnvironment(): boolean` 函数检测当前是否运行在测试环境中，以及 `getPBKDF2Iterations(): number` 函数根据环境返回 PBKDF2 迭代次数。

#### Scenario: 测试环境检测
- **WHEN** 运行在 Vitest 环境中（`globalThis.vitest` 或 `globalThis.__VITEST__` 或 `import.meta.env.VITEST` 为真）
- **THEN** `isTestEnvironment()` SHALL 返回 `true`，`getPBKDF2Iterations()` SHALL 返回 `1000`

#### Scenario: 生产环境检测
- **WHEN** 不在任何测试环境中
- **THEN** `isTestEnvironment()` SHALL 返回 `false`，`getPBKDF2Iterations()` SHALL 返回 `100000`

### Requirement: PBKDF2 常量导出

系统 SHALL 导出 `PBKDF2_ALGORITHM`（值为 `'SHA-256'`）和 `DERIVED_KEY_LENGTH`（值为 `256`）常量。

#### Scenario: 常量值稳定
- **WHEN** 导入并读取这两个常量
- **THEN** `PBKDF2_ALGORITHM` SHALL 等于 `'SHA-256'`，`DERIVED_KEY_LENGTH` SHALL 等于 `256`
