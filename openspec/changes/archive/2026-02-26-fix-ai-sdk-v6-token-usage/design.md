## Context

**背景**: `src/services/chatService.ts` 在处理 AI SDK v6 的 Token Usage 时使用了错误的字段名。

**当前状态**: 代码使用 `promptTokens` 和 `completionTokens` 访问 `LanguageModelUsage` 对象，但这些字段在 AI SDK v6 中已重命名为 `inputTokens` 和 `outputTokens`。为绕过类型检查，代码使用了不安全的 `(usage as any)` 类型断言。

**约束条件**:
- 必须保持 `StandardMessage.tokensUsage` 字段名不变（外部 API 兼容性）
- 不得引入新的依赖（当前使用 `ai@6.0.99`）
- 修改不应影响流式响应的其他部分

**相关方**: 依赖 `chatService.ts` 的所有聊天组件

## Goals / Non-Goals

**Goals:**
- 修复 Token Usage 字段名以符合 AI SDK v6 类型定义
- 移除不安全的 `any` 类型断言，提升类型安全性
- 确保测试覆盖修改后的代码路径

**Non-Goals:**
- 不修改 `StandardMessage` 类型定义（外部 API 保持稳定）
- 不改变流式响应的行为或性能
- 不涉及其他 AI SDK 相关代码的修改（如 embed、tool 等）

## Decisions

### 决策 1: 直接访问字段而非重构整个函数

**选择**: 直接修改字段名访问，不重构 `streamChatCompletion` 函数的整体结构

**理由**:
- 变更范围最小化，降低引入新 bug 的风险
- 当前函数逻辑清晰，无需架构调整
- 快速修复，便于代码审查

**备选方案**: 重构整个类型处理逻辑 → 被否决，因为过度设计且风险高

### 决策 2: 使用可选链和空值合并

**选择**: 使用 `usage.inputTokens ?? 0` 而非 `usage.inputTokens || 0`

**理由**:
- 符合 TypeScript 最佳实践
- 正确处理 `0` 值的情况（虽然 token 数量为 0 不常见）
- 与 AI SDK v6 类型定义保持一致（字段为 `number | undefined`）

### 决策 3: 不添加运行时验证

**选择**: 不添加字段存在性检查的运行时验证代码

**理由**:
- TypeScript 类型系统已在编译时保证类型安全
- AI SDK v6 保证这些字段存在（可能为 `undefined`）
- 保持代码简洁，避免过度防御

## Risks / Trade-offs

**风险 1**: AI SDK 未来版本可能再次更改字段名
- **缓解**: 保持代码模块化，便于未来修改；关注 AI SDK 更新日志

**风险 2**: `usage` 对象可能为 `undefined`
- **缓解**: 已有 `if (usage)` 检查（第 204 行），保持不变

**权衡**: 类型安全 vs. 运行时灵活性
- 我们选择完全依赖类型安全，因为 AI SDK 提供了稳定的类型定义

## Migration Plan

**部署步骤**:
1. 修改 `src/services/chatService.ts` 字段名
2. 运行类型检查 `pnpm tsc` 验证无类型错误
3. 运行测试 `pnpm test:run` 确保功能正常
4. 代码审查和合并

**回滚策略**: 变更仅限于一个文件的几行代码，可直接 Git revert

## Open Questions

无 - 这是一个简单明确的 bug 修复，所有技术决策已在本文档中说明。
