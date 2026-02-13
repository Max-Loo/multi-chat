# Keyring 单元测试设计文档

## Context

**背景**:
Keyring 模块 (`src/utils/tauriCompat/keyring.ts`) 是应用安全存储的核心组件，提供跨 Tauri 和 Web 环境的统一密钥存储 API。该模块当前缺乏自动化测试覆盖，存在安全性和稳定性的风险。

**当前状态**:
- `src/utils/tauriCompat/keyring.ts` - 主要实现文件（约 460 行代码）
- 包含两个主要类：`TauriKeyringCompat` 和 `WebKeyringCompat`
- 使用 Tauri 原生 API（`tauri-plugin-keyring-api`）或 Web API（IndexedDB + Web Crypto）
- 项目中已有类似的测试实践（`masterKey.test.ts`、`crypto.test.ts`）

**约束条件**:
- 必须使用项目现有的测试框架（Vitest + happy-dom）
- 不能修改被测试模块的代码（仅添加测试）
- 测试需要在 CI/CD 环境中稳定运行
- Mock 策略需要在两种环境之间切换

**利益相关者**:
- 开发团队：需要维护和重构 keyring 代码
- QA 团队：需要验证安全存储功能的正确性
- 最终用户：依赖密钥存储的安全性和可靠性

## Goals / Non-Goals

**Goals:**
- 为 keyring 模块提供完整的单元测试覆盖（≥80% 核心逻辑）
- 验证 Tauri 和 Web 环境的功能一致性
- 建立测试保护，支持安全重构和优化
- 确保加密/解密、密钥派生、错误处理等核心逻辑的正确性
- 提供可读性强的测试用例，作为功能规范文档

**Non-Goals:**
- 不测试 Tauri 原生 API 的行为（假设 Tauri API 正确工作）
- 不测试 Web 浏览器的原生 API（如 IndexedDB、Web Crypto API 的底层实现）
- 不进行性能基准测试（仅在合理范围内验证性能可接受）
- 不进行端到端集成测试（由其他测试套件覆盖）
- 不修改 keyring 模块的实现代码

## Decisions

### 决策 1: 使用 Vitest + happy-dom 作为测试框架

**选择**: Vitest + happy-dom

**理由**:
- 项目已配置 Vitest 和 happy-dom（参考 `masterKey.test.ts` 的实践）
- Vitest 与 Vite 深度集成，启动速度快
- happy-dom 提供浏览器 API 的轻量级实现（localStorage、crypto、indexedDB）
- 与项目现有测试工具链一致，降低维护成本

**替代方案**:
- **JSDOM**: 更成熟但性能较差，且项目未使用
- **Playwright**: 更适合 E2E 测试，对于单元测试过于重量级

### 决策 2: Mock 策略 - 依赖注入 + vi.mock

**选择**: 使用 vi.mock 模拟外部依赖，结合环境检测 Mock

**Tauri 环境 Mock**:
```typescript
// Mock Tauri API
vi.mock('tauri-plugin-keyring-api', () => ({
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  deletePassword: vi.fn(),
}));

// Mock 环境检测
vi.mock('@/utils/tauriCompat/env', () => ({
  isTauri: vi.fn(() => true), // 强制 Tauri 环境
}));
```

**Web 环境 Mock**:
```typescript
// Mock 环境检测
vi.mock('@/utils/tauriCompat/env', () => ({
  isTauri: vi.fn(() => false), // 强制 Web 环境
}));

// 使用 happy-dom 提供的 localStorage、crypto.subtle、indexedDB
// 或使用 fake-indexed-db 进行更精细的控制
```

**理由**:
- vi.mock 在模块级别替换依赖，确保测试隔离
- 环境检测 Mock 允许在单个测试文件中测试两种环境
- 参考 `masterKey.test.ts` 的成功实践
- Mock 外部依赖避免测试受环境因素影响（如系统钥匙串状态）

**替代方案**:
- **依赖注入**: 需要重构 keyring 模块，违反"不修改实现代码"的原则
- **真实 Tauri API 测试**: 需要 Tauri 环境，CI 环境中难以运行

### 决策 3: IndexedDB Mock 方案 - fake-indexed-db

**选择**: 使用 `fake-indexed-db` 库模拟 IndexedDB

**理由**:
- happy-dom 的 IndexedDB 实现功能有限
- `fake-indexed-db` 提供完整的 IndexedDB API 实现
- 支持事务、对象存储、索引等高级功能
- 可以在内存中运行，测试后自动清理
- 社区活跃，广泛使用

**实施**:
```typescript
import { IDBFactory } from 'fake-indexed-db';

// 在 beforeEach 中设置
beforeEach(() => {
  const indexedDB = new IDBFactory();
  vi.stubGlobal('indexedDB', indexedDB);
});

// 在 afterEach 中清理
afterEach(() => {
  vi.unstubAllGlobals();
});
```

**替代方案**:
- **happy-dom 内置 IndexedDB**: 功能不完整，可能不支持所有操作
- **手动 Mock**: 需要大量代码，维护成本高

### 决策 4: Web Crypto API Mock 策略

**选择**: 部分使用真实 crypto API，部分 Mock

**策略**:
- **使用真实 crypto.getRandomValues 和 crypto.subtle**: happy-dom 支持这些 API
- **Mock 密钥派生的输入参数**: 使用固定的种子和 salt，确保测试可重复
- **Mock 加密/解密的输入/输出**: 验证算法正确性，不依赖随机性

**示例**:
```typescript
// 测试加密/解密的正确性
it('应该正确加密和解密密码', async () => {
  const plaintext = 'test-password';
  const key = await deriveEncryptionKey('fixed-seed');
  
  const { ciphertext, iv } = await encrypt(plaintext, key);
  expect(ciphertext).not.toBe(plaintext);
  
  const decrypted = await decrypt(ciphertext, iv, key);
  expect(decrypted).toBe(plaintext);
});
```

**理由**:
- 真实 crypto API 验证算法实现的正确性
- 固定输入确保测试可重复（不依赖随机值）
- 避免过度 Mock 导致测试通过但实际代码失败

**替代方案**:
- **完全 Mock crypto API**: 无法验证真实加密行为，降低测试可信度

### 决策 5: 测试组织结构 - 嵌套 describe

**选择**: 使用三层嵌套 describe 结构

**结构**:
```typescript
describe('Keyring 兼容层测试套件', () => {
  // 全局 beforeEach/afterEach
  
  describe('Tauri 环境', () => {
    describe('setPassword', () => {
      it('应该调用 Tauri API', ...);
      it('应该传递正确的参数', ...);
    });
    
    describe('getPassword', () => { ... });
    describe('deletePassword', () => { ... });
  });
  
  describe('Web 环境', () => {
    describe('加密和解密', () => { ... });
    describe('IndexedDB 操作', () => { ... });
  });
  
  describe('跨环境兼容性', () => { ... });
});
```

**理由**:
- 清晰的层次结构，易于导航
- 每层 describe 可以共享 beforeEach/afterEach
- 与 `masterKey.test.ts` 的组织方式一致
- 便于添加新的测试场景

### 决策 6: 测试数据管理 - 固定测试数据集

**选择**: 使用固定的测试数据集

**测试数据**:
```typescript
const TEST_DATA = {
  service: 'com.multichat.test',
  user: 'test-user',
  password: 'test-password-123',
  longPassword: 'a'.repeat(1000),
  specialPassword: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  seed: 'dGVzdC1zZWVkLTMyLWJ5dGVz', // base64 编码的 32 字节
};
```

**理由**:
- 固定数据确保测试可重复
- 避免随机性导致测试间歇性失败
- 简化测试断言逻辑

**替代方案**:
- **随机生成测试数据**: 增加复杂度，不利于调试

### 决策 7: 覆盖率目标和验证

**选择**: 设置 80% 核心逻辑覆盖率目标

**验证方法**:
```bash
# 运行测试并生成覆盖率报告
pnpm test:coverage -- keyring.test.ts

# 查看 coverage/src/utils/tauriCompat/keyring.ts/index.html
```

**关注的核心逻辑**:
- `encrypt` / `decrypt` 函数（加密/解密）
- `deriveEncryptionKey` 函数（密钥派生）
- `TauriKeyringCompat` 类的方法
- `WebKeyringCompat` 类的方法
- 错误处理逻辑

**理由**:
- 80% 是合理的覆盖率目标，平衡测试成本和收益
- 专注于核心安全逻辑，而非边界代码
- 行覆盖率（line coverage）比分支覆盖率（branch coverage）更重要

**替代方案**:
- **100% 覆盖率**: 成本过高，边际收益递减
- **50% 覆盖率**: 可能遗漏重要场景

## Risks / Trade-offs

### 风险 1: Mock 的真实性风险

**风险**: 过度 Mock 可能导致测试通过但实际代码失败

**缓解措施**:
- 优先使用真实 API（如 crypto.subtle）
- 为 Mock 设置合理的返回值
- 定期运行集成测试验证端到端行为
- 代码审查时检查 Mock 的合理性

### 风险 2: 环境隔离风险

**风险**: Tauri 和 Web 环境的测试可能相互干扰

**缓解措施**:
- 使用 vi.clearAllMocks() 在每个测试后清理 Mock
- 使用独立的 describe 块隔离两种环境
- 在 beforeEach 中强制设置环境标志（isTauri）
- 避免在测试之间共享状态

### 风险 3: IndexedDB 异步操作风险

**风险**: IndexedDB 操作是异步的，可能导致测试时序问题

**缓解措施**:
- 确保所有 IndexedDB 操作都使用 async/await
- 在测试中等待事务完成后再断言
- 使用 fake-indexed-db 的同步操作简化测试
- 添加超时限制（default: 5000ms）

### 风险 4: 加密算法的测试复杂性

**风险**: 加密/解密测试复杂，难以覆盖所有边界条件

**缓解措施**:
- 测试已知明文/密文对（验证算法正确性）
- 测试不同长度的密码（短、中、长）
- 测试特殊字符密码
- 测试损坏的密文（验证解密失败处理）

### 权衡 1: 测试隔离 vs 测试真实性

**权衡**: 使用 Mock 提高隔离性，但可能降低真实性

**决策**: 优先考虑隔离性，使用 Mock 替代外部依赖

**理由**:
- 单元测试的目标是隔离测试单个模块
- 集成测试可以验证模块间交互
- Mock 确保测试在 CI 环境中稳定运行

### 权衡 2: 测试覆盖率 vs 开发时间

**权衡**: 更高的覆盖率需要更多时间编写测试

**决策**: 设置 80% 的合理目标，而非追求 100%

**理由**:
- 边际收益递减：从 80% 提升到 100% 需要不成比例的时间
- 专注于核心安全逻辑，而非边界工具代码
- 未来可以根据需要逐步提升覆盖率

## Migration Plan

### 实施步骤

1. **安装依赖**
   ```bash
   pnpm add -D fake-indexed-db
   ```
   - 添加 `fake-indexed-db` 作为开发依赖
   - 更新 `package.json` 的 devDependencies

2. **创建测试文件**
   - 创建 `src/__test__/utils/tauriCompat/keyring.test.ts`
   - 设置 Vitest 配置和 happy-dom 环境
   - 添加基础的 describe 块和 beforeEach/afterEach

3. **实现 Tauri 环境测试**
   - Mock `tauri-plugin-keyring-api` 和 `@/utils/tauriCompat/env`
   - 测试 `TauriKeyringCompat` 的三个方法
   - 验证 API 调用和参数传递

4. **实现 Web 环境测试**
   - 设置 fake-indexed-db 和 crypto API
   - 测试 `WebKeyringCompat` 的初始化
   - 测试加密/解密逻辑
   - 测试 IndexedDB 操作

5. **实现跨环境测试**
   - 测试 API 一致性
   - 测试 `isSupported` 方法
   - 验证错误处理行为

6. **运行测试并验证覆盖率**
   ```bash
   pnpm test -- keyring.test.ts
   pnpm test:coverage -- keyring.test.ts
   ```
   - 确保所有测试通过
   - 验证覆盖率 ≥80%
   - 查看覆盖率报告，识别未覆盖的代码

7. **CI/CD 集成**
   - 确保测试在 CI 环境中运行
   - 添加覆盖率检查到 CI pipeline
   - 设置覆盖率阈值（如低于 80% 时失败）

### 回滚策略

**无需回滚**: 测试代码是新增的，不影响现有功能

**清理步骤**（如果需要）:
```bash
# 删除测试文件
rm src/__test__/utils/tauriCompat/keyring.test.ts

# 卸载依赖
pnpm remove -D fake-indexed-db
```

## Open Questions

**无**: 当前设计已覆盖所有关键决策

**待验证**:
- fake-indexed-db 在 happy-dom 环境中的兼容性（初步验证显示兼容）
- CI 环境中的测试运行时间（预期 < 30 秒）
