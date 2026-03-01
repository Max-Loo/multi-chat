# Proposal: 为高优先级模块添加综合测试

## Why

当前项目核心业务逻辑的测试覆盖率严重不足（0%），存在重大的质量风险和潜在的回归问题。Chat 面板核心组件、Model 管理等关键用户交互路径完全缺乏测试保护，任何修改都可能导致功能缺陷且难以发现。提升这些模块的测试覆盖率可以显著提高代码质量和维护效率，为后续功能开发建立坚实的测试基础。

## What Changes

- **新增测试文件**：为所有高优先级模块添加单元测试和集成测试
- **提升测试覆盖率**：将核心业务逻辑的测试覆盖率从 0% 提升至 90%+
- **完善 Mock 工具**：扩展现有的测试辅助工具和 Mock 工厂
- **测试文档更新**：在 AGENTS.md 中记录新增测试的模块和覆盖情况
- **整体覆盖率提升**：预计项目整体覆盖率从 56.12% 提升至 75%+

## Capabilities

### New Capabilities
- `chat-panel-testing`: 为 Chat 面板核心组件添加完整测试覆盖，包括 ChatPanel、ChatPanelContent、ChatPanelSender、ChatBubble、RunningChatBubble、DetailTitle、ChatPanelHeader 等组件
- `chat-panel-hooks-testing`: 为 Chat Panel 相关 Hooks 添加测试，包括 useIsChatSending、useTypedSelectedChat
- `model-management-testing`: 为 Model 管理模块添加测试，包括 ModelTable、ModelConfigForm、CreateModel、EditModelModal
- `chat-sidebar-testing`: 为 Chat Sidebar 子组件添加测试，包括 ChatButton、ToolsBar

### Modified Capabilities
- 无需修改现有功能规范（仅添加测试，不改变业务逻辑）

## Impact

**影响的代码模块**：
- `src/pages/Chat/components/ChatContent/components/ChatPanel/` - 所有组件
- `src/pages/Chat/components/ChatSidebar/components/` - ChatButton、ToolsBar
- `src/pages/Model/` - ModelTable、CreateModel、ModelConfigForm
- `src/__test__/` - 新增约 15-20 个测试文件

**新增依赖**：
- 无（使用现有测试框架 Vitest + React Testing Library）

**测试辅助工具扩展**：
- 扩展 `src/__test__/helpers/` 中的 Mock 工厂
- 新增 Chat Panel 和 Model 管理相关的测试 fixtures

**CI/CD 影响**：
- 测试执行时间预计增加 2-3 分钟
- 需要确保 CI 环境有足够的资源运行新增测试
