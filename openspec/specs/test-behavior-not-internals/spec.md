# Spec: 测试行为而非内部实现

## Purpose

确保测试关注被测单元的公共行为和外部依赖交互，而非内部私有方法和实现细节。

## Requirements

### Requirement: 测试 SHALL mock 外部依赖而非内部私有方法

测试 SHALL NOT 使用 `vi.spyOn(instance as any, 'privateMethod')` 访问并 mock 私有方法。当需要模拟某个行为的失败场景时，SHALL mock 该行为的外部依赖（如网络请求模块、第三方库 API），而非被测类的内部实现。

**原理**：spy 私有方法使测试与内部实现耦合，重构时容易断裂。mock 外部依赖则保持测试对公共 API 行为的关注。

#### Scenario: 模拟加载失败场景时 mock 外部依赖
- **WHEN** 需要测试"外部资源加载失败"的场景
- **THEN** 测试 SHALL mock 外部依赖模块（如 `loadLanguageModule`）使其 reject
- **AND** 测试 SHALL NOT spy 被测类的私有方法（如 `doLoadLanguage`）
- **AND** 测试 SHALL 通过公共 API（如 `isLoaded()`、`hasFailedToLoad()`）验证结果

#### Scenario: 验证并发控制时 spy 外部库 API
- **WHEN** 需要验证"同一操作不会被重复执行"的并发控制行为
- **THEN** 测试 SHALL spy 外部库的公共 API（如 `hljs.registerLanguage`）
- **AND** 测试 SHALL NOT spy 被测类的私有方法来验证调用次数
- **AND** 测试 SHALL 通过断言外部依赖只被调用一次来间接验证并发控制

#### Scenario: 减少对 testInternals 的直接状态操作
- **WHEN** 需要为测试设置初始状态（如标记某语言已加载）
- **THEN** 测试 SHALL 优先使用公共 API（如 `markAsLoaded()`）设置状态
- **AND** 测试 SHALL 仅在公共 API 无法满足时使用 `testInternals`
- **AND** 使用 `testInternals` 时 SHALL NOT 使用 `as any` 类型绕过

### Requirement: DOM 操作测试 SHALL 使用真实 DOM 环境

测试涉及 DOM 操作的工具函数时，SHALL 使用 happy-dom 提供的真实 DOM 环境操作元素，而非 spy `document` 的原生方法。

#### Scenario: DOM 更新测试使用真实元素
- **WHEN** 测试 DOM 更新函数（如 `updateCodeBlockDOM`）
- **THEN** 测试 SHALL 通过 `document.createElement` 创建真实 DOM 元素
- **AND** 测试 SHALL 将元素添加到 `document.body` 中
- **AND** 测试 SHALL 通过验证元素的 `innerHTML`、`textContent` 等属性来确认更新结果
- **AND** 测试 SHALL NOT spy `document.querySelectorAll` 或 `document.contains`

#### Scenario: DOM 元素不存在场景的测试
- **WHEN** 测试"目标元素不存在"的场景
- **THEN** 测试 SHALL 不创建匹配选择器的元素（让查询自然返回空结果）
- **AND** 测试 SHALL 通过 `getPendingUpdatesCount()` 等公共 API 验证最终状态
- **AND** 测试 SHALL NOT 断言 `querySelectorAll` 的调用次数

#### Scenario: 重试逻辑的测试验证最终行为
- **WHEN** 测试包含重试逻辑的函数
- **THEN** 测试 SHALL 使用 `vi.useFakeTimers()` + `vi.advanceTimersByTime()` 模拟时间流逝
- **AND** 测试 SHALL 验证最终行为（如"最终停止重试"、"成功更新"）
- **AND** 测试 SHALL NOT 验证精确的重试次数
