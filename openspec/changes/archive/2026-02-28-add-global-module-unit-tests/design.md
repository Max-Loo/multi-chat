# global.ts 模块单元测试 - 技术设计

## Context

### 当前状态

`src/lib/global.ts` 模块包含两个核心的全局功能：

1. **`interceptClickAToJump()`** - 全局 DOM 事件监听器，拦截 `<a>` 标签的点击事件
   - 使用事件委托模式（在 document 级别监听）
   - 外部链接调用 `shell.open()` 打开
   - 内部链接保持默认行为

2. **`getDefaultAppLanguage()`** - 异步函数，获取应用默认语言
   - 优先级 1：localStorage 中的 `multi-chat-language` 键
   - 优先级 2：系统语言（通过 `@/utils/tauriCompat` 的 `locale()` API）
   - 兜底：返回 `'en'`

### 约束条件

- 项目使用 Vitest 作为测试框架
- 必须使用项目现有的测试辅助工具（`@/test-helpers`）
- 必须达到 100% 语句覆盖率
- 需要 Mock Tauri 兼容层 API（`shell.open`、`locale`）
- 需要模拟 DOM 环境和浏览器 API（localStorage）

### 利益相关者

- 开发团队：需要可靠的测试来防止回归
- QA 团队：需要测试作为功能验证的参考

## Goals / Non-Goals

**Goals:**

- 为 `src/lib/global.ts` 的所有导出函数提供完整的单元测试覆盖
- 确保 100% 语句覆盖率
- 使用项目标准的测试模式和工具
- 提供清晰的测试用例文档（通过良好的测试名称和注释）

**Non-Goals:**

- 不修改 `src/lib/global.ts` 的源代码（仅添加测试）
- 不添加集成测试或 E2E 测试（本次范围）
- 不测试 Tauri 兼容层本身（假设其工作正常）
- 不测试浏览器原生 API（如 `addEventListener`、`localStorage`）

## Decisions

### 决策 1: 使用 Vitest 的 `vi.hoisted()` 创建 Mock 函数

**选择**: 在测试文件顶部使用 `vi.hoisted()` 创建 Mock 函数，然后传递给 `vi.mock()`

**理由**:

- `vi.hoisted()` 确保 Mock 函数在模块导入之前创建
- 避免因导入顺序导致的 Mock 失效
- 符合 Vitest 最佳实践

**替代方案**:

- 直接在 `vi.mock()` 中定义工厂函数
  - **缺点**: 无法在测试中访问 Mock 函数引用（难以重置或验证调用）

**实现示例**:

```typescript
const mockShellOpen = vi.hoisted(() => vi.fn());
const mockLocale = vi.hoisted(() => vi.fn());

vi.mock('@/utils/tauriCompat', () => ({
  shell: { open: mockShellOpen },
  locale: mockLocale,
}));
```

### 决策 2: 使用 jsdom 模拟 DOM 环境

**选择**: 依赖 Vitest 的默认 jsdom 环境（已在 `vite.config.ts` 中配置）

**理由**:

- jsdom 提供完整的 DOM API 实现（`document`、`HTMLElement`、`Event` 等）
- 项目已配置，无需额外设置
- 支持 `closest()` 方法（用于 `element.closest('a')`）

**替代方案**:

- happy-dom
  - **缺点**: 需要额外配置，项目已使用 jsdom

### 决策 3: 测试文件组织结构

**选择**: 在 `src/__test__/lib/` 目录下创建 `global.test.ts`，使用 `describe` 块按函数分组

**理由**:

- 与源文件结构保持一致（`src/lib/global.ts` → `src/__test__/lib/global.test.ts`）
- 每个函数一个 `describe` 块，便于定位和阅读
- 每个测试场景一个 `test`/`it` 块

**结构示例**:

```typescript
describe('interceptClickAToJump', () => {
  describe('外部链接', () => {
    it('should intercept and call shell.open', () => {});
  });

  describe('内部链接', () => {
    it('should not intercept', () => {});
  });
});

describe('getDefaultAppLanguage', () => {
  describe('localStorage 优先级', () => {
    it('should return language from localStorage', () => {});
  });
});
```

### 决策 4: Mock 管理和测试隔离

**选择**: 使用 `beforeEach` 钩子重置 Mock 和清理副作用

**理由**:

- 确保每个测试独立运行（无副作用污染）
- `localStorage` 在测试间隔离（清除 `multi-chat-language` 键）
- Mock 调用次数在每次测试前重置

**实现示例**:

```typescript
beforeEach(() => {
  mockShellOpen.mockClear();
  mockLocale.mockClear();
  localStorage.clear();
});
```

### 决策 5: DOM 事件测试策略

**选择**: 创建真实的 DOM 元素和点击事件，使用 `dispatchEvent()` 触发

**理由**:

- 测试真实的行为（而不仅仅是实现细节）
- jsdom 支持完整的事件冒泡和 `closest()` 逻辑
- 可以验证 `preventDefault()` 是否被调用

**实现示例**:

```typescript
// 创建测试 DOM
document.body.innerHTML = '<a href="https://external.com">Link</a>';
const anchor = document.querySelector('a')!;

// 创建点击事件
const clickEvent = new MouseEvent('click', { bubbles: true });
Object.assign(clickEvent, { target: anchor });

// 触发事件（由于拦截器是全局的，需要在 beforeEach 中调用 interceptClickAToJump）
document.dispatchEvent(clickEvent);

// 验证行为
expect(mockShellOpen).toHaveBeenCalledWith('https://external.com');
```

## Risks / Trade-offs

### 风险 1: 全局事件监听器污染

**风险**: `interceptClickAToJump()` 在 document 上添加全局监听器，可能影响其他测试

**缓解措施**:

- 在 `afterEach` 中移除事件监听器（保存监听器引用）
- 使用 `vi.spyOn(document, 'addEventListener')` 验证监听器注册

**实现**:

```typescript
let removeListener: (() => void) | null = null;

beforeEach(() => {
  // Mock addEventListener 并保存监听器
  const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
  interceptClickAToJump();

  // 提取监听器引用
  const listener = addEventListenerSpy.mock.calls[0]?.[1];
  removeListener = () => document.removeEventListener('click', listener);
});

afterEach(() => {
  removeListener?.();
});
```

### 风险 2: 异步测试时序问题

**风险**: `getDefaultAppLanguage()` 是异步函数，`interceptClickAToJump()` 的事件处理器也是异步的

**缓解措施**:

- 使用 `async/await` 处理异步测试
- 对于 DOM 事件测试，使用 `waitFor()` 等待异步操作完成

### 风险 3: Mock 与真实实现不一致

**风险**: Mock 的行为可能与 Tauri 兼容层的真实实现不同

**缓解措施**:

- 定期运行集成测试验证整体功能
- 在测试注释中说明 Mock 的行为假设

## Migration Plan

### 部署步骤

1. **阶段 1**: 创建测试文件骨架和 Mock 设置
   - 创建 `src/__test__/lib/global.test.ts`
   - 配置 `@/utils/tauriCompat` 的 Mock

2. **阶段 2**: 实现 `getDefaultAppLanguage()` 测试
   - 按优先级顺序编写测试用例
   - 验证 Mock 调用和返回值

3. **阶段 3**: 实现 `interceptClickAToJump()` 测试
   - 实现 DOM 事件测试
   - 处理全局监听器清理

4. **阶段 4**: 验证覆盖率
   - 运行 `pnpm test:coverage` 检查覆盖率
   - 补充遗漏的测试用例

5. **阶段 5**: 代码审查和合并
   - 提交 PR 并进行代码审查
   - 确保所有测试通过

### 回滚策略

- 由于仅添加测试（不修改源代码），回滚只需删除测试文件
- 如发现问题，可从 Git 历史中恢复

## Open Questions

无（所有设计决策已明确）。
