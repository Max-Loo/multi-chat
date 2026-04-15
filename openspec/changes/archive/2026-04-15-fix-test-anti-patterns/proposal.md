## Why

测试质量审查报告（2026-04-15）识别出第二层反模式问题：3 个组件测试文件 mock 了子组件（违反 `behavior-driven-testing` 规范），4 个测试文件通过 `vi.spyOn` 验证内部实现细节（违反"测试行为，不测实现"原则），以及约 25 处可疑的 `as any` 类型绕过（违反 `test-type-safety` 规范）。这些问题导致测试与内部实现耦合，重构时容易断裂，且 `as any` 掩盖了潜在的类型错误。

## What Changes

- 重构 `GeneralSetting.test.tsx`：移除对 LanguageSetting、ModelProviderSetting、AutoNamingSetting 的 `vi.mock()`，改为渲染完整组件树并验证用户可见行为
- 重构 `SettingPage.test.tsx`：移除对 SettingSidebar 的 `vi.mock()`，改为渲染完整组件树
- 重构 `InitializationController.test.tsx`：移除对 FatalErrorScreen、NoProvidersAvailable、Progress 的 `vi.mock()`，改为渲染完整组件树
- 重构 `highlightLanguageManager.test.ts`：将 `vi.spyOn(manager as any, 'doLoadLanguage')` 替换为验证可观察行为（如 `getLanguage()` 返回值、加载状态变化）
- 重构 `codeBlockUpdater.test.ts`：将 spy `document.querySelectorAll`/`document.contains` 替换为验证 DOM 最终结果
- 逐个审查并清理约 25 处可疑 `as any`，替换为类型安全写法（保留约 20 处有合理注释的 `as any`）

## Capabilities

### New Capabilities
- `no-mock-child-components`: 组件测试禁止 mock 子组件，改为渲染完整组件树并验证用户可见行为的规范与实现
- `test-behavior-not-internals`: 将 spyOn 内部方法的测试重构为验证可观察行为的规范与实现

### Modified Capabilities
- `test-type-safety`: 在现有类型安全规范基础上，新增清理可疑 `as any` 的具体约束和替换策略

## Impact

- **受影响的测试文件**：5 个测试文件需要重构（GeneralSetting、SettingPage、InitializationController、highlightLanguageManager、codeBlockUpdater）
- **受影响的测试辅助代码**：可能需要新增 renderWithProviders 配置来支持完整组件树渲染
- **受影响的类型定义**：约 25 处 `as any` 需要替换为具体类型
- **不受影响**：生产代码不做变更；hook 测试文件的 mock 策略保持不变（属于合理的 hook 单元测试隔离）
