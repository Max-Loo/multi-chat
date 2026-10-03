# Spec Delta

## ADDED Requirements

### Requirement: V1 → V2 数据迁移执行

系统 SHALL 提供静默的 V1 → V2 数据迁移能力，对全部用户无条件执行。

#### Scenario: 迁移步骤执行顺序
- **GIVEN** 应用启动
- **WHEN** `keyring-data-version` 不为 `"2"`
- **THEN** 系统 SHALL 按以下顺序执行迁移：
  1. 检查 IndexedDB 中是否存在数据
  2. 如果无数据，直接设置版本为 `"2"`，跳过迁移
  3. 如果有数据，尝试 V1 → V2 迁移
  4. 迁移成功或失败后，都设置版本为 `"2"`

#### Scenario: 成功迁移
- **GIVEN** IndexedDB 中存在 V1 格式的加密数据
- **AND** `navigator.userAgent` 未变化
- **WHEN** 执行 V1 → V2 迁移
- **THEN** 系统 SHALL：
  1. 使用 V1 密钥派生方式（`userAgent + seed`）派生临时密钥
  2. 使用临时密钥解密 IndexedDB 中的所有密码记录
  3. 使用 V2 密钥派生方式（仅 `seed`）派生新密钥
  4. 使用新密钥重新加密所有密码记录
  5. 将重新加密的记录写回 IndexedDB
  6. 设置 `localStorage['keyring-data-version']` 为 `"2"`

#### Scenario: 迁移失败（解密失败）
- **GIVEN** IndexedDB 中存在 V1 格式的加密数据
- **AND** `navigator.userAgent` 已变化，无法解密
- **WHEN** 执行 V1 → V2 迁移
- **THEN** 系统 SHALL：
  1. 检测到解密失败
  2. 清除以下 IndexedDB 数据库中的所有数据：
     - `multi-chat-keyring`（密钥存储）
     - `multi-chat-store`（应用数据存储，使用密钥加密）
  3. 清除 `localStorage['multi-chat-keyring-seed']`
  4. 生成新的种子并存储到 `localStorage`
  5. 设置 `localStorage['keyring-data-version']` 为 `"2"`
- **AND** 后续 `initializeMasterKey` 将生成新的主密钥
- **AND** 应用数据将重新初始化（聊天记录等需要重新创建）

#### Scenario: 迁移失败（IndexedDB 不可用）
- **GIVEN** 浏览器不支持 IndexedDB 或存储不可用
- **WHEN** 执行 V1 → V2 迁移
- **THEN** 系统 SHALL 静默失败
- **AND** 不阻止应用启动
- **AND** 后续 Keyring 操作将正常处理错误

## REMOVED Requirements

### Requirement: V1 → V2 迁移逻辑
**Reason**: 原需求包含"Tauri 环境跳过迁移"分支场景；Tauri 桌面运行时移除后不存在可跳过迁移的平台，迁移对全部用户无条件执行。
**Migration**: 由本文件 ADDED 的"V1 → V2 数据迁移执行"需求取代，迁移算法与成功/失败行为完全不变，仅移除平台分支场景。
