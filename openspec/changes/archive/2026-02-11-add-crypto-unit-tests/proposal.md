# 优化 crypto 模块单元测试

## Why

`src/utils/crypto.ts` 模块负责处理敏感数据的加密和解密，是应用安全架构的核心组件。虽然现有测试（`src/__test__/utils/crypto.test.ts`）已覆盖基本的加密/解密功能，但存在以下不足：

**现有测试的局限性：**
- 未测试内部工具函数（`hexToBytes()`, `bytesToBase64()`, `base64ToBytes()`），这些是加密/解密的基础
- 缺少对密钥格式验证的测试（如非 64 字符 hex、非 hex 字符等）
- 缺少对数据完整性验证的测试（如 nonce 长度、密文格式等）
- 测试用例虽然覆盖了多语言和特殊字符，但缺少对极值情况的系统测试

优化测试可以：
- 提升代码覆盖率至 100%
- 确保所有边界条件都得到验证
- 增强对未来重构的信心

## What Changes

**扩展现有测试文件** `src/__test__/utils/crypto.test.ts`：

- 新增内部工具函数测试：
  - `hexToBytes()`: hex 字符串转换、奇数长度处理、非 hex 字符处理
  - `bytesToBase64()`: 字节数组到 Base64 转换、空数组处理
  - `base64ToBytes()`: Base64 到字节数组转换、无效 Base64 处理

- 新增边界条件测试：
  - 无效密钥格式（非 64 字符、非 hex 字符、空密钥）
  - 无效密文格式（缺少 nonce、数据长度不足）
  - 大数据处理（超长明文、特殊 Unicode 字符）

- 改进测试结构：
  - 使用测试辅助函数减少重复代码
  - 添加参数化测试以提高可维护性

## Capabilities

### New Capabilities

- `crypto-utils-coverage`: 内部工具函数测试覆盖，确保 hex/bytes/Base64 转换逻辑正确
- `crypto-validation-tests`: 输入验证测试，确保无效输入被正确拒绝
- `crypto-edge-cases`: 边界条件测试，覆盖极值情况和异常场景

### Modified Capabilities

无需修改现有规范。

## Impact

**受影响的代码：**
- `src/utils/crypto.ts` - 被测试的源代码（为提高测试覆盖率，可能需要导出内部函数）
- `src/__test__/utils/crypto.test.ts` - **扩展现有测试文件**（不是新增）

**可能的源代码调整：**
- 如果需要测试内部工具函数，可能需要导出 `hexToBytes`, `bytesToBase64`, `base64ToBytes`
- 或者使用 Jest/Vitest 的 `jest.requireActual()` 来访问内部函数

**依赖：**
- Vitest 测试框架（项目已配置）
- Node.js 内置 `crypto.subtle` API（或使用 `@peculiar/webcrypto` polyfill）

**测试环境：**
- Node.js 环境（Vitest 默认）
- 需要确保 `crypto.subtle` API 可用（Vitest 的 `environment: 'node'` 已支持）
