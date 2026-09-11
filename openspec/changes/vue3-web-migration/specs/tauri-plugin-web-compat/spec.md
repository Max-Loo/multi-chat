# Tauri 插件 Web 兼容层规范（退役增量）

## REMOVED Requirements

### Requirement: 环境检测

**Reason**: 应用已移除 Tauri 桌面端，`isTauri()` 双环境检测不复存在，`window.__TAURI__` 探测代码全部删除。

**Migration**: 开发/生产环境区分仅保留 `import.meta.env.DEV`（见 `web-only-platform` 的"环境检测收缩"）。

### Requirement: Shell 插件兼容层

**Reason**: Tauri 栈整体移除，`@tauri-apps/plugin-shell` 及其 Null Object 兼容实现（`Command`、`shell`）一并删除。

**Migration**: 打开外部链接的能力由 `window.open` 直接承接（见 `web-only-platform` 的"平台能力由 Web 标准 API 提供"）。

### Requirement: 类型安全

**Reason**: 该需求的类型一致性约束以"Tauri 与 Web 双环境"为前提，双环境消失后不再成立。

**Migration**: 各平台模块的 TypeScript 类型要求由 `web-keyring-compat`、`web-store-compat`、`os-locale-compat` 各自的类型条款承接。

### Requirement: 功能降级行为

**Reason**: "降级"概念随双环境消失；IndexedDB/Web Crypto 实现成为唯一实现，而非降级路径。

**Migration**: 存储行为由 `web-store-compat`、密钥行为由 `web-keyring-compat` 承接；shell 降级行为随功能一并删除。

### Requirement: 功能可用性标记

**Reason**: 该需求为兼容层各 API `isSupported()` 的总纲；双环境分支删除后，可用性检测仅在浏览器能力维度保留。

**Migration**: keyring/store 的 `isSupported()` 契约分别由 `web-keyring-compat`、`web-store-compat` 的"功能可用性标记"需求承接。

### Requirement: 模块化设计

**Reason**: 兼容层 `src/utils/tauriCompat/` 收缩为纯 Web 平台层 `src/utils/platform/`，原目录结构与"为其他 Tauri 插件扩展"的演进路径不再适用。

**Migration**: 各平台模块的文件组织由各自规格的"模块化设计"需求（已同步更新为 `src/utils/platform/` 路径）承接。

### Requirement: 导入路径规范

**Reason**: 原规范针对 `@/utils/tauriCompat` 双环境兼容层，该路径随 Tauri 移除而终止。

**Migration**: 平台能力统一从 `@/utils/platform` 导入，导入要求由各平台能力规格（如 `os-locale-compat` 的"导入路径规范"）承接。

### Requirement: 向后兼容性

**Reason**: "不破坏现有 Tauri 桌面功能"的前提随桌面端移除而消失。

**Migration**: 无；桌面端功能为本变更的既定 BREAKING 移除范围。

### Requirement: 代码规范

**Reason**: 该需求描述的是项目通用代码规范（中文注释、KISS/DRY、无额外依赖）在兼容层上的应用，非本能力独有行为。

**Migration**: 由 AGENTS.md 项目规范与各平台能力规格的代码条款承接。

### Requirement: 文档更新

**Reason**: 该需求描述的是兼容层落地时的一次性文档任务，已完成其历史使命；迁移后的文档要求在实施任务中执行。

**Migration**: 文档更新（AGENTS.md、README、docs/design/）纳入本变更实施任务清单。

### Requirement: 测试验证

**Reason**: "在 Tauri 与 Web 两种环境中验证"的前提随桌面端移除而消失。

**Migration**: 测试要求由测试类规格与 `framework-vue3` 的"测试体系延续"需求承接。

### Requirement: IndexedDB 降级策略

**Reason**: "降级策略"语境随双环境消失；但 IndexedDB 数据库隔离契约仍然有效，已由各能力规格直接承载。

**Migration**: 数据库命名（`multi-chat-store`、`multi-chat-keyring`）与库间隔离由 `web-store-compat`、`web-keyring-compat` 的既有需求承接。

### Requirement: Keyring 插件兼容层

**Reason**: `@tauri-plugin-keyring-api` 依赖移除，"包装原生 API、双环境可用"的定位不再成立；keyring 成为纯 Web 实现。

**Migration**: keyring 公开 API 与行为契约由 `web-keyring-compat`（本变更已修改为纯 Web 语义）承接。

### Requirement: Keyring 插件兼容层 barrel export

**Reason**: barrel export 约定随模块路径迁移至 `@/utils/platform`，原 `tauriCompat` 路径下的导出约束终止。

**Migration**: `keyring` 实例与 `KeyringPublicAPI` 类型改由 `@/utils/platform` 导出，契约由 `web-keyring-compat` 承接。

### Requirement: isTestEnvironment 结果缓存

**Reason**: 该需求的宿主模块（`tauriCompat/env.ts`）随双环境检测移除而重构，缓存行为条款需在纯平台层语境下重新表述。

**Migration**: 测试环境检测与 PBKDF2 迭代次数行为保留为 `src/utils/platform/` 内的工具函数；迭代次数契约由 `web-keyring-compat` 的"加密密钥派生"承接。

### Requirement: 降级策略一致性

**Reason**: "Web 端与 Tauri 端行为一致"的前提随桌面端移除而消失。

**Migration**: keyring/store 的 API 稳定性（签名、数据类型、错误处理）由各自规格的"API 一致性"类条款承接（语义调整为"对外 API 形态保持稳定"）。
