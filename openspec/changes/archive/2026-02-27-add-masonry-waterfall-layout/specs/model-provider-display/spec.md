# Model Provider Display - Delta Spec

## Purpose

此 delta spec 修改了"支持响应式布局"需求的实现方式，从 CSS Grid 改为 Masonry 瀑布流布局，以优化卡片高度不一致时的空间利用率。

## MODIFIED Requirements

### Requirement: 支持响应式布局
系统 SHALL 在不同屏幕尺寸下提供良好的显示效果，使用瀑布流布局以优化空间利用率。

#### Scenario: 小屏幕显示
- **WHEN** 屏幕宽度 < 1024px
- **THEN** 供应商卡片以三列瀑布流布局显示
- **AND** 列之间保持 1rem 间距

#### Scenario: 中等屏幕显示
- **WHEN** 屏幕宽度 ≥ 1024px 且 < 1560px
- **THEN** 供应商卡片以单列瀑布流布局显示
- **AND** 列之间保持 1rem 间距

#### Scenario: 超大屏幕显示
- **WHEN** 屏幕宽度 ≥ 1560px
- **THEN** 供应商卡片以双列瀑布流布局显示
- **AND** 列之间保持 1rem 间距
- **AND** 卡片按列从上到下填充，紧凑排列高度不一致的卡片

#### Scenario: 动态高度自适应
- **WHEN** 用户展开或折叠供应商卡片
- **THEN** 系统自动重新计算瀑布流布局
- **AND** 卡片平滑过渡到新位置（300ms 动画）
- **AND** 不会产生垂直空白区域
