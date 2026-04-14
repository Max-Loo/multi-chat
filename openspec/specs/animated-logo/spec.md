# animated-logo 能力规格

Canvas 动态 Logo 组件，展示机器人思考打字场景动画。

## Requirements

### Requirement: 组件必须渲染 Canvas 动画
组件 SHALL 在挂载时渲染 Canvas 动画，并在初始化完成后清理动画帧。

#### Scenario: 正常渲染动画
- **WHEN** 组件挂载
- **THEN** 系统 SHALL 刣建 Canvas 元素并启动动画循环

#### Scenario: 组件卸载清理
- **WHEN** 组件卸载
- **THEN** 系统 SHALL 取消 requestAnimationFrame 回调并清理 Canvas 上下文

---

### Requirement: 动画必须支持无障碍
动画 SHALL 尊重用户的 `prefers-reduced-motion` 设置。

#### Scenario: 用户偏好减少动画
- **WHEN** 用户系统设置了 `prefers-reduced-motion: reduce`
- **THEN** 系统 SHALL 显示静态帧而非动画

#### Scenario: 用户偏好标准动画
- **WHEN** 用户系统未设置 `prefers-reduced-motion: reduce`
- **THEN** 系统 SHALL 正常播放动画

---

### Requirement: 机器人视觉设计
机器人 SHALL 采用极简现代风格，圆角方形主体， LED 像素眼睛。

#### Scenario: 渲染机器人头部
- **WHEN** 绘制机器人头部
- **THEN** 系统 SHALL 渲染圆角矩形轮廓，LED 像素眼睛，微笑曲线

---

### Requirement: 思考气泡动画
系统 SHALL 在机器人右上角显示思考气泡，三个圆点依次跳动。

#### Scenario: 思考气泡显示
- **WHEN** 动画开始
- **THEN** 系统 SHALL 在机器人右上方绘制气泡框，内含三个跳动圆点

#### Scenario: 圆点跳动动画
- **WHEN** 动画帧更新
- **THEN** 三个圆点 SHALL 依次放大/缩小，产生跳动效果

---

### Requirement: 打字动作动画
系统 SHALL 展示机器人双手在键盘上打字的动画。

#### Scenario: 手臂打字动作
- **WHEN** 动画帧更新
- **THEN** 系统 SHALL 绘制左右手臂交替按键的打字姿态

#### Scenario: 手指动画
- **WHEN** 手臂移动时
- **THEN** 系统 SHALL 绘制手指跟随按键位置移动

---

### Requirement: 键盘动画
系统 SHALL 绘制键盘底座，并展示按键依次被按下的动画效果。

#### Scenario: 键盘绘制
- **WHEN** 动画开始
- **THEN** 系统 SHALL 绘制键盘底座和按键网格

#### Scenario: 按键激活
- **WHEN** 手指按下时
- **THEN** 系统 SHALL 高亮对应按键（品牌蓝色）

#### Scenario: 按键循环
- **WHEN** 所有按键依次激活后
- **THEN** 系统 SHALL 循环继续下一个按键激活

---

### Requirement: Canvas 尺寸自适应
Canvas SHALL 根据容器尺寸自适应调整大小。

#### Scenario: 容器尺寸变化
- **WHEN** 容器尺寸改变
- **THEN** 系统 SHALL 重新计算 Canvas 缩放比例并重绘

---

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

### Requirement: 配色方案
动画 SHALL 使用黑白配色（浅色模式）或深灰浅轮廓配色（暗色模式），蓝色点缀。

#### Scenario: 正常配色
- **WHEN** 绘制动画且系统处于浅色模式
- **THEN** 系统 SHALL 使用 `#333333` 作为主色调， `#4269C4` 作为点缀色

#### Scenario: 暗色配色
- **WHEN** 绘制动画且系统处于暗色模式
- **THEN** 系统 SHALL 使用 `#CCCCCC` 作为轮廓色， `#454545` 作为填充色， `#6b8dd8` 作为点缀色
