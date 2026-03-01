# Proposal: crypto.ts 集成测试

## Why

当前 `src/utils/crypto.ts` 拥有完善的单元测试（79 个测试用例）和基础集成测试（14 个测试用例），但**缺少端到端业务场景的验证**。

实际使用中，`crypto.ts` 与 `masterKey.ts` 和 `modelStorage.ts` 紧密集成：
- 应用启动时初始化主密钥 → 加密敏感字段（API keys）→ 存储到 Store
- 应用运行时加载模型 → 自动解密 API keys → 供 API 调用使用

缺失的集成测试可能导致：
- 主密钥轮换后的数据访问问题（旧密钥加密的数据无法解密）
- 部分解密失败时的容错机制未验证
- 恶意密文格式可能绕过 `isEncrypted()` 检查

## What Changes

### 新增测试文件
- `src/__test__/integration/crypto-storage.integration.test.ts`：端到端加密存储流程测试
  - 覆盖 `initializeMasterKey()` → `encryptModelSensitiveFields()` → `saveModelsToJson()`
  - 覆盖 `loadModelsFromJson()` → `decryptModelSensitiveFields()`
  - 验证数据完整性和往返一致性
  - **新增 25 个测试用例**（包括边缘用例和错误路径测试）

### 补充安全性和边界验证
- **密钥长度严格验证**：确保使用 AES-256（32 字节/64 hex 字符）
- **Nonce 唯一性验证**：100 次加密应产生 100 个不同的 nonce
- **恶意密文格式防御**：验证 `isEncrypted()` 对超长、emoji、二进制数据的防御能力
- **并发加密场景**：并发加密 100 个相同明文应产生 100 个不同密文

### 完善错误处理路径
- **部分解密失败场景**：批量解密时，部分数据使用旧密钥加密，应优雅降级
- **主密钥丢失场景**：主密钥不存在时，应返回空字符串 API keys，而非崩溃
- **边缘用例测试**：无效 hex 字符、奇数长度密钥、缺少前缀等错误路径

## Capabilities

### New Capabilities
- `crypto-integration-tests`：为 `src/utils/crypto.ts` 添加完整的集成测试覆盖，包括：
  - 端到端加密存储流程（save → load 往返）
  - 密钥轮换后的数据访问验证
  - 批量操作的容错机制验证
  - 安全性和边界条件测试

- `crypto-security-validation`：增强加密模块的安全性验证
  - 密钥长度严格性（仅接受 256-bit 密钥）
  - Nonce 随机性和唯一性
  - 恶意输入防御

### Modified Capabilities
- 无。不修改现有 `crypto.ts` 的功能，仅新增测试。

## Impact

### 影响的代码
- **新增**：`src/__test__/integration/crypto-storage.integration.test.ts`
- **测试框架**：继续使用 Vitest + happy-dom + fake-indexeddb
- **测试时间**：预计增加 ~2-3 秒（新增 25 个测试用例，包括边缘用例）

### 依赖系统
- **测试工具**：`@vitest/coverage-v8`（已有）
- **Mock 依赖**：`fake-indexeddb`（已在 `keyring.test.ts` 中使用）
- **被测模块**：`@/utils/crypto`, `@/store/keyring/masterKey`, `@/store/storage/modelStorage`

### 不影响
- **生产代码**：不修改 `src/utils/crypto.ts` 的实现
- **现有测试**：不破坏现有的单元测试和集成测试
- **应用性能**：测试仅在开发/CI 环境运行
