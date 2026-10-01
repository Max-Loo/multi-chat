# Spec Delta：os-locale-compat（移除 Tauri locale 分支需求）

## REMOVED Requirements

### Requirement: locale() 兼容层
**Reason**: 其定义的是"为 `@tauri-apps/plugin-os` 的 `locale()` 提供跨环境兼容层"——Tauri 插件移除后兼容层失去封装对象；存续的浏览器语言行为由新能力承载。
**Migration**: 语言检测行为由 `pure-web-platform` 的"语言检测"需求承载（`navigator.language`，用户手动设置优先）。

### Requirement: 环境检测
**Reason**: 纯 Web 化后不存在 Tauri/Web 双环境选择逻辑，`isTauri()` 检测被移除。
**Migration**: 由 `pure-web-platform` 的"无 Tauri 运行时残留"需求约束（不存在环境检测分支）。

### Requirement: 向后兼容性
**Reason**: 其约束对象是"Tauri 环境下 locale() 功能不变"；桌面形态移除后该需求失效。
**Migration**: 无需替代——桌面形态不再存在；Web 端语言行为连续性由 `pure-web-platform` 的"语言检测"需求保障。

### Requirement: 测试验证
**Reason**: 其要求在 `pnpm tauri dev` 与 `pnpm web:dev` 双构建链路下验证；双链路移除后验证矩阵收敛为单一 Vite 链路。
**Migration**: 语言检测验证收敛为单一 Web 环境（vitest + 浏览器），由 `vue3-app-foundation` 的 i18n 集成需求约束。
