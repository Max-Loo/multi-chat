## ADDED Requirements

### Requirement: 密钥生成函数测试
系统 MUST 测试 `generateMasterKey()` 函数生成符合规范的 256-bit 随机密钥。

#### Scenario: 生成正确长度的密钥
- **WHEN** 调用 `generateMasterKey()` 函数
- **THEN** 返回的密钥字符串长度为 64 个字符（32 字节 × 2 hex 字符）

#### Scenario: 密钥格式为有效十六进制
- **WHEN** 调用 `generateMasterKey()` 函数
- **THEN** 返回的密钥字符串仅包含 0-9 和 a-f 字符

#### Scenario: 多次生成密钥产生不同结果
- **WHEN** 连续调用 `generateMasterKey()` 函数 100 次
- **THEN** 每次生成的密钥字符串至少有 99 次互不相同（概率验证）

### Requirement: 密钥存在性检查测试
系统 MUST 测试 `isMasterKeyExists()` 函数正确检测密钥是否已存储。

#### Scenario: 密钥已存在时返回 true
- **WHEN** Keyring 中已存储有效密钥
- **THEN** `isMasterKeyExists()` 返回 `true`

#### Scenario: 密钥不存在时返回 false
- **WHEN** Keyring 中未存储密钥（返回 null）
- **THEN** `isMasterKeyExists()` 返回 `false`

#### Scenario: Keyring 异常时返回 false
- **WHEN** `getPassword()` 抛出异常
- **THEN** `isMasterKeyExists()` 返回 `false`

### Requirement: 获取主密钥测试
系统 MUST 测试 `getMasterKey()` 函数正确从 Keyring 获取密钥并处理异常。

#### Scenario: 成功获取已存储的密钥
- **WHEN** Keyring 中已存储密钥
- **THEN** `getMasterKey()` 返回密钥字符串

#### Scenario: 密钥不存在时返回 null
- **WHEN** Keyring 中未存储密钥（返回 null）
- **THEN** `getMasterKey()` 返回 `null`

#### Scenario: Web 环境 Keyring 异常时抛出错误
- **WHEN** `isTauri()` 返回 `false` 且 `getPassword()` 抛出异常
- **THEN** `getMasterKey()` 抛出错误，消息包含 "无法访问浏览器安全存储或密钥解密失败"

#### Scenario: Tauri 环境 Keyring 异常时抛出错误
- **WHEN** `isTauri()` 特返回 `true` 且 `getPassword()` 抛出异常
- **THEN** `getMasterKey()` 抛出错误，消息包含 "无法访问系统安全存储"

### Requirement: 存储主密钥测试
系统 MUST 测试 `storeMasterKey()` 函数正确将密钥存储到 Keyring 并处理异常。

#### Scenario: 成功存储密钥到 Keyring
- **WHEN** 调用 `storeMasterKey()` 并传入有效密钥字符串
- **THEN** `setPassword()` 被调用一次，参数包含服务名、账户名和密钥

#### Scenario: Web 环境 Keyring 异常时抛出错误
- **WHEN** `isTauri()` 返回 `false` 且 `setPassword()` 抛出异常
- **THEN** `storeMasterKey()` 抛出错误，消息包含 "无法将密钥存储到浏览器安全存储"

#### Scenario: Tauri 环境 Keyring 异常时抛出错误
- **WHEN** `isTauri()` 返回 `true` 且 `setPassword()` 抛出异常
- **THEN** `storeMasterKey()` 抛出错误，消息包含 "无法将密钥存储到系统安全存储"

### Requirement: 主密钥初始化测试
系统 MUST 测试 `initializeMasterKey()` 函数在首次启动和已有密钥场景下的行为。

#### Scenario: 密钥已存在时返回现有密钥
- **WHEN** Keyring 中已存储密钥
- **THEN** `initializeMasterKey()` 返回现有密钥，不生成新密钥

#### Scenario: 密钥不存在时生成并存储新密钥
- **WHEN** Keyring 中未存储密钥
- **THEN** `initializeMasterKey()` 生成新密钥并存储到 Keyring，返回新密钥

#### Scenario: Web 环境生成新密钥时输出警告日志
- **WHEN** `isTauri()` 返回 `false` 且密钥不存在
- **THEN** `console.warn()` 输出包含 "browser secure storage (IndexedDB + encryption)" 的警告

#### Scenario: Tauri 环境生成新密钥时输出警告日志
- **WHEN** `isTauri()` 返回 `true` 且密钥不存在
- **THEN** `console.warn()` 输出包含 "system secure storage" 的警告

### Requirement: 安全性警告处理测试
系统 MUST 测试 `handleSecurityWarning()` 函数在 Tauri 和 Web 环境下的行为差异。

#### Scenario: Tauri 环境直接返回（不显示警告）
- **WHEN** `isTauri()` 返回 `true`
- **THEN** `handleSecurityWarning()` 直接返回，不显示 Toast

#### Scenario: Web 环境且用户已确认时不显示警告
- **WHEN** `isTauri()` 返回 `false` 且 `localStorage.getItem('multi-chat-security-warning-dismissed')` 返回 `'true'`
- **THEN** `handleSecurityWarning()` 直接返回，不显示 Toast

#### Scenario: Web 环境首次使用时显示永久性 Toast
- **WHEN** `isTauri()` 返回 `false` 且 `localStorage.getItem('multi-chat-security-warning-dismissed')` 返回 `null`
- **THEN** `toast.warning()` 被调用，`duration` 为 `Infinity`，包含 "I Understand" 按钮

#### Scenario: 用户点击 Toast 按钮后保存确认状态
- **WHEN** 用户点击 Toast 的 "I Understand" 按钮
- **THEN** `localStorage.setItem('multi-chat-security-warning-dismissed', 'true')` 被调用

### Requirement: 导出主密钥测试
系统 MUST 测试 `exportMasterKey()` 函数正确导出密钥并处理密钥不存在的场景。

#### Scenario: 密钥存在时成功导出
- **WHEN** Keyring 中已存储密钥
- **THEN** `exportMasterKey()` 返回密钥字符串

#### Scenario: 密钥不存在时抛出错误
- **WHEN** Keyring 中未存储密钥（`getMasterKey()` 返回 `null`）
- **THEN** `exportMasterKey()` 抛出错误，消息包含 "主密钥不存在，无法导出"

### Requirement: 测试隔离性
系统 MUST 使用 Mock 隔离外部依赖，确保测试不依赖真实 Keyring 系统。

#### Scenario: Mock Keyring 函数
- **WHEN** 运行单元测试
- **THEN** `@/utils/tauriCompat` 的 `getPassword`、`setPassword`、`isTauri` 函数被 Mock，不调用真实 Keyring

#### Scenario: 每个测试用例独立执行
- **WHEN** 运行测试套件
- **THEN** 每个测试用例前后重置 Mock 状态，互不影响

#### Scenario: Mock 支持不同返回值
- **WHEN** 测试需要模拟 Keyring 返回不同值（成功、失败、异常）
- **THEN** Mock 函数支持配置 `mockResolvedValue`、`mockRejectedValue`、`mockReturnValue`

### Requirement: 测试覆盖率
系统 MUST 确保所有导出函数的测试覆盖率至少达到 90%。

#### Scenario: 所有导出函数都有测试用例
- **WHEN** 运行测试覆盖率检查
- **THEN** `generateMasterKey`、`isMasterKeyExists`、`getMasterKey`、`storeMasterKey`、`initializeMasterKey`、`handleSecurityWarning`、`exportMasterKey` 的覆盖率 ≥ 90%

#### Scenario: 所有代码分支都被测试
- **WHEN** 运行测试覆盖率检查
- **THEN** Tauri/Web 环境分支、成功/失败分支、边界条件都被测试用例覆盖
