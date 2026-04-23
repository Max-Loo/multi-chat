## Why

测试体系深度审查发现 2 个安全关键路径（密钥管理 UI、数据重置确认）完全无测试保护，P0 风险可能导致用户被锁死在加密数据外。同时审查暴露出测试质量问题：CSS 类选择器脆弱断言（21 文件 70 处）、条件守卫静默跳过（8 文件 34 处）、8 个跳过用例覆盖重要路径、XSS 安全测试被 mock 绕过。这些问题削弱了测试套件的可信度和保护能力。

## What Changes

- 为 `KeyManagementSetting` 组件（密钥导出/数据重置 UI）补充完整测试
- 为 `useResetDataDialog` hook（破坏性操作确认）补充完整测试
- 将 21 个测试文件中的 CSS 类 `querySelector` 断言替换为语义化查询（`getByRole`、`getByTestId` 等）
- 消除 8 个文件共 34 处条件守卫 `if (element)` 静默跳过断言，改为先断言存在再交互
- 修复 8 个 `skip/todo` 用例，覆盖错误处理和边界路径
- XSS 安全测试移除 markdown-it 和 DOMPurify 的 mock，使用真实库验证

## Capabilities

### New Capabilities

- `security-critical-testing`: 密钥管理 UI 和数据重置确认的安全关键路径测试
- `test-assertion-migration`: 测试断言从 CSS 类选择器和条件守卫迁移到语义化查询和安全断言模式

### Modified Capabilities

- `chat-panel-testing`: 修复条件守卫静默跳过和 CSS 选择器断言
- `crypto-integration-tests`: 修复跳过的密钥导出失败测试用例
- `keyring-unit-tests`: 修复跳过的密码读取错误和日志记录用例
- `test-mock-simplification`: XSS 测试移除 markdown-it/DOMPurify mock，使用真实库

## Impact

- 测试文件：影响约 35 个测试文件，主要在 `src/__test__/` 目录
- 源文件：部分组件需添加 `data-testid` 属性（约 10-15 个组件）
- 依赖：XSS 测试使用真实 markdown-it 和 DOMPurify，不再 mock
- 无生产代码行为变更，仅补充测试和改善测试质量
- 测试运行时间可能因使用真实库略有增加
