## MODIFIED Requirements

### Requirement: tauriCompat 测试仅验证项目自有逻辑

tauriCompat 测试文件 SHALL 仅包含验证项目跨环境兼容层逻辑的测试用例。测试 MUST NOT 包含以下类型的断言：
- 断言 JavaScript 原生类型（如 `typeof fetch === 'function'`、`expect(x).toBeInstanceOf(Promise)`）
- 断言变量已被赋值（如 `expect(store).toBeDefined()`）
- 断言 mock 基础设施行为（如 "Mock 验证测试" describe 块）

#### Scenario: http.test.ts 仅保留项目逻辑验证

- **WHEN** `http.test.ts` 中存在 `typeof fetch === 'function'` 或 `expect(input).toBeInstanceOf(URL)` 等断言
- **THEN** 这些断言 SHALL 被删除，仅保留验证项目 http 兼容层行为的测试

#### Scenario: os.test.ts 仅保留项目逻辑验证

- **WHEN** `os.test.ts` 中存在 `typeof lang === 'string'` 或 `expect(result).toBeInstanceOf(Promise)` 等同义反复断言
- **THEN** 这些断言 SHALL 被删除

#### Scenario: shell.test.ts 仅保留项目逻辑验证

- **WHEN** `shell.test.ts` 中存在 `expect(openPromise).toBeInstanceOf(Promise)` 断言
- **THEN** 该断言 SHALL 被删除

#### Scenario: store.test.ts 仅保留项目逻辑验证

- **WHEN** `store.test.ts` 中存在 `expect(store).toBeDefined()` 或 `expect(value).toBeDefined()` 等断言
- **THEN** 这些断言 SHALL 被替换为验证实际存储行为的断言，或被删除
