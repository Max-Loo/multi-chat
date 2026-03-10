# mobile-drawer Delta Specification

## MODIFIED Requirements

### Requirement: 抽屉宽度由内容决定

抽屉宽度由内容决定，但必须满足最小和最大宽度约束。

#### Scenario: 抽屉基于内容决定宽度
- **WHEN** 抽屉打开
- **THEN** 抽屉宽度由内容决定（`w-fit`）
- **AND** 抽屉最小宽度为 240px（`min-w-60`）
- **AND** 移动端最大宽度为视窗宽度的 85%（`max-w-[85vw]`）
- **AND** 小屏幕及以上（≥640px）最大宽度为 md（448px，`sm:max-w-md`）
- **AND** 确保各页面的侧边栏在抽屉中正常显示（ChatSidebar 224px、SettingSidebar 256px、ModelSidebar 240px）

#### Scenario: 抽屉内容较少时保持最小宽度
- **WHEN** 抽屉内容宽度小于 240px
- **THEN** 抽屉宽度固定为 240px（`min-w-60`）
- **AND** 防止抽屉过窄影响用户体验
