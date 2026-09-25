# Spec Delta

## REMOVED Requirements

### Requirement: createRunningChatEntry 辅助函数

**Reason**: 精简后该函数成为零引用导出（`runningChat` 嵌套状态已由 `createChatSliceState` 的 overrides 直接表达），任务 2.3 随其自测用例一并删除。

**Migration**: 需要 runningChat 嵌套结构时用 `createChatSliceState({ runningChat: { [chatId]: { [modelId]: { isSending, history } } } })` 直接构造。

### Requirement: RunningChatBubble 使用已有状态工厂

**Reason**: 约束对象 `src/__test__/components/RunningChatBubble.test.tsx` 在本变更之前已不存在（git ls-tree main 确认），requirement 失去约束目标；其「store 必须经共享工厂创建」的意图已由 test-suite-slimming 的「测试文件内联工厂必须替换为共享工厂」需求承接。

**Migration**: 无需迁移。RunningChat 相关 UI 若回归，新测试直接使用 `createTypeSafeTestStore` + slice state 工厂组合。
