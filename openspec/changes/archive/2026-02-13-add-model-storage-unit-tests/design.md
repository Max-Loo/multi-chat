## Context

`modelStorage.ts` 是模型数据持久化的核心模块，负责 API 密钥的加密存储和解密加载。当前该模块缺少单元测试，存在以下风险：

- 加密/解密逻辑错误可能导致 API 密钥泄露
- 主密钥缺失时的错误处理未经验证
- 边界情况（空列表、并发操作）的行为不明确
- 未来重构时缺少回归测试保护

## Goals / Non-Goals

**Goals:**
- 为 `modelStorage.ts` 提供完整的单元测试覆盖，包括所有导出函数和内部辅助函数
- 验证加密/解密逻辑的正确性和错误处理
- 测试边界情况和异常场景
- 集成到现有的 CI/CD 流程
- 确保测试执行速度快（< 1秒），适合频繁运行

**Non-Goals:**
- 不涉及集成测试或端到端测试
- 不修改 `modelStorage.ts` 的实现代码
- 不添加新的测试框架（使用项目现有的 Vitest）

## Decisions

### 测试框架选择：Vitest
**决策**: 使用 Vitest 作为测试框架

**理由**:
- 项目已配置 Vitest，无需引入额外依赖
- Vitest 与 Vite 深度集成，支持热重载和快速执行
- 与 Jest API 兼容，迁移成本低
- 原生支持 TypeScript，类型安全

**替代方案**: Jest（但需要额外配置，且与 Vite 集成度较低）

### Mock 策略：Vi.fn() 和 Manual Mocks
**决策**: 使用 Vitest 的 `vi.fn()` 和手动 mock 模块

**理由**:
- **crypto 模块**: Mock `encryptField()` 和 `decryptField()`，验证调用参数和返回值
- **masterKey 模块**: Mock `getMasterKey()`，模拟密钥存在/不存在场景
- **storeUtils 模块**: Mock `createLazyStore()`、`saveToStore()` 和 `loadFromStore()`，验证存储操作

**替代方案**: 使用 spies 监控真实函数（但依赖外部存储，测试不稳定）

### 测试文件结构：Describe 嵌套
**决策**: 使用 `describe()` 嵌套结构组织测试

**理由**:
- 按函数分组（如 `describe('encryptModelSensitiveFields')`）
- 按场景分组（如 `describe('Scenario: 成功加密 API 密钥')`）
- 测试报告清晰易读

**示例结构**:
```typescript
describe('modelStorage', () => {
  describe('encryptModelSensitiveFields', () => {
    it('should encrypt API key when key exists', async () => {
      // WHEN / THEN
    });
  });
});
```

### 测试数据：Fixture 模式
**决策**: 使用测试辅助函数生成标准测试数据

**理由**:
- 避免重复创建模型对象
- 统一测试数据格式
- 便于维护和修改

**实现**:
```typescript
const createMockModel = (overrides?: Partial<Model>): Model => ({
  id: 'model-1',
  nickname: 'Test Model',
  apiKey: 'sk-test-123',
  ...overrides
});
```

## Risks / Trade-offs

### Risk 1: Mock 与真实实现不一致
**风险**: Mock 的加密/解密函数可能与真实实现行为不同，导致测试通过但实际运行失败

**缓解措施**:
- 定期运行集成测试验证真实存储操作
- 在 Mock 中模拟真实的错误场景（如抛出异常）
- 代码审查时检查 Mock 行为是否与实现一致

### Risk 2: 测试覆盖假阳性
**风险**: 测试覆盖率高但实际测试质量低（如只测试 happy path）

**缓解措施**:
- 明确要求覆盖边界情况和错误场景
- 代码审查时检查测试用例是否全面
- 使用 `vitest --coverage` 生成覆盖率报告，要求 > 90%

### Trade-off: 测试执行速度 vs 测试完整性
**权衡**: 性能测试（如 100+ 模型）可能增加测试执行时间

**平衡方案**:
- 将性能测试标记为 `test.skip()` 或使用 `test.slow()`
- 在 CI 中默认跳过性能测试，仅在需要时运行
- 保持单元测试快速执行（< 1秒）

## Migration Plan

1. **创建测试文件**: `src/store/storage/modelStorage.test.ts`
2. **实现 Mock 模块**: 使用 `vi.mock()` 配置依赖模块
3. **编写测试用例**: 按照 spec.md 中的场景逐个实现
4. **运行测试**: `pnpm test modelStorage`
5. **CI 集成**: 确保 `pnpm test:run` 包含新测试
6. **覆盖率检查**: 生成覆盖率报告，确保 > 90%

**回滚策略**: 如果测试失败或影响构建，可以删除测试文件并回滚代码修改。

## Open Questions

无（所有技术决策已明确）
