## Context

ProviderGrid 和 ProviderMetadata 是 Setting 页面 ModelProviderSetting 模块的两个子组件，当前缺少独立测试文件。现有覆盖全部来自 `ModelProviderSetting.test.tsx`（仅空 providers）和 `ProviderCardDetails.test.tsx`（仅 deepseek provider）的间接渲染，导致大量分支未覆盖。

现有测试基础设施完善：`createMockRemoteProvider`、`createDeepSeekProvider`、`createKimiProvider`、`createZhipuProvider` 等 fixture 工厂可直接复用；i18n mock 通过 `globalThis.__mockI18n()` 注册；`react-masonry-css` 需要额外 mock。

## Goals / Non-Goals

**Goals:**
- ProviderGrid 分支覆盖率从 17.65% 提升至 80%+
- ProviderMetadata 分支覆盖率从 48.72% 提升至 80%+
- 改善 ModelProviderSetting 模块中覆盖率最低的两个组件，提升代码可维护性

**Non-Goals:**
- 不修改任何生产代码
- 不修改覆盖率阈值配置
- 不改动现有测试文件

## Decisions

### Decision 1: 独立测试文件 vs 扩展现有测试

**选择**：新建独立测试文件 `ProviderGrid.test.tsx` 和 `ProviderMetadata.test.tsx`。

**理由**：现有 `ModelProviderSetting.test.tsx` 测试的是容器组件的空状态/加载/错误流程，不适合混入子组件的细粒度分支测试。独立文件更符合现有测试目录结构（每个组件一个测试文件）。

### Decision 2: Mock react-masonry-css

**选择**：使用 `vi.mock('react-masonry-css')` 将 Masonry 替换为简单的 div 包装器。

**理由**：Masonry 依赖浏览器布局计算，在 happy-dom 环境下无法正确渲染瀑布流。测试关注的是数据传递和分支逻辑，不是 CSS 布局。

### Decision 3: ProviderMetadata 测试策略

**选择**：直接渲染 ProviderMetadata 组件，使用不同 providerKey 参数覆盖全部 4 个 URL 分支。

**理由**：ProviderMetadata 是纯展示组件，无内部状态，直接传 props 测试最简洁高效。

## Risks / Trade-offs

- **[风险] Masonry mock 可能与真实行为不一致** → mock 仅包裹 children，不改变数据流，风险极低
- **[权衡] 未测试 CSS 响应式断点** → 断点配置是静态数据，不涉及逻辑分支，测试性价比低
