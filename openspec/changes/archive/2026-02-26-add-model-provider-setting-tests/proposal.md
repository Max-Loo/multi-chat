## Why

`ModelProviderSetting` 组件是应用设置页面的容器组件之一，负责显示和管理模型供应商的配置界面。目前该组件缺少单元测试，存在以下风险：

1. **回归风险高**：组件负责管理供应商列表的显示状态，修改时容易引入渲染 bug
2. **重构安全性低**：没有测试覆盖的情况下，重构或优化代码时无法验证功能是否保持正常
3. **质量保障缺失**：无法通过 CI/CD 流程自动验证组件功能的正确性

现在编写单元测试的时机成熟，因为：
- 组件功能已基本稳定
- 项目已配置 Vitest 测试框架和测试辅助工具
- 其他关键组件已有测试覆盖，需要补齐测试盲点

**重要说明**：经过代码审查，`ModelProviderSetting` 是容器组件，不包含复杂的表单逻辑和加密功能。这些功能由子组件处理，将在各自的测试中覆盖。

## What Changes

- 新增 `ModelProviderSetting` 容器组件的单元测试套件
- 测试文件路径：`src/__test__/pages/Setting/components/GeneralSetting/components/ModelProviderSetting.test.tsx`
- 覆盖以下测试场景：
  - 组件渲染（正常状态、加载状态、错误状态）
  - Redux 状态管理（providers、loading、error）
  - 用户交互（刷新按钮、展开/折叠供应商卡片）
  - 国际化（中文界面显示）
- ~~不包含以下场景（由子组件或 Redux 层处理）~~：
  - ~~API 密钥的加密/解密功能~~
  - ~~表单验证（必填字段、格式验证）~~
  - ~~保存/删除/取消操作~~
  - ~~直接网络请求~~
- 使用项目的测试辅助工具（Redux Mock Store、全局 Mock 配置）
- ~~测试覆盖率目标：语句覆盖率 ≥ 80%，分支覆盖率 ≥ 75%~~ → **调整**：核心功能覆盖即可，不强制要求覆盖率百分比

## Capabilities

### New Capabilities
- `model-provider-setting-tests`: ModelProviderSetting 组件的单元测试能力，包括组件渲染、用户交互、表单验证、异步操作和错误处理的测试覆盖

### Modified Capabilities
无

## Impact

**影响的代码：**
- 新增：`src/components/__tests__/ModelProviderSetting.test.tsx`
- 可能需要重构：如果组件代码耦合度较高，可能需要提取可测试的子组件或工具函数

**影响的 API：**
无

**新增依赖：**
- 测试框架：Vitest（已配置）
- 测试辅助工具：`@/test-helpers`（已存在）
- React Testing Library（项目已使用）

**影响的系统：**
- CI/CD 流程：测试套件将包含新的测试用例
- 开发工作流：提交代码前需确保测试通过
