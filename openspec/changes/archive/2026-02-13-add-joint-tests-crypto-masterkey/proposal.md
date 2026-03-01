## Why

当前 crypto.ts 和 masterKey.ts 已有各自的单元测试，但缺乏联合测试验证两者的集成场景。这导致无法保证在实际应用中，主密钥的生命周期管理（生成、存储、获取）与加密解密操作的协同工作是否正确。需要在集成层面验证加密功能与主密钥管理的端到端行为。

## What Changes

- 新增联合测试套件，测试 crypto.ts 和 masterKey.ts 的集成场景
- 验证使用 masterKey 生成的密钥进行加密/解密操作的完整流程
- 测试主密钥生命周期中的加密操作正确性（首次启动生成密钥、使用现有密钥、密钥重新生成）
- 验证密钥格式在两个模块间的传递和兼容性
- 测试错误场景下的集成行为（密钥丢失、密钥变更后解密失败等）

## Capabilities

### New Capabilities
- `crypto-masterkey-integration`: 覆盖 crypto.ts 与 masterKey.ts 的联合测试，包括：
  - 使用 generateMasterKey 生成的密钥进行加密/解密
  - 使用 initializeMasterKey 获取的密钥进行加密/解密
  - 密钥重新生成后旧数据无法解密的场景
  - 密钥导出后用于加密操作的兼容性
  - Tauri 和 Web 环境下的集成行为差异（如有）

### Modified Capabilities
（无 - 仅新增集成测试，不修改现有规范）

## Impact

- **影响的代码**:
  - `src/utils/crypto.ts` - 加密/解密函数（测试消费者）
  - `src/store/keyring/masterKey.ts` - 主密钥管理函数（测试依赖）
  - `src/utils/tauriCompat` - Mock Keyring 函数（getPassword, setPassword, isTauri）

- **测试框架**:
  - 使用 Vitest 测试框架
  - 使用 vi.mock() 隔离外部依赖（@/utils/tauriCompat）

- **测试文件位置**:
  - 新增测试文件：`src/utils/__tests__/crypto-masterkey.integration.test.ts`

- **依赖**:
  - 依赖现有的单元测试 Mock 逻辑（masterKey 单元测试已实现的 Keyring Mock）
  - 依赖 crypto.ts 的工具函数（hexToBytes, bytesToBase64 等）

- **系统行为**:
  - 不影响生产代码，仅新增测试
  - 测试需在隔离环境运行，不依赖真实 Keyring
