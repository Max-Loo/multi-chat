# Spec Delta

## MODIFIED Requirements

### Requirement: 模块化设计

平台层 SHALL 使用模块化设计，遵循 SOLID 原则，便于扩展和维护。

#### Scenario: 目录结构

- **WHEN** 组织平台层代码
- **THEN** 系统在既有平台层目录（`src/utils/tauriCompat/` 或其重命名后的等价目录）下组织代码
- **AND** 包含以下模块：`index.ts`（统一导出）、`env.ts`（环境检测）、`os.ts`（语言偏好）、`http.ts`（HTTP）、`store.ts`（键值存储）、`keyring.ts`（密钥存储）
- **AND** 不包含 Shell 兼容层模块

#### Scenario: 单一职责原则

- **WHEN** 实现平台层模块
- **THEN** 每个文件只负责一个明确的职责
- **AND** `env.ts` 只包含环境检测逻辑，`store.ts` 只包含键值存储逻辑，`keyring.ts` 只包含密钥存储逻辑

#### Scenario: 可扩展性

- **WHEN** 需要新增平台能力模块
- **THEN** 系统沿用既有模块模式，在平台层目录下添加新模块文件并在 `index.ts` 中导出

### Requirement: Keyring 插件兼容层 barrel export

系统 SHALL 在平台层统一导出入口导出 `keyring` 实例和 `KeyringPublicAPI` 类型，不再导出实现类和独立函数。

#### Scenario: Keyring 相关 barrel export

- **WHEN** 开发者从平台层统一入口导入 Keyring 相关 API
- **THEN** 系统 SHALL 导出 `keyring` 实例（`KeyringPublicAPI` 类型）
- **AND** 系统 SHALL 导出 `KeyringPublicAPI` 类型
- **AND** 系统 SHALL NOT 导出 `setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState` 独立函数
- **AND** 系统 SHALL NOT 通过 barrel export 暴露 `WebKeyringCompat` 实现类（测试文件直接从 `./keyring` 路径导入）

#### Scenario: 其他兼容层 barrel export 不变

- **WHEN** 开发者从平台层统一入口导入其他模块（`isTauri`、`locale`、`fetch` 等）
- **THEN** 导出行为保持稳定
- **AND** 不再导出 Shell 相关 API（`Command`、`shell`）

## ADDED Requirements

### Requirement: 运行环境检测

系统 SHALL 提供运行时环境检测 API `isTauri()` 以保持调用方兼容性；在纯 Web 形态下，该函数 SHALL 恒返回 `false`。

#### Scenario: 恒定 Web 环境

- **GIVEN** 应用运行于纯 Web 形态（统一后的 `pnpm dev` 或 `pnpm build`）
- **WHEN** 调用 `isTauri()` 函数
- **THEN** 函数返回 `false`
- **AND** 应用中不存在返回 `true` 的运行环境

#### Scenario: 测试环境检测保持

- **WHEN** 在测试环境中调用 `isTestEnvironment()`
- **THEN** 函数行为与迁移前保持一致（含结果缓存语义）

### Requirement: 平台层类型安全

平台层 SHALL 在 TypeScript 编译时保持类型安全，类型定义为自有维护。

#### Scenario: 编译时类型检查

- **GIVEN** 项目使用 TypeScript 严格模式
- **WHEN** 导入和使用平台层 API
- **THEN** TypeScript 编译器不报类型错误
- **AND** 提供完整的类型提示和自动补全

#### Scenario: 类型定义自有化

- **WHEN** 定义平台层类型
- **THEN** 系统以自有类型声明承载全部公开 API 类型
- **AND** 不再依赖任何桌面壳插件的官方类型定义

### Requirement: 能力缺失降级行为

在浏览器能力缺失时，系统 SHALL 按既有策略优雅降级（IndexedDB 替代方案），确保应用不因能力缺失而崩溃。

#### Scenario: Store 降级

- **GIVEN** 浏览器支持 IndexedDB
- **WHEN** 调用 Store 平台层 API（如 `Store.get()`、`Store.set()`）
- **THEN** 方法使用 IndexedDB 实现数据持久化
- **AND** 方法始终返回 Promise

#### Scenario: Keyring 降级

- **GIVEN** 浏览器支持 IndexedDB 和 Web Crypto API
- **WHEN** 调用 Keyring 平台层 API（如 `setPassword()`、`getPassword()`）
- **THEN** 方法使用 IndexedDB + AES-256-GCM 加密实现安全存储
- **AND** 方法始终返回 Promise

#### Scenario: 不抛出异常

- **GIVEN** 平台层 API 被正常调用
- **WHEN** 底层能力不可用
- **THEN** 方法不抛出未处理的运行时错误，按既有错误处理策略返回可捕获的结果

### Requirement: 平台功能可用性标记

平台层 API SHALL 提供 `isSupported()` 方法，让调用者能够判断当前功能是否真正可用。

#### Scenario: Store 功能可用

- **GIVEN** 浏览器支持 IndexedDB
- **WHEN** 调用 Store 平台层的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示键值存储功能可用（使用 IndexedDB）

#### Scenario: Store 功能不可用

- **GIVEN** 浏览器不支持 IndexedDB
- **WHEN** 调用 Store 平台层的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示键值存储功能不可用

#### Scenario: Keyring 功能可用

- **GIVEN** 浏览器支持 IndexedDB 和 Web Crypto API
- **WHEN** 调用 Keyring 平台层的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示安全密钥存储功能可用（使用 IndexedDB + 加密）

#### Scenario: Keyring 功能不可用

- **GIVEN** 浏览器不支持 IndexedDB 或 Web Crypto API
- **WHEN** 调用 Keyring 平台层的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示安全密钥存储功能不可用

#### Scenario: UI 层响应功能可用性

- **WHEN** UI 组件读取到 `isSupported()` 返回 `false`
- **THEN** UI 层 SHOULD 禁用相关功能按钮或显示功能不可用提示
- **AND** 不向用户暴露降级行为的实现细节

### Requirement: 平台层测试验证

系统 SHALL 在纯 Web 环境中验证平台层的正确性。

#### Scenario: Web 环境验证

- **GIVEN** 应用运行于纯 Web 环境
- **WHEN** 执行单元与集成测试
- **THEN** 平台层不抛出运行时错误
- **AND** 应用正常加载和运行
- **AND** `isSupported()` 按浏览器实际能力返回

#### Scenario: 构建流程验证

- **WHEN** 执行统一后的开发与构建命令
- **THEN** 构建流程成功
- **AND** 不出现 TypeScript 类型错误
- **AND** 不出现运行时错误

### Requirement: IndexedDB 持久化策略

对于需要数据持久化的平台模块（如 store、keyring），系统 SHALL 使用 IndexedDB 作为持久化方案。

#### Scenario: 持久化策略选择

- **WHEN** 为新的平台模块选择持久化策略
- **THEN** 涉及数据持久化的模块使用 IndexedDB 方案
- **AND** 策略 SHALL 在平台层文档中明确说明

#### Scenario: IndexedDB 数据库隔离

- **WHEN** 使用 IndexedDB 持久化
- **THEN** 每个模块 SHALL 使用独立的 IndexedDB 数据库
- **AND** 数据库名称格式保持：`multi-chat-<module-name>`（如 `multi-chat-store`、`multi-chat-keyring`）
- **AND** 不同模块的数据 SHALL 互不干扰（既有数据不受影响）

### Requirement: Keyring 平台层

系统 SHALL 以受约束的 `keyring` 实例形式提供密钥存储平台层 API，仅在 Web 环境中可用。

#### Scenario: Web 环境使用 IndexedDB 实现

- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用 `keyring.setPassword()`、`keyring.getPassword()`、`keyring.deletePassword()`
- **THEN** 系统使用 IndexedDB 实现加密存储
- **AND** 不抛出运行时错误
- **AND** API 签名与迁移前保持一致，调用方无需修改

#### Scenario: 通过 barrel export 访问

- **WHEN** 开发者使用 `import { keyring } from '@/utils/tauriCompat'`（或其重命名后的等价路径）
- **THEN** 系统 SHALL 提供 `KeyringPublicAPI` 类型的 `keyring` 实例
- **AND** 不导出独立的 `setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState` 函数

## REMOVED Requirements

### Requirement: 环境检测

**Reason**: 原需求目标是区分"Tauri 桌面环境 / Web 浏览器环境"两种运行形态；桌面壳终止后仅存在 Web 形态，检测语义失效。替换为「运行环境检测」：`isTauri()` 保留为恒返回 `false` 的兼容 API。

**Migration**: 调用方无需修改；`isTauri()` 继续可用，后续清理阶段再评估删除该 API。

### Requirement: Shell 插件兼容层

**Reason**: 桌面壳终止后，Shell 命令执行能力在 Web 端无任何真实场景；其 Web 降级实现（Null Object）失去存在意义。业务代码中唯一的外链打开用法改为浏览器原生 API，由 `web-only-runtime` 能力的「外部链接打开」需求承载。

**Migration**: `useNavigateToExternalSite` 等调用方改用浏览器原生 `window.open(url, "_blank", "noopener,noreferrer")`；平台层统一入口不再导出 `Command` 与 `shell`。

### Requirement: 类型安全

**Reason**: 原需求包含"复用 `@tauri-apps/plugin-shell` 官方类型定义"场景，该依赖随桌面壳终止移除。类型安全约束由新需求「平台层类型安全」承载（类型定义自有化）。

**Migration**: 平台层公开 API 类型改为自有声明，导入方无感知。

### Requirement: 功能降级行为

**Reason**: 原需求的核心是"为 Tauri 插件选择 Web 降级策略"，其中 `Command.execute`、`shell.open` 场景随 Shell 兼容层删除失效；Store/Keyring 降级与"不抛出异常"约束由新需求「能力缺失降级行为」承载。

**Migration**: 无需调用方修改；IndexedDB 降级行为保持不变。

### Requirement: 功能可用性标记

**Reason**: 原需求包含 Tauri 环境、`Command`、`shell.open` 等场景，随桌面壳终止与 Shell 兼容层删除失效；Store/Keyring 的 `isSupported()` 语义由新需求「平台功能可用性标记」承载。

**Migration**: `isSupported()` 方法保留，调用方无需修改。

### Requirement: 测试验证

**Reason**: 原需求要求"Tauri 环境验证 + Web 环境验证"双环境矩阵；桌面壳终止后仅剩单环境。单环境验证由新需求「平台层测试验证」承载。

**Migration**: 测试命令收敛为统一脚本，验证语义不变。

### Requirement: IndexedDB 降级策略

**Reason**: 原需求以"为新 Tauri 插件实现兼容层时选择降级策略"为框架，该决策框架随桌面壳终止失效；IndexedDB 持久化与数据库隔离约束由新需求「IndexedDB 持久化策略」承载。

**Migration**: 数据库名称格式（`multi-chat-<module-name>`）与既有数据保持不变。

### Requirement: Keyring 插件兼容层

**Reason**: 该需求包含"Tauri 环境使用原生实现"与"与原生 API 保持一致"等双端场景，随桌面壳终止失效；Web 端 API 由新需求「Keyring 平台层」承载。

**Migration**: `keyring` 实例 API 签名不变，调用方无需修改。

### Requirement: 向后兼容性

**Reason**: 该需求的目标是保持与桌面壳环境的兼容与逐步迁移；桌面壳终止后目标失效。

**Migration**: 无需迁移。平台层公开 API（`isTauri`、Store、Keyring、HTTP、locale）签名保持稳定，业务调用方无需批量修改。

### Requirement: 降级策略一致性

**Reason**: 该需求约束的是「Web 降级实现与桌面壳原生 API 的双端行为一致」；双端场景不复存在，约束对象失效。Web 端自身的行为约束由 `web-store-compat`、`web-keyring-compat` 各自承载。

**Migration**: 无需迁移。各模块的数据格式、错误处理行为保持不变。
