## ADDED Requirements

### Requirement: 多页面抽屉状态独立管理单元测试
抽屉状态的 Redux 逻辑 SHALL 在 slice 单元测试文件中验证，而非集成测试文件。测试 SHALL 覆盖以下场景：不同页面（Chat、Setting、Model 创建）的抽屉状态通过各自的 toggle/set action 操作后，互不影响。

#### Scenario: Chat 和 Setting 页面的抽屉状态独立
- **WHEN** dispatch `chatToggleDrawer` 将 Chat 页面抽屉设为打开，再 dispatch `settingToggleDrawer` 将 Setting 页面抽屉设为打开，再 dispatch `chatSetIsDrawerOpen(false)` 将 Chat 页面抽屉关闭
- **THEN** Chat 页面 `isDrawerOpen` 为 false，Setting 页面 `isDrawerOpen` 为 true

#### Scenario: 三个页面的抽屉状态互不影响
- **WHEN** dispatch 三个页面的 `toggleDrawer` action 后，再 dispatch `settingSetIsDrawerOpen(false)` 仅关闭 Setting 页面抽屉
- **THEN** Chat 页面和 Model 创建页面的 `isDrawerOpen` 为 true，Setting 页面 `isDrawerOpen` 为 false

### Requirement: 未使用的 mock 导出 SHALL 被移除
以下 7 个 mock 导出函数 SHALL 从代码库中删除，因为已确认无任何测试文件导入使用：

- `createReactRouterMocks`（`helpers/mocks/router.ts`）
- `createCryptoMocks`（`helpers/mocks/crypto.ts`）
- `createMockChatModel`（`helpers/mocks/chatPanel.ts`）
- `createMockSelectedChat`（`helpers/mocks/chatPanel.ts`）
- `createMockRunningChat`（`helpers/mocks/chatPanel.ts`）
- `createMockAbortController`（`helpers/mocks/redux.ts`）
- `createMockAbortSignal`（`helpers/mocks/redux.ts`）

#### Scenario: 删除后所有测试 SHALL 正常通过
- **WHEN** 删除上述 7 个导出函数及其相关自测
- **THEN** 执行完整测试套件后，所有测试 SHALL 通过，无导入错误
