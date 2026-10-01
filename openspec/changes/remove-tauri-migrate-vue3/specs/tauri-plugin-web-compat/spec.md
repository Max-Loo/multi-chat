# Spec Delta：tauri-plugin-web-compat（移除双栈兼容需求）

## REMOVED Requirements

### Requirement: 环境检测
**Reason**: 纯 Web 化后不再存在 Tauri/Web 双环境，`isTauri()` 运行时环境检测失去存在意义。
**Migration**: 环境相关行为由新能力 `pure-web-platform` 承载；模块内移除 `isTauri`，仅保留测试环境检测（`isTestEnvironment`）。

### Requirement: Shell 插件兼容层
**Reason**: Tauri Shell 插件及其原生实现被移除，"跨环境 Shell 兼容"不复存在；外链打开收敛为纯 Web 行为。
**Migration**: 外部链接打开行为由 `pure-web-platform` 的"外部链接打开"需求承载（`window.open` 新标签页）。

### Requirement: 功能降级行为
**Reason**: "Web 环境降级"的语义消失——既有 Web 实现（IndexedDB 存储、加密密钥存储、`window.open`）升格为唯一实现，不再是降级路径。
**Migration**: 持久化与外链行为由 `pure-web-platform` 的"数据持久化唯一路径与数据兼容"、"外部链接打开"需求承载。

### Requirement: 功能可用性标记
**Reason**: 不再需要区分"Tauri 可用 / Web 降级"的平台可用性语义；唯一保留的是浏览器能力检测。
**Migration**: 由 `pure-web-platform` 的"浏览器能力检测"需求承载（IndexedDB、Web Crypto API 可用性判定与提示）。

### Requirement: 向后兼容性
**Reason**: 其约束对象是 Tauri 桌面功能与双环境切换；桌面形态移除后该需求失效。
**Migration**: 无需替代——桌面形态不再存在；Web 行为连续性由 `pure-web-platform` 的数据兼容需求保障。

### Requirement: 测试验证
**Reason**: 其要求在 Tauri 与 Web 两种环境及 `pnpm tauri dev` / `pnpm web:dev` 双构建链路下验证；双链路移除后验证矩阵收敛为单一 Vite 链路。
**Migration**: 验证收敛为 `pnpm build` + `pnpm test:run` + 浏览器运行验证，由 `pure-web-platform` 的"无 Tauri 运行时残留"需求约束。

### Requirement: IndexedDB 降级策略
**Reason**: "为 Tauri 插件选择降级策略"的前提消失；其中仍然有效的约束（按插件隔离的独立数据库、`multi-chat-<plugin>` 命名）已并入新能力的数据契约。
**Migration**: 数据库隔离与命名规则由 `pure-web-platform` 的"数据持久化唯一路径与数据兼容"需求承载。

### Requirement: Keyring 插件兼容层
**Reason**: 其核心是封装 `tauri-plugin-keyring-api` 原生实现并提供跨环境一致 API；Tauri 侧移除后，keyring 收敛为纯 Web 加密存储实现，不再承担兼容职责。
**Migration**: keyring 的 Web 行为契约继续由 `web-keyring-compat` 规范承载；平台层契约由 `pure-web-platform` 承载。保留的 barrel export 约束见本规范"Keyring 插件兼容层 barrel export"需求（保持不变）。
