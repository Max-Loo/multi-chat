# 统一导航配置管理

## Why

当前导航项配置在 `Sidebar` 和 `BottomNav` 两个组件中重复定义，导致维护成本高、易于出现不一致。每次添加或修改导航项需要在两处同步更新，违反了单一数据源（Single Source of Truth）原则。随着应用功能扩展，导航项可能会增加，重复定义的问题会更加严重。

## What Changes

- 新增 `src/config/navigation.ts` 配置文件，作为导航项的唯一数据源
- 修改 `src/components/Sidebar/index.tsx`，使用统一的导航配置
- 修改 `src/components/BottomNav/index.tsx`，使用统一的导航配置
- 删除组件内部的导航项定义，改为导入配置

## Capabilities

### New Capabilities
- `navigation-config`: 统一的导航配置管理能力，包括导航项的 ID、路径、图标、国际化键和主题样式配置

### Modified Capabilities
无

## Impact

**受影响的代码**:
- `src/components/Sidebar/index.tsx` - 导航项数据源变更
- `src/components/BottomNav/index.tsx` - 导航项数据源变更

**新增文件**:
- `src/config/navigation.ts` - 导航配置文件

**不受影响**:
- 用户界面和交互行为保持不变
- 国际化翻译文件无需变更（已有 `navigation.json`）
- 路由配置无需变更
- 测试文件需要更新以适配新的导入路径
