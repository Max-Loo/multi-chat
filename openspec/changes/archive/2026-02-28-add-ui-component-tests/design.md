# UI 组件测试技术设计文档

## Context

### 背景

当前项目的整体测试覆盖率为 32.75%，其中核心业务逻辑（加密、存储、密钥管理）已有完善的测试保障（90%+ 覆盖率），但用户直接交互的 UI 组件层覆盖率严重不足。关键 UI 组件包括：
- 侧边栏导航组件（`src/components/Sidebar/`）
- 聊天页面组件（`src/pages/Chat/`）
- 设置页面组件（`src/pages/Setting/`）

### 现状

**现有测试基础设施**：
- ✅ Vitest 测试框架已配置（`vite.config.ts`）
- ✅ React Testing Library 已安装并配置
- ✅ 测试辅助工具系统位于 `src/__test__/helpers/`
- ✅ Mock 工厂提供标准化的 Mock 创建函数
- ✅ 项目有 349 个单元/集成测试（核心功能）

**测试覆盖率现状**：
- 侧边栏导航组件：0% 覆盖率
- 聊天页面：7 个测试（主要测试重定向逻辑），覆盖率较低
- 设置页面：部分组件有测试（ModelProviderSetting、ProviderCard），但整体覆盖率不足

### 约束条件

**技术约束**：
- 必须使用现有的 Vitest + React Testing Library 测试栈
- 必须正确 Mock `@ant-design/x` 组件以避免 ES 模块兼容性问题
- 测试必须独立运行，不依赖执行顺序
- 不应引入新的运行时依赖

**时间约束**：
- 目标在 1-2 周内完成关键组件的测试补充
- 为后续引入 Playwright E2E 测试奠定基础

### 利益相关者

- **开发者**：需要可靠的测试套件来支持重构和防止回归
- **用户**：需要稳定的 UI 交互体验
- **QA 团队**（未来）：需要单元测试作为 E2E 测试的基础

## Goals / Non-Goals

### Goals

1. **提升关键 UI 组件测试覆盖率到 60-70%**
   - 侧边栏导航组件：从 0% 提升到 ≥70%
   - 聊天页面组件：从当前状态提升到 ≥60%
   - 设置页面组件：从当前状态提升到 ≥60%

2. **建立 UI 组件测试最佳实践**
   - 统一的 Mock 策略
   - 清晰的测试文件组织结构
   - 可复用的测试辅助函数

3. **为 E2E 测试奠定基础**
   - 通过单元测试降低 E2E 测试的调试成本
   - 验证核心交互路径的稳定性

### Non-Goals

**明确排除**：
- ❌ 不覆盖所有 UI 组件（仅限关键组件）
- ❌ 不引入新的测试框架或运行器
- ❌ 不实现端到端测试（Playwright 留待后续阶段）
- ❌ 不修改现有组件的实现逻辑（仅添加测试）
- ❌ 不追求 100% 测试覆盖率（目标 60-70%）

## Decisions

### 决策 1：使用 React Testing Library 而非 Enzyme

**选择**：继续使用 React Testing Library（@testing-library/react）

**理由**：
- ✅ 项目已安装并配置，无额外迁移成本
- ✅ 官方推荐，与 React 19 兼容性良好
- ✅ 强调"用户视角"测试，更贴近实际使用场景
- ✅ 与 Vitest 集成良好

**替代方案**：
- Enzyme：已停止维护，与 React 19 兼容性差
- React Component Testing（Cypress）：功能过于强大，适合 E2E 测试

### 决策 2：Mock 策略 - Mock @ant-design/x 组件

**选择**：在测试文件中 Mock 所有 `@ant-design/x` 组件

**理由**：
- ✅ 避免 Vitest 环境中的 ES 模块兼容性问题
- ✅ 现有 ChatPage 测试已证明此策略可行
- ✅ 减少测试复杂度和运行时间

**实现方案**：
```typescript
vi.mock('@ant-design/x', () => ({
  // Mock 具体组件
}));
```

**风险**：
- ⚠️ 如果 antd 组件行为变化，Mock 可能失效
- **缓解措施**：定期检查 antd 组件 API 变化

### 决策 3：测试文件组织结构

**选择**：与源代码平行的测试目录结构

**理由**：
- ✅ 与项目现有结构一致（`src/__test__/`）
- ✅ 易于定位测试文件
- ✅ 符合测试文件的行业标准

**目录结构**：
```
src/
  __test__/
    components/
      Sidebar/
        Sidebar.test.tsx  # 新增
    pages/
      Chat/
        ChatPage.test.tsx       # 已存在，增强
        ChatSidebar.test.tsx    # 新增
        ChatContent.test.tsx    # 新增
      Setting/
        SettingPage.test.tsx        # 新增
        GeneralSetting.test.tsx     # 新增
        LanguageSetting.test.tsx    # 新增
        ModelProviderSetting.test.tsx  # 已存在，增强
```

### 决策 4：Mock 策略 - Redux Store 和 Hooks

**选择**：使用项目现有的测试辅助工具（`@/test-helpers`）创建 Mock

**理由**：
- ✅ 项目已有统一的 Mock 工厂（`createTauriMocks`、`createReduxMocks` 等）
- ✅ 保证 Mock 的一致性和可维护性
- ✅ 利用现有的测试辅助函数（`resetTestState`、`useIsolatedTest`）

**实现方案**：
```typescript
import { createReduxMocks, resetTestState } from '@/test-helpers';

describe('Component Test', () => {
  beforeEach(() => {
    resetTestState();
    const mocks = createReduxMocks({ initialState: {...} });
  });
});
```

### 决策 5：测试优先级

**选择**：按组件重要性分级测试

**P0 - 最高优先级**（必须测试）：
- 侧边栏导航组件（导航交互）
- 聊天页面主组件（重定向逻辑）
- 模型供应商设置（API Key 配置）

**P1 - 高优先级**（应该测试）：
- ChatSidebar 组件（聊天列表）
- LanguageSetting 组件（语言切换）
- ProviderCard 组件（模型配置）

**P2 - 中等优先级**（可以测试）：
- ChatContent 组件（消息显示）
- 滚动容器交互
- 搜索过滤功能

## Risks / Trade-offs

### 风险 1：@ant-design/x Mock 可能不完整

**风险描述**：Mock 的组件可能与真实组件行为不一致，导致测试通过但实际运行失败。

**缓解措施**：
- 定期运行真实环境下的手动测试
- 在 E2E 测试中验证完整流程
- 记录 Mock 的限制和假设

### 风险 2：测试套件运行时间增加

**风险描述**：新增 40-60 个测试用例，预计测试运行时间增加 10-20 秒。

**缓解措施**：
- 使用 Vitest 的并行测试能力
- 优化 Mock 策略，减少不必要的渲染
- 考虑使用 `test.skip()` 暂时跳过耗时测试

### 风险 3：测试维护成本

**风险描述**：UI 组件变更时需要同步更新测试，增加维护成本。

**缓解措施**：
- 编写稳定的测试，聚焦核心交互而非实现细节
- 使用 `data-testid` 属性而非 CSS 选择器
- 定期重构和优化测试代码

### 权衡 1：覆盖率 vs 开发时间

**权衡**：不追求 100% 覆盖率，目标 60-70%。

**理由**：
- 100% 覆盖率成本高昂，边际收益递减
- 60-70% 覆盖率已能捕获大部分回归问题
- 核心业务逻辑已有 90%+ 覆盖率

### 权衡 2：单元测试 vs E2E 测试

**权衡**：优先完善单元测试，E2E 测试留待后续。

**理由**：
- 单元测试运行快，反馈迅速
- 单元测试能精确定位问题
- E2E 测试调试成本高，应建立在稳固的单元测试基础上

## Migration Plan

### 阶段 1：测试基础设施准备（1-2 天）

1. **创建测试文件结构**
   - 创建 `src/__test__/components/Sidebar/` 目录
   - 创建 `src/__test__/pages/Chat/` 子目录
   - 创建 `src/__test__/pages/Setting/` 子目录

2. **扩展测试辅助工具**
   - 添加 UI 组件专用的 Mock 工厂（如 `createReactRouterMocks`）
   - 添加自定义测试辅助函数（如 `renderWithRedux`）

### 阶段 2：侧边栏导航组件测试（2-3 天）

1. **创建 `Sidebar.test.tsx`**
   - 渲染测试（3 个测试）
   - 路由状态测试（3 个测试）
   - 导航交互测试（4 个测试）
   - 国际化测试（2 个测试）

2. **验证覆盖率**
   - 运行 `pnpm test:coverage` 检查覆盖率
   - 目标：≥70% 语句覆盖率

### 阶段 3：聊天页面测试增强（4-5 天）

1. **增强 `ChatPage.test.tsx`**
   - 侧边栏折叠状态测试（2 个新测试）
   - 总计：9 个测试

2. **创建 `ChatSidebar.test.tsx`**
   - 聊天列表渲染（3 个测试）
   - 新建聊天（2 个测试）
   - 搜索过滤（2 个测试）
   - 选择和删除（3 个测试）
   - 总计：10 个测试

3. **创建 `ChatContent.test.tsx`**
   - 消息列表渲染（3 个测试）
   - 流式消息接收（4 个测试）
   - 错误处理（3 个测试）
   - 推理内容显示（3 个测试）
   - 总计：13 个测试

4. **验证覆盖率**
   - 运行 `pnpm test:coverage` 检查覆盖率
   - 目标：≥60% 语句覆盖率

### 阶段 4：设置页面测试（3-4 天）

1. **创建 `SettingPage.test.tsx`**
   - 侧边栏和内容区渲染（2 个测试）
   - 路由导航（2 个测试）
   - 总计：4 个测试

2. **创建 `GeneralSetting.test.tsx`**
   - 渲染和滚动（3 个测试）
   - 总计：3 个测试

3. **创建 `LanguageSetting.test.tsx`**
   - 渲染和语言选择（4 个测试）
   - 总计：4 个测试

4. **增强 `ModelProviderSetting.test.tsx`**
   - 在现有 12 个测试基础上补充
   - 添加空状态和错误状态测试（2 个新测试）
   - 总计：14 个测试

5. **验证覆盖率**
   - 运行 `pnpm test:coverage` 检查覆盖率
   - 目标：≥60% 语句覆盖率

### 阶段 5：最终验证和文档更新（1 天）

1. **运行完整测试套件**
   - 确保所有新测试通过
   - 确保无控制台错误或警告

2. **生成覆盖率报告**
   - 运行 `pnpm test:coverage`
   - 验证目标覆盖率达成

3. **更新文档**
   - 更新 AGENTS.md 中的测试覆盖率统计
   - 添加 UI 组件测试最佳实践文档（可选）

### 回滚策略

如果测试导致问题：
1. 可以临时跳过特定测试：`test.skip()`
2. 可以回滚特定测试文件的提交
3. 不影响生产代码（测试文件独立于源代码）

## Open Questions

1. **Q: 是否需要测试 React Router 的路由配置？**
   - **倾向**：否，路由配置属于集成测试范畴，单元测试聚焦组件行为

2. **Q: 是否需要测试滚动条的自适应逻辑？**
   - **倾向**：否，滚动条行为难以在单元测试中验证，留待 E2E 测试

3. **Q: 是否需要测试国际化的所有语言？**
   - **倾向**：否，仅测试中文和英文切换即可

4. **Q: 是否需要添加性能测试（如渲染时间）？**
   - **倾向**：否，性能测试留待专门的性能测试工具

5. **Q: 是否需要测试可访问性（a11y）？**
   - **倾向**：否，可访问性测试可以使用 `jest-axe`，但超出当前目标范围
