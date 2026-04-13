## ADDED Requirements

### Requirement: 暗色模式 Logo 反色显示

系统 SHALL 在暗色模式下对 ProviderLogo 的图片应用反色滤镜，确保深色 logo 在暗色背景下清晰可辨。

#### Scenario: 暗色模式下 logo 反色

- **WHEN** 当前主题为暗色模式
- **AND** ProviderLogo 的图片成功加载并显示
- **THEN** 系统必须对 `<img>` 元素应用 `invert(1) hue-rotate(180deg)` CSS 滤镜
- **AND** logo 在暗色背景下清晰可辨

#### Scenario: 浅色模式下 logo 不受影响

- **WHEN** 当前主题为浅色模式
- **AND** ProviderLogo 的图片成功加载并显示
- **THEN** 系统不得应用反色滤镜
- **AND** logo 保持原始颜色显示

#### Scenario: 反色滤镜实现方式

- **WHEN** ProviderLogo 的 `<img>` 元素渲染
- **THEN** 系统必须通过纯 CSS 规则（`.dark` 下的选择器）控制反色滤镜
- **AND** 不得在组件内通过 JavaScript 判断主题状态添加 inline style
- **AND** `<img>` 元素必须具有 `provider-logo` class 用于 CSS 选择器匹配

#### Scenario: 阴影效果在暗色模式下的处理

- **WHEN** 暗色模式下 logo 应用反色滤镜
- **THEN** 原有的 `drop-shadow` 效果自动被反色处理
- **AND** 不需要额外的阴影调整

### Requirement: 暗色模式 logo 降级显示不受影响

系统 SHALL 确保暗色模式反色滤镜不影响 logo 加载失败时的首字母降级显示。

#### Scenario: 暗色模式下 logo 加载失败降级

- **WHEN** 当前主题为暗色模式
- **AND** logo 图片加载失败或超时
- **THEN** 系统降级到首字母显示
- **AND** 首字母显示样式与当前主题的 `text-primary` 和 `bg-primary/10` 一致
- **AND** 不应用反色滤镜到首字母占位符

## MODIFIED Requirements

### Requirement: Logo 样式优化

系统 SHALL 确保 logo 图片在不同背景下清晰可见。暗色模式下通过 CSS 滤镜确保深色 logo 可辨识。

#### Scenario: SVG 图片显示

- **WHEN** logo 图片为 SVG 格式
- **THEN** 系统使用 `object-contain` 保持宽高比
- **AND** 图片居中显示
- **AND** 图片不超出容器边界

#### Scenario: 图片容器样式

- **WHEN** logo 显示在供应商卡片头部
- **THEN** 系统使用 40x40 像素的容器
- **AND** 容器背景透明
- **AND** 图片添加轻微阴影（`drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))`）

#### Scenario: 暗色模式下的 logo 可见性

- **WHEN** 暗色模式下显示 logo
- **THEN** 系统通过 CSS 滤镜（`invert(1) hue-rotate(180deg)`）反转 logo 颜色
- **AND** 彩色 logo 的色相尽量保持原有感知（通过 `hue-rotate(180deg)` 补偿）
- **AND** 暗色 logo 变为亮色，与暗色背景形成足够对比度
