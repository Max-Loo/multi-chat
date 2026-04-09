## Context

`appConfigMiddleware.ts` 使用 `createListenerMiddleware` 注册了 3 个监听器：

1. **语言持久化**（第 11-52 行）—— 已测试 ✓
2. **推理内容配置持久化**（第 57-65 行）—— 已测试 ✓
3. **自动命名开关持久化**（第 70-78 行）—— **未测试 ✗**

第 3 个监听器的 effect 逻辑与前两个模式一致：从 store 读取状态值，持久化到 localStorage。但由于遗漏，测试文件中没有对应的测试用例。

## Goals

- 为 `setAutoNamingEnabled` 监听器补充单元测试
- 测试模式与已有的 `setTransmitHistoryReasoning` 测试保持一致（启用/禁用两个场景）
- 确保 `localStorage.setItem` 被正确调用，key 和 value 均正确

## Non-Goals

- 不修改源码（appConfigMiddleware.ts 无需变更）
- 不解决 V8 覆盖率归因问题（这是工具限制）
- 不重构现有测试结构

## Approach

直接在现有测试文件 `src/__test__/store/middleware/appConfigMiddleware.test.ts` 中新增一个 `describe` 块，参照「推理内容配置的持久化」的测试模式（第 157-193 行）：

```
describe('自动命名开关的持久化', () => {
  it('应该将自动命名开关持久化到 localStorage 当启用时', ...)
  it('应该将自动命名开关持久化到 localStorage 当禁用时', ...)
})
```

每个测试：
1. dispatch `setAutoNamingEnabled(true/false)`
2. `await new Promise(resolve => setTimeout(resolve, 0))` 等待异步 effect
3. 断言 `localStorage.setItem` 被调用，参数为 `LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY` 和 `String(value)`
4. 断言 store 状态更新正确

## Technical Decisions

无需新的技术决策，完全沿用现有测试基础设施。

## Affected Files

| 文件 | 变更类型 |
|------|---------|
| `src/__test__/store/middleware/appConfigMiddleware.test.ts` | 新增测试用例 |

需要额外 import `setAutoNamingEnabled` 和 `LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY`。
