## MODIFIED Requirements

### Requirement: 中间件测试使用可靠的异步等待模式

中间件测试 MUST 使用 `vi.waitFor` 进行异步断言，MUST NOT 使用 `setTimeout(resolve, 0)` 等基于宏任务的等待方式。

#### Scenario: appConfigMiddleware 异步断言

- **WHEN** dispatch 一个触发异步 effect 的 action 后需要验证副作用
- **THEN** 测试 SHALL 使用 `vi.waitFor(() => { expect(...) })` 而非 `setTimeout(resolve, 0)`

#### Scenario: chatMiddleware 异步断言

- **WHEN** dispatch 一个触发异步 effect 的 action 后需要验证副作用
- **THEN** 测试 SHALL 使用 `vi.waitFor(() => { expect(...) })` 而非 `setTimeout(resolve, 0)`
