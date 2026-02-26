## 1. 实现时间戳工具函数

- [x] 1.1 在 `src/utils/utils.ts` 中添加 `getCurrentTimestamp()` 函数
- [x] 1.2 在 `src/utils/utils.ts` 中添加 `getCurrentTimestampMs()` 函数
- [x] 1.3 为两个函数添加完整的 JSDoc 注释（包含返回值类型和单位说明）
- [x] 1.4 导出两个函数，使其可被其他模块导入

## 2. 替换 chatService.ts 中的实现

- [x] 2.1 删除 `chatService.ts` 中的私有 `getCurrentTimestamp()` 函数（第 24-26 行）
- [x] 2.2 在 `chatService.ts` 顶部添加 `import { getCurrentTimestamp } from '@/utils/utils'`
- [x] 2.3 验证 `streamChatCompletion` 函数中对 `getCurrentTimestamp()` 的调用正常工作

## 3. 替换 chatSlices.ts 中的实现

- [x] 3.1 在 `chatSlices.ts` 中查找所有 `Date.now() / 1000` 的使用
- [x] 3.2 添加导入语句 `import { getCurrentTimestamp } from '@/utils/utils'`
- [x] 3.3 将 `Date.now() / 1000` 替换为 `getCurrentTimestamp()`

## 4. 添加单元测试

- [x] 4.1 创建测试文件 `src/__test__/utils/utils.test.ts`（如果不存在）
- [x] 4.2 添加 `getCurrentTimestamp()` 的测试用例
  - 验证返回值为数字类型
  - 验证返回值为秒级精度（10 位数字）
  - 验证返回值在合理范围内（>= 1700000000 && < 2000000000）
  - 验证连续调用返回单调递增的值
- [x] 4.3 添加 `getCurrentTimestampMs()` 的测试用例
  - 验证返回值为数字类型
  - 验证返回值为毫秒级精度（13 位数字）
  - 验证返回值在合理范围内（>= 1700000000000 && < 2000000000000）
  - 验证连续调用返回单调递增的值

## 5. 运行现有测试验证

- [x] 5.1 运行完整测试套件：`pnpm test:run`
- [x] 5.2 验证 `chatService.ts` 相关测试通过
- [x] 5.3 验证 `chatSlices.ts` 相关测试通过
- [x] 5.4 如有失败，检查是否因时间戳格式不匹配导致，并修复

## 6. 代码质量检查

- [x] 6.1 运行类型检查：`pnpm tsc`
- [x] 6.2 运行代码检查：`pnpm lint`
- [x] 6.3 修复所有类型错误和 linting 错误（如有）

## 7. 文档更新

- [x] 7.1 在 `src/types/chat.ts` 的 `StandardMessage` 接口中确认 `timestamp` 字段的注释明确说明为"秒级 Unix 时间戳"
- [x] 7.2 检查 AGENTS.md 中是否有需要更新的时间戳相关说明
- [x] 7.3 在 AGENTS.md 的"工具函数"部分（如有）添加时间戳函数的说明

## 8. 可选优化

- [x] 8.1 评估 `src/utils/tauriCompat/keyring.ts` 中的 `Date.now()` 是否需要替换为 `getCurrentTimestampMs()`
- [x] 8.2 如需替换，添加导入并替换相关代码
- [x] 8.3 运行测试验证替换后的行为

**实施**: 已完成替换。在 `keyring.ts` 中添加导入 `import { getCurrentTimestampMs } from '@/utils/utils'`，并将第 288 行的 `Date.now()` 替换为 `getCurrentTimestampMs()`。测试和类型检查均通过。
