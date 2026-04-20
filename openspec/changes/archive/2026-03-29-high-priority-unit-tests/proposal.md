## Why

项目核心业务逻辑（hooks、store、services）测试覆盖较好，但高优先级的纯逻辑模块缺少单元测试：`streamProcessor.ts`（流式处理核心）、`codeBlockUpdater.ts`（DOM 更新机制）、Chat 页面 hooks（`useBoard`、`useIsSending`、`useSelectedChat`）。这些模块直接影响聊天功能的正确性和用户体验，需要补充测试以确保重构安全。

## What Changes

- 为 `streamProcessor.ts` 添加单元测试：验证流式事件处理、节流逻辑、元数据收集、最终消息生成
- 为 `codeBlockUpdater.ts` 添加单元测试：验证 DOM 更新、重试机制、WeakRef 生命周期管理、清理逻辑
- 为 Chat 页面 hooks 添加测试：`useBoard`（二维数组布局）、`useIsSending`（发送状态汇总）、`useSelectedChat`（选中聊天数据规范化）

## Capabilities

### New Capabilities
- `stream-processor-testing`: 流式处理器核心逻辑的单元测试，覆盖事件累积、节流控制、元数据收集、统计计算
- `code-block-updater-testing`: 代码块 DOM 更新工具的单元测试，覆盖匹配更新、重试策略、内存管理
- `chat-hooks-testing`: Chat 页面 hooks 的单元测试，覆盖 useBoard/useIsSending/useSelectedChat

### Modified Capabilities

## Impact

- 新增 4 个测试文件，位于 `src/__test__/` 对应目录；另追加 1 个现有测试文件
- 不影响现有代码和 API
- 依赖 vitest、@testing-library/react-hooks、现有 mock 工具
