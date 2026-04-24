## Why

密钥管理 UI（`KeyManagementSetting`）和数据重置确认（`useResetDataDialog`）是仅有的两个**完全无测试**的安全关键路径。前者涉及主密钥导出和剪贴板操作，后者控制不可逆的全量数据清除。任何 Bug 都可能导致用户被锁死在加密数据外或意外丢失全部数据。

## What Changes

- 补充 `KeyManagementSetting` 组件测试：覆盖密钥导出完整流程（成功/失败/加载态）、剪贴板复制（成功/失败后保持对话框）、数据重置按钮集成
- 补充 `useResetDataDialog` hook 测试：覆盖确认重置完整流程（`resetAllData` 调用 → `window.location.reload`）、失败时阻止页面刷新、重置期间按钮禁用状态、并发双击防护

## Capabilities

### New Capabilities

- `security-critical-testing`: 密钥管理和数据重置安全路径的完整测试覆盖，包括破坏性操作防护、剪贴板安全、页面刷新验证

### Modified Capabilities

## Impact

- 新增 2 个测试文件，修改 0 个源文件
- 依赖现有 mock 基础设施（`__createToastQueueModuleMock`、`__createI18nMockReturn`、`renderWithProviders`）
- 提升安全关键路径覆盖率从 0% → 目标 90%+
