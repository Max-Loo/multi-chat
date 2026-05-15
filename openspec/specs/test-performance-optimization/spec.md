## MODIFIED Requirements

### Requirement: resourceLoader retry 测试评估 fakeTimers
测试 SHALL 评估使用 `vi.useFakeTimers()` 替代真实等待来测试 retry 延迟行为。

#### Scenario: fakeTimers 验证重试间隔
- **WHEN** 使用 `vi.useFakeTimers()` 测试 retry 逻辑（当前真实等待 ~900ms）
- **THEN** 验证重试次数和间隔正确，无需真实等待

### Requirement: ProviderCardDetails UI 测试评估 fakeTimers
测试 SHALL 评估使用 `vi.useFakeTimers()` 替代真实 `setTimeout` 等待来测试 UI 渲染过渡。

#### Scenario: fakeTimers 验证 UI 过渡
- **WHEN** 使用 `vi.useFakeTimers()` 测试 UI 渲染过渡（当前真实等待 ~750ms）
- **THEN** 验证 UI 状态变化正确，无需真实等待
