## Why

6 个测试文件各自手动编写 `vi.mock('react-i18next')` 实现，未使用项目已有的 `globalThis.__createI18nMockReturn` 标准工厂。这导致：mock 实现不一致（有的用 Proxy、有的用 selector-based `t()`、有的用 `importOriginal`），维护成本高（修改 i18n mock 策略需改 6+ 处），且增加因 mock 差异导致测试误报的风险。

## What Changes

将以下 6 个文件的 `react-i18next` mock 统一为 `globalThis.__createI18nMockReturn` 模式：

1. `components/chat/ChatBubble.memo.test.tsx`（行 34-62）— selector-based `t()` 手动 mock
2. `pages/Chat/RunningBubble.test.tsx`（行 35-61）— 与 #1 几乎一模一样的手动 mock
3. `pages/Chat/Detail.test.tsx`（行 63-98）— selector-based `t()` 手动 mock
4. `components/MainApp.test.tsx`（行 16-37）— Proxy 手动 mock
5. `components/KeyRecoveryDialog.test.tsx`（行 13-23）— Proxy 手动 mock
6. `integration/master-key-recovery.integration.test.tsx`（行 68-95）— `importOriginal` + 手动 mock

## Capabilities

### New Capabilities

（无新能力——统一现有模式）

### Modified Capabilities

- `i18n-test-mock-factory`: 扩展覆盖范围至全部测试文件

## Impact

- **修改文件**: 6 个测试文件的 `vi.mock('react-i18next')` 块
- **风险**: 低——统一为已验证的工厂模式，行为等价
