## Why

当前 `modelStorage.ts` 缺少单元测试，无法验证加密存储逻辑的正确性。作为数据持久化的核心模块，任何错误都可能导致 API 密钥泄露或数据丢失。添加完整的单元测试可以确保代码质量，提高可维护性，并为未来重构提供安全网。

## What Changes

- 新增 `src/store/storage/modelStorage.test.ts` 测试文件
- 覆盖所有导出函数的单元测试：
  - `saveModelsToJson()`: 验证模型加密和保存逻辑
  - `loadModelsFromJson()`: 验证模型解密和加载逻辑
- 测试内部辅助函数：
  - `encryptModelSensitiveFields()`: 验证加密逻辑
  - `decryptModelSensitiveFields()`: 验证解密逻辑
- 覆盖边界情况和错误处理：
  - 主密钥不存在时的行为
  - 加密/解密失败时的错误处理
  - 空模型列表的处理
  - 部分 API 密钥已加密的处理

## Capabilities

### New Capabilities
- `model-storage-unit-tests`: 为 `modelStorage.ts` 模块提供完整的单元测试覆盖，包括加密/解密逻辑、错误处理和边界情况的验证。

### Modified Capabilities
无

## Impact

- **代码**: 新增 `src/store/storage/modelStorage.test.ts` 测试文件
- **测试框架**: 使用 Vitest（项目现有测试框架）
- **Mock 依赖**: 需要模拟 `@/utils/crypto`、`@/store/keyring/masterKey` 和 `./storeUtils` 模块
- **CI/CD**: 测试将集成到现有的 CI 流程（`pnpm test:run`）
- **文档**: 更新 AGENTS.md 中关于测试覆盖度的说明
