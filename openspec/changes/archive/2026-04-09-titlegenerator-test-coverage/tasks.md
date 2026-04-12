## 1. 重构 titleGenerator 源码

- [x] 1.1 提取 `buildTitlePrompt` 纯函数：从消息数组构建 prompt 字符串
- [x] 1.2 保持 `generateChatTitleService` 签名干净：`(messages, model)` → `Promise<string>`，不添加 deps 参数
- [x] 1.3 删除 `GenerateTitleDependencies` 接口
- [x] 1.4 验证现有测试仍全部通过（`removePunctuation` 和 `truncateTitle` 测试不受影响）

## 2. 编写单元测试

- [x] 2.1 为 `buildTitlePrompt` 编写测试：标准双消息、单消息、空数组、多条消息取最后两条
- [x] 2.2 为 `generateChatTitleService` 编写正常路径测试：使用 `vi.mocked(generateText)` 覆盖返回值，验证返回经过后处理的标题
- [x] 2.3 编写 provider 初始化失败测试：使用 `vi.mocked(getProvider).mockRejectedValue()`，验证错误传播
- [x] 2.4 编写空结果测试：`generateText` 返回空字符串、纯标点文本，验证抛出 "Generated title is empty"
- [x] 2.5 编写超长文本测试：`generateText` 返回超长文本，验证截取到 10 字符

## 3. 验证与清理

- [x] 3.1 运行完整测试套件，确认所有测试通过（117 文件，1573 用例，0 失败）
- [x] 3.2 确认调用方（chatMiddleware 等）无需修改且行为不变
- [x] 3.3 更新 openspec 方案文档，将"依赖注入"决策改为"vi.mock"方案
