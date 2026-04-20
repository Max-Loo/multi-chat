## ADDED Requirements

### Requirement: 平台 API spy 不得冗余于结果断言

当测试已通过 fake timers + 最终状态断言覆盖行为时，SHALL NOT 额外 spy 平台 API（如 `clearTimeout`）来断言调用次数。两种验证方式并存时，SHALL 保留结果断言、移除 spy 断言。

#### Scenario: useAdaptiveScrollbar 不 spy clearTimeout

- **WHEN** 检查 `src/__test__/hooks/useAdaptiveScrollbar.test.ts`
- **THEN** 文件 SHALL NOT 包含 `vi.spyOn(global, 'clearTimeout')`
- **AND** 文件 SHALL 使用 `vi.useFakeTimers()` + `vi.advanceTimersByTime()` + `isScrolling` / `scrollbarClassname` 状态断言验证防抖行为

### Requirement: testInternals 使用 SHALL 最小化

测试 SHALL 仅在公共 API 完全无法满足时使用 `testInternals`。可改为通过公共 API 间接验证的场景，SHALL NOT 使用 `testInternals`。

#### Scenario: resolveAlias 通过公共 API 间接验证

- **WHEN** 需要验证语言别名解析是否正确
- **THEN** 测试 SHALL 通过加载 `js` 后检查 `isLoaded('javascript')` 来间接验证
- **AND** 测试 SHALL NOT 直接调用 `testInternals.resolveAlias`

#### Scenario: loadingPromises 缓存清理通过 mock 调用计数验证

- **WHEN** 需要验证加载失败后 `loadingPromises` 缓存被清理
- **THEN** 测试 SHALL 通过 `loadLanguageModule` mock 的调用计数间接验证
- **AND** 测试 SHALL NOT 直接读取 `testInternals.loadingPromises`

#### Scenario: _clearFailedLanguages 不再使用

- **WHEN** 检查 `src/__test__/utils/highlightLanguageManager.test.ts`
- **THEN** 文件 SHALL NOT 调用 `HighlightLanguageManager._clearFailedLanguages()`
- **AND** 测试 SHALL 使用 `_resetInstance()` 重置所有状态（包含 failedLanguages 的自动清空）
