## 1. ResizeObserver polyfill 集中注册

- [x] 1.1 在 `setup.ts` 中添加全局 ResizeObserver 空 polyfill
- [x] 1.2 从 `Grid.test.tsx` 删除 ResizeObserver 定义（行 19-23）
- [x] 1.3 从 `Splitter.test.tsx` 删除 ResizeObserver 定义（行 19-23）
- [x] 1.4 从 `ChatPanelContentDetail.test.tsx` 删除 ResizeObserver 定义（行 20-24）
- [x] 1.5 从 `Chat/Detail.test.tsx` 删除 ResizeObserver 定义（行 78-82）

## 2. Fake timers 替换真实等待

- [x] 2.1 在 `useBasicModelTable.test.tsx` 中用 `vi.useFakeTimers()` + `vi.advanceTimersByTime()` 替换 600ms 等待（行 93）
- [x] 2.2 在 `ChatSidebar.test.tsx` 中用 fake timers 替换 300ms 等待（行 233）
- [x] 2.3 确保两个文件均在 afterEach 中恢复真实 timers

## 3. crypto.test.ts Unicode 往返测试参数化

- [x] 3.1 将约 20 个 Unicode 字符往返测试合并为 `test.each` 参数化形式
- [x] 3.2 确保参数化后的测试名称能清楚标识字符类型

## 4. highlight.js mock 共享提取

- [x] 4.1 创建 `helpers/mocks/highlight.ts` 共享 mock 模块
- [x] 4.2 修改 `ChatBubble.test.tsx` 使用共享 highlight.js mock
- [x] 4.3 修改 `ThinkingSection.test.tsx` 使用共享 highlight.js mock

## 5. 手动构造对象替换为工厂调用

- [x] 5.1 `messageTransformer.test.ts` — 将手动构造的 `StandardMessage` 替换为 `createMockMessage` 调用
- [x] 5.2 `ChatPanelContentDetail.test.tsx` — 将手动构造的 `StandardMessage` 和 `Model` 替换为工厂调用
- [x] 5.3 `modelMiddleware.test.ts` — 将手动构造的 mock model 替换为工厂调用

## 6. RTK 样板测试移除

- [x] 6.1 从 `chatPageSlices.test.ts` 删除行 57-85 的 RTK 框架保证测试

## 7. setup.ts barrel export 清理

- [x] 7.1 从 `setup.ts` 删除 `export * from './helpers'` 语句
- [x] 7.2 检查并修复任何通过 setup.ts 间接导入 helpers 的测试文件

## 8. 验证

- [x] 8.1 执行 `pnpm test` 确认所有测试通过
- [x] 8.2 执行 `pnpm tsc` 确认无类型错误
