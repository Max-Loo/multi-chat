# Masonry Waterfall Layout

## Purpose

为卡片列表组件提供瀑布流布局能力，支持响应式列数配置和动态高度自适应。通过紧凑排列高度不一致的卡片，提升空间利用率和视觉美观度。

## Requirements

### Requirement: 瀑布流布局展示
系统 SHALL 使用瀑布流布局方式展示卡片列表，以优化空间利用率。

#### Scenario: 瀑布流排列卡片
- **WHEN** 组件渲染时
- **THEN** 系统使用瀑布流布局排列卡片
- **AND** 卡片按列从上到下填充
- **AND** 当前列填满后自动开始下一列
- **AND** 不同高度的卡片紧凑排列，无垂直空白区域

### Requirement: 响应式列数配置
系统 SHALL 根据屏幕宽度自动调整列数，以提供最佳的显示效果。

#### Scenario: 小屏幕三列布局
- **WHEN** 屏幕宽度 < 1024px
- **THEN** 系统使用三列布局显示卡片

#### Scenario: 中等屏幕单列布局
- **WHEN** 屏幕宽度 ≥ 1024px 且 < 1560px
- **THEN** 系统使用单列布局显示卡片

#### Scenario: 超大屏幕双列布局
- **WHEN** 屏幕宽度 ≥ 1560px
- **THEN** 系统使用双列布局显示卡片

### Requirement: 动态高度自适应
系统 SHALL 支持卡片高度动态变化时自动重新布局。

#### Scenario: 展开卡片时自动调整
- **WHEN** 用户展开某个卡片
- **THEN** 系统自动重新计算布局
- **AND** 该卡片所在列的后续卡片下移以适应新高度
- **AND** 其他列的卡片位置保持不变

#### Scenario: 折叠卡片时自动调整
- **WHEN** 用户折叠某个卡片
- **THEN** 系统自动重新计算布局
- **AND** 该卡片所在列的后续卡片上移以填补空白
- **AND** 其他列的卡片位置保持不变

### Requirement: 列间距控制
系统 SHALL 在列之间保持一致的间距。

#### Scenario: 标准列间距
- **WHEN** 渲染瀑布流布局
- **THEN** 系统在相邻列之间应用 1rem (16px) 的间距
- **AND** 使用 padding-left 实现列间距

### Requirement: 卡片完整性保护
系统 SHALL 确保卡片不会被列分隔符断开。

#### Scenario: 防止卡片跨列显示
- **WHEN** 渲染卡片元素
- **THEN** 系统使用 CSS break-inside-avoid 属性
- **AND** 确保每个卡片完整显示在单列内
- **AND** 卡片不会被分割到两列中

### Requirement: 性能优化
系统 SHALL 保持良好的渲染性能。

#### Scenario: 快速渲染
- **WHEN** 卡片数量 ≤ 50 个
- **THEN** 系统在 500ms 内完成布局渲染
- **AND** 布局计算不阻塞主线程超过 100ms

#### Scenario: 平滑动画过渡
- **WHEN** 卡片高度变化触发重新布局
- **THEN** 系统在 300ms 内完成位置调整
- **AND** 卡片移动使用 CSS transition 动画
