# Skeleton Screen

## Purpose

提供统一的骨架屏加载体验，在内容加载过程中展示占位 UI，减少用户感知到的加载时间。

## Requirements

### Requirement: Skeleton 基础组件

系统 SHALL 提供基础 Skeleton 组件，支持多种形状变体。

#### Scenario: 渲染文本骨架

- **WHEN** 开发者使用 `<Skeleton variant="text" />`
- **THEN** 系统渲染一个圆角矩形，模拟文本行

#### Scenario: 渲染圆形骨架

- **WHEN** 开发者使用 `<Skeleton variant="circle" />`
- **THEN** 系统渲染一个圆形，模拟头像或图标

#### Scenario: 渲染矩形骨架

- **WHEN** 开发者使用 `<Skeleton variant="rect" />`
- **THEN** 系统渲染一个矩形，模拟卡片或图片

### Requirement: Skeleton 动画效果

系统 SHALL 支持多种动画效果，默认启用脉冲动画。

#### Scenario: 启用脉冲动画

- **WHEN** 开发者使用 `<Skeleton animation="pulse" />`
- **THEN** 系统渲染带有脉冲渐隐渐显效果的骨架

#### Scenario: 启用波浪动画

- **WHEN** 开发者使用 `<Skeleton animation="wave" />`
- **THEN** 系统渲染带有从左到右扫过的光泽效果

#### Scenario: 禁用动画

- **WHEN** 开发者使用 `<Skeleton animation={false} />`
- **THEN** 系统渲染静态骨架，无动画效果

### Requirement: Layout 页面骨架屏

系统 SHALL 提供 PageSkeleton 组件，模拟 Layout 的整体结构。

#### Scenario: 渲染桌面端页面骨架

- **WHEN** 在桌面端渲染 `<PageSkeleton />`
- **THEN** 系统渲染包含侧边栏骨架和主内容区域骨架的布局

#### Scenario: 渲染移动端页面骨架

- **WHEN** 在移动端渲染 `<PageSkeleton />`
- **THEN** 系统渲染包含主内容区域骨架和底部导航栏占位符的布局

### Requirement: 骨架屏尺寸和样式定制

系统 SHALL 允许通过 className 自定义骨架屏尺寸和外观。

#### Scenario: 自定义宽度和高度

- **WHEN** 开发者使用 `<Skeleton className="w-32 h-8" />`
- **THEN** 系统渲染指定尺寸的骨架元素

#### Scenario: 圆角定制

- **WHEN** 开发者使用 `<Skeleton className="rounded-lg" />`
- **THEN** 系统渲染指定圆角的骨架元素

### Requirement: 复合骨架布局

系统 SHALL 提供组合多个骨架元素的布局组件。

#### Scenario: 渲染列表骨架

- **WHEN** 开发者使用 `<SkeletonList count={5} />`
- **THEN** 系统渲染包含 5 个列表项骨架的垂直布局

#### Scenario: 渲染聊天消息骨架

- **WHEN** 开发者使用 `<SkeletonMessage />`
- **THEN** 系统渲染模拟聊天消息结构的骨架（头像 + 多行文本）
