## Why

当前测试套件中约 160 个断言与实现细节（CSS 类名、DOM 结构）强耦合：91 处 `container.querySelector`、69 处 `toHaveClass` 直接绑定 Tailwind 类名。这导致样式微调引发测试失败（假阳性），与 BDD Guide "测试用户可见行为而非实现细节" 的核心原则相矛盾。同时 60 个应用组件中 63% 为纯 `div` 结构，缺乏 ARIA 属性和语义化 HTML，既限制了测试查询策略，也影响了产品的可访问性。

## What Changes

- 建立三层语义断言体系：ARIA 标准语义 → `data-variant` 自定义语义 → 删除纯装饰断言
- 为 30+ 个组件补充 ARIA 属性（`aria-selected`、`aria-current`、`aria-expanded`、`role` 等）和语义化 HTML（`<nav>`、`<main>`、`<header>`）
- 引入 `data-variant` 约定表达 ARIA 未覆盖的组件展示变体（如尺寸变体 `compact`/`default`）
- 将 91 处 `container.querySelector` 替换为 `getByRole`、`getByTestId` 等语义查询
- 将 69 处 `toHaveClass` 按语义层级替换为 ARIA 断言、`data-variant` 断言或直接删除
- 为 7 个骨架屏组件统一添加 `aria-hidden="true"`
- 为 6+ 个页面布局组件添加 landmark role（`navigation`、`main`、`complementary`）
- 更新 BDD Guide 补充语义断言规范和禁止规则

## Capabilities

### New Capabilities

- `semantic-query-standard`: 三层语义断言标准（ARIA → data-variant → 删除），定义查询优先级、`data-variant` 命名约定、禁止使用 `container.querySelector` 的规则
- `component-accessibility`: 组件可访问性属性规范，定义需要添加的 ARIA 属性、语义化 HTML 元素、骨架屏 `aria-hidden` 模式、页面 landmark role 模式

### Modified Capabilities

- `behavior-driven-testing`: 补充语义断言的具体规则和断言分类标准，强化 BDD Guide 的可操作性

## Impact

- **组件文件**：约 30 个组件文件需添加 ARIA 属性或语义化 HTML 元素（仅添加属性，不改变行为逻辑）
- **测试文件**：约 20 个测试文件需修改断言方式（从 CSS 类名/DOM 查询改为语义查询）
- **文档**：BDD Guide 需更新语义断言规范章节
- **无 breaking change**：所有改动向后兼容，不改变组件对外 API 或用户可见行为
- **不引入新依赖**：不引入 ESLint/testing-library 插件（项目使用 oxlint）
