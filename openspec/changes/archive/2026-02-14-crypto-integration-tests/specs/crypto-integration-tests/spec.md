# Spec: crypto-integration-tests

**Capability**: crypto-integration-tests

**Version**: 1.0.0

**Summary**：为 `src/utils/crypto.ts` 添加完整的集成测试覆盖，包括端到端加密存储流程、密钥轮换后的数据访问验证、批量操作的容错机制验证、安全性和边界条件测试。

## ADDED Requirements

### Requirement: 端到端加密存储流程

系统 SHALL 提供集成测试验证完整的加密存储流程，从初始化主密钥到加密模型数据，再到存储和加载。

#### Scenario: 保存模型时自动加密敏感字段

- **WHEN** 用户初始化主密钥（`initializeMasterKey()`）并保存模型列表（`saveModelsToJson()`）
- **THEN** 系统应生成新的 256-bit 主密钥并存储
- **AND** 系统应加密每个模型的 `apiKey` 字段（如果未加密）
- **AND** 系统应调用 `encryptField()` 传入原始 `apiKey` 和主密钥
- **AND** 系统应成功存储加密后的模型列表到 Store

#### Scenario: 加载模型时自动解密敏感字段

- **WHEN** 用户加载模型列表（`loadModelsFromJson()`）且主密钥存在
- **THEN** 系统应从 Store 读取模型列表
- **AND** 系统应解密每个模型的 `apiKey` 字段（如果已加密）
- **AND** 系统应调用 `decryptField()` 传入加密的 `apiKey` 和主密钥
- **AND** 系统应返回解密后的模型列表

#### Scenario: 往返加密解密无数据损失

- **WHEN** 用户保存模型列表并立即加载
- **THEN** 加载的 `apiKey` 应与原始 `apiKey` 完全一致
- **AND** 所有非敏感字段（`nickname`, `modelName`, `apiAddress`, `remark`）应保持不变

#### Scenario: 批量处理多个模型

- **WHEN** 用户保存包含多个模型的列表
- **THEN** 系统应并发加密所有敏感字段（`Promise.all`）
- **AND** 每个模型的加密密钥应不同（因为 nonce 随机）
- **AND** 加密操作应在合理时间内完成（100 个模型 < 1 秒）

### Requirement: 部分解密失败场景

系统 SHALL 优雅地处理部分数据解密失败的场景。

#### Scenario: 部分模型使用旧密钥加密

- **GIVEN** 已存储的模型列表中，部分模型的 `apiKey` 使用旧密钥加密，部分使用当前密钥
- **WHEN** 用户加载模型列表
- **THEN** 系统应成功解密使用当前密钥加密的模型
- **AND** 系统应对解密失败的模型设置 `apiKey` 为空字符串
- **AND** 系统应记录错误日志到 `console.error`
- **AND** 系统应返回包含成功和失败模型的完整列表

#### Scenario: 解密失败不应中断批量操作

- **GIVEN** 模型列表包含 10 个模型，其中 2 个使用旧密钥加密
- **WHEN** 用户加载模型列表
- **THEN** 系统应成功解密 8 个模型
- **AND** 系统应将 2 个解密失败的模型的 `apiKey` 设置为空字符串
- **AND** 系统应抛出异常仅当所有模型都解密失败

### Requirement: 主密钥丢失后的数据访问

系统 SHALL 在主密钥不存在时提供降级处理，避免应用崩溃。

#### Scenario: 主密钥不存在时加载模型

- **GIVEN** 已存储的模型列表中包含加密的 `apiKey`
- **WHEN** 用户加载模型列表但主密钥不存在
- **THEN** 系统应检测到主密钥不存在（`getMasterKey()` 返回 `null`）
- **AND** 系统应返回模型列表，其中加密的 `apiKey` 被替换为空字符串
- **AND** 系统应保留未加密的 `apiKey`（如果有）
- **AND** 系统应输出警告日志到 `console.warn`

#### Scenario: 未加密的 apiKey 保持不变

- **GIVEN** 模型的 `apiKey` 未加密（不以 `enc:` 开头）
- **WHEN** 主密钥不存在且用户加载模型列表
- **THEN** 系统应返回原始 `apiKey`（不修改为空字符串）
- **AND** 系统应正常使用该 `apiKey`（如果用户已手动配置）

### Requirement: 并发加密场景的密文唯一性

系统 SHALL 确保高并发场景下加密相同明文产生不同的密文。

#### Scenario: 并发加密 1000 个相同明文

- **GIVEN** 主密钥已初始化
- **WHEN** 系统并发加密 1000 个相同的明文（如 `test-api-key`）
- **THEN** 所有 1000 个密文应互不相同
- **AND** 所有 1000 个密文应能成功解密为原始明文
- **AND** 并发操作应在合理时间内完成（1000 次 < 5 秒）

### Requirement: 混合数据完整性

系统 SHALL 正确处理包含加密和未加密数据的混合列表。

#### Scenario: 保存混合加密状态的模型

- **GIVEN** 模型列表包含：
  - 模型 A：`apiKey` 未加密（`sk-plain`）
  - 模型 B：`apiKey` 已加密（`enc:SGVsbG8=`）
  - 模型 C：`apiKey` 为空字符串
  - 模型 D：`apiKey` 为 `undefined`
- **WHEN** 用户保存模型列表
- **THEN** 系统应仅加密模型 A 的 `apiKey`
- **AND** 系统应保留模型 B 的已加密 `apiKey`（不重复加密）
- **AND** 系统应保留模型 C 和 D 的空/undefined 值

#### Scenario: 加载混合加密状态的模型

- **GIVEN** 已存储的模型列表包含加密和未加密的 `apiKey`
- **WHEN** 用户加载模型列表
- **THEN** 系统应解密加密的 `apiKey`
- **AND** 系统应保留未加密的 `apiKey`（不变）
- **AND** 系统应返回所有模型，无论 `apiKey` 加密状态
