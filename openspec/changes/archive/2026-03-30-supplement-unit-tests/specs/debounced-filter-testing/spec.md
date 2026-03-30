## ADDED Requirements

### Requirement: useDebouncedFilter 延迟过滤列表
系统 SHALL 在过滤文本变化后经过防抖延迟再执行过滤。

#### Scenario: 空文本返回完整列表
- **WHEN** text 为空字符串
- **THEN** filteredList 等于原始 list

#### Scenario: 有匹配文本时返回过滤结果
- **WHEN** text 为非空字符串且防抖延迟已过
- **THEN** filteredList 仅包含满足 predicate 条件的项

#### Scenario: 防抖期间使用旧结果
- **WHEN** text 刚变化但防抖延迟未到
- **THEN** filteredList 仍为上一次过滤结果

### Requirement: useDebouncedFilter 正确清理
系统 SHALL 在组件卸载时取消未执行的防抖函数。

#### Scenario: 组件卸载后防抖不再触发
- **WHEN** Hook unmount 时有 pending 的防抖调用
- **THEN** 防抖函数被 cancel，不再执行
