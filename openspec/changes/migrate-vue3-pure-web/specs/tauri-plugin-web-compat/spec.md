# Spec Delta

## MODIFIED Requirements

### Requirement: 类型安全

平台层 SHALL 在 TypeScript 编译时保持类型安全，API 使用原生 Web 类型定义。

#### Scenario: 编译时类型检查

- **GIVEN** 项目使用 TypeScript 严格模式
- **WHEN** 导入和使用平台层 API
- **THEN** TypeScript 编译器不报类型错误
- **AND** 提供完整的类型提示和自动补全

#### Scenario: 类型定义

- **WHEN** 定义平台层类型
- **THEN** 系统使用原生 DOM/ECMAScript 类型（如 `RequestInfo`、`Response`、`IDBDatabase`）或项目自定义类型
- **AND** 不创建与已移除 Tauri 插件对齐的类型声明

### Requirement: 功能降级行为

系统 SHALL 直接实现纯 Web 平台能力，所有 API 在浏览器环境中提供真实行为。

#### Scenario: 外部链接打开

- **WHEN** 调用外部链接打开 API 打开 URL
- **THEN** 系统使用浏览器原生 `window.open()` API 以新标签页打开 URL
- **AND** 使用 `noopener,noreferrer` 安全参数
- **AND** 仅支持 URL，不支持本地文件路径

#### Scenario: Store 实现

- **WHEN** 调用 Store API（如 `get()`、`set()`）
- **THEN** 系统使用 IndexedDB 实现数据持久化
- **AND** 方法始终返回成功的 Promise

#### Scenario: Keyring 实现

- **WHEN** 调用 Keyring API（如 `setPassword()`、`getPassword()`）
- **THEN** 系统使用 IndexedDB + AES-256-GCM 加密实现安全存储
- **AND** 方法始终返回成功的 Promise

### Requirement: 功能可用性标记

平台层 API SHALL 提供 `isSupported()` 方法，返回值反映浏览器能力（IndexedDB、Web Crypto API）的支持情况。

#### Scenario: Command 能力不存在

- **WHEN** 检查 Shell 命令执行能力
- **THEN** 系统不提供 Shell 命令执行 API（纯 Web 端无此能力，无业务使用方）

#### Scenario: 外部链接打开可用

- **WHEN** 调用外部链接打开对象的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示 URL 打开功能可用（使用浏览器原生 API）

#### Scenario: Store 可用性

- **GIVEN** 浏览器支持 IndexedDB
- **WHEN** 调用 Store 对象的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 浏览器不支持 IndexedDB 时方法返回 `false`

#### Scenario: Keyring 可用性

- **GIVEN** 浏览器支持 IndexedDB 和 Web Crypto API
- **WHEN** 调用 Keyring 对象的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 任一能力缺失时方法返回 `false`

#### Scenario: UI 层响应功能可用性

- **WHEN** UI 组件调用 `isSupported()` 返回 `false`
- **THEN** UI 层 SHOULD 禁用相关功能按钮或显示功能不可用提示

### Requirement: 模块化设计

平台层 SHALL 使用模块化设计，遵循 SOLID 原则，便于扩展和维护。

#### Scenario: 目录结构

- **WHEN** 创建平台层代码
- **THEN** 系统在 `src/utils/platform/` 目录下组织代码（由 `tauriCompat` 重命名而来）
- **AND** 包含以下文件：
  - `index.ts`: 导出所有平台层 API
  - `env.ts`: 测试环境检测工具函数
  - `shell.ts`: 外部链接打开实现
  - `os.ts`: 浏览器语言与平台检测实现
  - `store.ts`: IndexedDB 存储实现
  - `keyring.ts`: 加密密钥存储实现

#### Scenario: 单一职责原则

- **WHEN** 实现平台层模块
- **THEN** 每个文件只负责一个明确的职责
- **AND** 不在模块内保留任何按运行环境分支的代码路径

### Requirement: 导入路径规范

项目代码 SHALL 使用 `@/` 别名导入平台层模块，而非相对路径。

#### Scenario: 正确的导入方式

- **WHEN** 在项目代码中导入平台层 API
- **THEN** 使用 `import { keyring, store } from '@/utils/platform'`
- **AND** 不使用相对路径导入

### Requirement: IndexedDB 降级策略

系统 SHALL 使用 IndexedDB 作为所有需要数据持久化的能力（store、keyring）的存储方案。

#### Scenario: 存储方案选择

- **WHEN** 为需要持久化的新能力实现存储
- **THEN** 系统使用 IndexedDB 方案
- **AND** 不再存在 Null Object 与 IndexedDB 之间的策略选择

#### Scenario: IndexedDB 数据库隔离

- **WHEN** 使用 IndexedDB 存储方案
- **THEN** 每个能力 SHALL 使用独立的 IndexedDB 数据库
- **AND** 数据库名称格式：`multi-chat-<name>`（如 `multi-chat-store`、`multi-chat-keyring`）
- **AND** 不同能力的数据 SHALL 互不干扰

### Requirement: Keyring 插件兼容层

系统 SHALL 以受约束的 `keyring` 实例形式提供密钥存储 API，仅基于浏览器能力实现。

#### Scenario: 加密存储实现

- **WHEN** 调用 `keyring.setPassword()`、`keyring.getPassword()`、`keyring.deletePassword()`
- **THEN** 系统使用 IndexedDB + AES-256-GCM 加密实现密钥存储
- **AND** 不抛出运行时错误

#### Scenario: 通过 barrel export 访问

- **WHEN** 开发者使用 `import { keyring } from '@/utils/platform'`
- **THEN** 系统 SHALL 提供 `KeyringPublicAPI` 类型的 `keyring` 实例
- **AND** 不导出独立的 `setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState` 函数

### Requirement: Keyring 插件兼容层 barrel export

系统 SHALL 在 `src/utils/platform/index.ts` 中导出 `keyring` 实例和 `KeyringPublicAPI` 类型，不导出实现类和独立函数。

#### Scenario: Keyring 相关 barrel export

- **WHEN** 开发者从 `@/utils/platform` 导入 Keyring 相关 API
- **THEN** 系统 SHALL 导出 `keyring` 实例（`KeyringPublicAPI` 类型）
- **AND** 系统 SHALL 导出 `KeyringPublicAPI` 类型
- **AND** 系统 SHALL NOT 导出 `setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState` 独立函数
- **AND** 系统 SHALL NOT 通过 barrel export 暴露实现类（测试文件直接从 `./keyring` 路径导入）

#### Scenario: 其他平台层 barrel export 不变

- **WHEN** 开发者从 `@/utils/platform` 导入其他模块（shell、locale、fetch 等）
- **THEN** 导出行为 SHALL 保持不变

### Requirement: 代码规范

平台层代码 SHALL 遵循项目的代码规范和最佳实践。

#### Scenario: 中文注释

- **WHEN** 编写平台层代码
- **THEN** 所有函数、类、变量使用中文注释
- **AND** JSDoc 注释使用中文描述

#### Scenario: 无额外依赖

- **WHEN** 实现平台层
- **THEN** 不引入新的 npm 运行时依赖
- **AND** 仅使用浏览器原生 API 与项目已有依赖

#### Scenario: KISS 和 DRY 原则

- **WHEN** 实现平台层
- **THEN** 代码保持简洁，避免不必要的抽象
- **AND** 消除重复代码，提取公共逻辑到独立函数

### Requirement: 文档更新

系统 SHALL 更新项目文档，说明平台层的设计与浏览器能力边界。

#### Scenario: AGENTS.md 更新

- **WHEN** 完成纯 Web 迁移后
- **THEN** AGENTS.md 的架构说明更新为纯 Web 技术栈与 `src/utils/platform/` 快速查找表项
- **AND** 移除"Tauri 桌面环境"相关表述

#### Scenario: 设计文档更新

- **WHEN** 完成纯 Web 迁移后
- **THEN** `docs/design/cross-platform.md` 重写为纯 Web 平台层设计说明
- **AND** 删除 `docs/conventions/tauri-commands.md`

### Requirement: 测试验证

系统 SHALL 验证平台层在浏览器环境中的正确性。

#### Scenario: Web 环境验证

- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 执行单元测试与集成测试
- **THEN** 验证平台层不抛出运行时错误
- **AND** 应用正常加载和运行
- **AND** `isSupported()` 返回值与浏览器能力一致

#### Scenario: 构建流程验证

- **WHEN** 执行 `pnpm dev` 和 `pnpm build`
- **THEN** 构建流程成功
- **AND** 不出现 TypeScript 类型错误
- **AND** 不出现运行时错误

## REMOVED Requirements

### Requirement: 环境检测

**Reason**: 应用收敛为纯 Web 端，不再存在 Tauri 桌面运行环境，`isTauri()` 环境检测及其 `window.__TAURI__` 检测逻辑失去存在前提。
**Migration**: 无业务调用方直接使用 `isTauri()`；`env.ts` 保留 `isTestEnvironment()` 与 `getPBKDF2Iterations()`（测试环境检测仍需要）。

### Requirement: Shell 插件兼容层

**Reason**: `@tauri-apps/plugin-shell` 依赖随纯 Web 迁移移除；Shell 命令执行（`Command.create()`）无任何业务使用方，其 Web Null Object 实现一并删除。
**Migration**: `shell.open()` 的浏览器行为由本 delta 中"功能降级行为"需求的 `window.open()` 场景承接；需要打开外部链接的业务改用外部链接打开 API。

### Requirement: 向后兼容性

**Reason**: 兼容层"保持现有 Tauri 桌面功能不受影响"的约束与移除 Tauri 的变更目标直接冲突，桌面端停止发布。
**Migration**: 桌面版用户可继续使用历史版本；数据迁移通过设置页的主密钥导出/导入功能完成（浏览器无法读取桌面版本地文件）。

### Requirement: 降级策略一致性

**Reason**: "Web 端降级实现与 Tauri 端原生 API 行为保持一致"的前提（双环境并存）不复存在；平台层 API 签名即唯一契约。
**Migration**: 平台层 API 保持现有函数签名不变，业务调用方无需修改调用方式。
