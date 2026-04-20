## Context

feat/test 分支测试质量审查（docs/design/test-quality-review.md）识别出 6 个可修复的遗留问题。当前项目有 143 个测试套件、1761 个测试用例，已通过前期重构建立了完善的测试基础设施（`renderHookWithProviders`、`createTypeSafeTestStore`、`createTestRootState`、`asTestType<T>` 等工具）。但仍有少数文件未遵循已建立的规范。

**当前状态**：
- `as any` 从 66 处降至 40 处（其中 20 处为第三方库合理使用，7 处可改进）
- hook 测试中 7+ 个使用真实 store，但 `useCreateChat.test.ts` 仍使用 mock dispatch
- `useAdaptiveScrollbar.test.ts` 的 `clearTimeout` spy 与 fake timers 断言冗余
- `highlightLanguageManager.test.ts` 通过 `testInternals` 测试私有方法
- `src/store/selectors/` 无任何测试

## Goals / Non-Goals

**Goals:**
- 消除 6 处非第三方库原因的 `as any`（内联 action 2 处、onFinish mock 签名 4 处），另有 1 处 `sendMessage/pending` 内联 action 因 thunk 未导出保留 `as any` 并添加注释
- 统一 hook 测试模式，将 `useCreateChat.test.ts` 迁移到真实 store
- 移除 `useAdaptiveScrollbar.test.ts` 中的冗余 spy
- 减少 `highlightLanguageManager.test.ts` 对 `testInternals` 的依赖
- 为 `selectSelectedChat` selector 添加测试

**Non-Goals:**
- 不处理第三方库类型导致的 20 处合理 `as any`
- 不重构 `masterKey.test.ts` 的 spy 模式（当前模式正确）
- 不添加 `src/utils/enums.ts` 的测试（const enum 无需测试）
- 不修改 `verifyIsolation()` 的检查维度
- 不修改生产代码

## Decisions

### D1: useCreateChat 迁移策略 — renderHookWithProviders + 真实 store

**选择**：使用 `renderHookWithProviders` + `createTypeSafeTestStore` 替代 mock `useAppDispatch`。

**替代方案**：保持 mock dispatch 不变。
- 优点：无需修改测试结构
- 缺点：无法验证 reducer 处理，与项目其他 7+ 个 hook 测试模式不一致

**理由**：项目已有成熟的 store 工具链（`renderHookWithProviders`、`createTestRootState`、各 slice 工厂函数），迁移成本低且能验证完整数据流。`createChat` thunk 是异步的，真实 store 能更好地捕捉 reducer 交互问题。

### D2: highlightLanguageManager — 逐步减少而非完全移除 testInternals

**选择**：将 `resolveAlias` 和 `loadingPromises` 的直接测试改为通过公共 API 间接验证，但保留 `_resetInstance()` 和部分 `testInternals` 使用。

**替代方案**：完全移除 `testInternals`。
- 优点：彻底消除内部状态访问
- 缺点：单例模式在当前架构下必须保留某种重置机制，成本高

**理由**：`_resetInstance()` 是单例测试的必要基础设施。`testInternals.resolveAlias` 可以通过 `isLoaded('javascript')` 间接验证（加载 `js` 后检查别名是否生效）。`testInternals.loadingPromises` 可以通过 `loadLanguageModule` 的 mock 调用计数间接验证。`_clearFailedLanguages()` 可以删除（`_resetInstance()` 后实例自动重置）。

### D3: ModelConfigForm onFinish 类型修正 — 调整 mock 函数签名

**选择**：将 `vi.fn()` 替换为符合 `onFinish` prop 签名的正确类型 mock。

**理由**：`onFinish` 期望 `(values: FormValues) => void`，当前 mock 使用 `vi.fn()` 导致 TypeScript 无法推断匹配签名。通过 `vi.fn<(values: FormValues) => void>()` 指定泛型参数即可消除 `as any`。

### D4: selector 测试策略 — 直接测试 memoization 行为

**选择**：为 `selectSelectedChat` 编写测试，验证：不同输入的输出正确性、相同输入的引用稳定性（memoization）。

**理由**：`createSelector` 的 memoization 行为是 selector 的核心价值，手动验证引用稳定性可以防止退化。

## Risks / Trade-offs

- **[风险] useCreateChat 迁移可能暴露 reducer 交互问题** → 缓解：先运行现有测试确认通过，迁移后逐个用例验证
- **[风险] highlightLanguageManager 减少 testInternals 后可能降低测试覆盖率** → 缓解：通过公共 API 的间接测试覆盖相同的逻辑分支
- **[风险] selector 测试依赖 `createSelector` 的内部 memoization 实现** → 缓解：这是 `@reduxjs/toolkit` 的公共行为承诺，不是内部实现细节
- **[已知限制] `useIsChatSending.test.ts` 中 `sendMessage/pending` 内联 action 无法替换为 action creator** → `sendMessage` thunk 是 `chatSlices.ts` 的内部实现（未导出），无法通过 `sendMessage.pending` 生成类型安全 action。该处 `as any` 保留并添加注释说明原因，计入合理 `as any` 数量。
