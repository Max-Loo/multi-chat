## Context

测试套件中约 500 行代码测试的是第三方库行为、JavaScript 语言语义或完全重复的逻辑，而非项目自有代码。这些代码由不同开发者在不同时期引入，缺乏统一的测试价值评审机制。

当前状态：
- `codeHighlight.test.ts`（431 行）直接测试 highlight.js 核心功能
- `chatPageSlices.test.ts`（旧版本）与 `slices/chatPageSlices.test.ts` 功能完全重复
- 6 个 tauriCompat/useConfirm/useNavigateToExternalSite 文件含约 18 个假阳性断言
- `http.test.ts`（90 行）全部 8 个用例均为假阳性（typeof、instanceof、TypeScript 类型擦除后的运行时检查）
- `ChatPage.test.tsx` 的 3 个 mock 路径指向不存在的目录结构

## Goals / Non-Goals

**Goals:**
- 删除所有零价值测试代码，消除虚假覆盖率
- 确保删除后测试套件仍可通过
- 保留有价值的测试用例（tauriCompat 文件中验证项目自有逻辑的部分）

**Non-Goals:**
- 不重写被删除测试的替代版本（除非路径过时导致测试无法运行）
- 不修改测试基础设施（如 setup.ts、helpers）
- 不处理 P0-P2 级别的其他问题

## Decisions

### 决策 1：整文件删除 vs 选择性删除

**选择**：对不同文件采用不同策略

- **整文件删除**：`codeHighlight.test.ts`、旧版 `chatPageSlices.test.ts`、`http.test.ts` —— 无任何有价值的测试用例
- **选择性删除**：`tauriCompat/os.test.ts`、`tauriCompat/shell.test.ts`、`tauriCompat/store.test.ts`、`useConfirm.test.tsx`、`useNavigateToExternalSite.test.ts` —— 仅删除假阳性断言块，保留有价值的测试
- **重写评估**：`ChatPage.test.tsx` —— 先确认是否能通过执行，再决定重写还是删除

**理由**：`http.test.ts` 全部 8 个用例仅测试 JS 语言语义（typeof、instanceof）和 TypeScript 类型擦除后的运行时行为，无项目逻辑测试，应整文件删除。其余 tauriCompat 测试中部分用例验证了跨环境兼容性逻辑，仍有保留价值。

### 决策 2：ChatPage.test.tsx 处理策略

**选择**：先删除整个文件

**理由**：3 个 mock 路径全部过时，文件注释与实际代码矛盾，修复成本接近重写。P0-1（test-p0-fix-component-mocks）变更中会为 ChatPage 创建新的正确测试。

### 决策 3：假阳性断言的识别标准

**选择**：以下模式均视为假阳性
- `expect(typeof x).toBe('function')` 当 x 是 `vi.fn()` 或已知类型
- `expect(x).toBeDefined()` 当 x 刚被赋值不可能为 undefined
- `expect(Promise).toBeInstanceOf(Promise)` 类型系统已保证
- "Mock 验证测试" describe 块整体删除

**替代方案**：保留部分断言作为文档 —— 被否决，因为这些断言测试的是 JS 运行时而非项目代码。

## Risks / Trade-offs

- [覆盖率下降] → 可接受：名义覆盖率可能从 60% 降至 ~57%，但有效覆盖率不变。CI 阈值设为 60%，需确认删除后仍满足
- [tauriCompat 删除过多] → 缓解：逐文件审查，仅删除纯假阳性断言，保留验证项目逻辑的用例
- [ChatPage 测试完全缺失] → 缓解：在 test-p0-fix-component-mocks 变更中创建新测试
