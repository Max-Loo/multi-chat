## Why

当前自动命名功能的后端逻辑已完整实现，但用户只能通过手动修改 localStorage 来开关此功能，操作不便且需要技术知识。添加设置页面的 UI 开关，可以让所有用户方便地控制自动命名功能。

## What Changes

- **新增功能**：设置页面添加自动命名开关组件
  - 在通用设置（GeneralSetting）页面添加独立的设置卡片
  - 显示开关当前状态（开启/关闭）
  - 支持点击切换开关状态
  - 实时同步到 Redux store 和 localStorage

- **功能增强**：
  - 显示自动命名功能的说明文字
  - 开关状态变更时提供即时反馈

## Capabilities

### New Capabilities
无（此变更仅为现有功能添加 UI 控制，不引入新的业务能力）

### Modified Capabilities

- **chat-auto-naming**: 新增 UI 控制需求
  - 当前需求仅涵盖后端状态管理和持久化
  - 需要补充：用户必须能够通过设置页面的 UI 控件来切换自动命名开关
  - 不修改后端逻辑，仅补充前端交互层的需求

## Impact

**受影响的代码模块**：

- **设置页面组件**：
  - `src/pages/Setting/components/GeneralSetting/index.tsx` - 添加新的设置卡片
  - 新建 `src/pages/Setting/components/GeneralSetting/components/AutoNamingSetting.tsx` - 自动命名开关组件

- **Redux 状态管理**：
  - 无需修改（`setAutoNamingEnabled` action 和 `selectAutoNamingEnabled` selector 已存在）
  - 组件将使用现有 Redux 接口

- **国际化**：
  - 需要添加相关翻译键值到 `src/lib/i18n/resources/`（中文、英文）

**依赖变更**：
- 无新增依赖

**系统影响**：
- 不影响现有功能
- 纯增量变更，仅添加 UI 控制层
