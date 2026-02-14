# Design: crypto.ts 集成测试

## Context

**背景**
- `src/utils/crypto.ts`：加密工具模块，使用 Web Crypto API 实现 AES-256-GCM 加密/解密
- `src/store/keyring/masterKey.ts`：主密钥管理，支持 Tauri 环境的系统钥匙串和 Web 环境的 IndexedDB
- `src/store/storage/modelStorage.ts`：模型数据存储，使用 crypto.ts 加密 API keys

**当前状态**
- 单元测试：79 个测试用例（`src/__test__/utils/crypto.test.ts`）
- 基础集成测试：14 个测试用例（`src/__test__/utils/crypto-masterkey.integration.test.ts`）
- 测试框架：Vitest + happy-dom
- Mock 方案：所有外部依赖（`@/utils/tauriCompat`）被 mock

**约束**
- 测试环境不依赖真实的 Tauri keyring（通过 mock 隔离）
- Web 环境使用 fake-indexeddb（已在 `keyring.test.ts` 中验证）
- 必须与现有测试模式保持一致（`crypto-masterkey.integration.test.ts`）

## Goals / Non-Goals

**Goals：**
- 为 crypto.ts 添加端到端加密存储流程的集成测试
- 验证主密钥轮换后的数据访问场景
- 验证批量解密失败时的容错机制
- 增强加密模块的安全性和边界验证
- 确保测试覆盖率达到 90% 以上（新增 ~15 个测试用例）

**Non-Goals：**
- 不修改 `src/utils/crypto.ts` 的实现（仅新增测试）
- 不修改 `src/store/keyring/masterKey.ts` 的实现
- 不修改 `src/store/storage/modelStorage.ts` 的实现
- 不添加新的加密功能或算法

## Decisions

### 1. 测试文件组织

**决策**：创建独立的集成测试文件 `src/__test__/integration/crypto-storage.integration.test.ts`

**理由**：
- 与现有 `crypto-masterkey.integration.test.ts` 保持一致（已在 `src/__test__/utils/` 目录）
- `integration/` 子目录更清晰地标识集成测试
- 与单元测试 `crypto.test.ts` 分离，避免文件过大

**替代方案**：
- 在 `crypto.test.ts` 中添加集成测试 ❌（文件已 850 行，继续增长会难以维护）
- 在 `crypto-masterkey.integration.test.ts` 中添加 ❌（该文件专注于 crypto + masterKey 集成，新增内容应聚焦于 crypto + storage）

### 2. Mock 策略

**决策**：使用 `vi.mocked()` 完全 mock `@/utils/tauriCompat` 和 `@/store/storage/modelStorage`

**理由**：
- 集成测试聚焦于 crypto.ts 与业务逻辑的交互，而非验证 keyring 实现
- keyring 兼容层已有独立测试（`keyring.test.ts`，782 行）
- 避免测试时间过长（IndexedDB 操作 + 加密操作）
- 测试失败时更容易定位问题（隔离 crypto.ts 的问题）

**替代方案**：
- 使用真实的 IndexedDB（fake-indexeddb）❌（已由 `keyring.test.ts` 覆盖，增加重复工作）
- 使用真实的 Tauri keyring ❌（测试环境不可用）

### 3. 测试场景优先级

**决策**：按业务影响优先级排序测试场景

**高优先级**（与实际业务场景直接相关）：
1. 端到端加密存储流程（`saveModelsToJson` → `loadModelsFromJson`）
2. 部分解密失败场景（模型列表中部分使用旧密钥）
3. 主密钥丢失后的数据访问（降级处理）

**中优先级**（安全性和边界条件）：
4. 恶意密文格式测试（`isEncrypted()` 防御）
5. 密钥长度严格验证（256-bit 密钥）
6. Nonce 唯一性验证（加密安全性）

**低优先级**（性能和边缘场景）：
7. 并发加密的密文唯一性（1000 个并发加密）
8. 混合数据完整性（同时包含加密和未加密数据）

**理由**：
- 优先覆盖用户可能遇到的实际问题
- 安全性测试防止潜在的漏洞
- 性能测试已有基础覆盖（`crypto.test.ts` 已有 2MB 数据加密测试）

### 4. 测试数据管理

**决策**：每个测试用例独立初始化和清理密钥

**理由**：
- 确保测试用例之间无状态共享
- 避免"雪球效应"（前一个测试失败导致后续测试失败）
- 符合测试隔离原则

**实现**：
```typescript
describe('端到端加密存储流程', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 每个测试用例前清理密钥
    mockGetPassword.mockResolvedValue(null);
    mockSetPassword.mockResolvedValue(undefined);
  });
});
```

### 5. 错误断言消息

**决策**：使用 expect 的第二个参数添加清晰的断言消息

**理由**：
- 测试失败时，错误消息直接指向问题
- 减少调试时间（不需要查看测试代码）

**实现**：
```typescript
expect(decrypted, '解密结果应与原始明文一致').toBe(plaintext);
```

## Risks / Trade-offs

### Risk 1：测试时间增加
**风险**：新增 ~15 个测试用例，预计增加 2-3 秒测试时间

**缓解措施**：
- 集成测试仅验证关键路径，不过度追求覆盖率
- 使用 mock 避免缓慢的 I/O 操作（IndexedDB）

### Risk 2：Mock 与真实环境不一致
**风险**：完全 mock keyring 可能无法发现真实环境的集成问题

**缓解措施**：
- `keyring.test.ts` 已覆盖真实 keyring 实现（782 行测试）
- `crypto.ts` 本身不依赖 keyring，仅接受 hex 密钥字符串
- 业务集成测试（`modelStorage.test.ts`）使用真实加密/解密操作

### Risk 3：测试维护成本
**风险**：集成测试可能因业务逻辑变化而频繁失败

**缓解措施**：
- 测试聚焦于 crypto.ts 的加密/解密行为，而非业务逻辑细节
- 使用描述性测试名称和清晰的断言消息，便于快速定位问题
- 遵循"测试金字塔"原则：集成测试数量 < 单元测试数量

## Migration Plan

不适用（纯测试变更，无需数据迁移）

## Open Questions

**无**。所有技术决策已明确。

**待确认**（非阻塞）：
- 是否需要在 CI/CD 中生成测试覆盖率报告？（当前配置支持 `pnpm test:coverage`）
