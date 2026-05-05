## 1. 核心算法

- [x] 1.1 实现 `findSafeSplitPoint(content: string): number` 函数：逐行扫描，跟踪 fenced code block 状态，返回最后一个安全空行边界位置
- [x] 1.2 编写 `findSafeSplitPoint` 单元测试：覆盖普通段落、代码块内空行、内容过短无分割点、末尾空行等场景

## 2. StreamingContent 组件

- [x] 2.1 创建 `src/components/chat/StreamingContent.tsx`，实现冻结块 append-only 缓存（useRef）、活跃块渲染、`isRunning` 变化检测
- [x] 2.2 实现消息切换和内容缩短时的缓存重置逻辑（检测 messageId 变化、splitPoint 回退）
- [x] 2.3 实现流式结束时的全量校正渲染（`isRunning` → false 时清除缓存、单次完整渲染）

## 3. 集成替换

- [x] 3.1 修改 `ChatBubble.tsx`：将用户气泡和 AI 气泡中的 `dangerouslySetInnerHTML` 替换为 `<StreamingContent>`
- [x] 3.2 修改 `ThinkingSection.tsx`：将 `dangerouslySetInnerHTML` 替换为 `<StreamingContent>`

## 4. 验证

- [x] 4.1 手动验证流式消息渲染：确认已渲染段落不闪烁、新内容正常追加、代码块高亮正常
- [x] 4.2 手动验证非流式场景：历史消息加载、消息编辑、重新生成
- [x] 4.3 手动验证边界情况：纯代码块消息、极短消息、快速切换消息
