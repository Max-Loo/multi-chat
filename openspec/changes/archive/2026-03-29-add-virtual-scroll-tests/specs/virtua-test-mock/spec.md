## ADDED Requirements

### Requirement: 可配置的虚拟化渲染范围计算

Mock 组件 SHALL 根据 `viewportHeight`、`itemHeight`、`overscan` 三个参数计算可见范围，只渲染 `[startIndex, endIndex]` 内的子元素。

#### Scenario: 渲染超出视口的列表
- **WHEN** 传入 20 个子元素且视口只能容纳 8 个（viewportHeight=600, itemHeight=80, overscan=2）
- **THEN** Mock 只渲染第 0~9 项（8 个可见项 + 2 个 overscan = 共 10 项），其余不渲染

#### Scenario: 消息数量在可视范围内
- **WHEN** 传入 3 个子元素且视口可容纳 8 个
- **THEN** Mock 渲染全部 3 个子元素

### Requirement: 滚动模拟

Mock 工厂 SHALL 返回 `scrollTo(indexOrOffset)` 方法模拟滚动操作，更新闭包内的可见范围状态并触发 Virtualizer 的 `onScroll` 回调。

#### Scenario: 向下滚动
- **WHEN** 测试调用工厂返回的 `scrollTo` 方法滚动到第 10 项
- **THEN** 可见范围更新为包含第 10 项的区域，之前不可见的项变为可见，Virtualizer 的 `onScroll` 回调被调用

### Requirement: 渲染项追踪

Mock 工厂 SHALL 返回 `getRenderedRange()` 方法返回当前可见范围的 `{ startIndex, endIndex }`，供测试断言。

#### Scenario: 查询当前渲染范围
- **WHEN** 测试调用工厂返回的 `getRenderedRange()`
- **THEN** 返回当前可见范围的起始和结束索引

### Requirement: Virtualizer API 兼容

MockVirtualizer SHALL 接受与真实 `Virtualizer` 相同的 props：`scrollRef`、`startMargin`、`onScroll`、`children`。

MockVList SHALL 接受与真实 `VList` 相同的 props：`onScroll`、`children`、`className`、`style`。

#### Scenario: Virtualizer 接受 scrollRef 和 startMargin
- **WHEN** 传入 `scrollRef={containerRef}` 和 `startMargin={48}`
- **THEN** Mock 正常渲染，不抛出错误

#### Scenario: VList 接受 className 和 style
- **WHEN** 传入 `className="custom-class"` 和 `style={{ height: '100%' }}`
- **THEN** Mock 正常渲染，将 className 和 style 应用到容器 div
