## 1. 修复已有测试缺陷

- [x] 1.1 修复 `providerFactory.test.ts` 中的永真断言：Mock `providerLoader` 模块使 `loadProvider` 返回 rejected Promise，验证 `getProvider` 抛出包含 providerKey 和 cause 的增强错误
- [x] 1.2 完善 `useConfirm.test.tsx`：模拟点击确认按钮验证 `onOk` 被调用，模拟点击取消按钮验证 `onCancel` 被调用

## 2. 增强组件测试深度

- [x] 2.1 增强 `Splitter.test.tsx`：Mock ResizeObserver，验证多行/多列面板渲染结构和嵌套关系（Splitter 为纯渲染组件，无 onLayout 回调）
- [x] 2.2 增强 `ModelSelect.test.tsx`：提供 mock Redux store 包含模型数据，验证模型列表正确渲染，验证用户选择交互行为

## 3. 改进中间件测试

- [x] 3.1 改进 `modelMiddleware.test.ts`：增加数据状态验证（保存后重新读取验证数据一致性），降低对 Mock 调用次数断言的依赖

## 4. 新增 crypto-helpers 测试

- [x] 4.1 创建 `crypto-helpers.test.ts`，测试 AES-256-GCM 加解密往返正确性（基本文本、空字符串、长文本、Unicode）
- [x] 4.2 补充 IV 唯一性测试：相同明文加密两次产生不同 IV 和密文
- [x] 4.3 补充错误处理测试：错误密钥解密、损坏密文解密、返回值结构验证

## 5. 新增 codeBlockUpdater 测试

- [x] 5.1 创建 `codeBlockUpdater.test.ts`，Mock DOM API（querySelector、getElementById），测试成功更新场景
- [x] 5.2 测试重试机制：元素不存在时触发重试、达到最大次数后停止、重试过程中元素出现后成功
- [x] 5.3 测试内容匹配：内容不匹配时跳过更新，避免更新错误元素
- [x] 5.4 测试 `getPendingUpdatesCount` 和 `cleanupPendingUpdates` 功能

## 6. 新增 htmlEscape 测试

- [x] 6.1 创建 `htmlEscape.test.ts`，分别测试两种实现的基本 HTML 转义（注意 `escapeHtmlManual` 转义 `/` 而 `escapeHtml` 不转义）
- [x] 6.2 测试 XSS 防护：script 标签注入、事件处理器注入、JavaScript 协议注入
- [x] 6.3 测试两种实现核心字符一致性：验证对 `& < > " '` 产生相同输出，排除 `/` 字符

## 7. 验证

- [x] 7.1 运行完整测试套件，确保所有新增和修改的测试通过，无新增跳过用例
