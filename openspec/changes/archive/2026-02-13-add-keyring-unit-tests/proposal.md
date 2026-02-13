# Keyring 模块单元测试提案

## Why

Keyring 模块是应用安全存储的核心组件，负责在 Tauri 和 Web 环境中提供统一的密钥存储 API。当前该模块缺乏自动化测试，存在以下风险：

1. **关键安全性功能未验证**: 加密/解密逻辑、密钥派生、IndexedDB 操作等核心功能未经自动化测试覆盖
2. **跨环境兼容性难以保证**: Tauri 和 Web 环境的实现差异可能引入回归问题
3. **重构和维护风险高**: 缺乏测试保护，代码重构和优化时容易引入 bug
4. **不符合项目测试标准**: 项目中已有 `masterKey.test.ts`、`crypto.test.ts` 等模块的良好测试实践，keyring 模块应保持一致

## What Changes

- **新增**: 为 `src/utils/tauriCompat/keyring.ts` 模块创建完整的单元测试套件
- **新增**: 测试文件位置 `src/__test__/utils/tauriCompat/keyring.test.ts`
- **测试框架**: 使用 Vitest + happy-dom（与项目现有测试配置一致）
- **Mock 策略**:
  - Tauri 环境: Mock `tauri-plugin-keyring-api` 的原生 API
  - Web 环境: Mock Web Crypto API 和 IndexedDB
- **测试覆盖率目标**: ≥80% 核心逻辑覆盖率（加密/解密、密钥派生、错误处理）

## Capabilities

### New Capabilities
- `keyring-unit-tests`: 为 keyring 兼容层模块提供完整的单元测试覆盖，确保跨环境安全存储功能的正确性和稳定性

### Modified Capabilities
- `web-keyring-compat`: 无规范级变更，仅为现有实现添加测试验证

## Impact

**受影响的代码**:
- `src/utils/tauriCompat/keyring.ts` - 被测试模块（无需修改）
- `src/__test__/utils/tauriCompat/` - 新增测试目录和文件

**依赖和工具**:
- Vitest - 测试框架（项目已配置）
- happy-dom - DOM 环境（项目已配置）
- vi.mock - Mock Tauri API 和浏览器 API

**API 变更**:
- 无 API 变更，纯测试代码新增

**文档**:
- 测试用例即作为功能规范文档
- AGENTS.md 无需更新（已在跨平台兼容性章节说明 keyring 模块）
