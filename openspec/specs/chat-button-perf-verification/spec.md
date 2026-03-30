# ChatButton 渲染性能验证

## Purpose

通过构造「优化前」和「优化后」两种模式，在真实 Redux 环境下切换 `selectedChatId`，统计 ChatButton 组件体的实际调用次数和渲染耗时，量化 props 下沉优化的性能收益。性能测试与常规测试隔离，避免 CI 频繁运行。

## Requirements

### Requirement: 渲染次数验证

系统 SHALL 提供两种模式（Legacy 与 Optimized）来量化 `selectedChatId` 切换时的 ChatButton 重渲染次数。

#### Scenario: 优化前模式切换选中时 N 个 ChatButton 全部重渲染
- **WHEN** 使用 Legacy 模式（每个 ChatButton 独立 `useAppSelector(selectedChatId)`）
- **AND** 切换选中聊天
- **THEN** 所有 N 个 ChatButton 均重渲染（初始渲染 + 选中变化各 1 次 = 2 次）
- **AND** 重渲染总数等于 N

#### Scenario: 优化后模式切换选中时仅 2 个 ChatButton 重渲染
- **WHEN** 使用 Optimized 模式（父组件订阅一次，通过 `isSelected` props 下沉）
- **AND** 切换选中聊天
- **THEN** 仅取消选中和新选中的 2 个 ChatButton 重渲染
- **AND** 其余 N-2 个 ChatButton 保持仅初始渲染 1 次
- **AND** 重渲染总数等于 2

### Requirement: 多数据规模验证

系统 SHALL 在不同聊天数量下验证优化前后的渲染次数差异。

#### Scenario: 不同聊天数量的渲染次数对比
- **WHEN** 使用 10、20、50 个聊天的数据规模分别测试
- **THEN** 优化前模式重渲染次数等于聊天数量 N
- **AND** 优化后模式重渲染次数始终为 2

### Requirement: 连续切换稳定性验证

系统 SHALL 验证多次快速切换选中时，优化后的行为始终稳定。

#### Scenario: 连续切换 3 次选中
- **WHEN** 在 Optimized 模式下连续切换选中 3 次（例如 0→5→15→0）
- **THEN** 每次切换仅导致 2 个 ChatButton 重渲染（旧选中取消 + 新选中激活）
- **AND** 未涉及切换的 ChatButton 始终只渲染 1 次

### Requirement: 渲染耗时验证

系统 SHALL 测量优化前后切换选中的总渲染耗时，验证优化没有引入性能退化。

#### Scenario: 优化后耗时不超过优化前
- **WHEN** 在 50 个聊天场景下多次运行（如 10 次取平均）
- **THEN** 优化后的平均渲染耗时不超过优化前的 1.5 倍（允许 50% 测试环境波动容差）

### Requirement: 边界情况验证

系统 SHALL 验证特殊场景下的渲染行为。

#### Scenario: 重复选中同一个聊天
- **WHEN** dispatch 相同的 `selectedChatId` 值
- **THEN** 无论是 Legacy 还是 Optimized 模式，所有 ChatButton 均不重渲染（保持 1 次）

### Requirement: 测试隔离与运行方式

系统 SHALL 将性能验证测试与常规测试隔离。

#### Scenario: 性能测试文件位置
- **WHEN** 性能验证测试需要执行
- **THEN** 测试文件位于 `src/__test__/performance/chat-button-render-count.test.tsx`
- **AND** 通过 `pnpm vitest run src/__test__/performance/` 单独运行
