## Why

`src/store/keyring/masterKey.ts` 是应用安全架构的核心模块，负责主密钥的生成、存储和初始化。该模块目前没有任何单元测试，存在以下风险：
- 密钥生成逻辑的错误可能导致安全漏洞
- Keyring 集成问题在运行时才发现，影响用户体验
- 重构时缺乏回归保护，容易引入破坏性变更

## What Changes

- **发现**: 项目中已存在 `src/__test__/store/keyring/masterKey.test.ts`，包含 53 个测试用例，覆盖率 98.3%
- **新增 Mock 工具**: 在 `src/utils/tauriCompat/__mocks__/index.ts` 创建可复用的 Mock 工具（供其他测试使用）
- **测试覆盖范围**（已存在）:
  - `generateMasterKey()`: 验证密钥长度、格式（hex 编码）、随机性
  - `isMasterKeyExists()`: 测试存在/不存在场景、异常处理
  - `getMasterKey()`: 测试成功获取、密钥不存在、keyring 异常
  - `storeMasterKey()`: 测试成功存储、keyring 异常
  - `initializeMasterKey()`: 测试首次生成、返回已存在密钥、异常场景
  - `handleSecurityWarning()`: 测试 Tauri/Web 环境行为、localStorage 状态管理
  - `exportMasterKey()`: 测试成功导出、密钥不存在场景

## Capabilities

### New Capabilities
- `master-key-unit-tests`: 主密钥管理模块的单元测试能力，覆盖所有导出函数的正常流程和异常场景，确保密钥管理逻辑的正确性和健壮性。

### Modified Capabilities
（无 - 仅添加测试，不修改现有功能的行为要求）

## Impact

- **新增文件**:
  - `src/store/keyring/__tests__/masterKey.test.ts` - 主测试文件
  - `src/utils/tauriCompat/__mocks__/index.ts` - Mock 实现（如不存在）
- **测试框架**: 使用 Vitest（项目已配置）
- **依赖影响**: 无，仅添加测试代码
- **性能影响**: 测试仅在开发/CI 环境运行，不影响生产性能
- **安全影响**: 通过测试确保密钥管理逻辑的正确性，提升应用安全性
