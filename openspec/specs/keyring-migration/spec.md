# Spec: Keyring Migration

本规范定义了 Keyring V1 → V2 数据迁移的能力要求。

## Purpose

为 Web 环境的 Keyring 提供 V1 → V2 数据迁移能力，确保用户在密钥派生方式变更后能够无缝使用应用。

## Requirements

### Requirement: 版本标记管理

系统 SHALL 使用 `localStorage` 管理数据格式版本。

#### Scenario: 版本标记存储
- **WHEN** 数据格式版本需要记录
- **THEN** 系统 SHALL 在 `localStorage` 中存储键值对
  - 键：`keyring-data-version`
  - 值：版本号字符串（如 `"2"`）

#### Scenario: 版本检查
- **WHEN** 应用启动时
- **THEN** 系统 SHALL 从 `localStorage` 读取 `keyring-data-version`
- **AND** 如果值为 `"2"`，跳过迁移
- **AND** 如果值不存在或为其他值，执行迁移检查

### Requirement: V1 → V2 迁移逻辑

系统 SHALL 提供静默的 V1 → V2 数据迁移能力。

#### Scenario: 迁移步骤执行顺序
- **GIVEN** 应用在 Web 环境启动
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

#### Scenario: Tauri 环境跳过迁移
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 迁移步骤执行
- **THEN** 系统 SHALL 跳过所有迁移逻辑
- **AND** 使用系统钥匙串的原生实现

### Requirement: 迁移集成到初始化流程

系统 SHALL 将迁移逻辑集成到应用初始化流程中。

#### Scenario: 初始化步骤配置
- **WHEN** 定义 `initSteps` 配置
- **THEN** 系统 SHALL 包含 `keyringMigration` 步骤
- **AND** 该步骤属性：
  - 名称：`keyringMigration`
  - 严重程度：非关键（`critical: false`）
  - 无依赖
  - 执行顺序：在 `i18n` 步骤之前（作为第一个步骤）
- **AND** `masterKey` 步骤 SHALL 依赖 `keyringMigration`

#### Scenario: 迁移步骤执行
- **WHEN** `keyringMigration` 步骤执行
- **THEN** 系统 SHALL 返回迁移结果
- **AND** 结果格式：
  ```typescript
  {
    migrated: boolean,  // 是否执行了迁移
    reset: boolean      // 是否重置了数据
  }
  ```
- **AND** 结果存储在 `ExecutionContext` 中供后续步骤使用

### Requirement: V1 密钥派生（仅用于迁移）

系统 SHALL 保留 V1 密钥派生逻辑，仅用于数据迁移。

#### Scenario: V1 密钥派生实现
- **WHEN** 执行 V1 → V2 迁移
- **THEN** 系统 SHALL 使用 V1 密钥派生方式：
  - 基础密钥材料：`navigator.userAgent + seed`
  - 盐值（salt）：种子本身
  - 迭代次数：100,000 次（测试环境 1,000 次）
  - 哈希算法：SHA-256
  - 输出密钥长度：256 bits

#### Scenario: 迁移代码清理计划
- **GIVEN** V1 密钥派生代码仅用于迁移
- **WHEN** 大多数用户已完成迁移
- **THEN** 系统 SHALL 移除 V1 密钥派生代码
- **AND** 代码中 SHALL 包含清理计划注释

### Requirement: 迁移幂等性

迁移操作 SHALL 是幂等的，可安全重复执行。

#### Scenario: 重复执行迁移
- **GIVEN** `keyring-data-version` 已为 `"2"`
- **WHEN** 迁移步骤再次执行
- **THEN** 系统 SHALL 检测到版本已是 `"2"`
- **AND** 跳过所有迁移逻辑
- **AND** 返回 `{ migrated: false, reset: false }`

#### Scenario: 并发迁移
- **GIVEN** 多个浏览器标签页同时启动
- **WHEN** 多个迁移操作同时执行
- **THEN** 系统 SHALL 依赖 IndexedDB 事务处理并发
- **AND** 迁移结果一致
