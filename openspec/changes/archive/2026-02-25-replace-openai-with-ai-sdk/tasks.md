# 实施任务清单

## 1. 依赖管理

- [x] 1.1 安装 ai-sdk 核心包和供应商 provider 包
  ```bash
  pnpm add ai @ai-sdk/deepseek @ai-sdk/moonshotai zhipu-ai-provider
  ```

- [x] 1.2 移除 openai 依赖包
  ```bash
  pnpm remove openai
  ```

- [x] 1.3 运行类型检查，确认无类型错误
  ```bash
  pnpm tsc
  ```

## 2. 枚举和常量更新

- [x] 2.1 更新 `src/utils/enums.ts`
  - 从 `ModelProviderKeyEnum` 枚举中移除 `OPEN_AI = 'openai'`
  - 保留 `DEEPSEEK`、`KIMI`、`BIG_MODEL` 三个枚举值

- [x] 2.2 更新 `src/utils/constants.ts` 中的 `ALLOWED_MODEL_PROVIDERS` 白名单
  - 移除 `'openai'`（如存在）
  - 保留 `'deepseek'`、`'kimi'`、`'bigmodel'`

## 3. ChatService 重构

- [x] 3.1 在 `src/services/chatService.ts` 中导入 ai-sdk 相关模块
  ```typescript
  import { streamText } from 'ai';
  import { createDeepSeek } from '@ai-sdk/deepseek';
  import { createMoonshotAI } from '@ai-sdk/moonshotai';
  import { createZhipu } from 'zhipu-ai-provider';
  import { getFetchFunc } from '@/utils/tauriCompat';
  ```

- [x] 3.2 实现 `getProvider()` 函数
  - 接收 `providerKey: ModelProviderKeyEnum` 和 `apiKey: string` 参数
  - 根据 `providerKey` 返回对应的供应商 provider 工厂函数
  - 使用 `createDeepSeek({ apiKey })`、`createMoonshotAI({ apiKey })`、`createZhipu({ apiKey })`
  - 对不支持的供应商抛出错误

- [x] 3.3 重写 `streamChatCompletion()` 函数 - 使用 ai-sdk
  - 使用 `streamText()` 替代 `chat.completions.create()`
  - 配置 `fetch: getFetchFunc()` 注入兼容层 fetch 函数
  - 配置 `abortSignal` 支持请求中断

- [x] 3.4 实现 ai-sdk 流式响应到 `StandardMessage` 的转换
  - 迭代 `result.textStream` 获取增量文本
  - 将每个文本片段包装为 `StandardMessage` 格式
  - 保持 `finishReason` 字段的处理逻辑

- [x] 3.5 解析 token 使用情况
  - 从 `result.usage` 获取 `promptTokens`、`completionTokens`
  - 兼容不同供应商的 `cachedTokens` 结构
  - 更新 `StandardMessage` 的 `usage` 字段

- [x] 3.6 移除 `urlNormalizer.ts` 的导入和使用
  - 从 `src/services/chatService.ts` 中删除 `import { UrlNormalizer }`
  - 删除所有 `UrlNormalizer.normalize()` 调用

## 4. 清理废弃模块

- [x] 4.1 删除 `src/services/urlNormalizer.ts` 文件
  ```bash
  rm src/services/urlNormalizer.ts
  ```

- [x] 4.2 搜索并移除代码库中所有对 `urlNormalizer` 的引用
  ```bash
  rg -l "urlNormalizer" src/
  ```

## 5. 测试和验证

- [ ] 5.1 运行单元测试（如有）
  ```bash
  pnpm test
  ```

- [ ] 5.2 启动开发环境进行集成测试
  ```bash
  pnpm tauri dev
  ```

- [ ] 5.3 测试 DeepSeek 供应商聊天功能
  - 发送消息，验证流式响应正常
  - 验证 token 使用情况显示正确
  - 测试"停止生成"按钮（AbortSignal）

- [ ] 5.4 测试 Kimi (Moonshot AI) 供应商聊天功能
  - 发送消息，验证流式响应正常
  - 验证 token 使用情况显示正确
  - 测试"停止生成"按钮

- [ ] 5.5 测试 Zhipu (BigModel) 供应商聊天功能
  - 发送消息，验证流式响应正常
  - 验证 token 使用情况显示正确
  - 测试"停止生成"按钮

- [ ] 5.6 测试错误处理
  - 使用无效 API Key，验证错误提示正确
  - 验证网络错误处理

- [ ] 5.7 运行生产构建
  ```bash
  pnpm tauri build
  ```

- [ ] 5.8 在 Tauri 桌面应用中重复聊天功能测试
  - 重复步骤 5.3-5.6 的测试
  - 验证跨平台兼容性

## 6. Web 环境测试

- [ ] 6.1 启动 Web 开发服务器
  ```bash
  pnpm dev
  ```

- [ ] 6.2 在浏览器中测试所有三个供应商的聊天功能
  - 验证 Vite 代理正常工作
  - 重复步骤 5.3-5.6 的测试

## 7. 代码质量检查

- [x] 7.1 运行代码检查
  ```bash
  pnpm lint
  ```

- [x] 7.2 运行类型检查
  ```bash
  pnpm tsc
  ```

- [x] 7.3 分析未使用代码
  ```bash
  pnpm analyze:unused
  ```

## 8. 文档更新

- [x] 8.1 更新 `AGENTS.md` 中的"聊天服务层"部分
  - 说明使用 Vercel AI SDK 而非 OpenAI SDK
  - 更新代码示例，展示 `getProvider()` 和 `streamText()` 的用法

- [x] 8.2 删除或更新 `AGENTS.md` 中的"URL 标准化模块"部分
  - 添加说明：已移除该模块，URL 标准化由 ai-sdk provider 自动处理

- [x] 8.3 更新 `README.md`（如需要）
  - 如技术栈部分提到了 OpenAI SDK，更新为 Vercel AI SDK

## 9. 提交和清理

- [x] 9.1 检查 Git 状态，确认所有修改
  ```bash
  git status
  ```

- [x] 9.2 查看代码差异
  ```bash
  git diff
  ```

- [ ] 9.3 创建提交（如用户要求）
  ```bash
  git add .
  git commit -m "refactor: replace openai package with ai-sdk

- Migrate from OpenAI SDK to Vercel AI SDK with vendor-specific providers
- Remove urlNormalizer.ts (URL normalization now handled by ai-sdk)
- Remove OPEN_AI from ModelProviderKeyEnum
- Update ChatService to use streamText() and vendor providers
- Maintain backward compatibility with StandardMessage format"
  ```
