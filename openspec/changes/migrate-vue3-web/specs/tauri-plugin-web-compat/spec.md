# Spec Delta

## REMOVED Requirements

### Requirement: 环境检测

**Reason**: Tauri 桌面运行时被移除，应用仅在浏览器中运行，不再存在双环境分支，`isTauri()` 检测失去存在意义。
**Migration**: 语言检测等浏览器环境需求由 `web-only-runtime` 规格承接；`src/utils/tauriCompat/env.ts` 中仅为测试环境检测保留的部分（`isTestEnvironment`、PBKDF2 常量）迁移至共享 Web 模块，行为见 `tauri-compat-shared-modules` 规格的"环境检测函数"需求。

### Requirement: Shell 插件兼容层

**Reason**: `@tauri-apps/plugin-shell` 依赖随 Tauri 一起移除，Shell 命令执行与外部打开的兼容封装不再需要。
**Migration**: 外部链接打开改用浏览器原生 `window.open`，行为由 `web-only-runtime` 规格的"外部链接浏览器跳转"需求定义；Shell 命令执行功能整体下线，无替代。

### Requirement: 类型安全

**Reason**: 该需求要求复用 `@tauri-apps/plugin-shell` 官方类型定义，该包已从依赖中移除。
**Migration**: 迁移后的 Web 模块（密钥存储、数据持久化）使用自有的 TypeScript 类型定义，类型安全由 `vue3-frontend` 规格的"开发与构建工作流"（`pnpm tsc` 通过）保障。

### Requirement: 功能降级行为

**Reason**: "降级"以存在 Tauri 原生实现为前提；纯 Web 环境中 IndexedDB 存储与 `window.open` 就是唯一实现，不存在降级概念。
**Migration**: Web 环境行为由 `web-keyring-compat`（IndexedDB + AES-256-GCM）、`web-store-compat`（IndexedDB）与 `web-only-runtime`（外链跳转）规格直接定义。

### Requirement: 功能可用性标记

**Reason**: Tauri 环境分支已删除，双环境下的 `isSupported()` 语义不复存在；浏览器能力检测仍有价值但不再与 Tauri 对比。
**Migration**: 由 `web-only-runtime` 规格的"浏览器能力检测"需求承接，仅检测浏览器能力（IndexedDB、Web Crypto API）。

### Requirement: 模块化设计

**Reason**: `src/utils/tauriCompat/` 目录及其按插件分文件的组织方式随兼容层整体删除。
**Migration**: 保留的 Web 实现迁移至新的 Web 模块位置（见 design.md），模块化原则不变。

### Requirement: 导入路径规范

**Reason**: 该需求约束的是 `@/utils/tauriCompat` 的导入方式，目标模块已删除。
**Migration**: `@/` 别名导入规范为项目全局约定（见 AGENTS.md），对迁移后的新模块同样适用。

### Requirement: 向后兼容性

**Reason**: 需求要求"不破坏现有的 Tauri 桌面功能"，桌面功能本身已移除，无从兼容。
**Migration**: 无替代；既有 Web 端用户数据（IndexedDB、localStorage 种子）保持可读，由 `web-keyring-compat` 与 `web-store-compat` 规格的数据格式不变要求保障。

### Requirement: 代码规范

**Reason**: 该需求针对兼容层代码本身（不引入新依赖、仅用 `@tauri-apps/plugin-shell` 等），目标代码已删除。
**Migration**: 项目通用代码规范（中文注释、KISS、DRY）继续适用于全部新代码。

### Requirement: 文档更新

**Reason**: AGENTS.md 中的跨平台兼容层章节随兼容层删除，相关文档要求失效。
**Migration**: 文档改为描述纯 Web 架构：更新 `docs/design/cross-platform.md`（改为 Web 专用实现说明）、删除 `docs/conventions/tauri-commands.md`、同步 AGENTS.md 与 README。

### Requirement: 测试验证

**Reason**: 双环境（`pnpm dev` 与 `pnpm web:dev`）验证不再适用，Tauri 环境测试路径消失。
**Migration**: 由 `web-only-runtime` 规格的"纯浏览器运行时"与 `vue3-frontend` 规格的"开发与构建工作流"中的验证场景承接。

### Requirement: IndexedDB 降级策略

**Reason**: IndexedDB 在纯 Web 应用中是主存储方案而非降级方案，"按插件特性选择降级策略"的决策框架失效。
**Migration**: IndexedDB 的数据库命名（`multi-chat-store`、`multi-chat-keyring`）与隔离要求保持不变，由 `web-keyring-compat` 与 `web-store-compat` 规格直接定义。

### Requirement: Keyring 插件兼容层

**Reason**: 需求定义的是"Tauri 与 Web 环境均可用"的双分支 API，Tauri 分支已移除。
**Migration**: 由 `web-keyring-compat` 规格的"Keyring 插件兼容层"需求（本变更为其 MODIFY 为 Web 唯一实现）承接，API 面不变。

### Requirement: Keyring 插件兼容层 barrel export

**Reason**: `tauriCompat/index.ts` barrel 随兼容层删除。
**Migration**: keyring API 从新的统一入口导出，导出面（`keyring` 实例与 `KeyringPublicAPI` 类型）不变，见 `web-keyring-compat` 规格的对应 MODIFIED 需求。

### Requirement: isTestEnvironment 结果缓存

**Reason**: 该需求约束的 `env` 模块缓存行为随 `tauriCompat` 命名空间迁移，属实现细节层面的性能优化。
**Migration**: 缓存行为在迁移后的共享模块中原样保留（`getPBKDF2Iterations()` 使用模块级缓存），对外行为（测试环境 1000、生产环境 100000）由 `tauri-compat-shared-modules` 规格的"环境检测函数"需求继续覆盖。

### Requirement: 降级策略一致性

**Reason**: "Web 端降级实现与 Tauri 端原生 API 保持一致"的对比对象已不存在。
**Migration**: API 签名、数据类型与错误处理的稳定性要求由 `web-keyring-compat` 与 `web-store-compat` 规格各自的需求独立保障。
