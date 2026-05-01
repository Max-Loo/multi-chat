## Context

当前 Stryker 变异测试配置了 8 个模块，整体变异得分 85.20%。但两个模块存在明显短板：

- **providerLoader（72.41%）**：29 个变异中 6 个存活、2 个未覆盖。存活变异集中在构造函数的 `window` 环境检测分支（4 个）和 `ZHIPUAI_CODING_PLAN` 的 loader 返回值未验证（2 个）。未覆盖变异涉及 `online` 事件回调体和 `getLoader()` 方法。
- **crypto.ts（88.89%）**：72 个变异中 6 个存活、3 个未覆盖。其中 2 个存活变异涉及 `importKey` 的 `extractable` 参数（`false → true`），1 个涉及 `Error` 的 `cause` 属性未断言。

## Goals / Non-Goals

**Goals:**

- 将 providerLoader 变异得分从 72.41% 提升至 80% 以上
- 杀死 crypto.ts 的 `cause` 属性存活变异
- 评估并尽可能杀死 crypto.ts 的 `extractable` 存活变异

**Non-Goals:**

- 不修改源码，仅补充测试用例
- 不扩展变异测试到新的源码文件
- 不处理 chatSlices、modelRemote 等其他模块的存活变异

## Decisions

### 1. providerLoader 构造函数 `window` 分支测试策略

**决定**：在测试中临时模拟无 `window` 环境，验证事件监听器不被注册。

**原因**：4 个存活变异和 1 个未覆盖变异都源于同一个 `typeof window !== 'undefined'` 条件分支。测试环境（happy-dom）始终存在 `window`，导致 `false` 分支从未执行。需要通过 `vi.stubGlobal('window', undefined)` 模拟无窗口环境。

**替代方案**：将环境检测逻辑提取为可注入函数 — 过度工程化，仅为测试目的修改源码不合理。

### 2. ZHIPUAI_CODING_PLAN loader 返回值验证

**决定**：增加 `loadProvider(ZHIPUAI_CODING_PLAN)` 的返回值断言，验证其为函数类型。

**原因**：2 个存活变异（loader 函数替换为 `undefined`）的根因是测试只检查了加载状态，未检查加载产物。`ResourceLoader` 会将 `undefined` 也缓存并标记为 `loaded`。

### 3. crypto.ts `cause` 属性断言

**决定**：在 `decryptField` 错误路径测试中，用 `toSatisfy` 或 `rejects.toThrow` 配合手动检查验证 `error.cause` 存在且为原始错误。

**原因**：存活变异 `{ cause: error } → {}` 表明所有测试只检查了 `error.message`，完全忽略了错误链。这是最常见的测试盲区。

### 4. crypto.ts `extractable` 参数变异

**决定**：暂不处理。标记为已知等价变异。

**原因**：`CryptoKey` 是函数内部的局部变量，无法从外部访问。要验证 `extractable === false` 需要重构源码（提取 `importKey` 为可注入依赖），投入产出比太低。且该参数不影响加密/解密功能正确性，属于安全纵深防御属性。

## Risks / Trade-offs

- **[Risk] `window` 模拟可能影响其他测试** → 使用 `vi.stubGlobal` + `afterEach` 恢复，限定影响范围
- **[Risk] `extractable` 变异将继续存活** → 可接受，在后续迭代中评估是否需要重构
- **[Trade-off] 仅处理两个模块，不全面追杀所有存活变异** → 符合 ROI 优先原则
