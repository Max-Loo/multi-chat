## Context

项目拥有 171 个测试文件、1958 个测试用例，测试体系整体成熟。深度审查发现 3 个源文件缺少独立测试：

- `useScrollContainer`（hook）—— 完全无测试，包含 DOM 事件绑定/清理逻辑
- `ProviderCardHeader`（组件）—— 无独立测试，被 ProviderCard.test.tsx 间接覆盖部分行为
- `ProviderCardSummary`（组件）—— 无独立测试，被 ProviderCard.test.tsx 间接覆盖部分行为

## Goals / Non-Goals

### Goals

- 为 3 个缺口文件创建独立的单元测试，消除覆盖盲区
- 覆盖各文件的所有可测试行为路径
- 遵循项目现有 BDD 测试规范（"应该 [行为] 当 [条件]"）

### Non-Goals

- 不修改任何业务代码
- 不重构现有测试文件
- 不调整覆盖率阈值
- 不为 shadcn/ui 原子组件补充测试

## Decisions

### 1. useScrollContainer 测试方案

**选择**：使用 `renderHook` + 真实 DOM 容器

`useScrollContainer` 需要将 ref 绑定到真实 DOM 元素才能触发 `addEventListener`。通过 `renderHook` 创建 hook 并手动附加 ref 到测试容器 div，模拟 scroll 事件触发。

**备选**：Mock `addEventListener`/`removeEventListener`——过于侵入，测试的是 mock 而非真实行为。

### 2. ProviderCardHeader / ProviderCardSummary 测试策略

**选择**：独立组件测试，Mock `react-i18next` 和 `ProviderLogo`

每个组件单独 `render` 并验证渲染输出。使用 `globalThis.__mockI18n` 统一 mock i18n，ProviderLogo 使用已有的 mock 工厂。

**备选**：通过 ProviderCard 间接测试——不够显式，无法精确定位组件边界行为。

### 3. 测试文件位置

**选择**：遵循项目现有目录约定

- `src/__test__/hooks/useScrollContainer.test.ts`
- `src/__test__/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardHeader.test.tsx`
- `src/__test__/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardSummary.test.tsx`

## Risks / Trade-offs

- **[Risk] useScrollContainer 测试可能因 happy-dom 事件模拟不完整导致假阴性** → 使用 `vi.spyOn` 直接断言 `addEventListener`/`removeEventListener` 调用作为补充
- **[Risk] ProviderCardSummary 逻辑极简（2 个 prop、1 个条件），测试价值较低** → 仍然补充，保持覆盖完整性，且成本极低（~10 行测试）

## Migration Plan

无迁移需求，纯新增测试文件。

## Open Questions

无。
