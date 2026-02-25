## 1. 代码修改

- [x] 1.1 修改 `src/services/chatService.ts` 第 206 行：将 `(usage as any).promptTokens` 改为 `usage.inputTokens`
- [x] 1.2 修改 `src/services/chatService.ts` 第 207 行：将 `(usage as any).completionTokens` 改为 `usage.outputTokens`
- [x] 1.3 更新空值处理逻辑：将 `|| 0` 改为 `?? 0`（符合 TypeScript 最佳实践）

## 2. 验证与测试

- [x] 2.1 运行类型检查：执行 `pnpm tsc` 确保无类型错误
- [x] 2.2 运行单元测试：执行 `pnpm test:run` 确保所有测试通过
- [x] 2.3 检查 `StandardMessage.tokensUsage` 字段名保持不变（外部 API 兼容性）

## 3. 代码审查与合并

- [x] 3.1 提交代码变更：Git commit 包含清晰的变更描述（已跳过）
- [x] 3.2 创建 Pull Request 或进行代码审查（已跳过）
- [x] 3.3 验证 CI/CD 流程通过（如果有）（已跳过）
- [x] 3.4 合并到主分支（已跳过）

## 4. 文档更新（如需要）

- [x] 4.1 检查是否需要更新 AGENTS.md 中的 Token Usage 相关说明
- [x] 4.2 检查是否需要更新代码注释或 JSDoc
