# Spec Delta

## ADDED Requirements

### Requirement: 键值存储统一入口

系统 SHALL 提供键值存储 API，从统一入口导出，在浏览器环境中基于 IndexedDB 实现数据持久化，作为应用本地数据持久化的统一方案。

#### Scenario: 浏览器环境使用 IndexedDB 实现
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用 Store API（如 `Store.get()`、`Store.set()`、`Store.save()`）
- **THEN** 系统使用 IndexedDB 实现数据持久化
- **AND** 不抛出运行时错误

#### Scenario: API 稳定性
- **WHEN** 使用 Store API
- **THEN** 函数签名与迁移前的兼容层 API 保持一致
- **AND** 既有的调用方代码无需修改即可继续使用

### Requirement: 存储层可用性检测

存储层 SHALL 提供 `isSupported()` 方法，让调用者判断 Store 功能在当前浏览器中是否可用。

#### Scenario: 浏览器支持 IndexedDB 时可用
- **GIVEN** 应用运行在支持 IndexedDB 的浏览器中
- **WHEN** 调用存储层的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示功能可用（使用 IndexedDB）

#### Scenario: 浏览器不支持 IndexedDB 时不可用
- **GIVEN** 应用运行在不支持 IndexedDB 的浏览器中（如隐私模式或旧版浏览器）
- **WHEN** 调用存储层的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示 Store 功能不可用

## MODIFIED Requirements

### Requirement: IndexedDB 数据存储

在浏览器环境中，系统 SHALL 使用 IndexedDB 提供键值存储功能，确保数据持久化和性能。

#### Scenario: 创建 IndexedDB 数据库
- **WHEN** 应用首次访问 Store
- **THEN** 系统 SHALL 创建名为 `multi-chat-store` 的 IndexedDB 数据库
- **AND** 创建 `store` 对象存储（Object Store）
- **AND** 使用 `key` 字段作为主键

#### Scenario: 读取键值
- **GIVEN** IndexedDB 数据库已创建
- **WHEN** 调用 `Store.get(key)` 方法
- **THEN** 系统 SHALL 从 IndexedDB 中读取对应键的值
- **AND** 返回值支持所有 JSON 可序列化类型（字符串、对象、数组等）
- **AND** 如果键不存在，返回 `null`

#### Scenario: 写入键值
- **GIVEN** IndexedDB 数据库已创建
- **WHEN** 调用 `Store.set(key, value)` 方法
- **THEN** 系统 SHALL 将键值对写入 IndexedDB
- **AND** 支持的值类型包括：字符串、数字、布尔值、对象、数组
- **AND** 数据在写入后立即可读（同事务内）

#### Scenario: 删除键值
- **GIVEN** IndexedDB 数据库中存在键 `myKey`
- **WHEN** 调用 `Store.delete(key)` 方法
- **THEN** 系统 SHALL 从 IndexedDB 中删除该键
- **AND** 后续读取该键返回 `null`

#### Scenario: 保存持久化
- **GIVEN** IndexedDB 数据库已创建
- **WHEN** 调用 `Store.save()` 方法
- **THEN** 系统 SHALL 确保所有未提交的写入操作完成
- **AND** 该方法为幂等操作（IndexedDB 自动持久化，无需显式落盘）
- **AND** 方法始终返回成功的 Promise

#### Scenario: 列出所有键
- **GIVEN** IndexedDB 数据库中存在多个键
- **WHEN** 调用 `Store.keys()` 方法
- **THEN** 系统 SHALL 返回所有键的数组
- **AND** 返回类型为 `string[]`

### Requirement: 数据类型兼容性

存储层 SHALL 确保所有常用数据类型的序列化和反序列化正确性。

#### Scenario: 对象存储
- **WHEN** 存储复杂对象（如包含嵌套属性的对象）
- **THEN** 系统 SHALL 正确序列化和反序列化对象
- **AND** 对象结构在读写后保持不变

#### Scenario: 数组存储
- **WHEN** 存储数组（如模型列表）
- **THEN** 系统 SHALL 正确序列化和反序列化数组
- **AND** 数组元素顺序和内容保持不变

#### Scenario: 布尔和数字类型
- **WHEN** 存储布尔值或数字
- **THEN** 系统 SHALL 保持数据类型不变
- **AND** 读取时返回原始类型（不转换为字符串）

### Requirement: 错误处理

系统 SHALL 提供健壮的错误处理机制，确保 IndexedDB 访问失败时的优雅降级。

#### Scenario: IndexedDB 不可用
- **GIVEN** 用户的浏览器不支持 IndexedDB（如隐私模式）
- **WHEN** 尝试访问 Store
- **THEN** 系统 SHALL 抛出友好的错误提示
- **AND** 错误消息包含"浏览器不支持 IndexedDB"的说明
- **AND** 应用 SHALL 显示用户友好的错误界面

#### Scenario: 存储配额超限
- **GIVEN** 用户的浏览器存储空间不足
- **WHEN** 尝试写入大量数据
- **THEN** 系统 SHALL 捕获 `QuotaExceededError` 异常
- **AND** 显示错误提示"浏览器存储空间不足，请清理浏览器数据或导出备份后清理应用数据"
- **AND** 应用 SHALL 优雅降级，不崩溃

#### Scenario: 事务失败处理
- **WHEN** IndexedDB 事务失败（如数据库版本冲突）
- **THEN** 系统 SHALL 记录错误日志
- **AND** 返回包含错误信息的 Promise rejection
- **AND** 调用者可以通过 catch 捕获错误

### Requirement: 数据迁移

系统 SHALL 提供数据的导入导出能力，作为用户数据备份与跨设备迁移的途径。

#### Scenario: 手动数据导入导出
- **WHEN** 用户需要备份或迁移数据
- **THEN** 系统 SHALL 提供数据导出功能（导出为 JSON 文件）
- **AND** 系统 SHALL 提供数据导入功能（从 JSON 文件导入到 IndexedDB）
- **AND** 原桌面版用户可使用迁移前版本的导出功能产出 JSON 文件后导入纯 Web 版

### Requirement: Web Store 使用共享的 initIndexedDB

存储层的 IndexedDB 初始化 SHALL 使用从共享模块导入的 `initIndexedDB` 函数，而非本地定义的版本。

#### Scenario: Store 功能不变
- **WHEN** 通过存储层进行 get/set/delete/keys 操作
- **THEN** 行为与迁移前完全一致，数据格式不变

#### Scenario: 公开 API 不变
- **WHEN** 上层代码通过存储模块的统一入口导入 store 相关 API
- **THEN** 所有导出的函数签名和类型保持不变

### Requirement: 模块化设计

存储层 SHALL 遵循项目的模块化设计原则。

#### Scenario: 文件组织
- **WHEN** 实现存储层
- **THEN** 系统 SHALL 在独立的 Web 工具模块中创建 store 模块（具体位置见 design.md）
- **AND** 模块仅负责键值持久化逻辑
- **AND** 在该模块的统一入口中导出 Store API

#### Scenario: 类型定义
- **WHEN** 定义存储层类型
- **THEN** 系统 SHALL 在项目内自有的类型定义中声明 API 签名（不依赖已移除的 `@tauri-apps/plugin-store` 包）
- **AND** 提供完整的 TypeScript 类型提示

## REMOVED Requirements

### Requirement: Store 插件兼容层

**Reason**: 该需求定义为"Tauri 与 Web 环境均可用"的双分支 API，其场景（"Tauri 环境使用原生实现"等）以 Tauri 运行时存在为前提；Tauri 运行时移除后双分支定义失效。
**Migration**: 由本增量的 ADDED 需求"键值存储统一入口"承接：IndexedDB 成为唯一实现，API 签名保持不变。

### Requirement: 功能可用性标记

**Reason**: 该需求的场景集围绕"Tauri 环境 Store 可用"与 Web 环境的对比展开，Tauri 分支删除后场景定义失效。
**Migration**: 由本增量的 ADDED 需求"存储层可用性检测"承接，仅依据浏览器能力（IndexedDB）判断可用性。
