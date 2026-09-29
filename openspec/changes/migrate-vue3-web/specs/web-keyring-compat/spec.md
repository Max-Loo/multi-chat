# Spec Delta

## ADDED Requirements

### Requirement: 密钥存储统一入口

系统 SHALL 提供密钥存储 API，以受约束的 `keyring` 实例形式从统一入口导出，在浏览器环境中基于 IndexedDB + AES-256-GCM 实现，作为应用唯一的密钥存储方案。

#### Scenario: 浏览器环境使用 IndexedDB 实现
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用 `keyring.setPassword()`、`keyring.getPassword()`、`keyring.deletePassword()`
- **THEN** 系统使用 IndexedDB 实现加密存储
- **AND** 不抛出运行时错误

#### Scenario: API 稳定性
- **WHEN** 使用 `keyring` 实例的 Keyring API
- **THEN** 函数签名与迁移前的兼容层 API 保持一致
- **AND** 既有的调用方代码无需修改即可继续使用

#### Scenario: 通过统一入口访问
- **WHEN** 开发者从密钥存储模块的统一入口导入 keyring 相关 API
- **THEN** 系统 SHALL 提供 `KeyringPublicAPI` 类型的 `keyring` 实例
- **AND** 不导出独立的 `setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState` 函数

### Requirement: 密钥存储可用性检测

密钥存储层 SHALL 提供 `isSupported()` 方法，让调用者判断 Keyring 功能在当前浏览器中是否可用。

#### Scenario: 浏览器能力齐全时 Keyring 可用
- **GIVEN** 应用运行在支持 IndexedDB 和 Web Crypto API 的浏览器中
- **WHEN** 调用密钥存储层的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示功能可用（使用 IndexedDB + 加密）

#### Scenario: 浏览器能力缺失时 Keyring 不可用
- **GIVEN** 应用运行在不支持 IndexedDB 或 Web Crypto API 的浏览器中
- **WHEN** 调用密钥存储层的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示 Keyring 功能不可用

## MODIFIED Requirements

### Requirement: 主密钥存储支持

系统 SHALL 特别支持主密钥的安全存储，这是密钥存储层的主要用例。

#### Scenario: 首次启动初始化主密钥（完整流程）
- **GIVEN** 应用首次在浏览器环境中启动
- **WHEN** 应用初始化主密钥存储
- **THEN** 系统 SHALL 按以下顺序执行：
  1. 生成 256-bit 随机种子并存储到 `localStorage`（存储键：`multi-chat-keyring-seed`）
  2. 使用种子作为基础密钥材料，通过 PBKDF2 派生加密密钥
  3. 使用 Web Crypto API 的 `crypto.getRandomValues()` 生成 256-bit 主密钥
  4. 使用派生的加密密钥对主密钥进行 AES-256-GCM 加密（生成随机 IV）
  5. 将加密后的主密钥、IV、时间戳存储到 IndexedDB 的 `keys` 对象存储
  6. 显示安全性提示："密钥以浏览器本地加密方式存储，清除浏览器数据将导致数据无法解密，请妥善保管主密钥备份"

#### Scenario: 存储主密钥（非首次启动）
- **GIVEN** 应用非首次启动，种子和加密密钥已存在
- **WHEN** 调用 `setPassword("com.multichat.app", "master-key", masterKey)`
- **THEN** 系统 SHALL 使用已派生的加密密钥加密主密钥
- **AND** 系统 SHALL 将加密后的主密钥存储到 IndexedDB
- **AND** 主密钥 SHALL 使用最强的加密保护（AES-256-GCM）

#### Scenario: 读取主密钥（每次启动流程）
- **GIVEN** IndexedDB 中已存储加密的主密钥
- **WHEN** 应用启动并调用 `getPassword("com.multichat.app", "master-key")`
- **THEN** 系统 SHALL 按以下顺序执行：
  1. 从 `localStorage` 读取种子（存储键：`multi-chat-keyring-seed`）
  2. 使用种子作为基础密钥材料，通过 PBKDF2 重新派生加密密钥
  3. 从 IndexedDB 的 `keys` 对象存储读取加密的主密钥记录
  4. 使用派生的加密密钥和存储的 IV 对主密钥进行 AES-256-GCM 解密
  5. 返回解密后的主密钥明文
- **AND** 应用 SHALL 使用主密钥进行数据加密/解密操作

#### Scenario: 主密钥不存在
- **GIVEN** 应用首次启动或主密钥已删除
- **WHEN** 调用 `getPassword("com.multichat.app", "master-key")`
- **THEN** 系统 SHALL 返回 `null`
- **AND** 应用 SHALL 生成新的主密钥并存储

### Requirement: 安全性考虑

系统 SHALL 确保密钥存储满足浏览器环境下的安全性要求，并明确其安全边界。

#### Scenario: 加密强度
- **WHEN** 使用 AES-256-GCM 加密算法
- **THEN** 系统 SHALL 使用 256 位密钥
- **AND** 每次加密使用唯一的 IV（初始化向量）
- **AND** IV 长度为 12 字节（GCM 推荐）

#### Scenario: 密钥派生安全性
- **WHEN** 使用 PBKDF2 派生密钥
- **THEN** 系统 SHALL 使用高迭代次数（100,000+）增加暴力破解难度
- **AND** 使用存储在 `localStorage` 中的种子作为盐值
- **AND** 结果密钥长度为 256 位
- **AND** 密钥派生不依赖 `navigator.userAgent` 或其他易变的浏览器属性

#### Scenario: 种子明文存储的安全性权衡
- **GIVEN** 浏览器环境无法使用操作系统级安全存储
- **WHEN** 设计加密密钥的持久化方案
- **THEN** 系统 SHALL 采用"种子明文存储 + PBKDF2 派生"的方案
- **AND** 安全性分析：
  - **攻击向量**: 攻击者需要同时获取 `localStorage`（种子）+ IndexedDB（加密主密钥）
  - **保护层**: PBKDF2 100,000 次迭代增加暴力破解难度
  - **安全级别**: ⚠️ 无法防御拥有本机完整访问权的攻击者，但可防御部分数据泄露场景，高于完全不加密
  - **稳定性**: 不依赖 `navigator.userAgent`，跨浏览器版本数据可访问
- **AND** 这是浏览器环境下安全性、可用性和稳定性的合理权衡

#### Scenario: 安全性警告
- **WHEN** 用户首次使用密钥存储功能
- **THEN** 系统 SHALL 显示安全性提示
- **AND** 提示内容包含："密钥以浏览器本地加密方式存储，清除浏览器数据将导致数据无法解密，建议定期导出备份主密钥"
- **AND** 用户可以选择"不再提示"

### Requirement: Web Keyring 内部实现使用共享模块

密钥存储的内部实现 SHALL 从共享模块导入 `initIndexedDB`、`encrypt`、`decrypt`、`PasswordRecord`、`isTestEnvironment`、`getPBKDF2Iterations` 及 PBKDF2 常量，而非在本地定义这些函数和常量。

#### Scenario: keyring 功能不变
- **WHEN** 通过密钥存储层进行密钥的 set/get/delete 操作
- **THEN** 行为与迁移前完全一致，加密数据格式不变，可正确读写已有数据

#### Scenario: 公开 API 不变
- **WHEN** 上层代码通过密钥存储模块的统一入口导入 keyring 相关 API
- **THEN** 所有导出的函数签名和类型保持不变

### Requirement: 模块化设计

密钥存储层 SHALL 遵循项目的模块化设计原则。

#### Scenario: 文件组织
- **WHEN** 实现密钥存储层
- **THEN** 系统 SHALL 在独立的 Web 工具模块中创建 keyring 模块（具体位置见 design.md）
- **AND** 模块仅负责密钥存储逻辑
- **AND** 在该模块的统一入口中导出 keyring API

#### Scenario: 类型定义
- **WHEN** 定义密钥存储类型
- **THEN** 系统 SHALL 在项目内自有的类型定义中声明 API 签名（不依赖已移除的 `tauri-plugin-keyring-api` 包）
- **AND** 提供完整的 TypeScript 类型提示

## REMOVED Requirements

### Requirement: Keyring 插件兼容层

**Reason**: 该需求定义为"Tauri 与 Web 环境均可用"的双分支 API，其场景（"Tauri 环境使用原生实现"等）以 Tauri 运行时存在为前提；Tauri 运行时移除后双分支定义失效。
**Migration**: 由本增量的 ADDED 需求"密钥存储统一入口"承接：IndexedDB + AES-256-GCM 成为唯一实现，API 签名与导出面保持不变。

### Requirement: 功能可用性标记

**Reason**: 该需求的场景集围绕"Tauri 环境 Keyring 可用"与 Web 环境的对比展开，Tauri 分支删除后场景定义失效。
**Migration**: 由本增量的 ADDED 需求"密钥存储可用性检测"承接，仅依据浏览器能力（IndexedDB、Web Crypto API）判断可用性。
