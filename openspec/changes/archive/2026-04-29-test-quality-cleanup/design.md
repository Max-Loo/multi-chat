## Context

项目有 177 个测试文件，行覆盖率 87.81%。经过审查，发现部分测试只执行代码但不验证行为，虚增覆盖率数字但不提供回归保护。

本次变更的目标是清理 5 个测试文件中的伪测试、重复测试和弱断言，为后续分支覆盖补强（变更 2）建立干净基线。

## Goals / Non-Goals

**Goals:**

- 删除零行为价值的测试用例（泛型重复、DOM 重复查询）
- 重写仅有隐式断言的测试，补充具体行为验证
- 修复守卫空转测试，确保断言必定执行
- 加强弱断言，替换为精确断言

**Non-Goals:**

- 不新增测试用例（那是变更 2 的工作）
- 不调整覆盖率阈值
- 不引入新的测试工具或框架
- 不修改被测源代码

## Decisions

### 决策 1：删除 vs 重写

**原则**：如果一个测试删除后不影响任何真实回归保护，直接删除；如果测试意图有价值但断言不足，重写。

**具体处理**：

| 文件 | 决策 | 理由 |
|------|------|------|
| `useDebounce.test.ts` 泛型测试（89-155 行） | 删除 | TypeScript 泛型在运行时被擦除，4 个测试走完全相同的 JS 路径 |
| `Layout.test.tsx` "正确渲染组件"（43-47 行） | 重写 | 渲染测试有价值，但需断言具体结构而非仅 `getByTestId` |
| `Layout.test.tsx` "渲染主内容区域"（49-53 行） | 重写 | 需验证 main 区域的存在性和位置 |
| `Layout.test.tsx` "应用正确的布局结构"（55-59 行） | 删除 | `children.length > 0` 对任何有子元素的组件都成立 |
| `Layout.test.tsx` Sidebar 位置测试（91-108 行） | 删除 | 与 70-78 行的"桌面端应有 Sidebar 和主内容区域并排"测试验证同一件事 |
| `Layout.test.tsx` "处理空 className"（142-146 行） | 重写 | 边界条件有价值，但需断言空 className 不影响渲染 |
| `Splitter.test.tsx` "应用正确的容器样式"（56-59 行） | 重写 | 标题说样式但未检查样式，应改为验证实际行为 |
| `ChatPanel.test.tsx` 增加列数（151-162 行） | 重写 | 去掉 `if (initialValue < 3)` 守卫，用 `modelCount > 1` 的场景确保断言执行 |
| `ChatPanel.test.tsx` 减少列数（163-175 行） | 重写 | 同上，去掉 `if (initialValue > 1)` 守卫 |
| `ChatPanel.test.tsx` "组件结构和布局" 3 个测试（263-281 行） | 删除 | 与首测（85-91 行）重复验证 `chat-panel` 存在性 |
| `ChatPanel.test.tsx` "处理空的 chatModelList"（284-288 行） | 重写 | 应验证空列表下的具体行为，不仅检查存在性 |
| `ChatPanel.test.tsx` "处理未命名的聊天"（290-294 行） | 重写 | 应验证空名称的显示行为 |
| `useBasicModelTable.test.tsx` 筛选测试（80-102 行） | 重写 | `toBeLessThanOrEqual` 在筛选失效时也通过 |
| `useBasicModelTable.test.tsx` 3 模型渲染测试（121-138 行） | 删除 | 与 2 模型测试（65-78 行）走相同代码路径，只是数量不同 |

### 决策 2：Layout 测试重写策略

Layout 组件的核心行为是 `isMobile` 条件渲染（Sidebar vs BottomNav）。当前测试只在桌面端浅尝辄止，移动端只测了一个用例。

**重写方案**：合并渲染测试为两个专注的 describe 块：

```
describe('桌面端布局')
  - 渲染 Sidebar，不渲染 BottomNav
  - Sidebar 在 main 之前（DOM 顺序）
  - 支持 className

describe('移动端布局')
  - 不渲染 Sidebar，渲染 BottomNav
  - main 是第一个子元素
  - 底部导航存在且有正确的 ARIA
```

这样每个测试都有明确的断言，且桌面/移动端的核心差异被覆盖。

### 决策 3：ChatPanel 守卫空转修复

问题：`if (initialValue < 3)` 守卫让测试在特定条件下空转。

**方案**：不使用 `if` 守卫。直接构造必定触发断言的测试数据。例如：

- 增加列数：用 `renderChatPanel(3)` 然后先减到 2，再增到 3
- 减少列数：用 `renderChatPanel(3)` 直接减少，因为 `initialValue = 3 > 1`

### 决策 4：弱断言加强原则

**useBasicModelTable 筛选测试**：`toBeLessThanOrEqual(initialCount)` → 改为断言具体筛选结果。

```
之前：expect(length).toBeLessThanOrEqual(initialCount)
之后：expect(length).toBe(1)
      expect(result[0].nickname).toBe('GPT-4')
```

## Risks / Trade-offs

- **覆盖率数字下降 1-2%** → 这是预期内的，删除伪测试必然导致。可接受，因为剩余测试的保护力不变。
- **重写可能引入新问题** → 每个重写的测试必须在修改后通过 `pnpm test:run` 验证。
- **Layout 测试合并可能遗漏** → 合并前确认被删测试没有覆盖独有的行为分支。
