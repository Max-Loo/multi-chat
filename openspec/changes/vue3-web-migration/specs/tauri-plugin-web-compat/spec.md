# Spec Delta

## ADDED Requirements

### Requirement: Shell 功能运行时模块

系统 SHALL 提供 Shell 功能的运行时模块 API：`Command` 为 Null Object 实现（不执行任何系统命令），`shell.open()` 使用浏览器原生 `window.open()` 打开 URL。

#### Scenario: Web 环境使用降级实现

- **WHEN** 调用兼容层 API（如 `Command.create()`）
- **THEN** 系统返回 Null Object 实现
- **AND** 不抛出运行时错误
- **AND** 返回类型与既有调用方保持一致

#### Scenario: API 一致性

- **WHEN** 使用兼容层 API
- **THEN** 函数签名和导出形状与既有调用方使用的 API 保持一致
- **AND** 调用方无需因迁移修改代码

### Requirement: 类型定义自维护

兼容层 SHALL 在 TypeScript 编译时保持类型安全，类型定义由项目自行维护。

#### Scenario: 编译时类型检查

- **GIVEN** 项目使用 TypeScript 严格模式
- **WHEN** 导入和使用兼容层 API
- **THEN** TypeScript 编译器不报类型错误
- **AND** 提供完整的类型提示和自动补全

#### Scenario: 类型定义复用

- **WHEN** 定义兼容层类型
- **THEN** 系统 SHALL 在项目内维护所需的全部类型（如 `ChildProcess`）
- **AND** 不依赖任何 `@tauri-apps/*` 包的类型声明
- **AND** 类型定义包含必要的扩展（如 `isSupported()` 方法）

### Requirement: 功能可用性检测

运行时模块 API SHALL 提供 `isSupported()` 方法，让调用者能够判断当前功能是否真正可用；可用性 SHALL 基于浏览器能力检测判定。

#### Scenario: Web 环境 Command 功能不可用

- **WHEN** 调用 `Command` 对象的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示 Shell 命令执行功能不提供实际行为

#### Scenario: Web 环境 shell.open 功能可用

- **WHEN** 调用 `shell` 对象的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示 URL 打开功能可用（使用浏览器原生 API）

#### Scenario: Web 环境 Store 功能可用

- **GIVEN** 浏览器支持 IndexedDB
- **WHEN** 调用 Store 对象的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示键值存储功能可用（使用 IndexedDB）

#### Scenario: Web 环境 Store 功能不可用

- **GIVEN** 浏览器不支持 IndexedDB
- **WHEN** 调用 Store 对象的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示键值存储功能不可用

#### Scenario: Web 环境 Keyring 功能可用

- **GIVEN** 浏览器支持 IndexedDB 和 Web Crypto API
- **WHEN** 调用 Keyring 对象的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示安全密钥存储功能可用（使用 IndexedDB + 加密）

#### Scenario: Web 环境 Keyring 功能不可用

- **GIVEN** 浏览器不支持 IndexedDB 或 Web Crypto API
- **WHEN** 调用 Keyring 对象的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示安全密钥存储功能不可用

#### Scenario: UI 层响应功能可用性

- **WHEN** UI 组件调用 `isSupported()` 返回 `false`
- **THEN** UI 层 SHOULD 禁用相关功能按钮或显示功能不可用提示
- **AND** 不向用户暴露降级行为的实现细节

### Requirement: Web 测试验证

系统 SHALL 在 Web 环境中验证运行时模块的正确性。

#### Scenario: Web 环境验证

- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 执行测试
- **THEN** 验证运行时模块不抛出运行时错误
- **AND** 应用正常加载和运行
- **AND** 各模块 `isSupported()` 返回值符合预期

#### Scenario: 构建流程验证

- **WHEN** 执行 `pnpm dev` 与 `pnpm build`
- **THEN** 构建流程成功
- **AND** 不出现 TypeScript 类型错误
- **AND** 不出现运行时错误

### Requirement: Keyring 统一入口模块

系统 SHALL 提供受约束的 `keyring` 实例作为密钥存储统一入口，实现基于 IndexedDB + AES-256-GCM 加密。

#### Scenario: Web 环境使用 IndexedDB 实现

- **WHEN** 调用 `keyring.setPassword()`、`keyring.getPassword()`、`keyring.deletePassword()`
- **THEN** 系统使用 IndexedDB 实现加密存储
- **AND** 不抛出运行时错误
- **AND** 行为与原 Web 环境实现保持一致

#### Scenario: API 一致性

- **WHEN** 使用 `keyring` 实例的 Keyring API
- **THEN** 函数签名与既有调用方使用的 API 保持一致（`setPassword`、`getPassword`、`deletePassword`、`isSupported`、`resetState`）
- **AND** 调用方无需因迁移修改代码

#### Scenario: 通过 barrel export 访问

- **WHEN** 开发者使用 `import { keyring } from '@/utils/webRuntime'`
- **THEN** 系统 SHALL 提供 `KeyringPublicAPI` 类型的 `keyring` 实例
- **AND** 不再导出独立的 `setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState` 函数

## MODIFIED Requirements

### Requirement: 模块化设计

运行时模块 SHALL 使用模块化设计，遵循 SOLID 原则，便于扩展和维护。

#### Scenario: 目录结构

- **WHEN** 组织运行时模块代码
- **THEN** 系统在 `src/utils/webRuntime/` 目录下组织代码
- **AND** 包含以下文件：
  - `index.ts`: 导出所有运行时模块 API
  - `env.ts`: 测试环境检测工具函数
  - `shell.ts`: Shell 功能 Null Object 实现
  - `os.ts`: 浏览器语言与平台检测实现
  - `http.ts`: fetch 封装实现
  - `store.ts`: IndexedDB 键值存储实现
  - `keyring.ts`: 加密密钥存储实现

#### Scenario: 单一职责原则

- **WHEN** 实现运行时模块
- **THEN** 每个文件只负责一个明确的职责
- **AND** `env.ts` 只包含环境检测逻辑
- **AND** `shell.ts` 只包含 Shell 功能逻辑
- **AND** `os.ts` 只包含语言与平台检测逻辑
- **AND** `store.ts` 只包含键值存储逻辑
- **AND** `keyring.ts` 只包含密钥存储逻辑

#### Scenario: 可扩展性

- **WHEN** 需要新增运行时能力模块
- **THEN** 系统使用与现有模块相同的模式
- **AND** 在 `src/utils/webRuntime/` 下添加新的模块文件
- **AND** 在 `index.ts` 中导出新模块的 API

### Requirement: 导入路径规范

项目代码 SHALL 使用 `@/` 别名导入运行时模块，而非相对路径。

#### Scenario: 正确的导入方式

- **WHEN** 在项目代码中导入运行时模块 API
- **THEN** 使用 `import { Command } from '@/utils/webRuntime'`
- **AND** 不使用相对路径如 `import { Command } from '../../../utils/webRuntime'`

### Requirement: 代码规范

运行时模块代码 SHALL 遵循项目的代码规范和最佳实践。

#### Scenario: 中文注释

- **WHEN** 编写运行时模块代码
- **THEN** 所有函数、类、变量使用中文注释
- **AND** JSDoc 注释使用中文描述

#### Scenario: 无额外依赖

- **WHEN** 实现运行时模块
- **THEN** 不引入新的 npm 运行时依赖
- **AND** 仅使用浏览器原生 API 与项目已有依赖

#### Scenario: KISS 和 DRY 原则

- **WHEN** 实现运行时模块
- **THEN** 代码保持简洁，避免不必要的抽象
- **AND** 消除重复代码，提取公共逻辑到独立函数

### Requirement: 文档更新

系统 SHALL 更新项目文档，说明纯 Web 运行时模块的能力边界。

#### Scenario: AGENTS.md 更新

- **WHEN** 完成迁移后
- **THEN** AGENTS.md 中原"Tauri 插件兼容层"相关章节 SHALL 改写为纯 Web 运行时模块说明
- **AND** 包含以下内容：
  - 运行时模块的用途和设计原理
  - 如何在代码中使用运行时模块 API
  - 哪些功能在浏览器环境不可用（Shell 命令执行）
  - Store 和 Keyring 的 IndexedDB 实现说明

#### Scenario: 导入路径规范说明

- **WHEN** 文档提及运行时模块
- **THEN** 明确说明使用 `@/` 别名导入
- **AND** 提供代码示例

### Requirement: IndexedDB 降级策略

对于数据持久化能力（store、keyring），系统 SHALL 使用 IndexedDB 作为持久化方案；对于系统操作能力（shell 命令），系统 SHALL 使用 Null Object 模式。

#### Scenario: 选择降级策略

- **WHEN** 为新的运行时能力实现模块
- **THEN** 系统 SHALL 根据能力特性选择实现策略：
  - 如果能力涉及数据持久化（如 store、keyring），使用 IndexedDB 方案
  - 如果能力涉及系统操作（如 shell 命令），使用 Null Object 模式
- **AND** 实现策略 SHALL 在模块文档中明确说明

#### Scenario: IndexedDB 数据库隔离

- **WHEN** 使用 IndexedDB 持久化方案
- **THEN** 每个模块 SHALL 使用独立的 IndexedDB 数据库
- **AND** 数据库名称格式：`multi-chat-<module-name>`（如 `multi-chat-store`、`multi-chat-keyring`）
- **AND** 不同模块的数据 SHALL 互不干扰

### Requirement: Keyring 插件兼容层 barrel export

系统 SHALL 在 `webRuntime/index.ts` 中导出 `keyring` 实例和 `KeyringPublicAPI` 类型，不再导出实现类和独立函数。

#### Scenario: Keyring 相关 barrel export

- **WHEN** 开发者从 `@/utils/webRuntime` 导入 Keyring 相关 API
- **THEN** 系统 SHALL 导出 `keyring` 实例（`KeyringPublicAPI` 类型）
- **AND** 系统 SHALL 导出 `KeyringPublicAPI` 类型
- **AND** 系统 SHALL NOT 导出 `setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState` 独立函数
- **AND** 系统 SHALL NOT 通过 barrel export 暴露实现类（测试文件直接从 `./keyring` 路径导入）

#### Scenario: 其他兼容层 barrel export 不变

- **WHEN** 开发者从 `@/utils/webRuntime` 导入其他模块（Command、shell、locale、fetch 等）
- **THEN** 导出行为 SHALL 保持不变

## REMOVED Requirements

### Requirement: 环境检测
**Reason**: 纯 Web 运行时不再存在 Tauri 桌面环境，`isTauri()` 及 `window.__TAURI__` 检测失去意义。
**Migration**: 调用方移除对 `isTauri()` 的分支逻辑，统一走 Web 实现；`isTestEnvironment()` 与 PBKDF2 相关工具保留在共享模块。

### Requirement: Shell 插件兼容层
**Reason**: 原含"Tauri 环境使用原生实现"场景；Tauri 移除后 Shell 功能仅保留 Null Object 与浏览器实现，故以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 保持 API 导出形状不变。

### Requirement: 类型安全
**Reason**: 原要求"复用 @tauri-apps/plugin-shell 官方类型定义"；Tauri 依赖移除后类型改由项目自维护，故以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 保持严格模式编译通过的要求。

### Requirement: 功能可用性标记
**Reason**: 原含"Tauri 环境功能可用"场景；Tauri 移除后 isSupported 仅依据浏览器能力判定，故以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 保持各模块判定依据不变。

### Requirement: 测试验证
**Reason**: 原含"Tauri 环境验证"场景且构建流程验证覆盖 `pnpm dev`（tauri dev）与 `pnpm web:dev` 双轨；Tauri 移除后以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 仅保留 Web 环境与 Vite 构建验证。

### Requirement: Keyring 插件兼容层
**Reason**: 原含"Tauri 环境使用原生实现"场景且 API 目标为兼容 `@tauri-plugin-keyring-api`；Tauri 移除后仅保留 Web 实现，故以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 保持 API 形状与导出方式不变。

### Requirement: 向后兼容性
**Reason**: 项目移除 Tauri 桌面端，不再需要保持与 Tauri 桌面功能或原生插件 API 的向后兼容。
**Migration**: 无迁移路径；桌面能力随本变更终止。

### Requirement: 降级策略一致性
**Reason**: 仅存在单一（Web）实现后，不再存在跨环境 API 一致性需求。
**Migration**: 各模块行为以本变更更新后的要求为准。
