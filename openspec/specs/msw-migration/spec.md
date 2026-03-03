# Spec: 测试策略标准化 - MSW 与 vi.mock 的正确使用

## Purpose

定义单元测试和集成测试的清晰边界，明确 MSW 和 `vi.mock` 的使用场景，修复错误的 Mock 策略，建立标准化的测试分类规范。

**核心原则**：
- **单元测试**：测试单个函数/组件，使用 `vi.mock` 隔离所有依赖
- **集成测试**：测试多个模块协作，使用 MSW 模拟外部 API，不使用 `vi.mock` 隔离内部模块

**判断流程图**：
```
是否测试单个模块？
├── 是 → 单元测试（使用 vi.mock）
└── 否 → 是否涉及外部资源？
    ├── 是 → 集成测试（使用 MSW）
    └── 否 → 集成测试（不使用 vi.mock）
```

## Requirements

### Requirement: 必须正确区分单元测试和集成测试

系统 SHALL 根据测试对象和依赖关系，正确选择测试策略和 Mock 工具。

**单元测试特征**：
- 测试单个函数、类或组件的行为
- 使用 `vi.mock()` 隔离所有依赖
- 不涉及文件系统、网络、数据库等外部资源
- 执行速度快，可并行运行
- **示例**：`chatService.test.ts`、Redux Slice 测试、工具函数测试

**集成测试特征**：
- 测试多个模块协作的场景
- 涉及外部资源（文件系统、网络、数据库）
- 使用 MSW (Mock Service Worker) 模拟 API 调用
- 不使用 `vi.mock()` 隔离被测试系统的内部模块
- **示例**：`modelStorage.test.ts`、`masterKey.test.ts`、`chat-flow.integration.test.ts`

#### Scenario: 单元测试必须使用 vi.mock
- **WHEN** 测试单个函数（如 `streamChatCompletion`）
- **THEN** 测试 SHALL 使用 `vi.mock()` 模拟所有依赖
- **AND** 测试 SHALL 验证输入输出和逻辑分支
- **AND** 测试 SHALL NOT 使用 MSW（因为没有真实的网络请求）

#### Scenario: 集成测试必须使用 MSW
- **WHEN** 测试多个模块协作（如加密 + 文件系统）
- **THEN** 测试 SHALL 使用 MSW 模拟外部 API（Tauri API、供应商 API）
- **AND** 测试 SHALL NOT 使用 `vi.mock()` 隔离被测试系统的内部模块
- **AND** 测试 SHALL 验证完整的业务流程

#### Scenario: ChatService 单元测试保留 vi.mock
- **WHEN** 测试 `chatService.streamChatCompletion()` 参数传递和消息转换逻辑
- **THEN** 测试 SHALL 使用 `vi.mock()` 模拟 AI SDK（DeepSeek、Kimi、Zhipu）
- **AND** 测试 SHALL 验证参数转换逻辑（`StandardMessage` → AI SDK 格式）
- **AND** 测试 SHALL 验证错误处理分支
- **AND** 测试 SHALL NOT 使用 MSW（因为不涉及真实的网络请求）
- **AND** 测试 SHALL 删除第 14 行的 "TODO: 重新实现以使用 MSW" 注释

#### Scenario: ModelStorage 集成测试必须使用 MSW
- **WHEN** 测试模型数据的加密存储和加载流程
- **THEN** 测试 SHALL 使用 MSW 模拟 Tauri 文件系统 API
- **AND** 测试 SHALL 使用真实的加密函数（`encryptField`、`decryptField`）
- **AND** 测试 SHALL 验证加密 + 存储的完整流程
- **AND** 测试 SHALL NOT 使用 `vi.mock()` 模拟加密模块或存储模块

**当前问题**：
- `modelStorage.test.ts` 使用 `vi.mock` 模拟了 `crypto`、`masterKey`、`storeUtils`
- 这导致测试失去了验证加密集成的意义

**修复方案**：
```typescript
// ❌ 删除这些 mock
vi.mock('@/utils/crypto', () => ({ ... }));
vi.mock('@/store/keyring/masterKey', () => ({ ... }));
vi.mock('@/utils/storeUtils', () => ({ ... }));

// ✅ 使用 MSW 模拟 Tauri API
const server = setupServer(
  http.post('/tauri/store/set', async ({ request }) => {
    const body = await request.json();
    // 验证存储的数据格式
    expect(body.key).toBe('models');
    expect(body.value).toMatch(/^enc:/); // 验证已加密
    return HttpResponse.json({ ok: true });
  })
);
```

#### Scenario: MasterKey 集成测试必须使用 MSW
- **WHEN** 测试主密钥的生成、存储、获取流程
- **THEN** 测试 SHALL 使用 MSW 模拟 Tauri 钥匙串 API
- **AND** 测试 SHALL 使用真实的密钥生成逻辑
- **AND** 测试 SHALL 验证密钥格式（64 位十六进制）
- **AND** 测试 SHALL NOT 使用 `vi.mock()` 模拟 `getPassword`/`setPassword`

**当前问题**：
- `masterKey.test.ts` 使用 `vi.mock` 模拟了钥匙串 API
- 这导致测试无法验证真实的钥匙串集成

**修复方案**：
```typescript
// ❌ 删除这些 mock
vi.mock('@/utils/tauriCompat/keyring', () => ({
  getPassword: vi.fn(),
  setPassword: vi.fn(),
}));

// ✅ 使用 MSW 模拟 Tauri keyring API
const server = setupServer(
  http.post('/tauri/keyring/set-password', async ({ request }) => {
    const body = await request.json();
    // 验证密钥格式
    expect(body.password).toMatch(/^[a-f0-9]{64}$/);
    mockKeyringStore[body.key] = body.password;
    return HttpResponse.json({ ok: true });
  })
);
```

### Requirement: 集成测试中的 vi.mock 必须移除

系统 SHALL 确保集成测试不使用 `vi.mock()` 隔离被测试系统的内部模块。

**禁止的场景**：
- ❌ 在集成测试中 Mock 存储模块（如 `modelStorage`、`chatStorage`）
- ❌ 在集成测试中 Mock 服务模块（如 `chatService`、`modelRemoteService`）
- ❌ 在集成测试中 Mock 加密模块（如 `crypto.ts`）
- ❌ 在集成测试中 Mock 钥匙串模块（如 `keyring.ts`）

**允许的场景**：
- ✅ 在单元测试中 Mock 第三方库（如 `ai` SDK、`axios`）
- ✅ 在单元测试中 Mock 工具函数（如 `getCurrentTimestamp`）
- ✅ 使用 MSW 模拟外部 API（Tauri API、供应商 API）

#### Scenario: 集成测试移除内部模块的 vi.mock
- **WHEN** 在集成测试中发现 `vi.mock()` 用于隔离被测试系统的模块
- **THEN** 开发者 SHALL 移除这些 mock
- **AND** 开发者 SHALL 使用 MSW 模拟外部 API
- **AND** 测试 SHALL 验证真实的模块协作流程

#### Scenario: chat-flow.integration.test.ts 移除 vi.mock
- **WHEN** 测试完整的聊天流程
- **THEN** 测试 SHALL 移除对 `chatStorage` 和 `chatService` 的 vi.mock
- **AND** 测试 SHALL 使用 MSW 模拟供应商 API（DeepSeek、Kimi 等）
- **AND** 测试 SHALL 使用 MSW 模拟 Tauri store API
- **AND** 测试 SHALL 验证 UI → Redux → API → 存储的完整流程

**当前问题**：
- `chat-flow.integration.test.ts` 使用 `vi.mock` 模拟了 `chatStorage` 和 `chatService`
- 这导致集成测试失去了验证多模块协作的意义

**修复方案**：
```typescript
// ❌ 删除这些 mock
vi.mock('@/store/storage/chatStorage', () => ({ ... }));
vi.mock('@/services/chatService', () => ({ ... }));

// ✅ 使用 MSW 模拟所有外部 API
const server = setupServer(
  // 模拟供应商 API
  http.post('https://api.deepseek.com/v1/chat/completions', deepSeekHandler),

  // 模拟 Tauri store API
  http.post('/tauri/store/set', storeSetHandler),
  http.get('/tauri/store/get', storeGetHandler)
);
```

### Requirement: 测试文件命名必须清晰反映测试类型

系统 SHALL 确保测试文件的命名清晰反映其测试类型（单元测试 vs 集成测试）。

**命名规范**：
- 单元测试：`<module>.test.ts` 或 `<module>.test.tsx`
- 集成测试：`<feature>.integration.test.ts` 或 `<feature>.integration.test.tsx`

#### Scenario: 重命名误导的集成测试文件
- **WHEN** 测试文件名为 `integration.test.ts` 但实际是单元测试
- **THEN** 开发者 SHALL 重命名文件为 `<module>.test.ts`
- **AND** 文件内容 SHALL 使用 `vi.mock` 隔离依赖

**需要重命名的文件**：
1. `utils/crypto-masterkey.integration.test.ts` → `utils/crypto-masterkey.test.ts`
2. `integration/crypto-storage.integration.test.ts` → `integration/crypto-storage.test.ts`

**重命名命令**：
```bash
mv src/__test__/utils/crypto-masterkey.integration.test.ts \
   src/__test__/utils/crypto-masterkey.test.ts

mv src/__test__/integration/crypto-storage.integration.test.ts \
   src/__test__/integration/crypto-storage.test.ts
```

### Requirement: MSW Handlers 必须集中管理

系统 SHALL 在 `src/__test__/msw/handlers/` 目录下集中管理所有 MSW handlers，按 API 供应商或功能模块组织。

**目录结构**：
```
src/__test__/msw/
├── handlers/
│   ├── deepseek.ts       # DeepSeek API handlers
│   ├── kimi.ts           # Moonshot AI (Kimi) API handlers
│   ├── zhipu.ts          # ZhipuAI API handlers
│   ├── models-dev.ts     # models.dev API handlers
│   └── index.ts          # 统一导出所有 handlers
├── setup.ts              # MSW server 配置
└── types.ts              # Handler 类型定义
```

#### Scenario: Handler 文件按供应商组织
- **WHEN** 创建新的 API handler
- **THEN** 开发者 SHALL 在 `handlers/` 目录下创建以供应商命名的文件
- **AND** 文件 SHALL 导出 `handlers` 数组，包含该供应商的所有路由
- **AND** 文件 SHALL 包含完整的请求/响应类型定义

#### Scenario: 统一导出所有 Handlers
- **WHEN** 在测试文件中使用 MSW
- **THEN** 测试文件 SHALL 从 `@/__test__/msw/handlers` 导入 handlers
- **AND** 测试文件 SHALL 通过 `setupServer(...handlers)` 初始化 MSW
- **AND** 测试文件 SHALL NOT 手动定义 handlers

#### Scenario: Handlers 支持参数化配置
- **WHEN** 测试需要不同的响应场景（成功、失败、超时）
- **THEN** handler SHALL 接受配置对象来定制响应
- **AND** 配置对象 SHALL 支持 `delay`（模拟延迟）、`status`（HTTP 状态码）、`response`（响应体）

### Requirement: MSW 必须支持 Tauri API 模拟

系统 SHALL 使用 MSW 模拟 Tauri 的 invoke API，确保集成测试能够验证与 Tauri 的集成。

**Tauri API 模拟范围**：
- 文件系统操作（`store.set`、`store.get`、`store.save`）
- 钥匙串操作（`keyring.set-password`、`keyring.get-password`、`keyring.delete-password`）
- Shell 操作（`shell.open`）
- OS 信息（`os.platform`、`os.locale`）

#### Scenario: 模拟 Tauri Store API
- **WHEN** 测试涉及文件系统存储（如 `modelStorage`、`chatStorage`）
- **THEN** MSW SHALL 模拟 `/tauri/invoke` 端点
- **AND** handler SHALL 解析 `cmd` 参数并返回相应的数据
- **AND** handler SHALL 支持 `set`、`get`、`save`、`load` 命令

**示例**：
```typescript
const server = setupServer(
  http.post('/tauri/invoke', async ({ request }) => {
    const body = await request.json();
    const { cmd, key, value } = body;

    switch (cmd) {
      case 'set_store':
        mockStore[key] = value;
        return HttpResponse.json({ ok: true });
      case 'get_store':
        return HttpResponse.json({ value: mockStore[key] || null });
      default:
        return HttpResponse.json({ error: 'Unknown command' }, { status: 400 });
    }
  })
);
```

#### Scenario: 模拟 Tauri Keyring API
- **WHEN** 测试涉及钥匙串操作（如 `masterKey`）
- **THEN** MSW SHALL 模拟钥匙串的 `set`、`get`、`delete` 操作
- **AND** handler SHALL 验证密钥格式（如 64 位十六进制）
- **AND** handler SHALL 支持密钥不存在场景

### Requirement: MSW 必须正确处理 CORS Preflight 请求

系统 SHALL 确保集成测试中的 MSW server 正确响应 CORS preflight 请求（OPTIONS 方法），避免测试失败。

**问题背景**：
- 当前 `chat-flow.integration.test.ts` 标记了 "TODO: 修复 MSW CORS preflight 处理问题"
- 浏览器/Node.js 在跨域请求前会发送 OPTIONS 请求
- 如果 MSW 未处理 OPTIONS，测试会报错 "Network error"

#### Scenario: MSW Server 响应 OPTIONS 请求
- **WHEN** 测试发送跨域 API 请求（如 `https://api.deepseek.com`）
- **THEN** MSW server SHALL 自动响应 OPTIONS 请求
- **AND** 响应 SHALL 包含 CORS 头：`Access-Control-Allow-Origin: *`
- **AND** 响应状态码 SHALL 为 204 (No Content)

#### Scenario: 集成测试配置 CORS 处理
- **WHEN** 在 `vitest.integration.config.ts` 中配置 MSW
- **THEN** 配置 SHALL 包含 `onUnhandledRequest: 'bypass'` 选项
- **AND** 配置 SHALL 确保所有 OPTIONS 请求被正确处理
- **AND** 测试 SHALL NOT 报告 "Network error" 或 "CORS policy" 错误

### Requirement: MSW 必须支持流式响应模拟

系统 SHALL 使用 MSW 的流式响应功能来模拟 AI SDK 的 `streamText()` 返回的 `ReadableStream`。

**实现方案**：
- 使用 MSW 的 `HttpResponse.stream()` 方法
- 模拟 `text-delta` 和 `reasoning-delta` 事件
- 支持中途错误注入测试

#### Scenario: 模拟 DeepSeek 流式响应
- **WHEN** 测试 DeepSeek 流式聊天
- **THEN** MSW handler SHALL 返回 `ReadableStream`
- **AND** 流 SHALL 分块发送文本内容（模拟 `text-delta`）
- **AND** 流 SHALL 在结束时发送完整的元数据（`finishReason`, `usage`）

#### Scenario: 模拟流式响应中途错误
- **WHEN** 测试 API 中途失败场景
- **THEN** MSW handler SHALL 在发送部分内容后抛出错误
- **AND** 测试 SHALL 验证错误处理逻辑（Toast 提示、状态回滚）

#### Scenario: 模拟推理内容流式传输
- **WHEN** 测试包含推理内容的模型（如 DeepSeek-R1）
- **THEN** MSW handler SHALL 发送 `reasoning-delta` 事件
- **AND** 流 SHALL 包含推理文本的逐步生成

### Requirement: MSW 迁移必须保持测试覆盖率

系统 SHALL 确保测试策略标准化后，测试覆盖率不低于之前水平。

**验证标准**：
- 所有重构的测试必须通过
- 测试覆盖率报告显示 `coverage` 百分比未下降
- 新增 handlers 的单元测试覆盖率 ≥ 80%

#### Scenario: 重构后验证测试通过
- **WHEN** 完成 `modelStorage.test.ts` 和 `masterKey.test.ts` 的重构
- **THEN** 所有原有测试用例 SHALL 继续通过
- **AND** 测试 SHALL 验证真实的模块协作流程
- **AND** 测试执行时间 SHALL 在合理范围内（增加 < 20%）

#### Scenario: 新增 Handler 的单元测试
- **WHEN** 创建新的 MSW handler
- **THEN** 开发者 SHALL 为 handler 编写单元测试
- **AND** 测试 SHALL 验证 handler 正确拦截请求
- **AND** 测试 SHALL 验证 handler 返回预期的响应

### Requirement: TODO 注释必须清理

系统 SHALL 清理测试文件中过时的 TODO 注释，确保代码库清洁。

**需要清理的 TODO**：
1. `chatService.test.ts` 第 14 行："TODO: 重新实现以使用 MSW 替代 vi.mock"
2. `chatSlices.test.ts` 第 141 行："TODO: 重新实现以测试行为而非实现细节"

**行动**：
- **删除** `chatService.test.ts` 的 TODO（保留 vi.mock 是正确的）
- **更新** `chatSlices.test.ts` 的 TODO 为具体的实施计划（或在 BDD 规范中处理）
