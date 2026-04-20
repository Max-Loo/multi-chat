## Tasks

- [x] ### 1. 补充 streamProcessor 节流和边界测试
  - **文件**: `src/__test__/services/chat/streamProcessor.integration.test.ts`（追加）
  - **内容**:
    - 节流逻辑：throttleInterval>0 时限制 yield 频率，流结束立即 yield 未发送更新
    - 边界情况：text-delta text 为 undefined、未知事件类型被忽略
  - **规格**: `specs/stream-processor-testing/spec.md`

- [x] ### 2. 创建 codeBlockUpdater 单元测试
  - **文件**: `src/__test__/utils/codeBlockUpdater.test.ts`（新建）
  - **内容**:
    - DOM 匹配更新：通过语言类名和文本内容匹配元素
    - 重试机制：递增延迟重试（0/16/50/100/200/300ms）
    - 生命周期管理：WeakRef 跟踪、5 秒自动清理
    - 清理函数：cleanupPendingUpdates 清空记录
  - **工具**: `vi.useFakeTimers()` 控制 setTimeout
  - **规格**: `specs/code-block-updater-testing/spec.md`

- [x] ### 3. 创建 useBoard hook 测试
  - **文件**: `src/__test__/pages/Chat/hooks/useBoard.test.ts`（新建）
  - **内容**:
    - 二维数组切分逻辑（正常/空列表/边界值）
    - shouldUseSplitter 判断（isSplitter + 模型数量组合）
  - **规格**: `specs/chat-hooks-testing/spec.md`（useBoard 部分）

- [x] ### 4. 创建 useIsSending hook 测试
  - **文件**: `src/__test__/pages/Chat/hooks/useIsSending.test.ts`（新建）
  - **内容**:
    - 无选中聊天返回 false
    - 无运行数据返回 false
    - 任一窗口发送中返回 true
    - 所有窗口未发送返回 false
  - **规格**: `specs/chat-hooks-testing/spec.md`（useIsSending 部分）

- [x] ### 5. 创建 useSelectedChat hook 测试
  - **文件**: `src/__test__/pages/Chat/hooks/useSelectedChat.test.ts`（新建）
  - **内容**:
    - 有选中聊天返回规范化数据
    - 无选中聊天返回 null + 空数组
    - chatModelList 缺失时返回空数组
  - **规格**: `specs/chat-hooks-testing/spec.md`（useSelectedChat 部分）
