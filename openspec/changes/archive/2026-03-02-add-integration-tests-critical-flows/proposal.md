# 集成测试补充方案 - 关键端到端流程

## Why

项目当前仅有 **3 个集成测试**，全部集中在加密和存储模块，缺少对关键业务流程的端到端验证。

**现有测试覆盖情况：**
- **单元测试**: 78 个测试文件，覆盖组件、Hooks、状态管理、工具函数
- **集成测试**: 仅 3 个（`crypto-masterkey`, `crypto-storage`, `initialization`）
- **E2E 测试**: 无

**关键业务流程未经集成验证：**

1. **聊天流程**（核心功能）
   - 发送消息 → 流式响应 → Redux 存储 → 持久化
   - 涉及模块：`chatService` → `chatMiddleware` → `chatStorage`
   - **风险**: 各模块单独测试通过，但集成后可能存在接口不匹配、数据流断裂等问题

2. **模型配置流程**（关键用户流程）
   - 添加 API Key → 加密存储 → 聊天使用
   - 涉及模块：`modelStorage` → `crypto.ts` → `masterKey` → `chatService`
   - **风险**: 加密链路未经端到端验证，可能导致数据泄露或无法解密

3. **设置变更流程**（跨模块协调）
   - 语言切换 → i18n 更新 → Redux → localStorage
   - 涉及模块：`appConfigMiddleware` → `i18n.ts` → `localStorage`
   - **风险**: 跨模块协调未经测试，可能出现状态不一致

**为什么现在补充：**
- 单元测试已达到 75.6% 覆盖率，需要验证模块间协作
- 项目接近功能完整，是补充集成测试的最佳时机
- 缺少集成测试会在重构时引入回归风险
- 集成测试可作为活文档，帮助理解系统行为

## What Changes

为 **3 个关键端到端流程**补充集成测试，预计新增 **3-5 个集成测试文件**：

### 1. 聊天流程集成测试

**新增文件**: `src/__test__/integration/chat-flow.integration.test.ts`

**测试场景**：
- 完整聊天流程：用户输入 → API 调用 → 流式响应 → Redux 更新 → 持久化存储
- 错误处理：API 失败 → 错误提示 → 重试机制
- 消息历史：加载历史聊天 → 渲染消息 → 继续对话
- 推理内容：配置推理开关 → 请求推理内容 → 渲染推理过程

**涉及模块**：
- `services/chatService.ts`
- `store/middleware/chatMiddleware.ts`
- `store/slices/chatSlices.ts`
- `store/storage/chatStorage.ts`
- `components/ChatPanelSender.tsx`
- `components/ChatPanelContentDetail.tsx`

### 2. 模型配置集成测试

**新增文件**: `src/__test__/integration/model-config.integration.test.ts`

**测试场景**：
- 添加模型：填写表单 → API Key 加密 → 存储到 Redux → 持久化
- 使用模型：选择模型 → 解密 API Key → 调用 API → 验证响应
- 编辑模型：加载模型 → 修改配置 → 更新加密存储
- 删除模型：删除模型 → 清理加密数据 → 验证删除

**涉及模块**：
- `store/storage/modelStorage.ts`
- `utils/crypto.ts`
- `store/keyring/masterKey.ts`
- `services/chatService.ts`
- `pages/Model/components/ModelConfigForm.tsx`

### 3. 设置变更集成测试

**新增文件**: `src/__test__/integration/settings-change.integration.test.ts`

**测试场景**：
- 语言切换：切换语言 → i18n 更新 → Redux 更新 → localStorage 持久化 → UI 重新渲染
- 推理内容开关：切换开关 → Redux 更新 → localStorage 持久化 → 下次聊天生效
- 跨平台一致性：Tauri 环境 → 系统钥匙串；Web 环境 → IndexedDB

**涉及模块**：
- `store/middleware/appConfigMiddleware.ts`
- `lib/i18n.ts`
- `store/slices/appConfigSlices.ts`
- `utils/tauriCompat/store.ts`
- `utils/tauriCompat/keyring.ts`

### 4. 跨平台兼容性集成测试（可选）

**新增文件**: `src/__test__/integration/cross-platform.integration.test.ts`

**测试场景**：
- Tauri/Web 环境检测：`isTauri()` → 选择正确的存储层
- 主密钥管理：Tauri → 系统钥匙串；Web → IndexedDB 加密
- HTTP 请求：Tauri → Tauri HTTP 插件；Web → fetch API

**涉及模块**：
- `utils/tauriCompat/env.ts`
- `utils/tauriCompat/keyring.ts`
- `utils/tauriCompat/http.ts`
- `utils/tauriCompat/store.ts`

## Capabilities

### New Capabilities

- **`chat-flow-integration`**: 端到端聊天流程的集成测试能力，覆盖消息发送、流式响应、状态管理和持久化存储
- **`model-config-integration`**: 模型配置流程的集成测试能力，覆盖 API Key 加密、存储和使用验证
- **`settings-change-integration`**: 设置变更流程的集成测试能力，覆盖语言切换、推理内容配置和跨平台持久化
- **`cross-platform-integration`**: 跨平台兼容性的集成测试能力，覆盖 Tauri/Web 环境切换和存储层适配

### Modified Capabilities

无。本次变更仅补充测试代码，不修改任何生产代码的行为或接口。

## Impact

### 代码影响

**新增集成测试文件**（3-4 个）：
```
src/__test__/integration/chat-flow.integration.test.ts
src/__test__/integration/model-config.integration.test.ts
src/__test__/integration/settings-change.integration.test.ts
src/__test__/integration/cross-platform.integration.test.ts (可选)
```

**新增测试辅助工具**（可能需要）：
```
src/__test__/helpers/integration/
├── testServer.ts         # Mock API 服务器
├── flushPromises.ts      # Promise 刷新工具
└── setupTestStore.ts     # Redux 测试 store 配置
```

**无代码修改**：
- 所有生产代码保持不变
- 仅添加测试文件，不引入 breaking changes

### 测试覆盖率提升

虽然集成测试不直接影响代码覆盖率数字，但会显著提升：
- **集成覆盖率**: 验证模块间协作的代码路径
- **场景覆盖率**: 覆盖端到端用户场景
- **回归保护**: 为重构提供安全网

### 依赖项

**可能需要新增的测试依赖**：

| 依赖 | 用途 | 是否必需 |
|------|------|----------|
| `msw` (Mock Service Worker) | Mock HTTP API 请求 | 推荐 |
| `@testing-library/user-event` | 模拟真实用户交互 | 已安装 ✅ |
| `fake-indexeddb` | Mock IndexedDB (Web 环境) | 已安装 ✅ |

**现有测试框架已足够**：
- Vitest (已配置)
- Redux Toolkit 测试工具
- React Testing Library

### 性能影响

- **测试执行时间**: 集成测试较慢，预计增加 10-15 秒
- **建议**: 将集成测试与单元测试分离，使用不同 script
  ```json
  {
    "test": "vitest",                    // 单元测试
    "test:integration": "vitest -c vitest.integration.config.ts",  // 集成测试
    "test:all": "pnpm test && pnpm test:integration"  // 全部测试
  }
  ```

### 维护成本

- **短期**: 集成测试需要维护 Mock 数据和测试场景
- **长期**: 降低生产环境 bug，减少调试成本
- **收益比**: 高（集成测试捕获单元测试无法发现的问题）

### CI/CD 影响

**建议的 CI 配置**：
```yaml
# 并行运行单元测试和集成测试
test:
  parallel:
    - unit-tests: pnpm test
    - integration-tests: pnpm test:integration

# 仅在合并前运行完整测试套件
test-full:
  script: pnpm test:all
  only: [merge_requests]
```
