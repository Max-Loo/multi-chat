# 规格：Title Model Selector 优化

## 概述

将 `Title` 组件中的 `models` selector 从订阅完整数组改为在 selector 内部精确查找目标模型，消除其他模型数据变化对本组件的干扰。

## 当前行为

```tsx
// Title.tsx:22
const models = useAppSelector((state) => state.models.models);

// Title.tsx:25-27
const currentModel = useMemo(() => {
  return models.find((model) => model.id === chatModel.modelId);
}, [chatModel, models]);
```

两步操作：先订阅整个 `models` 数组（任何模型增删改都会产生新引用），再用 `useMemo(find)` 筛选出目标模型。

## 目标行为

```tsx
const currentModel = useAppSelector((state) =>
  state.models.models.find((model) => model.id === chatModel.modelId)
)
```

将两步合并为单个 `useAppSelector`，在 selector 内部完成查找。

### shallowEqual 的问题

默认情况下 `useAppSelector` 使用 `===` 严格相等比较。如果 `find` 每次返回同一个对象引用（即目标模型未被修改），则不会重渲染，行为正确。但如果 Redux Toolkit 的 Immer 在其他模型修改时重新创建了数组，`find` 可能返回相同引用的同一对象（因为 Immer 对未修改的对象保持引用不变），此时 `===` 比较仍然通过。

**结论**：不需要额外的 `shallowEqual`，`===` 严格比较已经足够。只有目标模型对象本身的引用发生变化（即目标模型被修改）时才会重渲染。

### 内联 selector 的已知 trade-off

内联 selector 每次渲染都会创建新的函数引用。React-Redux（基于 `useSyncExternalStore`）每次都会执行 selector 并用 `===` 比较结果。对于当前 models 数组规模（通常几十个），`find` 的开销可以忽略不计。

如果未来 models 数组增长到较大规模（100+），可以考虑使用 `createSelector` 做 selector memoization。当前无需改动。

## 变更详情

### 删除

- 修改 import 行：`import { memo, useMemo } from "react"` → `import { memo } from "react"`（`useMemo` 仅在此处使用）
- 移除 `const models = useAppSelector(...)` 行
- 移除 `const currentModel = useMemo(...)` 块

### 新增

```tsx
const currentModel = useAppSelector((state) =>
  state.models.models.find((model) => model.id === chatModel.modelId)
)
```

### 保留不变

- `currentModel` 的后续使用代码完全不变
- `isNil(currentModel)` 的错误提示逻辑不变
- `displayName` 计算逻辑不变
- `statusTag` 渲染逻辑不变

## 边界情况

- 模型被删除（`isDeleted: true`）：`find` 仍返回该模型对象，`Title` 正确显示"已删除"Badge
- 模型不存在：`find` 返回 `undefined`，`isNil(currentModel)` 分支正常显示错误 Badge
- `chatModel.modelId` 变化：selector 重新执行，`find` 返回新模型，正确更新

## 受影响的测试

需同步更新 `Title` 相关测试：

- `src/__test__/components/DetailTitle.test.tsx`

测试中需确保 mock store 的 `models` 数组包含测试所需的模型对象。

## 验收标准

- `Title` 组件内部的 `useAppSelector` 不再订阅整个 `models` 数组
- `useMemo` 不再用于模型查找（由 selector 内部 `find` 替代）
- 模型名称、状态 Badge、Tooltip 内容渲染正常
- 模型删除/禁用状态正确显示
- 所有现有测试通过
