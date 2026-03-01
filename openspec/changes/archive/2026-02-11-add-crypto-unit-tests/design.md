# Crypto 模块测试优化设计

## Context

**背景：**
- `src/utils/crypto.ts` 包含 3 个内部工具函数和 3 个导出函数
- 现有测试 `src/__test__/utils/crypto.test.ts` 已覆盖基本功能，但内部函数未测试
- 这些内部函数是加密/解密流程的基础，如果出错会导致难以调试的问题

**当前状态：**
- 内部函数（`hexToBytes`, `bytesToBase64`, `base64ToBytes`）未导出
- 测试使用真实的 `crypto.subtle` API（浏览器/Node.js 原生）
- Vitest 配置使用 `environment: 'node'`，支持 Web Crypto API

**约束条件：**
- 避免过度暴露内部实现细节（保持封装性）
- 测试代码应该简洁易维护
- 不应引入额外的运行时依赖

## Goals / Non-Goals

**Goals:**
- 实现 100% 的代码覆盖率（包括所有分支）
- 确保所有边界条件都经过验证
- 保持测试代码的可读性和可维护性
- 最小化对生产代码的侵入性修改

**Non-Goals:**
- 不重构 crypto.ts 的实现（除非必要）
- 不引入新的测试依赖（如测试专用 polyfill）
- 不改变测试框架（继续使用 Vitest）

## Decisions

### 决策 1：导出内部工具函数用于测试

**选择：** 导出 `hexToBytes`, `bytesToBase64`, `base64ToBytes` 函数

**理由：**
- 这些是纯函数，无副作用，导出风险低
- 导出使得函数可以被其他模块复用（如调试工具）
- 比 `jest.requireActual()` 或测试私有 API 更清晰
- TypeScript 的类型系统保证了类型安全

**替代方案：**
- **方案 A：不导出，使用 `jest.requireActual()` 访问**
  - 优点：保持封装性
  - 缺点：测试代码复杂，维护成本高，依赖具体实现

- **方案 B：在测试文件中重新实现这些函数**
  - 优点：测试独立
  - 缺点：无法测试实际实现，测试变得无意义

**最终选择导出**，因为简单、直接、可维护。

### 决策 2：测试组织结构

**选择：** 使用 `describe` 嵌套 + 参数化测试

**理由：**
- `describe` 嵌套保持清晰的层次结构
- `test.each()` 参数化测试减少重复代码
- 使用测试辅助函数（如 `testInvalidInput`）提高复用性

**测试结构示例：**
```typescript
describe('hexToBytes', () => {
  describe('正常情况', () => {
    it('应该正确转换 hex 字符串', ...);
  });

  describe('异常情况', () => {
    it.each([
      ['奇数长度', 'abc'],
      ['非 hex 字符', 'xyz'],
    ])('应该抛出错误: %s', (...);
  });
});
```

### 决策 3：测试数据管理

**选择：** 使用测试数据常量而非随机生成

**理由：**
- 可重现的测试失败
- 明确的测试用例文档
- 更容易理解测试意图

**示例：**
```typescript
const INVALID_HEX_CASES = [
  { name: '奇数长度', input: 'abc' },
  { name: '包含非 hex 字符', input: 'ghij' },
  { name: '包含空格', input: 'ab cd' },
];
```

### 决策 4：crypto.subtle API 依赖

**选择：** 继续使用 Node.js 原生的 `crypto.subtle` API

**理由：**
- Vitest 的 `environment: 'node'` 已支持 Web Crypto API
- 项目现有测试已通过，证明环境可用
- 不引入额外的 polyfill 依赖

**验证：**
运行 `pnpm test:run` 确认现有测试通过

## Risks / Trade-offs

### 风险 1：导出内部函数可能被误用

**风险：** 其他模块可能依赖这些内部函数，增加重构难度

**缓解措施：**
- 在函数注释中标注 `@internal` 或 `Testing only`
- 未来可以使用 `/*#__PURE__*/` 注释支持 tree-shaking
- 如果需要，可以使用 `export {}` 语法配合 JSDoc `@private`

### 风险 2：100% 覆盖率可能带来脆弱的测试

**风险：** 过度关注覆盖率数字，导致测试与实现耦合

**缓解措施：**
- 优先测试公开行为（API）而非实现细节
- 对内部函数，只测试关键逻辑而非所有分支
- 定期审查测试，删除无意义的断言

### 权衡：测试覆盖率 vs 开发时间

**权衡：** 追求 100% 覆盖率需要额外时间

**决策：** 对于加密模块，高覆盖率是值得的投资，因为：
- 安全关键代码需要高置信度
- 一次性投入，长期受益
- 内部函数逻辑简单，测试成本低

## Migration Plan

**步骤 1：导出内部函数**
1. 在 `src/utils/crypto.ts` 中导出 `hexToBytes`, `bytesToBase64`, `base64ToBytes`
2. 添加 `@internal` JSDoc 注释说明用途

**步骤 2：扩展测试文件**
1. 在 `src/__test__/utils/crypto.test.ts` 中添加新的测试套件
2. 按照设计文档的决策组织测试结构
3. 使用参数化测试覆盖边界条件

**步骤 3：验证**
1. 运行 `pnpm test:run` 确保所有测试通过
2. 运行 `pnpm test:coverage` 检查覆盖率是否达到 100%
3. 运行 `pnpm tsc` 和 `pnpm lint` 确保代码质量

**回滚策略：**
- 如果导出函数造成问题，可以移除 `export` 关键字
- 测试文件可以独立回滚，不影响生产代码
- Git 提供版本控制保障

## Open Questions

**无** - 所有关键决策已明确。

---

**附录：测试用例清单**

**内部工具函数测试：**
- [ ] `hexToBytes`: 正常 hex、奇数长度、非 hex 字符、空字符串
- [ ] `bytesToBase64`: 正常字节数组、空数组、特殊字符
- [ ] `base64ToBytes`: 正常 Base64、无效 Base64、空字符串

**输入验证测试：**
- [ ] `encryptField`: 无效密钥（非 64 字符、非 hex）、空密钥
- [ ] `decryptField`: 无效密文格式（无前缀、长度不足）

**边界条件测试：**
- [ ] 超长明文（> 1MB）
- [ ] 特殊 Unicode 字符（emoji、组合字符）
- [ ] 大量重复数据（检测 nonce 唯一性）
