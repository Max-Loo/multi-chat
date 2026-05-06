## ADDED Requirements

### Requirement: sonner mock 不得重复定义相同行为的函数

`toast-system.integration.test.tsx` 中的 sonner mock MUST 使用 `Object.assign` 或等效模式，将 `success`、`error`、`warning`、`info`、`loading` 统一指向同一个 `renderToastToDom` 实现，消除 6 个函数体的重复。

#### Scenario: sonner mock 使用 Object.assign 消除重复

- **WHEN** 加载 `toast-system.integration.test.tsx` 的 sonner mock 定义
- **THEN** `toast.success`、`toast.error`、`toast.warning`、`toast.info`、`toast.loading` MUST 全部引用同一个 `renderToastToDom` 函数，不得逐一展开定义

### Requirement: 测试文件必须使用共享的 model fixture

测试文件 MUST NOT 手写与已有 fixture 工厂函数（如 `createDeepSeekModel`）功能等价的本地工厂函数。

#### Scenario: chat integration 测试复用 createDeepSeekModel

- **WHEN** `chat/index.integration.test.ts` 需要创建测试模型
- **THEN** MUST 使用 `createDeepSeekModel`（来自 `@/__test__/helpers/fixtures/model`），MUST NOT 定义本地 `createTestModel`

#### Scenario: auto-naming integration 测试复用 createDeepSeekModel

- **WHEN** `auto-naming.integration.test.ts` 需要创建测试模型
- **THEN** MUST 使用 `createDeepSeekModel`（来自 `@/__test__/helpers/fixtures/model`），MUST NOT 定义本地 `createTestModel`

### Requirement: mock 响应式数据的类型必须与源类型一致

测试中 mock `useResponsive` 返回值时，`layoutMode` 字段 MUST 使用 `LayoutMode` 联合类型，MUST NOT 使用 `as string` 断言绕过类型检查。

#### Scenario: Layout 测试中 layoutMode 使用正确类型

- **WHEN** `Layout.test.tsx` 定义 `mockResponsive` 对象的 `layoutMode` 字段
- **THEN** MUST 使用 `LayoutMode` 类型的合法值（`'mobile'` | `'compact'` | `'compressed'` | `'desktop'`），MUST NOT 使用 `as string` 类型断言
