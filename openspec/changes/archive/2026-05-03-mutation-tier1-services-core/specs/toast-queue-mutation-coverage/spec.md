## ADDED Requirements

### Requirement: 变异测试 SHALL 验证 flush 队列刷新间隔精度
测试套件 SHALL 杀死 `setTimeout(resolve, 500)` 的数值变异体，需验证 toast 在 500ms 前**未**显示。

#### Scenario: 队列消息按 500ms 间隔逐个显示
- **WHEN** 队列中有 2 条消息，调用 `markReady`
- **THEN** SHALL 第一条立即显示，499ms 时第二条**未**显示，500ms 时第二条显示

#### Scenario: flush 期间新消息立即显示
- **WHEN** flush 正在执行时调用新的 toast 方法
- **THEN** SHALL 新消息立即显示（因为 toastReady 已为 true）

### Requirement: 变异测试 SHALL 验证 reset 重置全部状态
测试套件 SHALL 杀死 `reset` 中状态清除的变异体。

#### Scenario: reset 清空队列和就绪状态
- **WHEN** 调用 `toastQueue.reset()`
- **THEN** SHALL 清空队列、设置 toastReady=false、设置 isMobile=undefined
