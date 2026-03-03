# Spec: 集成测试覆盖范围 (Delta)

## MODIFIED Requirements

### Requirement: 集成测试必须覆盖关键错误场景

系统 SHALL 确保集成测试覆盖关键错误场景，验证系统的错误处理和恢复能力。

**关键错误场景**：
- API 失败（网络错误、超时、服务器错误）
- 数据损坏（无效数据、格式错误）
- 用户体验中断（页面刷新、导航切换）
- **新增**：API 供应商服务中断（DeepSeek、Kimi、ZhipuAI 个别或全部不可用）

#### Scenario: API 错误处理集成测试
- **WHEN** API 请求失败时
- **THEN** 集成测试 SHALL 验证：
  - 错误消息正确显示
  - UI 状态正确更新（loading → error）
  - 用户可以重试或取消

#### Scenario: 网络超时处理集成测试
- **WHEN** API 请求超时时
- **THEN** 集成测试 SHALL 验证：
  - 超时错误正确显示
  - 请求正确取消
  - 用户可以重新发起请求

#### Scenario: 数据恢复集成测试
- **WHEN** 存储数据损坏或丢失时
- **THEN** 集成测试 SHALL 验证：
  - 系统检测到数据异常
  - 提供恢复方案（如重置、重新加载）
  - 用户体验不崩溃

#### Scenario: API 供应商服务中断测试
- **WHEN** 特定 API 供应商服务中断时（如 DeepSeek API 不可用）
- **THEN** 集成测试 SHALL 验证：
  - 系统正确识别供应商服务状态
  - 用户看到清晰的错误提示（非通用错误）
  - 其他供应商的模型仍可正常使用
  - 已发送的请求正确取消，不阻塞 UI

#### Scenario: 所有供应商服务不可用测试
- **WHEN** 所有 API 供应商服务同时中断时
- **THEN** 集成测试 SHALL 验证：
  - 系统显示全局错误提示（如"所有模型供应商服务不可用"）
  - 用户无法发送新消息
  - 已加载的聊天历史仍可查看
  - 系统提供重试机制（自动或手动）

### Requirement: 集成测试使用真实实现

系统 SHALL 确保集成测试使用真实实现，仅 Mock 外部依赖。

**真实实现范围**：
- Redux store（actions、reducers、selectors）
- 存储层（IndexedDB、文件系统）
- 组件树（完整渲染，不 Mock 子组件）
- 服务层（除 API 调用外）

**Mock 范围**：
- 远程 API 调用（使用 MSW）
- 第三方服务（如支付网关）
- 浏览器 API（如 Geolocation）
- **新增**：Tauri API（在 Web 环境测试时使用兼容层）

#### Scenario: 集成测试使用真实 Redux
- **WHEN** 编写集成测试时
- **THEN** 测试 SHALL 使用真实 Redux store
- **AND** 测试 SHALL 通过 `dispatch` actions 测试状态变化
- **AND** 测试 SHALL NOT Mock Redux middleware

#### Scenario: 集成测试使用真实存储层
- **WHEN** 编写集成测试时
- **THEN** 测试 SHALL 使用真实存储层（IndexedDB）
- **AND** 测试 SHALL 在测试前清理存储
- **AND** 测试 SHALL 在测试后验证持久化

#### Scenario: 集成测试使用 MSW Mock API
- **WHEN** 集成测试需要 Mock API 时
- **THEN** 测试 SHALL 使用 MSW（Mock Service Worker）
- **AND** 测试 SHALL 在 beforeEach 中设置 handlers
- **AND** 测试 SHALL 在 afterEach 中关闭 server
- **AND** 测试 SHALL 正确处理 CORS preflight 请求（见下文）

#### Scenario: 集成测试使用 Tauri 兼容层
- **WHEN** 在 Web 环境运行集成测试（非 Tauri 桌面环境）
- **THEN** 测试 SHALL 使用 Tauri 兼容层（`src/utils/tauriCompat/`）
- **AND** 测试 SHALL 验证兼容层提供与 Tauri 一致的 API
- **AND** 测试 SHALL 验证 Web 降级实现正确工作（如 IndexedDB 替代文件系统）

### Requirement: 集成测试运行时间可接受

系统 SHALL 确保集成测试运行时间在可接受范围内（单次测试套件 < 2 分钟）。

**性能优化策略**：
- 使用并行测试执行（Vitest 默认）
- 重用测试 fixtures 和 setup
- 避免重复的初始化操作
- **新增**：MSW server 复用，避免重复创建

#### Scenario: 集成测试运行时间监控
- **WHEN** 运行集成测试时
- **THEN** 测试套件 SHALL 在 2 分钟内完成
- **AND** 测试 SHALL 报告每个测试的运行时间
- **AND** 超过阈值的测试 SHALL 被标记并优化

#### Scenario: 集成测试并行执行
- **WHEN** 运行集成测试时
- **THEN** Vitest SHALL 并行执行独立测试
- **AND** 测试 SHALL 不依赖执行顺序

#### Scenario: MSW Server 复用和优化
- **WHEN** 多个测试使用相同的 MSW handlers
- **THEN** 测试套件 SHALL 在 `beforeAll` 中统一初始化 MSW server
- **AND** 每个测试仅在需要时覆盖特定 handlers（使用 `server.use()`）
- **AND** 测试 SHALL 在 `afterAll` 中关闭 server
- **AND** 测试 SHALL NOT 在每个测试的 `beforeEach` 中创建新 server

**示例**：
```typescript
// vitest.integration.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./src/__test__/integration/setup.ts'],
    // ...
  },
});

// src/__test__/integration/setup.ts
import { server } from './msw/setup';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
```

### Requirement: 集成测试与单元测试互补

系统 SHALL 确保集成测试与单元测试互补，避免重复测试同一行为。

**职责划分**：
- **单元测试**：测试独立函数/组件的内部逻辑（如复杂计算、数据转换）
- **集成测试**：测试模块间交互和完整用户流程

**避免重复**：
- 如果集成测试已覆盖行为，单元测试可删除或简化
- 保留关键单元测试（如性能关键路径、安全相关）
- **新增**：API 供应商特定的逻辑应在集成测试中验证

#### Scenario: 单元测试与集成测试不重复
- **WHEN** 编写测试时
- **THEN** 测试 SHALL 避免重复测试同一行为
- **AND** 如果集成测试覆盖，单元测试 SHALL 优先删除

#### Scenario: 保留关键单元测试
- **WHEN** 删除冗余单元测试时
- **THEN** 关键单元测试 SHALL 保留：
  - 性能关键路径（如加密算法）
  - 安全相关逻辑（如输入验证）
  - 复杂计算（如数据处理）

#### Scenario: API 供应商逻辑在集成测试中验证
- **WHEN** 测试 API 供应商特定逻辑（如 DeepSeek 流式响应、Kimi headers）
- **THEN** 测试 SHALL 在集成测试中验证
- **AND** 测试 SHALL 使用真实的 Redux store + MSW handlers
- **AND** 测试 SHALL NOT 在单元测试中 Mock 所有依赖

## ADDED Requirements

### Requirement: MSW 必须正确处理 CORS Preflight 请求

系统 SHALL 确保集成测试中的 MSW server 正确响应 CORS preflight 请求（OPTIONS 方法），避免测试失败。

**问题背景**：
- 当前 `chat-flow.integration.test.ts` 标记了 "TODO: 修复 MSW CORS preflight 处理问题"
- 浏览器/Node.js 在跨域请求前会发送 OPTIONS 请求
- 如果 MSW 未处理 OPTIONS，测试会报错 "Network error" 或 "CORS policy"

**解决方案对比**：

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| 方案 1: 显式 OPTIONS handler | 完整控制，可测试 CORS 场景 | 重复代码 | ⭐⭐⭐⭐⭐ 推荐 |
| 方案 2: onUnhandledRequest: 'bypass' | 简单，一行配置 | 可能掩盖真实 CORS 问题 | ⭐⭐⭐ 备选 |
| 方案 3: 禁用 CORS | 不影响测试 | 不符合真实场景 | ⭐ 不推荐 |

**推荐方案 1：显式 OPTIONS handler**（兼顾完整性和可控性）

```typescript
// src/__test__/msw/setup.ts
import { setupServer } from 'msw/node';
import { HttpResponse } from 'msw';

export const server = setupServer(
  // 方案 1: 显式处理所有 OPTIONS 请求（推荐）
  http.options('*', ({ request }) => {
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }),

  // 其他 handlers...
  http.post('https://api.deepseek.com/v1/chat/completions', deepSeekHandler),
);

// 在测试套件启动时配置
beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
```

**备选方案 2：onUnhandledRequest: 'bypass'**（简化配置，快速修复）

```typescript
// src/__test__/msw/setup.ts
import { setupServer } from 'msw/node';

export const server = setupServer(
  // 其他 handlers...
);

// 关键配置：忽略未处理的请求（包括 OPTIONS）
server.listen({
  onUnhandledRequest: 'bypass',
});

// 注意：此方案可能掩盖真实的 CORS 问题，建议仅在快速修复时使用
```

**方案选择指导**：
- **生产环境集成测试**：使用方案 1（显式 OPTIONS handler）
- **快速修复阶段**：可临时使用方案 2，但需在后续迁移到方案 1
- **单元测试（不涉及网络）**：无需处理 CORS

#### Scenario: MSW Server 显式响应 OPTIONS 请求（方案 1）
- **WHEN** 测试发送跨域 API 请求（如 `https://api.deepseek.com`）
- **THEN** MSW server SHALL 显式响应 OPTIONS 请求
- **AND** 响应 SHALL 包含完整的 CORS 头
- **AND** 响应状态码 SHALL 为 204 (No Content)
- **AND** 测试 SHALL NOT 报告 "Network error"

#### Scenario: MSW Server 使用 bypass 配置（方案 2）
- **WHEN** 在 `vitest.integration.config.ts` 中配置 MSW
- **THEN** 配置 SHALL 包含 `onUnhandledRequest: 'bypass'` 选项
- **AND** 配置 SHALL 确保 OPTIONS 请求不被拦截
- **AND** 配置 SHALL 允许测试中未定义的路由通过

#### Scenario: 验证 CORS 问题已修复
- **WHEN** 运行 `chat-flow.integration.test.ts`
- **THEN** 测试 SHALL 不再报告 "TODO: 修复 MSW CORS preflight 处理问题"
- **AND** 所有跨域请求测试 SHALL 通过
- **AND** 测试 SHALL 不显示 "Network error" 或 "CORS policy" 错误

**迁移路径**：
```markdown
阶段 1（快速修复）：使用方案 2（onUnhandledRequest: 'bypass'）
- ✅ 立即解决测试失败
- ✅ 恢复 CI/CD 通过

阶段 2（完整方案）：迁移到方案 1（显式 OPTIONS handler）
- ✅ 提供更好的测试覆盖
- ✅ 可测试 CORS 相关场景
- ✅ 避免掩盖真实问题
```

#### Scenario: 验证 CORS 问题已修复
- **WHEN** 运行 `chat-flow.integration.test.ts`
- **THEN** 测试 SHALL 不再报告 "TODO: 修复 MSW CORS preflight 处理问题"
- **AND** 所有跨域请求测试 SHALL 通过
- **AND** 测试 SHALL 不显示 "Network error" 或 "CORS policy" 错误

### Requirement: 集成测试必须覆盖 API 供应商场景

系统 SHALL 为每个支持的 API 供应商（DeepSeek、Kimi、ZhipuAI）提供集成测试，验证供应商特定的功能。

**供应商特定场景**：
- **DeepSeek**: 流式响应、推理内容（DeepSeek-R1）
- **Kimi**: 长上下文、特定 headers
- **ZhipuAI**: 编码模型（ZhipuAI_CODING_PLAN）

#### Scenario: DeepSeek 流式响应集成测试
- **WHEN** 用户使用 DeepSeek 模型发送聊天消息
- **THEN** 集成测试 SHALL 验证：
  - 流式响应正确逐字显示在 UI
  - 推理内容（`reasoningContent`）正确折叠/展开
  - `finishReason` 和 `usage` 元数据正确保存
- **AND** MSW handlers SHALL 模拟 DeepSeek API 的流式响应格式

#### Scenario: DeepSeek-R1 推理内容测试
- **WHEN** 用户使用 DeepSeek-R1 模型（支持推理内容）
- **THEN** 集成测试 SHALL 验证：
  - 推理内容正确显示在折叠区域
  - 用户可以展开/折叠推理内容
  - 推理内容不包含在最终响应中（`content` 字段分离）
- **AND** 测试 SHALL 验证 "包含推理内容" 开关的功能

#### Scenario: Kimi 长上下文测试
- **WHEN** 用户使用 Kimi 模型发送长上下文消息
- **THEN** 集成测试 SHALL 验证：
  - 系统正确发送长上下文（> 32k tokens）
  - 响应正确处理长文本
  - UI 显示长文本的性能可接受（不卡顿）

#### Scenario: ZhipuAI 编码模型测试
- **WHEN** 用户使用 ZhipuAI 编码模型（ZhipuAI_CODING_PLAN）
- **THEN** 集成测试 SHALL 验证：
  - 模型正确识别为编码模型（特殊 UI 标识）
  - 响应格式符合编码场景（如代码高亮）
  - 特定 API 参数正确传递

### Requirement: 集成测试必须验证模型供应商切换

系统 SHALL 提供集成测试，验证用户可以在不同供应商之间切换，系统正确处理状态和配置。

**切换场景**：
- 同一个聊天使用不同供应商的模型
- 切换供应商后，历史消息仍可查看
- 供应商配置变更（API key、地址）后的行为

#### Scenario: 聊天中切换模型供应商
- **WHEN** 用户在同一个聊天中切换使用不同供应商的模型
- **THEN** 集成测试 SHALL 验证：
  - 新消息使用新供应商的模型
  - 历史消息仍显示正确的供应商标识
  - Redux store 正确更新 `runningChat` 状态

#### Scenario: 供应商配置变更后的行为
- **WHEN** 用户修改供应商配置（如更改 API key）
- **THEN** 集成测试 SHALL 验证：
  - 配置正确保存到存储
  - 后续消息使用新配置
  - 如果配置无效，显示错误提示

### Requirement: 集成测试必须验证模型供应商远程获取

系统 SHALL 提供集成测试，验证从 `models.dev` API 远程获取供应商数据和降级到缓存的行为。

**远程获取场景**：
- 首次启动时从远程获取
- 远程 API 失败时降级到缓存
- 手动刷新供应商数据

#### Scenario: 远程获取供应商数据成功
- **WHEN** 应用启动或用户手动刷新
- **THEN** 集成测试 SHALL 验证：
  - 系统发送请求到 `https://models.dev/api.json`
  - 数据正确过滤（只保留 DeepSeek、Kimi、ZhipuAI）
  - 数据保存到 Redux store 和缓存
  - UI 显示更新后的供应商列表

#### Scenario: 远程获取失败时降级到缓存
- **WHEN** 远程 API 不可用（网络错误、超时）
- **THEN** 集成测试 SHALL 验证：
  - 系统从本地缓存加载数据（`remote-cache.json`）
  - 显示警告 Toast（但应用仍可用）
  - 用户仍可使用模型功能

#### Scenario: 缓存也不存在时的行为
- **WHEN** 远程 API 不可用且本地缓存为空
- **THEN** 集成测试 SHALL 验证：
  - 系统显示致命错误提示（如"无法获取模型供应商数据"）
  - 用户无法使用模型功能
  - 系统提供重试按钮
