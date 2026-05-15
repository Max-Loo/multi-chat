---
name: chatslices-mutation-phase2
description: chatSlices.ts 第二轮变异测试精确断言提升
---

## 目标

chatSlices.ts 变异测试分数从 80.22% 提升至 ≥93%。

## 存活变异体分布（基于 reports/mutation/mutation.html 实际报告）

| 函数/区域 | 存活数 | 行范围 | 根因 |
|----------|--------|--------|------|
| updateMetaInList | 11 | L335-L344 | 未断言 chatMetaList 合并结果 |
| removeActiveChatData / setSelectedChatIdWithPreload.fulfilled | 14 | L145-L173, L585-L602 | activeChatData 写入和 previousChat 清理未逐字段断言 |
| clearActiveChatData | 4 | L457-L464 | sendingChatIds 条件和 delete 未断言 |
| editChatName | 3 | L409-L414 | 条件和等值运算符未覆盖 |
| appendHistoryToModel | 3 | L357-L370 | 代码块清空和条件未断言 |
| deleteChat | 2 | L447 | selectedChatId 清理未断言 |
| sendMessage thunk 体 | 2 | L76-L135 | transmitHistoryReasoning 传入未验证 |
| startSendChatMessage 条件 | 2 | L272-L283 | 条件分支和对象字面量未覆盖 |
| 散布区域（L17, L91-L134） | 12 | 多处 | sendMessage 体 + 初始化逻辑单点断言缺失 |
| initializeChatList | 1 | L66 | 对象字面量 |
| pushRunningChatHistory | 1 | L527 | 条件表达式 |

**合计**：53 个存活变异体

## 约束

- 仅修改测试文件，不修改源代码
- 将现有 `toBeDefined()` 弱断言升级为逐字段 `toEqual`（当前有 15 处 `toBeDefined()`，无 `toMatchObject`）
- 测试命名遵循"应该 [预期行为] 当 [条件]"规范
- 测试 sendMessage thunk 体时，`streamChatCompletion` 使用 `async function*` mock（代码库 line 1064 已有此模式）
- signal.aborted 测试使用真实 `AbortController` + `controller.abort()` 方式触发（`AbortSignal.aborted` 为只读属性）
