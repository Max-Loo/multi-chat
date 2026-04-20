## ADDED Requirements

### Requirement: clearUrlSearchParams 正确清除指定参数
系统 SHALL 从 URLSearchParams 中删除指定的参数键，返回新的 URLSearchParams 对象，不修改原对象。

#### Scenario: 清除存在的参数
- **WHEN** 调用 `clearUrlSearchParams(['chatId'], new URLSearchParams('chatId=123&other=456'))`
- **THEN** 返回的 URLSearchParams 只包含 `other=456`，原始对象不受影响

#### Scenario: 清除多个参数
- **WHEN** 调用 `clearUrlSearchParams(['a', 'b'], new URLSearchParams('a=1&b=2&c=3'))`
- **THEN** 返回的 URLSearchParams 只包含 `c=3`

#### Scenario: 清除不存在的参数无副作用
- **WHEN** 调用 `clearUrlSearchParams(['nonexistent'], new URLSearchParams('a=1'))`
- **THEN** 返回的 URLSearchParams 包含 `a=1`

#### Scenario: 空参数列表返回原参数副本
- **WHEN** 调用 `clearUrlSearchParams([], new URLSearchParams('a=1'))`
- **THEN** 返回的 URLSearchParams 包含 `a=1`
