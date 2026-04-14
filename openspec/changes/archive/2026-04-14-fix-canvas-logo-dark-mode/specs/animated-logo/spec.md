## ADDED Requirements

### Requirement: Canvas 动画必须响应主题切换
Canvas 动画 SHALL 根据当前生效的主题（浅色/暗色）使用对应的调色板进行绘制，确保在暗色模式下视觉效果与整体风格协调。

#### Scenario: 暗色模式下渲染
- **WHEN** 系统处于暗色模式（`resolvedTheme` 为 `"dark"`）
- **THEN** 系统 SHALL 使用暗色调色板绘制所有 Canvas 元素（深色填充、浅色轮廓、提亮的品牌蓝点缀）

#### Scenario: 浅色模式下渲染
- **WHEN** 系统处于浅色模式（`resolvedTheme` 为 `"light"`）
- **THEN** 系统 SHALL 使用浅色调色板绘制所有 Canvas 元素（行为与当前一致）

#### Scenario: 主题切换时即时响应
- **WHEN** 用户从浅色切换到暗色（或反之）时 Logo 正在显示
- **THEN** 系统 SHALL 在下一帧使用新调色板重绘

---

## MODIFIED Requirements

### Requirement: 配色方案
动画 SHALL 使用黑白配色（浅色模式）或深灰浅轮廓配色（暗色模式），蓝色点缀。

#### Scenario: 正常配色
- **WHEN** 绘制动画且系统处于浅色模式
- **THEN** 系统 SHALL 使用 `#333333` 作为主色调， `#4269C4` 作为点缀色

#### Scenario: 暗色配色
- **WHEN** 绘制动画且系统处于暗色模式
- **THEN** 系统 SHALL 使用 `#CCCCCC` 作为轮廓色， `#454545` 作为填充色， `#6b8dd8` 作为点缀色
