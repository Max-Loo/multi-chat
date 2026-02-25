# Crypto 与 MasterKey 集成测试规范

## ADDED Requirements

### Requirement: 使用生成的主密钥进行加密/解密

系统 MUST 测试使用 `generateMasterKey()` 生成的密钥可以成功执行 `encryptField()` 和 `decryptField()` 操作。

#### Scenario: 生成密钥后加密明文

- **WHEN** 调用 `generateMasterKey()` 生成密钥
- **AND** 使用生成的密钥调用 `encryptField()` 加密标准明文（如 "Hello, World!"）
- **THEN** 系统应返回以 "enc:" 开头的密文
- **AND** 密文应有效（Base64 编码正确）

#### Scenario: 使用相同密钥解密密文

- **WHEN** 调用 `generateMasterKey()` 生成密钥
- **AND** 使用密钥加密明文得到密文
- **AND** 使用相同密钥调用 `decryptField()` 解密密文
- **THEN** 系统应返回原始明文
- **AND** 解密结果应与加密输入完全一致

#### Scenario: 加密 Unicode 字符并解密

- **WHEN** 调用 `generateMasterKey()` 生成密钥
- **AND** 使用密钥加密包含 Unicode 的明文（如中文 "你好世界"、emoji "🔐"）
- **AND** 使用相同密钥解密密文
- **THEN** 系统应返回原始 Unicode 字符
- **AND** 字符编码应无损失

#### Scenario: 密钥长度验证

- **WHEN** 调用 `generateMasterKey()` 生成密钥
- **THEN** 密钥字符串长度应为 64 个字符（256-bit）
- **AND** 密钥应仅包含有效的 hex 字符（0-9, a-f）
- **AND** 密钥应可直接用于 `encryptField()`（无需额外转换）

### Requirement: 使用初始化的主密钥进行加密/解密

系统 MUST 测试使用 `initializeMasterKey()` 获取的密钥可以成功执行加密/解密操作。

#### Scenario: 首次启动生成新密钥并加密

- **WHEN** Keyring 中无密钥（`getPassword()` 返回 `null`）
- **AND** 调用 `initializeMasterKey()` 初始化主密钥
- **AND** 使用返回的密钥调用 `encryptField()` 加密明文
- **THEN** 系统应成功加密
- **AND** `setPassword()` 应被调用一次（存储新密钥）
- **AND** 密钥应与 `generateMasterKey()` 生成的格式一致

#### Scenario: 已有密钥时复用并加密

- **WHEN** Keyring 中已有密钥（`getPassword()` 返回有效密钥）
- **AND** 调用 `initializeMasterKey()` 初始化主密钥
- **AND** 使用返回的密钥调用 `encryptField()` 加密明文
- **THEN** 系统应返回现有密钥（不生成新密钥）
- **AND** 加密应成功
- **AND** `setPassword()` 不应被调用（不存储新密钥）

#### Scenario: 使用初始化密钥进行往返加密/解密

- **WHEN** 调用 `initializeMasterKey()` 获取密钥
- **AND** 使用密钥加密明文得到密文
- **AND** 使用相同密钥解密密文
- **THEN** 系统应返回原始明文
- **AND** 往返转换应无数据损失

### Requirement: 密钥重新生成后旧数据无法解密

系统 MUST 测试密钥重新生成后，使用旧密钥加密的数据无法解密，并验证错误处理。

#### Scenario: 重新生成密钥后解密旧数据失败

- **WHEN** 使用旧密钥加密明文得到密文
- **AND** 重新调用 `generateMasterKey()` 生成新密钥
- **AND** 使用新密钥调用 `decryptField()` 解密旧密文
- **THEN** 系统应抛出错误
- **AND** 错误消息应包含 "解密敏感数据失败，可能是主密钥已更改或数据已损坏"
- **AND** 错误原因应为 `OperationError`（AES-GCM 认证失败）

#### Scenario: 密钥丢失后解密失败

- **WHEN** 使用密钥加密明文得到密文
- **AND** Keyring 中密钥被清除（`getPassword()` 返回 `null`）
- **AND** 调用 `initializeMasterKey()` 生成新密钥
- **AND** 使用新密钥解密旧密文
- **THEN** 系统应抛出解密失败错误
- **AND** 错误消息应提示用户密钥已更改

#### Scenario: 部分错误的密钥解密失败

- **WHEN** 使用密钥 A 加密明文得到密文
- **AND** 使用与密钥 A 仅少量字符不同的密钥 B 解密密文
- **THEN** 系统应抛出解密失败错误
- **AND** AES-GCM 认证标签应验证失败

### Requirement: 密钥导出与加密操作兼容性

系统 MUST 测试 `exportMasterKey()` 导出的密钥可以用于加密/解密操作。

#### Scenario: 导出密钥后用于加密

- **WHEN** Keyring 中已存储密钥
- **AND** 调用 `exportMasterKey()` 导出密钥
- **AND** 使用导出的密钥调用 `encryptField()` 加密明文
- **THEN** 系统应成功加密
- **AND** 密文应带有 "enc:" 前缀

#### Scenario: 导出密钥后用于解密

- **WHEN** 使用密钥加密明文得到密文
- **AND** 调用 `exportMasterKey()` 导出相同密钥
- **AND** 使用导出的密钥调用 `decryptField()` 解密密文
- **THEN** 系统应返回原始明文
- **AND** 解密应成功

#### Scenario: 密钥不存在时导出失败

- **WHEN** Keyring 中无密钥（`getPassword()` 返回 `null`）
- **AND** 调用 `exportMasterKey()` 导出密钥
- **THEN** 系统应抛出错误
- **AND** 错误消息应包含 "主密钥不存在，无法导出"

### Requirement: Tauri 和 Web 环境集成行为

系统 MUST 测试 Tauri 和 Web 环境下密钥管理与加密操作的集成行为差异。

#### Scenario: Tauri 环境密钥初始化与加密

- **WHEN** `isTauri()` 返回 `true`
- **AND** Keyring 中无密钥
- **AND** 调用 `initializeMasterKey()` 初始化主密钥
- **AND** 使用返回的密钥加密明文
- **THEN** 系统应成功加密
- **AND** `console.warn()` 应输出包含 "system secure storage" 的警告
- **AND** 加密操作应与 Web 环境结果一致（密文格式相同）

#### Scenario: Web 环境密钥初始化与加密

- **WHEN** `isTauri()` 返回 `false`
- **AND** Keyring 中无密钥
- **AND** 调用 `initializeMasterKey()` 初始化主密钥
- **AND** 使用返回的密钥加密明文
- **THEN** 系统应成功加密
- **AND** `console.warn()` 应输出包含 "browser secure storage (IndexedDB + encryption)" 的警告
- **AND** 加密操作应与 Tauri 环境结果一致（密文格式相同）

#### Scenario: Tauri 环境 Keyring 异常时加密失败

- **WHEN** `isTauri()` 返回 `true`
- **AND** `getPassword()` 抛出异常（Keyring 不可用）
- **AND** 调用 `initializeMasterKey()`
- **THEN** 系统应抛出错误
- **AND** 错误消息应包含 "无法访问系统安全存储，请检查钥匙串权限设置或重新启动应用"
- **AND** 加密操作不应执行

#### Scenario: Web 环境 Keyring 异常时加密失败

- **WHEN** `isTauri()` 返回 `false`
- **AND** `getPassword()` 抛出异常（IndexedDB 不可用）
- **AND** 调用 `initializeMasterKey()`
- **THEN** 系统应抛出错误
- **AND** 错误消息应包含 "无法访问浏览器安全存储或密钥解密失败"
- **AND** 加密操作不应执行

### Requirement: 测试隔离与 Mock 配置

系统 MUST 确保集成测试使用 Mock 隔离外部依赖，每个测试用例独立执行。

#### Scenario: Mock Keyring 函数

- **WHEN** 运行集成测试
- **THEN** `@/utils/tauriCompat` 的 `getPassword`、`setPassword`、`isTauri` 应被 Mock
- **AND** Mock 不应调用真实 Keyring 系统
- **AND** Mock 应支持配置返回值（成功、失败、异常）

#### Scenario: 每个测试用例独立执行

- **WHEN** 运行测试套件
- **THEN** 每个测试用例前后应重置 Mock 状态（`beforeEach`、`afterEach`）
- **AND** 测试用例之间不应共享状态
- **AND** 测试顺序不影响结果

#### Scenario: Mock 支持不同场景

- **WHEN** 测试需要模拟密钥存在场景
- **THEN** Mock `getPassword` 应返回有效密钥字符串
- **WHEN** 测试需要模拟密钥不存在场景
- **THEN** Mock `getPassword` 应返回 `null`
- **WHEN** 测试需要模拟 Keyring 异常场景
- **THEN** Mock `getPassword` 应抛出异常

### Requirement: 集成测试覆盖率

系统 MUST 确保集成测试覆盖所有关键集成场景，达到测试目标。

#### Scenario: 所有主要集成场景有测试用例

- **WHEN** 运行集成测试套件
- **THEN** 以下场景应有对应测试用例：
  - 生成密钥 → 加密 → 解密
  - 初始化密钥 → 加密 → 解密
  - 密钥重新生成 → 旧数据解密失败
  - 密钥导出 → 加密/解密
  - Tauri/Web 环境差异

#### Scenario: 错误场景有测试用例

- **WHEN** 运行集成测试套件
- **THEN** 以下错误场景应有对应测试用例：
  - 密钥重新生成后解密失败
  - Keyring 异常时初始化失败
  - 密钥不存在时导出失败
- **AND** 错误消息应被验证

#### Scenario: 测试可独立运行

- **WHEN** 运行单个集成测试文件
- **THEN** 测试应成功（不依赖其他测试文件）
- **AND** 测试应快速完成（< 5 秒）
