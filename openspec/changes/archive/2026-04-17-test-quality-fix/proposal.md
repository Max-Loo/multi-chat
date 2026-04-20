## Why

测试质量审查（docs/design/test-quality-review.md）发现 6 个可修复的遗留问题：冗余的内部实现 spy、可消除的 `as any`（6 处可消除 + 1 处因 thunk 未导出保留并加注释）、hook 测试模式不一致（唯一使用 mock dispatch 的用例）、selector 覆盖盲区。这些问题导致测试与实现细节耦合、类型安全缺口、以及测试模式不统一。

## What Changes

- 移除 `useAdaptiveScrollbar.test.ts` 中冗余的 `clearTimeout` spy，改为仅依赖 fake timers + 结果状态断言
- 将 `useTypedSelectedChat.test.tsx` 和 `useIsChatSending.test.ts` 中的内联 action `as any` 替换为 action creator（从 `@/store/slices/chatSlices` 按名称逐个导入）
- 将 `useCreateChat.test.ts` 从 mock dispatch 模式迁移到 `renderHookWithProviders` + 真实 store 模式，与其他 7+ 个 hook 测试保持一致
- 修正 `ModelConfigForm.test.tsx` 中 4 处 `onFinish as any` 的 mock 函数签名
- 减少 `highlightLanguageManager.test.ts` 对 `testInternals` 的直接使用，改为通过公共 API 间接验证
- 为 `src/store/selectors/chatSelectors.ts` 添加单元测试

## Capabilities

### New Capabilities
- `selector-tests`: 为 memoized selector 函数添加单元测试，验证输入-输出映射和 memoization 行为

### Modified Capabilities
- `create-chat-hook-tests`: 将测试策略从 mock dispatch 改为真实 store + renderHookWithProviders，验证完整的数据流
- `test-behavior-not-internals`: 新增关于减少 `testInternals` 依赖和移除冗余平台 API spy 的要求
- `test-type-safety`: 新增关于内联 action 替换和 mock 函数签名修正的要求，更新 `as any` 计数目标

## Impact

- **测试文件**（直接修改）：`useAdaptiveScrollbar.test.ts`、`useTypedSelectedChat.test.tsx`、`useIsChatSending.test.ts`、`useCreateChat.test.ts`、`ModelConfigForm.test.tsx`、`highlightLanguageManager.test.ts`
- **新增测试文件**：`src/__test__/store/selectors/chatSelectors.test.ts`
- **无生产代码变更**：所有改动仅影响测试代码
- **无 breaking change**：测试行为等价，仅改善测试质量和模式一致性
