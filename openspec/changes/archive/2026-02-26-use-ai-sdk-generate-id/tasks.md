## 1. 代码替换

### 1.1 替换 chatService.ts 中的 ID 生成逻辑

- [x] 1.1.1 在 `src/services/chatService.ts` 顶部添加导入 `import { generateId } from 'ai'`
- [x] 1.1.2 删除 `generateId()` 函数（line 17-19）
- [x] 1.1.3 确认 `streamChatCompletion` 函数中的 `generateId()` 调用现在使用 `ai.generateId`

### 1.2 替换 ToolsBar.tsx 中的 ID 生成逻辑

- [x] 1.2.1 在 `src/pages/Chat/components/ChatSidebar/components/ToolsBar.tsx` 中删除导入 `import { v4 as uuidv4 } from 'uuid'`（line 10）
- [x] 1.2.2 添加导入 `import { generateId } from 'ai'`
- [x] 1.2.3 替换 `handleCreateChat` 函数中的 `uuidv4()` 为 `generateId()`（line 38）

### 1.3 替换 ModelConfigForm.tsx 中的 ID 生成逻辑

- [x] 1.3.1 在 `src/pages/Model/components/ModelConfigForm.tsx` 中删除导入 `import { v4 as uuidv4 } from 'uuid'`（line 18）
- [x] 1.3.2 添加导入 `import { generateId } from 'ai'`
- [x] 1.3.3 替换 `getFullModelParams` 函数中的 `uuidv4()` 为 `generateId()`（line 115）

### 1.4 替换 chatSlices.ts 中的 ID 生成逻辑（带前缀）

- [x] 1.4.1 在 `src/store/slices/chatSlices.ts` 中删除导入 `import { v4 as uuidv4 } from 'uuid'`（line 8）
- [x] 1.4.2 添加导入 `import { createIdGenerator } from 'ai'`
- [x] 1.4.3 在文件顶部创建 `generateUserMessageId` 工具函数：`const generateUserMessageId = createIdGenerator({ prefix: USER_MESSAGE_ID_PREFIX })`
- [x] 1.4.4 替换 `sendMessage` thunk 中的 `USER_MESSAGE_ID_PREFIX + uuidv4()` 为 `generateUserMessageId()`（line 86）

### 1.5 替换测试辅助代码中的 ID 生成逻辑

- [x] 1.5.1 在 `src/__test__/helpers/fixtures/model.ts` 中添加导入 `import { createIdGenerator } from 'ai'`
- [x] 1.5.2 删除自定义的 `generateId()` 函数（line 13-17）
- [x] 1.5.3 删除 `idCounter` 变量和 `resetIdCounter` 函数（line 13-24）
- [x] 1.5.4 创建新的 `generateId` 常量：`const generateId = createIdGenerator({ prefix: 'test-model-' })`

## 2. 移除依赖

- [x] 2.1 检查 `uuid` 包的依赖关系：运行 `pnpm why uuid`
- [x] 2.2 移除 `uuid` 包：运行 `pnpm remove uuid`
- [x] 2.3 验证 `package.json` 和 `pnpm-lock.yaml` 已更新

## 3. 验证

### 3.1 类型检查和代码规范

- [x] 3.1.1 运行类型检查：`pnpm tsc`，确保无类型错误
- [x] 3.1.2 运行代码规范检查：`pnpm lint`，修复所有 lint 错误

### 3.2 测试验证

- [x] 3.2.1 运行测试套件：`pnpm test`，确保所有测试通过
- [x] 3.2.2 检查测试辅助函数生成的 ID 格式是否正确
- [x] 3.2.3 验证 chatService 的 ID 生成功能正常工作

### 3.3 功能验证

- [ ] 3.3.1 启动开发服务器：`pnpm tauri dev`
- [ ] 3.3.2 手动测试创建新聊天功能，验证 ID 生成正常
- [ ] 3.3.3 手动测试配置新模型功能，验证 ID 生成正常
- [ ] 3.3.4 手动测试发送消息功能，验证用户消息 ID 带有正确的前缀

## 4. 清理

- [x] 4.1 使用编辑器搜索 `uuid` 关键词，确保没有遗漏的导入或使用
- [x] 4.2 检查是否有其他未使用的导入语句
- [x] 4.3 如有必要，更新 AGENTS.md 或 README.md 文档（移除对 uuid 包的提及）

## 5. 提交代码

- [x] 5.1 查看变更：`git diff`
- [x] 5.2 添加所有变更文件：`git add`
- [x] 5.3 提交变更：`git commit -m "refactor: replace uuid and crypto.randomUUID with ai.generateId"`
