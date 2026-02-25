## Context

**当前状态**: `src/store/keyring/masterKey.ts` 模块包含 7 个导出函数，负责主密钥的生成、存储、初始化和导出。该模块依赖 `@/utils/tauriCompat` 提供的跨平台 Keyring API，但没有单元测试覆盖。

**约束条件**:
- 必须使用项目已配置的 Vitest 框架
- 不能修改 `masterKey.ts` 的源代码（仅添加测试）
- 需要模拟 Keyring 依赖以隔离外部系统（系统钥匙串、IndexedDB）
- 测试需要同时覆盖 Tauri 和 Web 运行环境

**利益相关者**: 开发团队（代码质量）、安全团队（密钥管理正确性）、QA（回归测试）

## Goals / Non-Goals

**Goals**:
- 为所有 7 个导出函数提供单元测试覆盖
- 验证密钥生成、存储、获取的正确性
- 测试异常场景和错误处理
- 确保 Tauri/Web 环境分支的正确性
- 创建可复用的 Mock 工具供其他测试使用

**Non-Goals**:
- 集成测试（真实 Keyring 交互）
- E2E 测试（完整应用流程）
- 性能测试（密钥生成速度、加密性能）
- 修改 `masterKey.ts` 的实现逻辑

## Decisions

### 1. 测试框架选择

**决策**: 使用 Vitest（已配置）而非引入新框架

**理由**:
- 项目已配置 Vitest，无需额外依赖
- Vitest 与 Vite 构建工具深度集成
- 支持 ES modules、TypeScript 原生支持
- Watch 模式和快照功能完善

**替代方案**: Jest - 考虑后放弃，因为需要额外配置且与 Vite 集成度较低

### 2. Mock 策略

**决策**: 使用 Vitest 的 `vi.mock()` 在文件级别 mock `@/utils/tauriCompat`

**理由**:
- 隔离外部依赖（系统钥匙串、IndexedDB）
- 测试执行快速（无 I/O 操作）
- 可控制各种异常场景
- Mock 工具可复用到其他测试

**实现方式**:
```typescript
vi.mock("@/utils/tauriCompat", () => ({
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  isTauri: vi.fn(),
}));
```

**替代方案**: 真实 Keyring + 测试数据库 - 考虑后放弃，因为测试速度慢且环境依赖复杂

### 3. 测试组织结构

**决策**: 使用 Vitest 的 `describe()` 和 `it()` 按函数分组测试

**理由**:
- 每个导出函数一个 `describe` 块
- 测试用例按场景分组（正常流程、异常、边界）
- 使用 `beforeEach()` 重置 mock 状态
- 使用 `test.each()` 进行参数化测试（密钥格式验证）

**测试覆盖函数**:
- `generateMasterKey()` - 3 个测试用例
- `isMasterKeyExists()` - 3 个测试用例
- `getMasterKey()` - 4 个测试用例
- `storeMasterKey()` - 3 个测试用例
- `initializeMasterKey()` - 4 个测试用例
- `handleSecurityWarning()` - 4 个测试用例
- `exportMasterKey()` - 2 个测试用例

**总计**: ~23 个测试用例

### 4. 环境分支测试

**决策**: 使用 `vi.mocked(isTauri).mockReturnValue()` 控制 `isTauri()` 返回值

**理由**:
- 覆盖 Tauri 和 Web 两个分支
- 测试环境特定的日志输出
- 测试 `handleSecurityWarning()` 的条件逻辑

**示例**:
```typescript
describe("handleSecurityWarning (Tauri 环境)", () => {
  beforeEach(() => {
    vi.mocked(isTauri).mockReturnValue(true);
  });
  // 测试 Tauri 环境行为
});

describe("handleSecurityWarning (Web 环境)", () => {
  beforeEach(() => {
    vi.mocked(isTauri).mockReturnValue(false);
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    } as any;
  });
  // 测试 Web 环境行为
});
```

### 5. 异常场景测试

**决策**: 使用 `vi.fn().mockRejectedValue()` 模拟 Keyring 错误

**理由**:
- 验证错误处理逻辑的正确性
- 测试不同环境的错误消息
- 确保错误不会导致应用崩溃

**测试场景**:
- `getPassword()` 抛出异常 → 验证 `getMasterKey()` 抛出正确错误
- `setPassword()` 抛出异常 → 验证 `storeMasterKey()` 抛出正确错误
- `isTauri()` 返回 false → 验证 Web 环境错误消息
- `isTauri()` 返回 true → 验证 Tauri 环境错误消息

## Risks / Trade-offs

### 风险 1: Mock 与真实 Keyring 行为不一致

**风险**: Mock 返回值可能与真实 Keyring 行为不同，导致测试通过但实际运行失败

**缓解措施**:
- 定期运行集成测试验证真实 Keyring 交互
- 在 Mock 中模拟 Keyring 的真实返回值类型（null、string、Error）
- 代码审查时检查 Mock 函数的实现

### 风险 2: `crypto.getRandomValues()` 的随机性难以测试

**风险**: 密钥生成的随机性无法直接验证（可能偶然生成重复密钥）

**缓解措施**:
- 测试密钥格式（长度、hex 编码）而非随机性
- 多次调用 `generateMasterKey()` 验证生成不同的值（概率测试）
- 不依赖特定密钥值，仅验证格式正确性

### 风险 3: `handleSecurityWarning()` 依赖 `localStorage` 和动态导入

**风险**: 测试环境可能没有 `localStorage`，或 `import('sonner')` 失败

**缓解措施**:
- Mock `global.localStorage` 和 `global.localStorage.getItem`
- Mock `import('sonner')` 返回 fake `toast` 对象
- 使用 `vi.stubGlobal()` 添加缺失的全局对象

### 风险 4: 测试覆盖但不保证安全性

**风险**: 单元测试验证逻辑正确性，但不保证密钥管理的安全性（如密钥强度、加密算法）

**缓解措施**:
- 单元测试关注逻辑正确性，安全性由安全审查和渗透测试覆盖
- 依赖 Web Crypto API 的安全性（已被浏览器厂商验证）
- 密钥生成使用 `crypto.getRandomValues()`（密码学安全的随机数生成器）

## Migration Plan

**阶段 1: 创建 Mock 工具**（1-2 小时）
- [ ] 创建 `src/utils/tauriCompat/__mocks__/index.ts`
- [ ] 实现 `getPassword`、`setPassword`、`isTauri` 的 mock 函数
- [ ] 添加 TypeScript 类型支持

**阶段 2: 编写测试用例**（3-4 小时）
- [ ] 创建 `src/store/keyring/__tests__/masterKey.test.ts`
- [ ] 实现 `generateMasterKey()` 测试
- [ ] 实现 `isMasterKeyExists()` 测试
- [ ] 实现 `getMasterKey()` 测试
- [ ] 实现 `storeMasterKey()` 测试
- [ ] 实现 `initializeMasterKey()` 测试
- [ ] 实现 `handleSecurityWarning()` 测试
- [ ] 实现 `exportMasterKey()` 测试

**阶段 3: 验证和优化**（1 小时）
- [ ] 运行 `pnpm test` 验证所有测试通过
- [ ] 检查测试覆盖率（`pnpm test:coverage`）
- [ ] 优化慢速测试（如有）

**回滚策略**: 如测试导致 CI 失败或开发环境问题，删除测试文件和 Mock 工具即可（不影响生产代码）

## Open Questions

**Q1**: `handleSecurityWarning()` 使用动态 `import('sonner')`，如何 mock？

**A**: 使用 `vi.mock()` 拦截动态导入：
```typescript
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
  },
}));
```

**Q2**: 是否需要测试 `console.warn()` 和 `console.error()` 的输出？

**A**: 是的，使用 `vi.spyOn(console, 'warn')` 验证警告日志输出，确保用户能看到正确的错误信息。

**Q3**: 是否需要测试密钥的密码学强度（如熵值）？

**A**: 不需要，单元测试关注逻辑正确性。密码学强度由安全审查覆盖，且 `crypto.getRandomValues()` 已被浏览器厂商验证。

**Q4**: 是否需要测试密钥的持久化（重启应用后密钥仍存在）？

**A**: 不需要，持久化是 Keyring 的职责，不属于 `masterKey.ts` 的单元测试范围。持久化测试由集成测试覆盖。
