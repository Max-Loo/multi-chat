# Proposal: 添加自定义 Hooks 测试

## Why

当前项目中有 10 个自定义 Hooks 完全没有测试覆盖（0% 覆盖率），这些 Hooks 在应用的各个核心功能中被广泛使用（防抖、确认对话框、导航、数据获取等）。缺少单元测试会导致潜在的功能回归风险，也阻碍了代码重构和优化的信心。为这些核心 Hooks 添加测试可以将项目整体测试覆盖率从 49.63% 提升至 65% 以上，显著提升代码质量和可维护性。

## What Changes

为以下 10 个自定义 Hooks 添加完整的单元测试：

1. **useDebounce** - 测试防抖逻辑、定时器清理、值更新延迟
2. **useConfirm** - 测试确认对话框的显示、确认/取消回调、Context Provider
3. **useNavigateToPage** - 测试页面导航功能、参数传递
4. **useCurrentSelectedChat** - 测试当前选中聊天的选择器逻辑
5. **useExistingChatList** - 测试已有聊天列表的数据获取
6. **useExistingModels** - 测试已有模型的数据获取
7. **useAdaptiveScrollbar** - 测试自适应滚动条的行为
8. **useBasicModelTable** - 测试模型表格的 Hook 逻辑
9. **useNavigateToExternalSite** - 测试外部站点导航功能
10. **redux.ts** - 测试 Redux 类型化 Hooks（useAppSelector、useAppDispatch）

每个 Hook 的测试将包括：
- 正常使用场景测试
- 边界情况测试
- 错误处理测试（如果适用）
- Hooks 生命周期测试（mount、update、unmount）

## Capabilities

### New Capabilities

- **custom-hooks-testing**: 为所有自定义 Hooks 添加完整的单元测试覆盖，确保核心业务逻辑的正确性和稳定性

### Modified Capabilities

无（此变更仅添加测试，不修改现有功能的行为）

## Impact

**影响的代码**：
- 新增测试文件：`src/__test__/hooks/*.test.ts`（约 10 个文件）
- 被测试的源文件：`src/hooks/*.ts` 和 `src/hooks/*.tsx`（10 个文件）

**依赖变化**：
- 无新增依赖（使用现有的测试框架：Vitest + React Testing Library）

**测试覆盖率提升**：
- 当前覆盖率：49.63%
- 预期覆盖率：65%+
- 新增测试数：30-40 个测试用例

**系统影响**：
- 提高代码重构的信心
- 防止功能回归
- 提升代码可维护性
