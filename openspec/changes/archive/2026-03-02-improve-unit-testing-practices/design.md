# 技术设计：改进单元测试实践

## Context

### 当前状态

项目的测试数量较多（共约 95 个测试文件），但符合最佳实践的程度约为 65%，存在严重的质量问题：

1. **过度 Mock 内部实现**
   - 组件测试中 Mock 子组件（如 `ChatPage.test.tsx` Mock 了 `ChatButton`、`ChatBubble` 等）
   - Hooks 测试中测试内部函数调用（如 `useDebounce.test.ts` 测试 `clearTimeout` 调用次数）
   - 测试与实现细节强耦合，重构时频繁失败

2. **测试目录结构不合理**
   - 机械照搬 `src/` 目录结构（`components/`、`hooks/`、`pages/`、`store/`）
   - 导致测试关注"每个函数是否被测试"，而非"每个行为是否被测试"

3. **测试策略不一致**
   - 服务层测试（`chatService.test.ts`）正确 Mock 系统边界
   - 但组件测试过度 Mock 内部组件
   - 缺乏统一的测试隔离和 Mock 策略指南

4. **集成测试覆盖不足**
   - 现有的 `chat-flow.integration.test.ts` 质量很好
   - 但覆盖范围有限，需要扩展更多端到端场景

### 约束条件

- 必须保持测试覆盖率不下降（目标：≥ 当前覆盖率）
- 测试运行时间可接受（目标：单次测试运行 < 2 分钟）
- 不能引入新的外部依赖（除非必要）
- 必须与现有的测试框架（Vitest）兼容

### 利益相关者

- 开发团队：需要测试易于维护、重构友好
- QA 团队：需要测试能够真正捕获回归问题
- 项目维护者：需要测试文档清晰，新开发者易于理解

## Goals / Non-Goals

**Goals:**
- 将测试从"测试实现"转向"测试行为"，提升测试质量和可维护性
- 建立统一的测试隔离和 Mock 策略指南，避免过度 Mock
- 重构测试目录结构，按功能/行为组织，而非文件结构
- 提升集成测试覆盖，捕获更多真实场景的问题
- 确保测试在重构时保持稳定，降低维护成本

**Non-Goals:**
- 不追求 100% 测试覆盖率（保持当前覆盖率或略微提升）
- 不重构业务代码本身（仅重构测试代码）
- 不引入新的测试框架或工具（继续使用 Vitest）
- 不改变测试命名语言（保持中文命名）

## Decisions

### 决策 1：移除组件测试中的子组件 Mock

**选择**：完全移除子组件 Mock，测试完整组件树

**理由**：
- ✅ 测试真实用户行为（渲染完整 UI）
- ✅ 重构友好（重命名、移动组件不会导致测试失败）
- ✅ 捕获集成问题（组件间交互错误）
- ⚠️ 测试运行时间略微增加（可接受）

**替代方案**：
- 保留部分 Mock（如 Mock 耗时组件）→ ❌ 违背"测试行为"原则
- 仅使用浅渲染（Shallow Rendering）→ ❌ React Testing Library 不推荐

### 决策 2：Hooks 测试改为测试行为

**选择**：不测试内部函数调用，改为测试行为结果

**理由**：
- ✅ 测试关注"做了什么"，而非"怎么做"
- ✅ 重构友好（改变内部实现不影响测试）
- ⚠️ 可能需要更多测试用例覆盖边界情况

**示例**：
```typescript
// ❌ 当前：测试实现细节
it('应该在组件卸载时清理定时器', () => {
  const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
  const { unmount } = renderHook(() => useDebounce('value', 500));
  unmount();
  expect(clearTimeoutSpy).toHaveBeenCalled();
});

// ✅ 改进：测试行为
it('应该延迟更新值', () => {
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'initial', delay: 500 } }
  );
  rerender({ value: 'updated', delay: 500 });
  expect(result.current).toBe('initial'); // 未延迟，值未更新
  act(() => vi.advanceTimersByTime(500));
  expect(result.current).toBe('updated'); // 延迟后，值已更新
});
```

### 决策 3：按功能重构测试目录结构

**选择**：从按文件结构组织改为按功能/行为组织

**理由**：
- ✅ 测试聚焦于"验证功能"，而非"覆盖文件"
- ✅ 易于找到相关测试（如"聊天管理"功能的所有测试在一个文件）
- ✅ 促进编写集成测试（自然地测试完整功能）

**新结构示例**：
```
src/__test__/
├── e2e/                          # 端到端测试
│   ├── chat-flow.test.ts         # 完整聊天流程
│   ├── model-management.test.ts  # 模型管理流程
│   └── user-auth.test.ts         # 用户认证流程
├── components/                   # 保留：简单组件测试（如 Button）
│   └── Button.test.tsx
├── hooks/                        # 保留：独立 hooks 测试
│   └── useDebounce.test.ts
└── services/                     # 保留：服务层测试
    └── chatService.test.ts
```

### 决策 4：Redux 测试策略调整

**选择**：减少 Redux 单元测试，增加集成测试覆盖

**理由**：
- ✅ Redux 是内部实现细节，用户不直接感知
- ✅ 集成测试可以同时验证 Redux + UI 行为
- ✅ 减少重复测试（单元测试和集成测试测试同一行为）

**具体做法**：
- 保留关键的 Redux reducer 测试（如复杂状态转换）
- 删除简单的状态设置测试（如 `setLoading`）
- 更多依赖集成测试验证完整用户流程

### 决策 5：Mock 策略明确化

**选择**：仅 Mock 系统边界，不 Mock 内部实现

**系统边界定义**：
- ✅ 网络 API 调用（fetch、axios）
- ✅ 文件系统 I/O（fs、IndexedDB）
- ✅ 第三方服务（Stripe、OpenAI API）
- ✅ 时间/定时器（Date、setTimeout）- 仅在必要时
- ✅ 随机数生成

**内部实现（不 Mock）**：
- ❌ React 组件（子组件、Hooks）
- ❌ Redux store/selectors
- ❌ 工具函数
- ❌ 内部模块

### 决策 6：集成测试扩展

**选择**：扩展 `chat-flow.integration.test.ts`，增加更多端到端场景

**新增场景**：
1. **模型管理流程**：创建模型 → 编辑模型 → 删除模型
2. **设置变更流程**：修改语言 → 修改推理开关 → 验证持久化
3. **多轮对话流程**：连续发送多条消息 → 验证上下文管理
4. **错误恢复流程**：API 失败 → 重试 → 成功

**理由**：
- ✅ 捕获单元测试无法发现的集成问题
- ✅ 提升发布信心
- ✅ 文档化用户使用场景

## Risks / Trade-offs

### 风险 1：测试运行时间增加

**描述**：移除子组件 Mock 后，测试运行时间可能增加 20-50%

**缓解措施**：
- ✅ 使用 Vitest 的并行测试功能
- ✅ 仅对关键测试使用完整渲染，简单组件保持浅渲染
- ✅ 监控测试运行时间，设置性能阈值（< 2 分钟）

### 风险 2：测试失败诊断困难

**描述**：完整组件树测试失败时，可能难以定位问题根源

**缓解措施**：
- ✅ 使用 `data-testid` 标记关键元素，提高断言精度
- ✅ 提供清晰的测试错误消息（使用自定义 matcher）
- ✅ 保留少量关键组件的单元测试（如复杂计算逻辑）

### 风险 3：重构工作量较大

**描述**：需要重构约 15-25 个测试文件

**缓解措施**：
- ✅ 分阶段进行（优先重构最脆弱的测试）
- ✅ 使用自动化工具辅助（如 codemod 移除 Mock）
- ✅ 在重构过程中保持测试覆盖率

### 风险 4：团队学习曲线

**描述**：新的测试实践需要团队学习和适应

**缓解措施**：
- ✅ 编写测试指南文档（作为新增能力的一部分）
- ✅ 提供 before/after 对比示例
- ✅ 在 PR review 中强制执行新标准

## Migration Plan

### 阶段 1：基础设施准备（1-2 天）

1. **更新测试指南文档**
   - 文件：`src/__test__/README.md`（已存在，需扩充内容）
   - 新增内容：
     - 行为驱动测试原则章节
     - 测试隔离和 Mock 策略详细说明
     - 测试目录结构重组说明
     - Before/After 对比示例
     - 常见反模式和解决方案

2. **更新测试辅助工具**
   - 添加通用测试 utils（如 `createTestStore`、`renderWithProviders`）
   - 统一测试 fixtures

3. **设置性能基准**
   - 记录当前测试运行时间
   - 设置性能阈值（< 2 分钟）

### 阶段 2：重构高优先级测试（3-5 天）

**优先级排序**：
1. **最高优先级**（最脆弱的测试）：
   - `ChatPage.test.tsx`
   - `useDebounce.test.ts`
   - `useExistingModels.test.tsx`

2. **高优先级**：
   - 其他组件测试（`ChatSidebar.test.tsx`、`ModelTable.test.tsx`）
   - Redux 测试（`modelSlice.test.ts`、`chatSlices.test.ts`）

3. **中优先级**：
   - Hooks 测试（`useNavigateToPage.test.ts`、`useIsChatSending.test.ts`）
   - 工具函数测试（大部分已符合，少量调整）

**重构流程**（每个测试文件）：
1. 识别需要移除的 Mock
2. 重写测试用例（测试行为而非实现）
3. 运行测试确保通过
4. 记录测试运行时间
5. 提交 PR 并 review

### 阶段 3：扩展集成测试（2-3 天）

1. **新增集成测试文件**：
   - `model-management.integration.test.ts`
   - `settings-change.integration.test.ts`
   - `multi-turn-conversation.integration.test.ts`

2. **迁移部分单元测试到集成测试**
   - 将复杂的 Redux + UI 交互测试移至集成测试
   - 删除冗余的单元测试

### 阶段 4：清理和优化（1-2 天）

1. **删除冗余测试**
   - 删除重复覆盖同一行为的测试
   - 删除测试实现细节的测试

2. **统一测试命名**
   - 确保所有测试使用"应该 [预期行为] 当 [条件]"格式

3. **更新文档**
   - 更新 `src/__test__/README.md`，添加新的测试实践章节
   - 在主 `README.md` 中确认测试部分存在并链接到测试文档
   - 在 `AGENTS.md` 中确认测试文档引用正确

### 阶段 5：验证和发布（1 天）

1. **验证测试覆盖率**
   - 运行 `pnpm test:coverage`
   - 确保覆盖率 ≥ 当前水平

2. **验证测试运行时间**
   - 运行 `pnpm test`
   - 确保运行时间 < 2 分钟

3. **发布**
   - 合并所有 PR
   - 创建 release notes
   - 通知团队新的测试实践

**总工期估算**：8-13 天

**受影响测试文件数量**：
- 需要重构的测试文件：约 15-25 个
- 最高优先级：3 个（ChatPage.test.tsx、useDebounce.test.ts、useExistingModels.test.tsx）
- 高优先级：7 个（组件测试 4 个 + Redux 测试 3 个）
- 中优先级：9 个（Hooks 测试 5 个 + 工具函数测试 4 个审查）

**回滚策略**：
- 每个阶段独立分支，可随时回滚
- 使用 Git feature flag 控制新测试启用
- 保留旧测试作为参考，直到新测试稳定

## Open Questions

1. **Q**: 是否需要引入新的测试工具（如 `@testing-library/user-event` 已有，是否需要其他）？
   - **A**: 当前工具足够，暂不需要引入新依赖

2. **Q**: 测试运行时间阈值如何设定？
   - **A**: 当前测试运行时间约 X 秒，建议阈值为 2 分钟（120 秒），超出则报警

3. **Q**: 是否需要 100% 符合新标准才允许合并？
   - **A**: 不需要。新代码必须符合标准，旧代码逐步重构。在 PR review 中强制执行新标准。

4. **Q**: 如何处理第三方组件库（如 `@ant-design/x`）的 Mock？
   - **A**: 第三方组件库属于系统边界，可以继续 Mock，但应优先测试完整行为。仅在性能问题时才 Mock。
