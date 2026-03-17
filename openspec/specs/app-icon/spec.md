# app-icon 能力规格
静态 SVG 应用图标，用于 App 图标、favicon 等。

## Requirements

### Requirement: SVG 必须是静态
SVG 图标 SHALL 为纯静态 SVG 文件，不包含任何动画或脚本。

#### Scenario: 构建图标文件
- **WHEN** 开发者构建应用
- **THEN** 系统 SHALL 将 SVG 文件放在 `public/logo.svg`

---

### Requirement: 焦点在机器人头部
SVG 图标 SHALL 聚焦于机器人头部，省略桌子、纸张等场景元素。

#### Scenario: 知别图标设计
- **WHEN** 设计 App 图标
- **THEN** SVG SHALL 只包含机器人头部、眼睛和身体轮廓

---

### Requirement: 小尺寸适配
SVG 图标 SHALL 在小尺寸 (16x16 到 64x64) 下保持清晰可识别。

#### Scenario: 16x16 尺寸显示
- **WHEN** 在 16x16 像素下显示
- **THEN** 图标 SHALL 保持机器人头部和眼睛的基本轮廓

#### Scenario: 32x32 尺寸显示
- **WHEN** 在 32x32 像素下显示
- **THEN** 图标 SHALL 显示完整的头部和简化的身体

#### Scenario: 64x64 及以上尺寸显示
- **WHEN** 在 64x64 像素及以上显示
- **THEN** 图标 SHALL 显示完整的设计细节

---

### Requirement: 配色一致性
SVG 图标 SHALL 使用与 Canvas 动画相同的配色方案。

#### Scenario: 图标配色
- **WHEN** 绘制 SVG 图标
- **THEN** 系统 SHALL 使用 `#333333` 主色调和 `#4269C4` 点缀色
