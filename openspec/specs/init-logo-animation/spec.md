# Init Logo Animation

## Purpose

在应用初始化过程中展示品牌 Logo 动画，提升视觉体验并明确加载状态。

## Requirements

### Requirement: 初始化界面显示 Logo 动画

应用在初始化过程中 SHALL 在进度条上方显示 Logo 动画组件。

#### Scenario: 正常初始化流程

- **WHEN** 应用启动进入初始化状态
- **THEN** 屏幕中央显示 Logo 动画组件
- **AND** 动画组件位于进度条上方
- **AND** 动画与进度条居中对齐

### Requirement: 目录结构重命名

`src/components/InitializationScreen/` 目录 SHALL 重命名为 `src/components/AnimatedLogo/`，并提供统一的导出入口。

#### Scenario: 目录重命名完成

- **WHEN** 开发者查看组件目录
- **THEN** 目录名称为 `AnimatedLogo`
- **AND** 目录包含原有的 `canvas-logo.ts` 和 `AnimatedLogo.tsx` 文件
- **AND** 目录包含 `index.ts` 导出文件，统一导出 `AnimatedLogo` 组件
