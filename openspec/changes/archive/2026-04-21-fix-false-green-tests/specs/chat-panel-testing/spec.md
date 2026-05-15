## MODIFIED Requirements

### Requirement: 异步状态更新的断言必须使用 await

ChatPanel 测试中所有使用 `waitFor()` 的场景 SHALL 在调用前添加 `await`，确保异步断言能够正确执行。未 `await` 的 `waitFor` 调用 SHALL 视为测试缺陷。

#### Scenario: waitFor 异步断言正确执行
- **WHEN** 测试代码使用 `waitFor()` 等待状态更新并执行断言
- **THEN** 必须在 `waitFor()` 前添加 `await`，确保断言在 Promise resolve 后执行

#### Scenario: 未 await 的 waitFor 被修复
- **WHEN** ChatPanel.test.tsx 中第 157 行和第 333 行的 `waitFor()` 调用
- **THEN** 这两处 SHALL 添加 `await` 关键字，使内部断言能够执行
