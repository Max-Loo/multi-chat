# Keyring 单元测试规范

本规范定义了 keyring 兼容层模块的单元测试要求，确保在 Tauri 和 Web 环境中的正确性和稳定性。

## Purpose

为 `src/utils/tauriCompat/keyring.ts` 模块提供完整的单元测试覆盖，验证跨环境安全存储功能的行为正确性，包括加密/解密、密钥派生、错误处理等核心逻辑。

## Requirements

### Requirement: 测试基础设施配置

测试套件 SHALL 使用 Vitest + happy-dom 框架，配置与项目现有测试模式保持一致。

#### Scenario: 使用 Vitest 和 happy-dom
- **GIVEN** 项目已配置 Vitest 和 happy-dom
- **WHEN** 创建 keyring 模块的测试文件
- **THEN** 测试文件 SHALL 导入 Vitest 的 describe、it、expect、vi、beforeEach、afterEach
- **AND** 测试环境 SHALL 使用 happy-dom 模拟浏览器环境
- **AND** 测试文件 SHALL 位于 `src/__test__/utils/tauriCompat/keyring.test.ts`

#### Scenario: Mock 浏览器全局 API
- **GIVEN** 使用 happy-dom 环境
- **WHEN** 测试需要使用 localStorage、crypto.subtle、indexedDB 等浏览器 API
- **THEN** 测试 SHALL 使用 vi.mock 或 vi.spyOn 模拟这些 API
- **AND** 测试 SHALL 在 beforeEach 中清理 mock 状态
- **AND** 测试 SHALL 在 afterEach 中恢复原始实现

### Requirement: Tauri 环境 Mock 策略

在 Tauri 环境测试中，系统 SHALL Mock `tauri-plugin-keyring-api` 的原生 API，隔离测试 keyring 兼容层逻辑。

#### Scenario: Mock Tauri Keyring API
- **GIVEN** 测试 Tauri 环境的 keyring 行为
- **WHEN** Mock `@tauri-plugin-keyring-api` 模块
- **THEN** 测试 SHALL 使用 vi.mock 替换整个模块
- **AND** Mock SHALL 提供 getPassword、setPassword、deletePassword 的模拟实现
- **AND** 测试 SHALL 能够配置 mock 返回值（resolve/reject）

#### Scenario: 模拟 Tauri 环境检测
- **GIVEN** keyring 模块需要检测运行环境
- **WHEN** 测试 Tauri 环境特定行为
- **THEN** 测试 SHALL Mock `@/utils/tauriCompat/env` 的 isTauri 函数
- **AND** 测试 SHALL 配置 isTauri 返回 true
- **AND** keyringCompat SHALL 使用 TauriKeyringCompat 实例

#### Scenario: 验证 Tauri API 调用
- **GIVEN** Mock 了 Tauri Keyring API
- **WHEN** 调用 keyring 的 setPassword、getPassword、deletePassword 方法
- **THEN** 测试 SHALL 验证调用了对应的 Tauri API
- **AND** 测试 SHALL 验证传递的参数（service、user、password）
- **AND** 测试 SHALL 验证调用次数和顺序

### Requirement: Web 环境 Mock 策略

在 Web 环境测试中，系统 SHALL Mock Web Crypto API 和 IndexedDB，隔离测试加密/解密和存储逻辑。

#### Scenario: Mock Web Crypto API
- **GIVEN** 测试 Web 环境的加密行为
- **WHEN** 测试需要使用 crypto.getRandomValues、crypto.subtle.encrypt/decrypt
- **THEN** 测试 SHALL 使用 vi.spyOn 模拟 crypto API
- **AND** 测试 SHALL 配置 mock 返回预定义的加密结果
- **OR** 测试 SHALL 使用真实的 crypto API 进行集成测试（如果环境支持）

#### Scenario: Mock IndexedDB
- **GIVEN** 测试 Web 环境的 IndexedDB 存储
- **WHEN** 测试需要操作 IndexedDB 数据库
- **THEN** 测试 SHALL 使用 fake-indexed-db 或 happy-dom 提供的 IndexedDB mock
- **AND** 测试 SHALL 验证 IndexedDB 的事务、对象存储操作
- **AND** 测试 SHALL 在每个测试后清理数据库状态

#### Scenario: Mock localStorage for seed storage
- **GIVEN** Web 环境需要从 localStorage 读取种子
- **WHEN** 测试涉及种子生成或读取
- **THEN** 测试 SHALL 使用 vi.stubGlobal 或直接操作 localStorage
- **AND** 测试 SHALL 在 beforeEach 中清理 localStorage
- **AND** 测试 SHALL 验证存储的种子格式（base64 字符串）

### Requirement: 加密和解密功能测试

系统 SHALL 测试 Web 环境的 AES-256-GCM 加密和解密逻辑的正确性。

#### Scenario: 测试密码加密存储
- **GIVEN** Web 环境和已初始化的加密密钥
- **WHEN** 调用 setPassword(service, user, password)
- **THEN** 系统 SHALL 使用 AES-256-GCM 算法加密密码
- **AND** 密文 SHALL 与原始密码不同
- **AND** 加密 SHALL 生成唯一的 IV（初始化向量）
- **AND** 密文和 IV SHALL 正确存储到 IndexedDB

#### Scenario: 测试密码解密读取
- **GIVEN** IndexedDB 中存储了加密的密码记录
- **WHEN** 调用 getPassword(service, user)
- **THEN** 系统 SHALL 从 IndexedDB 读取密文和 IV
- **AND** 系统 SHALL 使用相同的密钥解密密文
- **AND** 解密后的密码 SHALL 与原始密码完全一致
- **AND** 如果记录不存在，返回 null

#### Scenario: 测试加密密钥派生
- **GIVEN** Web 环境和 localStorage 中的种子
- **WHEN** WebKeyringCompat 初始化
- **THEN** 系统 SHALL 使用 PBKDF2 算法派生加密密钥
- **AND** 派生参数 SHALL 使用种子作为 salt
- **AND** 迭代次数 SHALL 为 100,000 次
- **AND** 哈希算法 SHALL 为 SHA-256
- **AND** 输出密钥长度 SHALL 为 256 bits

### Requirement: 密钥生命周期测试

系统 SHALL 测试密钥的创建、读取、更新、删除等生命周期操作。

#### Scenario: 测试密钥不存在
- **GIVEN** Keyring 中不存在指定的 (service, user) 密钥
- **WHEN** 调用 getPassword(service, user)
- **THEN** 系统 SHALL 返回 null
- **AND** 不抛出异常

#### Scenario: 测试密钥创建和读取
- **GIVEN** Keyring 中不存在指定的 (service, user) 密钥
- **WHEN** 调用 setPassword(service, user, password) 存储
- **AND** 随后调用 getPassword(service, user) 读取
- **THEN** 读取的密码 SHALL 与存储的密码一致

#### Scenario: 测试密钥更新
- **GIVEN** Keyring 中已存在 (service, user) 的密钥
- **WHEN** 调用 setPassword(service, user, newPassword) 更新
- **AND** 随后调用 getPassword(service, user) 读取
- **THEN** 读取的密码 SHALL 为新密码，而非旧密码

#### Scenario: 测试密钥删除
- **GIVEN** Keyring 中存在 (service, user) 的密钥
- **WHEN** 调用 deletePassword(service, user) 删除
- **AND** 随后调用 getPassword(service, user) 读取
- **THEN** 系统 SHALL 返回 null

### Requirement: 错误处理测试

系统 SHALL 测试各种错误场景，确保系统在异常情况下优雅降级。

#### Scenario: 测试加密失败
- **GIVEN** Web 环境和加密密钥已初始化
- **WHEN** 加密操作失败（如 crypto.subtle.encrypt 抛出异常）
- **THEN** 系统 SHALL 捕获异常
- **AND** 系统 SHALL 抛出友好的错误消息"密码加密或存储失败"
- **AND** 系统 SHALL 包含原始错误作为 cause

#### Scenario: 测试解密失败
- **GIVEN** IndexedDB 中存储的密文已损坏或被篡改
- **WHEN** 调用 getPassword(service, user) 尝试解密
- **THEN** 系统 SHALL 捕获解密异常
- **AND** 系统 SHALL 抛出错误"密码读取或解密失败"
- **AND** 系统 SHALL 记录错误日志到 console.error

#### Scenario: 测试 IndexedDB 不可用
- **GIVEN** 浏览器不支持 IndexedDB 或 IndexedDB 初始化失败
- **WHEN** 尝试初始化 WebKeyringCompat
- **THEN** 系统 SHALL 抛出错误"浏览器不支持安全存储或初始化失败"
- **AND** 系统 SHALL 使用 Error.cause 传递原始错误

#### Scenario: 测试 Tauri API 错误
- **GIVEN** Tauri 环境
- **WHEN** Tauri Keyring API 抛出异常（如系统钥匙串访问失败）
- **THEN** TauriKeyringCompat SHALL 向上传播异常
- **AND** 测试 SHALL 验证异常被正确抛出

### Requirement: 跨环境兼容性测试

系统 SHALL 测试 Tauri 和 Web 环境的 API 一致性。

#### Scenario: 测试 API 签名一致性
- **GIVEN** Tauri 和 Web 两种环境
- **WHEN** 比较两个环境的 keyring API
- **THEN** 两种环境 SHALL 提供相同的接口（setPassword、getPassword、deletePassword、isSupported）
- **AND** 函数签名 SHALL 一致

#### Scenario: 测试行为一致性
- **GIVEN** Tauri 和 Web 两种环境
- **WHEN** 执行相同的密钥操作（存储、读取、删除）
- **THEN** 两种环境的返回值类型 SHALL 一致
- **AND** 错误处理行为 SHALL 一致（抛出异常 vs 返回 null）

#### Scenario: 测试 isSupported 方法
- **GIVEN** Tauri 环境
- **WHEN** 调用 isSupported()
- **THEN** 系统 SHALL 返回 true

- **GIVEN** Web 环境且支持 IndexedDB 和 Web Crypto API
- **WHEN** 调用 isSupported()
- **THEN** 系统 SHALL 返回 true

- **GIVEN** Web 环境但不支持 IndexedDB 或 Web Crypto API
- **WHEN** 调用 isSupported()
- **THEN** 系统 SHALL 返回 false

### Requirement: 测试覆盖率要求

测试套件 SHALL 达到足够的覆盖率，确保核心逻辑经过验证。

#### Scenario: 核心逻辑覆盖率
- **GIVEN** keyring 模块的核心功能
- **WHEN** 运行测试套件并生成覆盖率报告
- **THEN** 核心逻辑的覆盖率 SHALL ≥80%
- **AND** 覆盖的核心逻辑包括：
  - 加密/解密函数（encrypt、decrypt）
  - 密钥派生函数（deriveEncryptionKey）
  - 密钥管理函数（setPassword、getPassword、deletePassword）
  - 错误处理逻辑

#### Scenario: 边界条件覆盖
- **GIVEN** 各种边界条件
- **WHEN** 运行测试套件
- **THEN** 测试 SHALL 覆盖以下边界条件：
  - 空字符串密码
  - 非常长的密码（1000+ 字符）
  - 特殊字符密码
  - 并发存储多个密钥
  - 种子丢失或损坏

#### Scenario: 错误路径覆盖
- **GIVEN** 各种错误场景
- **WHEN** 运行测试套件
- **THEN** 测试 SHALL 覆盖所有错误路径：
  - 加密失败
  - 解密失败
  - IndexedDB 操作失败
  - Tauri API 失败
  - 密钥未初始化

### Requirement: 测试组织结构

测试文件 SHALL 遵循项目的测试组织模式，确保可读性和可维护性。

#### Scenario: 使用 describe 嵌套结构
- **GIVEN** keyring 模块的多个测试场景
- **WHEN** 组织测试文件
- **THEN** 测试 SHALL 使用 describe 嵌套结构组织
- **AND** 顶层 describe SHALL 按功能分组（如"Tauri 环境"、"Web 环境"、"加密解密"）
- **AND** 内层 describe SHALL 按场景分组（如"存储密钥"、"读取密钥"、"错误处理"）

#### Scenario: 使用清晰的测试命名
- **GIVEN** 测试用例
- **WHEN** 编写测试描述
- **THEN** 测试描述 SHALL 使用"应该...当..."的中文格式
- **AND** 测试描述 SHALL 清晰表达测试意图和条件

#### Scenario: 使用 beforeEach 和 afterEach
- **GIVEN** 多个相关的测试用例
- **WHEN** 组织测试
- **THEN** 测试 SHALL 在 beforeEach 中初始化共享状态
- **AND** 测试 SHALL 在 afterEach 中清理副作用
- **AND** 确保测试之间的隔离性
