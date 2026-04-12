## Why

测试审查报告（docs/test-audit-report.md）发现了多个测试质量问题：存在永真断言掩盖缺陷、组件测试仅验证渲染不验证交互、回调测试未验证实际触发、以及安全相关模块缺少测试覆盖。这些问题降低了测试套件的可信度，可能导致回归缺陷被遗漏。

## What Changes

- 修复 `providerFactory.test.ts` 中的 `expect(true).toBe(true)` 永真断言，改为真正验证 SDK 加载失败的错误处理
- 增强 `Splitter.test.tsx` 测试，补充面板尺寸变化验证
- 增强 `ModelSelect.test.tsx` 测试，补充模型数据渲染和选择交互验证
- 完善 `useConfirm.test.tsx` 测试，验证 onOk/onCancel 回调在用户交互后被实际调用
- 改进 `modelMiddleware.test.ts` 测试，减少对 Mock 调用次数的断言，增加数据状态验证
- 新增 `crypto-helpers.ts` 测试，覆盖 AES-256-GCM 加解密、错误密钥、损坏数据等场景
- 新增 `codeBlockUpdater.ts` 测试，覆盖 DOM 更新、重试机制、WeakRef 内存管理
- 新增 `htmlEscape.ts` 测试，覆盖两种转义实现的正确性和一致性

## Capabilities

### New Capabilities

- `crypto-helpers-testing`: 测试 `src/utils/tauriCompat/crypto-helpers.ts` 的 AES-256-GCM 加解密正确性、错误处理和边界情况
- `code-block-updater-testing`: 测试 `src/utils/codeBlockUpdater.ts` 的 DOM 更新逻辑、重试机制和内存管理
- `html-escape-testing`: 测试 `src/utils/htmlEscape.ts` 两种 HTML 转义实现的正确性（注意两种实现在 `/` 字符上行为不同）和 XSS 防护能力

### Modified Capabilities

- `test-coverage-quality`: 提升已有测试质量，修复永真断言、增强组件交互测试、完善回调验证、改进中间件测试断言方式

## Impact

- **测试文件**（8 个文件需要修改或新增）：`providerFactory.test.ts`、`Splitter.test.tsx`、`ModelSelect.test.tsx`、`useConfirm.test.tsx`、`modelMiddleware.test.ts`、以及 3 个新增测试文件
- **无生产代码变更**：所有改动仅在测试文件中，不影响应用功能
- **测试数量**：预计新增约 40-60 个测试用例
