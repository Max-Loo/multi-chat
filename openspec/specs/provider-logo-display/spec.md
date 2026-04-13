# Provider Logo Display

## Purpose

定义供应商 logo 的获取和显示行为，包括 logo URL 构建、图片加载、错误降级处理和样式优化。此规格确保项目中所有需要显示供应商 logo 的地方都使用统一的实现方式。

## Requirements

### Requirement: 获取供应商 Logo URL

系统 SHALL 提供工具函数来构建供应商 logo 的 URL。

#### Scenario: 构建 logo URL
- **WHEN** 调用 `getProviderLogoUrl(providerKey)` 工具函数
- **THEN** 系统返回 `https://models.dev/logos/${providerKey}.svg`
- **AND** URL 格式固定，前缀和后缀不变
- **AND** 使用 providerKey 作为文件名

#### Scenario: 使用示例
- **WHEN** 调用 `getProviderLogoUrl('openai')`
- **THEN** 系统返回 `https://models.dev/logos/openai.svg`
- **WHEN** 调用 `getProviderLogoUrl('anthropic')`
- **THEN** 系统返回 `https://models.dev/logos/anthropic.svg`

### Requirement: 显示供应商 Logo 图片

系统 SHALL 在需要显示供应商的地方使用 logo 图片替代首字母头像。

#### Scenario: 成功加载 logo
- **WHEN** 供应商卡片组件渲染
- **AND** logo 图片资源可访问
- **THEN** 系统显示供应商 logo 图片
- **AND** 图片使用 `<img>` 标签渲染
- **AND** 图片尺寸为 40x40 像素（w-10 h-10）
- **AND** 图片使用 `object-contain` 保持宽高比

#### Scenario: Logo 图片属性
- **WHEN** logo 图片渲染时
- **THEN** 系统设置 `alt` 属性为 `{providerName} logo`
- **AND** 系统添加轻微阴影效果（`drop-shadow`）
- **AND** 图片清晰显示，无模糊或失真

### Requirement: Logo 加载失败降级

系统 SHALL 在 logo 图片加载失败时降级到首字母显示。

#### Scenario: 网络错误导致加载失败
- **WHEN** logo 图片资源无法访问（网络错误、404等）
- **THEN** 系统捕获 `onError` 事件
- **AND** 系统切换到首字母显示模式
- **AND** 首字母使用大写的供应商名称第一个字符
- **AND** 降级后的样式与原首字母头像一致

#### Scenario: ProviderKey 不匹配
- **WHEN** logo 文件不存在（providerKey 与文件名不匹配）
- **THEN** 系统触发 `onError` 事件
- **AND** 系统降级到首字母显示
- **AND** 不显示损坏的图片图标

#### Scenario: 降级状态的持久性
- **WHEN** logo 加载失败降级到首字母
- **THEN** 系统保持首字母显示状态
- **AND** 不在组件重新渲染时重试加载 logo
- **AND** 用户需要刷新页面才能重试

#### Scenario: ProviderKey 变化时重置状态
- **WHEN** `providerKey` 属性变化
- **THEN** 系统重置 `imgError` 和 `imgLoaded` 状态
- **AND** 系统重新尝试加载新的 logo
- **AND** 使用 `key={providerKey}` 强制重新渲染 img 元素

### Requirement: Logo 加载超时处理

系统 SHALL 在 logo 加载超时时自动降级到首字母显示。

#### Scenario: 加载超时降级
- **WHEN** logo 图片加载时间超过 `LOGO_LOAD_TIMEOUT`（5000ms）
- **THEN** 系统触发超时机制
- **AND** 系统降级到首字母显示
- **AND** 用户无需等待即可看到内容

#### Scenario: 超时后加载成功
- **WHEN** logo 在超时后加载完成（超过 `LOGO_LOAD_TIMEOUT`）
- **THEN** 系统保持首字母显示（不切换到 logo）
- **AND** 避免内容突兀变化

#### Scenario: 正常加载时间
- **WHEN** logo 在 `LOGO_LOAD_TIMEOUT` 内加载完成
- **THEN** 系统显示 logo 图片
- **AND** 不触发超时降级

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

### Requirement: 渐进显示策略

系统 SHALL 使用渐进显示策略，先显示首字母占位符，logo 加载成功后平滑淡入。

#### Scenario: 初始状态显示首字母
- **WHEN** 供应商卡片组件首次渲染
- **THEN** 系统立即显示首字母占位符
- **AND** 首字母使用供应商名称第一个字符的大写
- **AND** 首字母显示在与 logo 相同的位置和尺寸
- **AND** 避免首屏空白

#### Scenario: Logo 加载成功后淡入
- **WHEN** logo 图片成功加载
- **THEN** 系统使用 300ms 的过渡动画淡入 logo
- **AND** 同时淡出首字母占位符
- **AND** 过渡效果平滑流畅
- **AND** 使用 CSS `opacity` 属性实现

#### Scenario: Logo 加载失败保持首字母
- **WHEN** logo 加载失败或超时
- **THEN** 系统保持首字母显示
- **AND** 不触发任何过渡动画
- **AND** 用户体验连续

#### Scenario: 避免布局偏移
- **WHEN** logo 从首字母切换到图片
- **THEN** 系统使用绝对定位确保内容重叠
- **AND** 不引起容器尺寸变化
- **AND** 不触发页面布局重排

### Requirement: 可访问性支持

系统 SHALL 确保所有用户（包括使用辅助技术的用户）都能正确识别供应商。

#### Scenario: Logo 图片的可访问性
- **WHEN** logo 图片显示时
- **THEN** 系统设置 `alt` 属性为 `{providerName} logo`
- **AND** 屏幕阅读器能够正确读出供应商名称

#### Scenario: 首字母降级的可访问性
- **WHEN** 降级到首字母显示时
- **THEN** 系统使用 `<div>` 元素包裹首字母
- **AND** 设置 `role="img"` 属性
- **AND** 设置 `aria-label` 为 `{providerName} logo`
- **AND** 屏幕阅读器能够正确识别这是供应商 logo 的后备显示

### Requirement: 工具函数的可复用性

系统 SHALL 提供可在项目任何地方使用的工具函数。

#### Scenario: 导入工具函数
- **WHEN** 开发者需要使用供应商 logo URL
- **THEN** 系统通过 `@/utils/providerUtils` 导入工具函数
- **AND** 函数使用命名导出（named export）
- **AND** 函数命名为 `getProviderLogoUrl`

#### Scenario: TypeScript 类型支持
- **WHEN** 使用工具函数
- **THEN** 系统提供完整的 TypeScript 类型定义
- **AND** 函数签名为 `(providerKey: string): string`
- **AND** 返回类型为 string

#### Scenario: 函数文档
- **WHEN** 查看工具函数源码
- **THEN** 系统提供 JSDoc 注释
- **AND** 注释包含函数描述
- **AND** 注释包含参数说明（`@param`）
- **AND** 注释包含返回值说明（`@returns`）
- **AND** 注释包含使用示例（`@example`）

### Requirement: ProviderLogo 组件封装

系统 SHALL 提供可复用的 React 组件封装所有 logo 显示逻辑。

#### Scenario: 组件基本使用
- **WHEN** 开发者需要显示供应商 logo
- **THEN** 系统提供 `<ProviderLogo>` 组件
- **AND** 组件接受 `providerKey` 和 `providerName` 作为必需 props
- **AND** 组件接受可选的 `size` 和 `className` props
- **AND** 组件自动处理加载、降级、渐进显示逻辑

#### Scenario: 组件类型定义
- **WHEN** 使用 TypeScript
- **THEN** 系统提供完整的组件 Props 类型定义
- **AND** 类型定义包含所有 props 的类型和注释

#### Scenario: 组件导出
- **WHEN** 导入组件
- **THEN** 系统通过 `@/components/ProviderLogo` 导入
- **AND** 使用命名导出（`export const ProviderLogo`）

### Requirement: 组件性能优化

系统 SHALL 使用双层缓存机制优化组件性能。

#### Scenario: React.memo 组件级缓存
- **WHEN** 组件 props（`providerKey`、`providerName`、`size`）不变
- **THEN** 系统跳过组件重新渲染
- **AND** 使用 `React.memo` 包装组件
- **AND** 提供自定义比较函数

#### Scenario: 浏览器缓存命中
- **WHEN** logo 已被浏览器缓存（HTTP 缓存）
- **THEN** 系统从浏览器缓存快速加载
- **AND** 网络请求瞬间完成（通常 < 50ms）
- **AND** 用户几乎立即看到 logo

#### Scenario: React.memo 缓存命中性能
- **WHEN** 组件 props 不变
- **THEN** 系统跳过组件重新渲染
- **AND** 无需执行 useEffect 和状态更新
- **AND** 渲染时间 < 16ms（60 FPS）

### Requirement: 兼容性保障

系统 SHALL 确保在不同浏览器和网络环境下正常工作。

#### Scenario: 浏览器兼容性
- **WHEN** 用户使用现代浏览器（Chrome、Firefox、Safari、Edge）
- **THEN** 系统正确渲染 SVG 图片
- **AND** `onError` 事件正常触发
- **AND** 降级逻辑正常工作

#### Scenario: 网络延迟
- **WHEN** 网络延迟较高
- **THEN** 系统显示加载占位（浏览器默认行为）
- **AND** 图片加载完成后显示
- **AND** 加载失败时自动降级到首字母

### Requirement: 性能要求

系统 SHALL 确保 logo 显示不会影响页面性能。

#### Scenario: 小文件大小
- **WHEN** logo 图片为 SVG 格式
- **THEN** 文件大小通常小于 10KB
- **AND** 加载速度快
- **AND** 不阻塞页面渲染

#### Scenario: 缓存策略
- **WHEN** 用户多次访问同一页面
- **THEN** 浏览器缓存 logo 图片
- **AND** 重复访问时不重新下载
- **AND** 减少网络请求
