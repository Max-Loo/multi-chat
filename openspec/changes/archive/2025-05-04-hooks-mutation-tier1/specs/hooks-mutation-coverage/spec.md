## Purpose

P0 级 Hook（useConfirm、useBasicModelTable、useResetDataDialog、useAdaptiveScrollbar、useAutoResizeTextarea、useMediaQuery）的变异测试覆盖要求，确保通过 Stryker 变异测试验证测试套件对代码变异的检测能力。

## ADDED Requirements

### Requirement: useConfirm 变异测试覆盖

`useConfirm.tsx` 的变异测试 SHALL 覆盖以下关键逻辑路径：

1. **Context 空/非空路径**: `useConfirm` 在 `ConfirmProvider` 内外使用的行为差异 SHALL 有独立测试
2. **confirm 与 warning 分支**: `modal.confirm()` 和 `modal.warning()` 各自的状态设置路径 SHALL 分别验证
3. **回调函数调用**: `onOk` 和 `onCancel` 回调在确认/取消操作后 SHALL 被正确触发或跳过
4. **国际化文本**: 对话框标题、按钮文本的 i18n key 引用 SHALL 被验证，确保 StringLiteral 变异虽已排除但文本逻辑正确
5. **状态重置**: 对话框关闭后所有内部状态 SHALL 恢复到初始值

#### Scenario: confirm 和 warning 走不同分支
- **WHEN** 分别调用 `modal.confirm()` 和 `modal.warning()`
- **THEN** 对话框渲染内容（标题、描述、按钮样式）SHALL 不同，验证两个分支都被测试覆盖

#### Scenario: Context 外使用抛出错误
- **WHEN** 在 `ConfirmProvider` 外部调用 `useConfirm`
- **THEN** SHALL 抛出 Context 未定义错误，测试验证错误边界

#### Scenario: 确认后状态重置
- **WHEN** 用户确认对话框并回调执行完成
- **THEN** `isDialogOpen` SHALL 为 false，内部状态 SHALL 恢复初始值

### Requirement: useBasicModelTable 变异测试覆盖

`useBasicModelTable.tsx` 的变异测试 SHALL 覆盖以下关键逻辑路径：

1. **过滤算法**: `nickname`、`providerName`、`modelName`、`remark` 四字段的模糊匹配逻辑 SHALL 各自有独立测试数据
2. **大小写不敏感**: 过滤 SHALL 忽略大小写，必须同时测试大写、小写、混合大小写输入
3. **isDeleted 过滤**: 已删除模型 SHALL 被排除，过滤后的结果 SHALL 不包含 `isDeleted: true` 的条目
4. **列定义完整性**: 返回的列数组 SHALL 包含所有必需列（nickname、providerKey、modelName、updateAt、createdAt、remark）

#### Scenario: 四字段独立过滤
- **WHEN** 输入过滤文本匹配 `nickname` 但不匹配其他三个字段
- **THEN** 结果 SHALL 仅包含 nickname 匹配的模型，验证过滤逻辑覆盖所有字段

#### Scenario: 大小写不敏感过滤
- **WHEN** 模型名称为 "GPT-4" 且过滤文本为 "gpt-4"
- **THEN** 结果 SHALL 包含该模型，验证 `toLowerCase` 调用未被变异跳过

#### Scenario: 已删除模型被排除
- **WHEN** 列表中存在 `isDeleted: true` 的模型
- **THEN** 过滤前的数据集 SHALL 已排除已删除模型

### Requirement: useResetDataDialog 变异测试覆盖

`useResetDataDialog.tsx` 的变异测试 SHALL 覆盖以下关键逻辑路径：

1. **异步成功路径**: `resetAllData()` 成功后 SHALL 调用 `window.location.reload()`
2. **异步失败路径**: `resetAllData()` 抛出异常后 SHALL 恢复 `isResetting` 和 `isDialogOpen` 状态，并记录错误
3. **并发防护**: `isResetting` 为 true 时确认按钮 SHALL 被禁用，`handleConfirmReset` SHALL 不重复调用 `resetAllData`
4. **对话框状态管理**: `openDialog` 和 `closeDialog` SHALL 正确切换 `isDialogOpen`

#### Scenario: 重置失败后状态恢复
- **WHEN** `resetAllData()` 抛出异常
- **THEN** `isResetting` SHALL 恢复为 false，`isDialogOpen` SHALL 恢复为 false，且 `window.location.reload` SHALL 未被调用

#### Scenario: 并发防护阻止重复调用
- **WHEN** 快速连续点击确认按钮（`isResetting` 仍为 true）
- **THEN** `resetAllData` SHALL 仅被调用一次

### Requirement: useAdaptiveScrollbar 变异测试覆盖

`useAdaptiveScrollbar.ts` 的变异测试 SHALL 覆盖以下关键逻辑路径：

1. **定时器管理**: 连续滚动时 SHALL 清除前一个定时器并重新开始计时
2. **CSS 类名切换**: `scrollbar-none`（默认）与 `scrollbar-thin`（滚动中）SHALL 根据状态正确切换
3. **自定义延迟**: `hideDebounceMs` 参数 SHALL 被正确使用，默认值 500ms SHALL 有效
4. **null 检查**: `isNull` 对定时器引用的检查 SHALL 覆盖 null 和非 null 两种路径

#### Scenario: 连续滚动重置定时器
- **WHEN** 在 300ms 内连续触发 3 次 scroll 事件
- **THEN** SHALL 只在最后一次滚动后经过 `hideDebounceMs` 才切换回 `scrollbar-none`

#### Scenario: 自定义延迟生效
- **WHEN** 传入 `hideDebounceMs: 1000`
- **THEN** 滚动后 SHALL 在 1000ms 后隐藏滚动条，而非默认的 500ms

#### Scenario: 定时器引用 null 检查
- **WHEN** 首次触发滚动（定时器引用为 null）
- **THEN** SHALL 正确创建新定时器而不尝试清除 null 引用

### Requirement: useAutoResizeTextarea 变异测试覆盖

`useAutoResizeTextarea.ts` 的变异测试 SHALL 覆盖以下关键逻辑路径：

1. **高度 clamp 逻辑**: `scrollHeight` 在 `minHeight` 和 `maxHeight` 之间的约束 SHALL 被验证
2. **isScrollable 状态**: 超过 `maxHeight` 时 `isScrollable` SHALL 为 true，否则为 false
3. **高度回缩**: 值从多行变为单行时高度 SHALL 回缩到 `minHeight`
4. **动态参数变更**: `maxHeight` 参数动态变化时 SHALL 重新计算 `isScrollable`

#### Scenario: 高度被 clamp 到 maxHeight
- **WHEN** `scrollHeight` 为 300 且 `maxHeight` 为 192
- **THEN** 实际高度 SHALL 为 192，`isScrollable` SHALL 为 true

#### Scenario: 高度回缩到 minHeight
- **WHEN** 值从多行文本变为空字符串
- **THEN** 高度 SHALL 回缩到 `minHeight`（默认 60px）

#### Scenario: 动态 maxHeight 触发重算
- **WHEN** `maxHeight` 从 192 变为 100 且当前 `scrollHeight` 为 150
- **THEN** `isScrollable` SHALL 从 false 变为 true

### Requirement: useMediaQuery 变异测试覆盖

`useMediaQuery.ts` 的变异测试 SHALL 覆盖以下关键逻辑路径：

1. **matchMedia 匹配/不匹配**: 初始状态 SHALL 正确反映媒体查询的匹配结果
2. **change 事件响应**: 媒体查询状态变化时 SHALL 更新返回值
3. **150ms 节流行为**: 节流函数 SHALL 在首次变化时立即响应，150ms 内的后续变化 SHALL 被节流
4. **SSR 安全**: `typeof window === 'undefined'` 时 SHALL 返回 false 而不抛错
5. **清理函数**: 卸载时 SHALL 移除 change 事件监听器

#### Scenario: 节流的 leading 和 trailing 行为
- **WHEN** 在 150ms 内连续触发 3 次 change 事件
- **THEN** 第 1 次 SHALL 立即响应，第 3 次 SHALL 在 150ms 后响应，第 2 次 SHALL 被节流丢弃

#### Scenario: SSR 环境返回 false
- **WHEN** `window` 未定义（模拟 SSR 环境）
- **THEN** `useMediaQuery` SHALL 返回 false 而不抛出错误

#### Scenario: 卸载时清理监听器
- **WHEN** 使用 `useMediaQuery` 的组件卸载
- **THEN** SHALL 调用 `removeEventListener` 移除 change 监听器

### Requirement: 变异得分目标

补充测试后，`pnpm test:mutation` 运行结果中每个 Hook 的变异得分 SHALL 达到 **80% 或以上**。
