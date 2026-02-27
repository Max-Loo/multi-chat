## Context

**当前状态**:
`src/hooks/useNavigateToPage.ts` hook 导出了两个方法来处理聊天页面跳转：
- `navigateToChat({ chatId, ...options })` - 跳转到指定聊天，带 `chatId` 查询参数
- `navigateToChatWithoutParams(options)` - 跳转到聊天列表页，无查询参数

**问题分析**:
- 两个方法功能高度相似，仅区别于是否传递 `chatId` 参数
- 违反 DRY 原则，维护成本高
- 命名冗余（`navigateToChatWithoutParams` 过长）
- 调用方式不统一，增加使用复杂度

**约束条件**:
- 必须保持现有的跳转功能不变
- 需要检查项目中是否存在对 `navigateToChatWithoutParams` 的调用（前期搜索结果显示暂无调用）
- 保持 TypeScript 类型安全

**利益相关者**:
- 前端开发团队：使用此 hook 进行页面导航

## Goals / Non-Goals

**Goals:**
- 将两个方法合并为单一的 `navigateToChat` 方法
- 通过可选参数 `chatId?: string` 统一处理两种跳转场景
- 简化 API，提升可维护性和使用体验
- 保持向后兼容性（虽然项目暂无调用，但应设计为向后兼容）

**Non-Goals:**
- 不改变路由结构（仍使用 `/chat` 和 `/chat?chatId=xxx`）
- 不引入新的依赖或库
- 不修改其他 hooks 或组件

## Decisions

### 决策 1: 使用可选参数而非方法重载

**选择**: 将 `chatId` 设为接口的可选属性 `chatId?: string`

**理由**:
- **简洁性**: 单一方法实现，调用直观
- **类型安全**: TypeScript 可选参数提供完整的类型推断
- **可扩展性**: 未来添加新参数（如 `messageId`）只需扩展接口
- **符合 KISS 原则**: 避免不必要的复杂性

**替代方案**:
- 函数重载（TypeScript overloads）：增加代码复杂度，维护成本更高
- 保持两个方法：违反 DRY 原则，无法解决核心问题

### 决策 2: 保留 `NavigateToChatOptions` 接口但修改 `chatId` 为可选

**选择**: 修改现有接口，将 `chatId: string` 改为 `chatId?: string`

**理由**:
- **类型安全**: 接口提供明确的参数类型和可选性
- **向后兼容**: 现有的 `navigateToChat` 调用方式（传入 `{ chatId, ...options }`）仍然有效
- **文档作用**: 接口定义即为 API 文档，IDE 可提供智能提示

**替代方案**:
- 直接使用内联类型参数：降低可读性和可维护性

### 决策 3: 简化实现逻辑

**选择**: 在 `navigateToChat` 方法内部根据 `chatId` 是否存在来决定路由格式

**理由**:
- **单一职责**: 一个方法处理所有场景，逻辑集中
- **易于测试**: 只需测试一个方法的多个分支
- **性能影响**: 可忽略（简单的条件判断）

**实现伪代码**:
```typescript
const navigateToChat = ({ chatId, ...options }: NavigateToChatOptions = {}) => {
  const path = chatId
    ? `/chat?${new URLSearchParams({ chatId }).toString()}`
    : '/chat';
  navigate(path, options);
};
```

### 决策 4: 默认空对象参数

**选择**: 使用 `= {}` 作为默认参数

**理由**:
- **调用灵活性**: 支持无参调用 `navigateToChat()` 和带选项调用 `navigateToChat({ replace: true })`
- **向后兼容**: 保持与原 `navigateToChatWithoutParams(options)` 相同的调用体验
- **符合惯用法**: React hooks 社区常见模式

**示例**:
```typescript
// 无 chatId，无额外选项
navigateToChat()

// 无 chatId，有额外选项
navigateToChat({ replace: true })

// 有 chatId
navigateToChat({ chatId: 'abc-123' })

// 有 chatId，有额外选项
navigateToChat({ chatId: 'abc-123', replace: true })
```

## Risks / Trade-offs

### 风险 1: 破坏性变更（Breaking Change）

**描述**: 如果项目中有代码使用了 `navigateToChatWithoutParams` 方法，删除该方法会导致编译错误。

**风险等级**: 低（前期搜索显示暂无调用）

**缓解措施**:
- ✅ 已完成全局搜索，确认项目中暂无 `navigateToChatWithoutParams` 的调用
- 如果未来发现有调用，提供明确的迁移指南：
  - `navigateToChatWithoutParams()` → `navigateToChat()`
  - `navigateToChatWithoutParams({ replace: true })` → `navigateToChat({ replace: true })`

### 风险 2: API 不明确性

**描述**: 调用者可能不清楚 `chatId` 参数是可选的，需要查看类型定义。

**风险等级**: 极低

**缓解措施**:
- TypeScript 类型系统会在 IDE 中提供智能提示
- 可选参数 `?` 语法在类型定义中清晰可见
- 接口名称 `NavigateToChatOptions` 已表明这是选项对象

### 权衡: 简洁性 vs. 显式性

**选择**: 优先简洁性（合并方法）

**权衡**:
- ✅ 优势: API 更简洁，维护成本更低
- ⚠️ 劣势: 调用时需要查看类型定义才能知道 `chatId` 可选
- **结论**: 简洁性带来的收益远大于略微降低的显式性，TypeScript 类型系统提供了足够的提示

## Migration Plan

### 实施步骤

1. **修改接口定义**:
   - 将 `NavigateToChatOptions` 接口中的 `chatId: string` 改为 `chatId?: string`

2. **重构 `navigateToChat` 方法**:
   - 添加默认参数 `= {}`
   - 在方法内部添加条件判断，根据 `chatId` 是否存在构建不同的路由

3. **删除 `navigateToChatWithoutParams` 方法**:
   - 移除方法实现
   - 从返回对象中移除该导出

4. **更新导出**:
   - 只返回 `{ navigateToChat }`

5. **验证**:
   - 运行 TypeScript 类型检查: `pnpm tsc`
   - 运行 ESLint 检查: `pnpm lint`
   - 运行测试: `pnpm test`

### 回滚策略

**回滚方案**:
- Git 回滚到变更前的提交
- 恢复 `navigateToChatWithoutParams` 方法
- 恢复 `NavigateToChatOptions` 接口的 `chatId` 必填约束

**回滚触发条件**:
- 发现未预期的调用场景
- 类型检查或测试失败
- 引入运行时错误

### 部署检查清单

- [ ] TypeScript 编译无错误
- [ ] ESLint 检查无错误
- [ ] 所有测试通过
- [ ] 全局搜索确认无残留的 `navigateToChatWithoutParams` 调用
- [ ] 手动测试聊天页面跳转功能（开发环境）

## Open Questions

*(无未解决的问题。此重构范围清晰，技术方案明确。)*
