## Context

`ModelHeader` 是一个 57 行的简单展示组件，位于 `src/pages/Model/CreateModel/components/ModelHeader.tsx`。它根据 `useResponsive()` 返回的 `isMobile` 值切换移动端和桌面端布局。当前测试完全通过父组件 `CreateModel.test.tsx` 间接覆盖，但该测试仅运行在桌面端视口下，导致移动端分支（返回按钮、菜单按钮）的行/分支/函数覆盖率均为 0%。

项目已有完善的 mock 基础设施（`useResponsive`、`redux`、`react-router-dom`、`react-i18next`），无需新增 mock。

## Goals / Non-Goals

**Goals:**

- 将 `ModelHeader` 覆盖率提升至 90%+ 行覆盖率、80%+ 分支覆盖率
- 覆盖移动端和桌面端两条渲染分支
- 覆盖返回按钮和菜单按钮的点击交互

**Non-Goals:**

- 不修改 `ModelHeader.tsx` 源代码
- 不修改 `CreateModel.test.tsx` 现有测试
- 不引入新的 mock 工具或测试基础设施

## Decisions

**独立测试文件 vs 扩展 CreateModel.test.tsx**

选择：创建独立测试文件 `src/__test__/pages/Model/CreateModel/components/ModelHeader.test.tsx`

理由：ModelHeader 是独立组件，有自己的 hooks 和交互逻辑。独立测试更聚焦、更易维护，且不会让 `CreateModel.test.tsx` 继续膨胀。

**Mock 策略**

选择：Mock `useResponsive` 控制响应式分支，使用 `renderWithProviders` 提供真实的 Redux store 和 Router。

理由：遵循项目测试规范 — 仅 mock 系统边界（`useResponsive` 是环境检测 hook），不 mock 内部实现。Redux 和 Router 使用真实实例以验证端到端行为。

**i18n Mock 配置**

`DEFAULT_I18N_RESOURCES` 中不包含 `common.goBack`、`model.openMenu`、`model.title`，必须通过 `__mockI18n()` 传入自定义 keys：

```typescript
vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    common: { goBack: '返回' },
    model: { openMenu: '打开菜单', title: '模型管理' },
  })
);
```

按钮断言使用 aria-label 查询：`getByRole('button', { name: '返回' })` 和 `getByRole('button', { name: '打开菜单' })`。

## Risks / Trade-offs

- **低风险**：组件逻辑简单（2 个按钮 + 1 个标题），不涉及异步或复杂状态。唯一需要确认的是 `useResponsive` 的 mock 方式与项目现有模式一致。
