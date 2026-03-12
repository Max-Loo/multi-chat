# Proposal: 国际化错误消息

## Why

当前应用在初始化流程和配置管理中存在硬编码的错误消息（中英文混合），这些错误消息可能被展示给用户，但未纳入国际化系统。随着应用支持中文、英文、法文三种语言，所有面向用户的错误消息都应遵循项目的国际化架构，以提供一致的多语言用户体验。

## What Changes

- **新增 error.json 命名空间**：为 en/zh/fr 三种语言创建专门的错误消息翻译文件
- **添加 tSafely() 函数**：在 `src/lib/i18n.ts` 中实现安全的翻译获取函数，支持非 React 环境并处理 i18n 未初始化的情况
- **重构 appConfigSlices.ts**：使用 `tSafely()` 替换所有硬编码的英文错误消息
- **重构 initSteps.ts**：使用 `tSafely()` 替换硬编码的中文错误消息（i18n 初始化错误除外，使用英文常量）
- **混合加载策略**：英文 error.json 静态打包确保立即可用，中文和法文 error.json 动态加载 + 英文降级策略

## Capabilities

### New Capabilities

- **error-i18n**: 错误消息的国际化翻译系统，包括初始化错误、配置错误、应用配置错误等场景的翻译键值
- **safe-translation**: 非React环境中的安全翻译机制，支持降级策略和嵌套键值访问

### Modified Capabilities

*无现有规范需要修改*

## Impact

### 受影响的文件

**新增文件**：
- `src/locales/en/error.json`
- `src/locales/zh/error.json`
- `src/locales/fr/error.json`

**修改文件**：
- `src/lib/i18n.ts`：添加 `tSafely()` 函数及其类型定义 `SafeTranslator`，静态打包英文 error 命名空间，其他语言动态加载
- `src/store/slices/appConfigSlices.ts`：替换硬编码错误消息为 `tSafely()` 调用
- `src/config/initSteps.ts`：替换硬编码错误消息为 `tSafely()` 调用（i18n 初始化错误使用英文常量）
- `docs/design/i18n-system.md`：添加 error 命名空间和 `tSafely()` 函数的文档说明

### 性能影响

- 初始 bundle 大小增加约 **826 字节**（仅英文 error.json，包含 11 个错误消息）
- 中文和法文 error.json 按需动态加载，不影响初始性能
- gzip 压缩后约 300-400 字节，对性能的影响可忽略不计

### 依赖关系

- 无新增外部依赖
- 使用现有的 i18next 和 react-i18next

### 兼容性

- **向后兼容**：降级策略确保即使在 i18n 未就绪时也能显示有意义的错误消息
- **无破坏性变更**：所有修改都是内部实现，不涉及公共 API 变更
- **类型安全**：导出 `SafeTranslator` 类型别名，支持 TypeScript 类型推断

### 测试覆盖

- **单元测试**：为 `tSafely()` 函数添加完整的单元测试，覆盖所有边界情况
- **集成测试**：验证初始化流程中的错误消息国际化
- **回归测试**：确保现有 i18n 功能不受影响
