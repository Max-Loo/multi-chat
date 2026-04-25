## 1. AI SDK Mock 代码注释补充

- [x] 1.1 为 `src/__test__/helpers/mocks/aiSdk.ts` 中所有导出函数添加 JSDoc（`@param`、`@returns`、使用示例），覆盖：`createMockStreamResult`、`createMockStreamResultWithMetadata`、`createMockAIProvider`、`createReasoningStreamEvents`、`createTextStreamEvents`、`createMockNetworkError`、`createMockAPIError`、`createMockTimeoutError`、`createMockAbortedStreamResult`、`createMockStreamTimeoutResult`、`createMockLanguageModel`、`createMockProviderFactory`
- [x] 1.2 将 README 中 AI SDK Mock 函数的参数文档迁移为代码注释后，精简 README 的 AI SDK 章节为：导入示例 + 依赖注入用法 + 链接到 aiSdk.ts

## 2. 合并重复章节

- [x] 2.1 将「行为驱动测试原则」「Before/After 对比示例」「常见反模式和解决方案」「测试最佳实践」四个章节合并为一个「测试原则与规范」章节，保留：核心理念 + 组件/Hooks/Redux 各一组正反例 + Mock 策略要点 + 命名规范
- [x] 2.2 删除合并后原四个章节的所有残余内容

## 3. 删除不适用内容

- [x] 3.1 删除「测试目录结构重组说明」章节（第 598-668 行）
- [x] 3.2 删除「测试最佳实践」中的后端建议（内存数据库、HTTP 录制工具、终极检验标准）
- [x] 3.3 精简 Mock 注释规范为 3 行规则 + 1 个示例（替代当前的 150 行模板和检查清单）

## 4. 精简剩余冗余内容

- [x] 4.1 精简常见问题排查指南（10 个问题）为每题一行摘要 + 解决方向，删除完整代码示例
- [x] 4.2 删除整个 MSW 章节（第 478-537 行）：`src/__test__/msw/` 目录和 `msw` 依赖均不存在于项目中，该章节引用的所有文件路径和代码示例均不可用
- [x] 4.3 清理散落在其他章节的 MSW 引用：第 1052 行（测试编写规范 > 集成测试）、第 1838 行（集成测试章节）、第 2042-2061 行（常见问题排查 > 问题 9）
- [x] 4.3 精简类型安全指南为简要规则，删除通用编程建议
- [x] 4.4 删除「组件测试示例」章节（与合并后的测试原则章节重复）

## 5. 更新目录结构

- [x] 5.1 更新 README 的目录结构树以反映 `src/__test__/` 的实际文件布局（当前列出的 helpers/mocks/ 子文件与实际不符）
- [x] 5.2 验证最终行数不超过 800 行（`wc -l src/__test__/README.md`）
- [x] 5.3 运行 `pnpm test:run` 确认所有测试仍然通过
