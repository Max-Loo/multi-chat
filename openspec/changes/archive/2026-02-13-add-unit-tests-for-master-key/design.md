## Context

**当前状态：**

masterKey.ts 是密钥管理的核心模块，负责主密钥的生成、存储和获取。该模块目前没有任何单元测试，存在以下风险：

- **密钥生成逻辑隐患**：随机性不足、格式错误等未被验证
- **错误处理路径未覆盖**：异常情况下的行为不确定
- **跨平台兼容性问题**：Tauri 和 Web 环境的差异难以早期发现
- **重构缺乏安全网**：未来修改可能破坏密钥管理功能

**技术约束：**

- 使用 Web Crypto API 生成密钥（crypto.getRandomValues）
- 使用 Keyring 兼容层（tauriCompat/keyring）进行存储
- 需要模拟 Tauri 和 Web 两种运行环境
- 部分函数依赖 DOM API（localStorage、toast），需要测试环境支持

**依赖模块：**

- `@/utils/tauriCompat`：提供 getPassword、setPassword、isTauri 等 API
- `sonner`：Toast 通知库（用于 handleSecurityWarning）

## Goals / Non-Goals

**Goals：**

- 为 masterKey.ts 的所有 7 个导出函数创建全面的单元测试
- 验证密钥生成的正确性（长度、格式、随机性）
- 验证存储和获取功能的正常流程和错误处理
- 验证跨平台兼容性（Tauri vs Web 环境的差异）
- 确保测试覆盖率达到 80% 以上
- 为未来的测试工作提供参考模板（storeUtils.ts、modelStorage.ts 等）

**Non-Goals：**

- 不涉及集成测试（与 crypto.ts 的集成由后续工作完成）
- 不修改 masterKey.ts 的源代码（仅添加测试）
- 不测试 Keyring 兼容层本身（假设其正确性）
- 不测试加密算法本身（仅验证调用接口的正确性）

## Decisions

**测试框架选择：Vitest + happy-dom**

- **选择理由**：
  - 项目已配置 Vitest 作为测试运行器（参见 vite.config.ts 的 test 配置）
  - Vitest 与 Vite 深度集成，支持 TypeScript 开箱即用
  - happy-dom 提供 DOM API 支持，可以模拟 localStorage 和 toast 动态导入
  - 参考项目：src/__test__/utils/crypto.test.ts 使用相同配置

- **替代方案**：Jest + jsdom
  - 拒绝理由：需要额外配置，与 Vite 集成不如 Vitest 紧密

**Mock 策略：使用 vi.mock 模拟 @/utils/tauriCompat**

- **选择理由**：
  - masterKey.ts 依赖 keyring API（getPassword、setPassword、isTauri）
  - 在测试环境中不应访问真实的系统钥匙串或 IndexedDB
  - vi.mock 可以在测试用例中动态控制 mock 返回值，覆盖各种场景

- **实现方式**：
  ```typescript
  // 全局 mock
  vi.mock('@/utils/tauriCompat', () => ({
    getPassword: vi.fn(),
    setPassword: vi.fn(),
    isTauri: vi.fn(),
  }));

  // 在测试用例中设置具体返回值
  (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue('mock-key');
  ```

- **替代方案**：使用真实 keyring API（不模拟）
  - 拒绝理由：测试需要隔离环境，不应依赖外部存储

**测试用例组织结构：按函数分组**

- **选择理由**：
  - masterKey.ts 有 7 个导出函数，每个函数独立测试
  - 使用 describe 分组，提高测试可读性
  - 每个函数覆盖正常路径和错误路径

- **组织结构**：
  ```typescript
  describe('generateMasterKey', () => { ... });
  describe('isMasterKeyExists', () => { ... });
  describe('getMasterKey', () => { ... });
  describe('storeMasterKey', () => { ... });
  describe('initializeMasterKey', () => { ... });
  describe('handleSecurityWarning', () => { ... });
  describe('exportMasterKey', () => { ... });
  ```

**覆盖率目标：>80%**

- **选择理由**：
  - 80% 是业界推荐的单元测试覆盖率基准
  - 主密钥是安全核心，需要较高的测试覆盖
  - 考虑到边界条件和错误处理的测试，目标可达

- **计算方式**：运行 `pnpm test:coverage` 查看 Vitest 生成的覆盖率报告

**密钥随机性验证：多次生成检查重复率**

- **选择理由**：
  - 验证 crypto.getRandomValues 的随机性
  - 通过多次生成（如 100 次）检查是否有重复
  - 确保密钥空间的合理利用

- **实现方式**：
  ```typescript
  it('should generate unique keys across multiple calls', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateMasterKey());
    }
    expect(keys.size).toBe(100); // 无重复
  });
  ```

## Risks / Trade-offs

**风险 1：Mock 过度可能隐藏真实集成问题**

- **风险描述**：过度依赖 mock 可能无法发现 Keyring 兼容层的真实 bug
- **缓解措施**：
  - 明确单元测试的范围：验证 masterKey.ts 的逻辑正确性
  - 集成测试由后续工作完成（crypto.ts 集成测试）
  - 在 Tauri 开发环境中手动验证真实场景

**风险 2：handleSecurityWarning 的 Toast 测试复杂**

- **风险描述**：handleSecurityWarning 依赖动态导入的 toast 和 localStorage，测试环境可能不完整
- **缓解措施**：
  - 使用 happy-dom 提供的 localStorage mock
  - 模拟 sonner 的 toast 方法（vi.fn）
  - 验证 toast.warning 被正确调用，不验证 UI 渲染
  - 使用 waitFor 或 vi.waitFor 验证异步行为

**风险 3：跨平台兼容性测试不充分**

- **风险描述**：测试主要依赖 mock，无法验证真实 Tauri 和 Web 环境的差异
- **缓解措施**：
  - 使用 isTauri mock 模拟两种环境
  - 为 Tauri 和 Web 环境分别编写测试用例
  - 在真实环境中手动测试（pnpm tauri dev vs 简单的 Web 部署）

**风险 4：加密算法正确性验证不足**

- **风险描述**：单元测试无法验证 Web Crypto API 的实现正确性
- **缓解措施**：
  - Web Crypto API 是浏览器原生实现，假设其正确性
  - 单元测试仅验证接口调用（密钥长度、格式）
  - 不测试加密强度（假设 256-bit 随机性足够）

**权衡：测试复杂度 vs 覆盖率**

- **选择**：优先覆盖正常路径和关键错误路径，不追求 100% 边界条件覆盖
- **理由**：主密钥模块逻辑相对简单，80% 覆盖率足以保证可靠性

**权衡：测试运行速度 vs 真实性**

- **选择**：使用 mock 而非真实存储，牺牲部分真实性换取速度
- **理由**：单元测试应快速反馈，集成测试可使用真实环境
