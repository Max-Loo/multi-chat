## Context

当前项目使用 `StandardMessage` 接口表示聊天消息，其中包含 `tokensUsage` 字段用于记录 token 消耗量。该字段使用 `completion` 和 `prompt` 命名，与 Vercel AI SDK 返回的 `usage.inputTokens` 和 `usage.outputTokens` 不一致，导致在 `chatService.ts` 中需要额外的字段映射逻辑。

相关约束：
- **依赖**: Vercel AI SDK (@ai-sdk/deepseek, @ai-sdk/moonshotai 等) 返回 `usage` 对象
- **存储**: 聊天消息持久化在 Tauri Store（桌面端）或 IndexedDB（Web 端）
- **类型安全**: TypeScript strict mode 已启用
- **测试**: 需要确保所有使用该类型的组件和测试代码正确更新

## Goals / Non-Goals

**Goals:**
- 统一 token 使用量的类型命名，使其与 Vercel AI SDK 保持一致
- 简化 `chatService.ts` 中的响应转换逻辑，消除字段映射
- 确保向后兼容性，平滑迁移已存储的旧数据
- 保持类型安全，避免运行时错误

**Non-Goals:**
- 不修改 token 计算逻辑（仅修改字段名称）
- 不改变聊天消息的其他字段或结构
- 不添加新的 token 统计功能（如缓存 token 追踪）

## Decisions

### 1. 类型定义命名策略

**决策**: 使用 `usage` 作为属性名，`inputTokens` 和 `outputTokens` 作为字段名。

**理由**:
- 与 Vercel AI SDK 返回的 `usage` 对象完全一致
- `inputTokens` 和 `outputTokens` 比 `prompt` 和 `completion` 更语义化
- 消除 `chatService.ts` 中的字段映射逻辑

**替代方案**:
- 保留 `tokensUsage` 但修改内部字段名 → 仍需维护不一致的命名
- 使用自定义名称（如 `tokenStats`）→ 增加与主流 SDK 的差异

### 2. 字段可选性

**决策**: `usage` 字段保持可选（`usage?`），与原 `tokensUsage?` 一致。

**理由**:
- 并非所有消息都包含 token 使用信息（如用户消息）
- 保持向后兼容，避免破坏现有代码
- Vercel AI SDK 在某些情况下可能不返回 usage 数据

### 3. cached 字段处理

**决策**: 移除 `cached` 可选字段。

**理由**:
- 当前代码中未使用 `cached` 字段
- Vercel AI SDK 返回的 `usage` 对象不包含 `cached` 字段
- 简化类型定义，避免冗余字段

## Risks / Trade-offs

### Risk 1: 旧数据丢失
### Risk 1: 第三方组件破坏
**风险**: 如果有外部组件或插件依赖 `tokensUsage` 字段，重构后可能失效。

**缓解措施**:
- 全局搜索代码库中所有 `tokensUsage` 引用
- 更新所有内部组件（聊天界面、统计面板等）
- 在代码注释中明确标记为 BREAKING CHANGE

### Risk 2: 类型检查失败
**风险**: TypeScript 编译可能因未更新的引用而失败。

**缓解措施**:
- 运行 `pnpm tsc` 确保类型检查通过
- 使用编辑器的 "Find All References" 功能定位所有使用点
- 确保 `chatService.ts` 的转换逻辑正确处理新字段

## Migration Plan

### Phase 1: 类型定义更新
1. 修改 `src/types/chat.ts` 中的 `StandardMessage` 接口
2. 将 `tokensUsage` 重命名为 `usage`
3. 将内部字段 `prompt` → `inputTokens`，`completion` → `outputTokens`
4. 移除 `cached` 字段

### Phase 2: 核心服务更新
1. 更新 `src/services/chatService.ts`：
   - 修改 `streamChatCompletion` 函数的响应转换逻辑
   - 直接映射 `response.usage` 到 `message.usage`，移除字段名转换
   - 确保正确提取 `inputTokens` 和 `outputTokens`

### Phase 3: 组件和测试更新
1. 全局搜索 `tokensUsage`，替换为 `usage`
2. 更新聊天界面、统计面板等组件的字段访问
3. 更新所有测试代码中的 Mock 数据
4. 运行 `pnpm tsc` 和 `pnpm test` 确保无破坏

### Phase 4: 验证和清理
1. 手动测试聊天功能，确认 token 统计正确
2. 全局搜索确认无残留 `tokensUsage` 引用
3. 更新文档（README.md 中涉及类型的说明，如有）

### 回滚策略
如果发现严重问题：
1. 回滚类型定义到 `tokensUsage`
2. 回滚 `chatService.ts` 的转换逻辑
3. 发布补丁版本修复问题

## Open Questions

1. **Q**: 如何处理 `cached` 字段的历史数据？
   - **A**: 忽略该字段，新类型定义中不包含对应项。
