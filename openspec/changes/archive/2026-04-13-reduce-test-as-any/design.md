## Context

当前项目测试代码中有 194 处 `as any` 类型断言，按场景分为四类：

| 场景 | 数量 | 根因 |
|------|------|------|
| 绕过类型传参（preloadedState、reducer 映射） | ~100 | 缺少类型安全的 RootState 工厂 |
| 访问私有/内部成员（manager.xxx、router.routes） | ~34 | 缺少测试友好的访问接口 |
| 构造不完整 Mock 对象（缺字段的 state） | ~53 | 缺少带默认值的工厂函数 |
| 给 Error 添加额外属性 | ~5 | Error 类型无法扩展 |

现有的 `helpers/mocks/redux.ts` 仅覆盖 ModelSliceState，`helpers/render/redux.tsx` 中的 `createTestStore` 自身也用了 `as any`。各组件测试文件重复定义 `createTestStore` 函数，每个都是独立的 `as any` 来源。

`RootState` 定义在 `src/store/index.ts`，包含 7 个 slice：models、chat、chatPage、appConfig、modelProvider、settingPage、modelPage。

## Goals / Non-Goals

**Goals:**
- 提供类型安全的 `createTestRootState()` 工厂函数，覆盖所有 7 个 slice 的默认值
- 提供类型安全的 `createTypeSafeTestStore()` 工厂函数，消除 reducer 映射的 `as any`
- 提供扩展 Error 类型（`AIError`），消除 `(error as any).statusCode` 模式
- 为 `HighlightLanguageManager` 新增 `@internal` 测试访问器，消除私有成员访问
- 将 194 处 `as any` 减少到 < 40 处（减少 80%）

**Non-Goals:**
- 不追求 100% 消除 `as any`（少量场景下 `as any` 是合理的，如第三方库类型过复杂）
- 不改变测试的业务逻辑和断言内容
- 不修改 `setup.ts` 中的全局 Mock（这些 Mock 针对底层 Tauri/SDK 兼容层，改动风险大收益低）
- 不引入新的测试框架或依赖

## Decisions

### Decision 1：`createTestRootState` 工厂函数

**选择**：创建一个接受 `Partial<RootState>` 的工厂函数，为每个 slice 提供合理的默认值。

**替代方案**：
- A) 每个测试文件自行构造完整 state → 维护成本高，重复代码多
- B) 使用 `DeepPartial<RootState>` 递归部分类型 → 过于复杂，且 Redux 的 `preloadedState` 本身支持 `Partial<RootState>`

**理由**：`Partial<RootState>` 已经是 Redux `configureStore` 的原生支持类型。核心问题是缺少默认值——只需一个函数提供各 slice 的默认值即可。

```typescript
// helpers/mocks/testState.ts
export function createTestRootState(overrides?: Partial<RootState>): RootState {
  return {
    models: createModelSliceState(),
    chat: createChatSliceState(),
    chatPage: createChatPageSliceState(),
    appConfig: createAppConfigSliceState(),
    modelProvider: createModelProviderSliceState(),
    settingPage: { /* 默认值 */ },
    modelPage: { /* 默认值 */ },
    ...overrides,
  };
}
```

### Decision 2：`createTypeSafeTestStore` 工厂函数

**选择**：扩展现有 `helpers/render/redux.tsx` 中的 `createTestStore`，消除其自身的 `as any`，并导出为公共 API。

**理由**：已有 20+ 个文件各自定义 `createTestStore`，存在大量重复。统一到一处既消除 `as any`，也消除重复代码。

**API 设计**：函数接受 `preloadedState` 和可选的 `reducerOverrides`，在保持完整 reducer 映射的同时允许按需替换特定 reducer。

```typescript
/** Reducer 映射类型，与 RootState 的 key 一一对应 */
type ReducerMap = {
  [K in keyof RootState]: Reducer<RootState[K]>;
};

/**
 * 创建类型安全的测试 store
 * @param preloadedState 预加载状态（可选，默认使用各 slice 工厂函数的默认值）
 * @param options.reducerOverrides 自定义 reducer 替换（可选，用于 stub 掉特定 reducer）
 */
export function createTypeSafeTestStore(
  preloadedState?: Partial<RootState>,
  options?: {
    reducerOverrides?: Partial<ReducerMap>;
  }
): EnhancedStore<RootState> {
  const defaultReducers: ReducerMap = {
    models: modelsReducer,
    chat: chatReducer,
    chatPage: chatPageReducer,
    appConfig: appConfigReducer,
    modelProvider: modelProviderReducer,
    settingPage: settingPageReducer,
    modelPage: modelPageReducer,
  };

  return configureStore({
    reducer: {
      ...defaultReducers,
      ...options?.reducerOverrides,
    },
    preloadedState,
  });
}
```

**`reducerOverrides` 使用场景**：

| 场景 | 用法 | 说明 |
|------|------|------|
| Stub 掉 `modelProvider` | `reducerOverrides: { modelProvider: (state) => state }` | 防止中间件副作用 |
| Stub 掉某个 slice | `reducerOverrides: { chat: (state = createChatSliceState()) => state }` | 隔离测试目标 |

**无需 `reducerOverrides` 的场景**：大部分测试只需 `preloadedState` 控制初始状态，让真实 reducer 处理 dispatch。`reducerOverrides` 仅用于需要禁用特定 reducer 副作用的场景（如中间件测试、store 集成测试）。

**类型安全保障**：`reducerOverrides` 的 key 必须是 `keyof RootState`，value 必须是 `Reducer<RootState[K]>` 兼容类型。拼写错误或类型不匹配会在编译期报错。

### Decision 3：`AIError` 扩展类型

**选择**：在 `helpers/mocks/aiSdk.ts` 中定义 `AIError` 接口扩展 `Error`，替代运行时 `as any` 属性注入。

```typescript
interface AIError extends Error {
  statusCode: number;
  response: { status: number; statusText: string; json: () => Promise<any> };
}
```

**理由**：类型在编译期验证，拼写错误会被捕获。

### Decision 4：HighlightLanguageManager 测试访问器

**选择**：在源类中新增 `@internal` 标注的 getter 方法，返回内部状态供测试使用。

**替代方案**：
- A) 使用 `#private` + 测试不访问 → 无法测试内部逻辑
- B) 将内部成员改为 `protected` → 暴露给子类，违反封装意图
- C) 使用 Friend 模式（TypeScript 不支持）

**理由**：`@internal` 是 TypeScript 生态中常用的标记方式，JSDoc `@internal` 在 API 文档中会被标注为内部 API。对生产代码零侵入（不改变公共 API），测试代码获得类型安全访问。

### Decision 5：分批替换策略

**选择**：按模块分批替换，每批可独立验证。顺序：helpers → hooks → store → components → pages → integration。

**理由**：先更新工具层，后续模块可直接使用新 API。避免一次性大范围修改导致难以定位问题。

## Risks / Trade-offs

- **[测试行为可能微妙变化]** `createTestRootState` 的默认值可能与某些测试隐含假设不一致 → 使用 slice 工厂函数的"空/安全"默认值，保持与现有测试行为一致
- **[新增 `@internal` 访问器暴露内部实现]** 源类新增了仅供测试使用的方法 → 标注 `@internal`，开发者文档明确不作为公共 API 使用
- **[大范围修改测试文件]** 约 50 个文件需要修改 → 每批独立 PR，每批内测试必须全部通过
- **[不完全消除]** setup.ts 和少数第三方库类型冲突仍保留 `as any` → 可接受，这些场景下 `as any` 是合理的权衡
