# Spec: 密码输入组件

本文档定义 `PasswordInput` 组件的功能需求和验收标准。

## ADDED Requirements

### Requirement: 组件渲染
系统必须提供一个可复用的 `PasswordInput` 组件，该组件在默认状态下显示密码输入框和眼睛图标切换按钮。组件必须使用相对定位容器包裹输入框和按钮，按钮必须绝对定位在输入框右侧并垂直居中。

#### Scenario: 组件初始渲染
- **WHEN** 开发者在页面中渲染 `<PasswordInput />` 组件
- **THEN** 系统必须显示一个标准的密码输入框（type="password"）
- **AND** 在输入框右侧必须显示一个眼睛图标（Eye）按钮
- **AND** 输入框必须有右侧内边距（pr-10）为按钮预留空间
- **AND** 按钮必须垂直居中对齐（top-1/2 -translate-y-1/2）

#### Scenario: 组件接受标准 HTML 属性
- **WHEN** 开发者传递标准 HTML input 属性（如 placeholder、disabled、required、autoComplete）
- **THEN** 组件必须将这些属性传递给底层的 input 元素
- **AND** 这些属性必须按预期工作

### Requirement: 密码隐藏状态
系统必须在默认情况下隐藏密码输入内容，使用 `type="password"` 属性。切换按钮必须显示"眼睛"图标（Eye），表示当前密码处于隐藏状态。

#### Scenario: 初始隐藏状态
- **WHEN** 组件首次被渲染
- **THEN** 输入框的 type 属性必须为 "password"
- **AND** 输入的内容必须被显示为圆点或星号
- **AND** 切换按钮必须显示 Eye 图标
- **AND** 按钮的 aria-label 必须为"显示密码"（中文）或"Show password"（英文）

#### Scenario: 编辑模式预填充隐藏
- **WHEN** 组件在编辑模式下预填充已有的密码值
- **THEN** 输入的内容必须仍然被隐藏
- **AND** 切换按钮必须显示 Eye 图标
- **AND** 用户必须无法直接看到预填充的密码内容

### Requirement: 密码显示/隐藏切换
系统必须允许用户通过点击切换按钮来改变密码的可见性。点击按钮必须在"隐藏"（type="password"，显示 Eye 图标）和"显示"（type="text"，显示 EyeOff 图标）状态之间切换。

#### Scenario: 从隐藏切换到显示
- **WHEN** 用户在密码隐藏状态下点击 Eye 图标按钮
- **THEN** 输入框的 type 属性必须变为 "text"
- **AND** 输入的内容必须以明文形式显示
- **AND** 按钮图标必须变为 EyeOff
- **AND** 按钮的 aria-label 必须更新为"隐藏密码"（中文）或"Hide password"（英文）

#### Scenario: 从显示切换回隐藏
- **WHEN** 用户在密码显示状态下点击 EyeOff 图标按钮
- **THEN** 输入框的 type 属性必须变回 "password"
- **AND** 输入的内容必须重新被隐藏
- **AND** 按钮图标必须变回 Eye
- **AND** 按钮的 aria-label 必须更新回"显示密码"（中文）或"Show password"（英文）

#### Scenario: 连续多次切换
- **WHEN** 用户连续多次点击切换按钮
- **THEN** 每次点击都必须立即切换密码的可见性状态
- **AND** 切换动画必须流畅无延迟
- **AND** 输入框的焦点必须保持在输入框内

### Requirement: 表单集成
组件必须完全兼容 TanStack Form 的字段管理机制，包括值绑定、变更通知和失焦处理。组件必须使用 React.forwardRef 暴露 DOM 引用，以支持表单库的焦点管理和验证功能。

#### Scenario: 值绑定
- **WHEN** 开发者使用 TanStack Form 的 Field 组件包裹 PasswordInput
- **THEN** 表单必须能够正确读取输入框的值
- **AND** 值的变更必须实时同步到表单状态

#### Scenario: 变更通知
- **WHEN** 用户在 PasswordInput 中输入内容
- **THEN** 组件必须触发 onChange 事件
- **AND** TanStack Form 必须接收到新的值
- **AND** 表单的验证逻辑必须能够正常执行

#### Scenario: 失焦处理
- **WHEN** 用户在输入后点击输入框外部区域（blur 事件）
- **THEN** 组件必须触发 onBlur 事件
- **AND** TanStack Form 必须能够执行失焦验证

#### Scenario: DOM 引用访问
- **WHEN** TanStack Form 或父组件尝试获取 PasswordInput 的 DOM 引用
- **THEN** 组件必须返回底层的 HTMLInputElement 引用
- **AND** 父组件必须能够通过该引用调用 focus()、blur() 等方法

### Requirement: 国际化支持
组件必须支持中英文双语，切换按钮的 aria-label 必须根据当前应用语言显示相应的文本。系统必须在 `common.json` 中定义通用的"显示"和"隐藏"翻译键。

#### Scenario: 中文环境下显示
- **WHEN** 应用语言设置为中文（zh-CN）
- **AND** 密码处于隐藏状态
- **THEN** 切换按钮的 aria-label 必须为"显示密码"
- **AND** 切换到显示状态后，aria-label 必须变为"隐藏密码"

#### Scenario: 英文环境下显示
- **WHEN** 应用语言设置为英文（en）
- **AND** 密码处于隐藏状态
- **THEN** 切换按钮的 aria-label 必须为"Show password"
- **AND** 切换到显示状态后，aria-label 必须变为"Hide password"

#### Scenario: 动态语言切换
- **WHEN** 用户在应用运行时切换语言
- **THEN** 下一次渲染组件时，aria-label 必须反映新选择的语言
- **AND** 不需要重新挂载组件

### Requirement: 无障碍访问
组件必须符合 WCAG 无障碍标准，为屏幕阅读器用户提供适当的 ARIA 标签和语义化标记。

#### Scenario: 屏幕阅读器识别
- **WHEN** 屏幕阅读器用户聚焦到密码输入框
- **THEN** 输入框必须被正确识别为密码输入控件
- **AND** 切换按钮必须有明确的 aria-label 说明其功能

#### Scenario: 键盘导航
- **WHEN** 用户使用 Tab 键导航到输入框
- **THEN** 输入框必须能够获得焦点
- **AND** 用户必须可以使用 Shift+Tab 焦点到切换按钮
- **AND** 按钮必须能够通过 Enter 或 Space 键触发

#### Scenario: 触摸设备支持
- **WHEN** 用户在触摸屏设备上点击切换按钮
- **THEN** 按钮必须有足够大的触摸区域（至少 44x44 像素）
- **AND** 点击必须立即响应，无延迟

### Requirement: 样式一致性
组件必须与 shadcn/ui 设计系统保持一致的视觉风格，包括边框、圆角、阴影、颜色和交互状态（hover、focus、disabled）。组件必须继承 Input 组件的基础样式类，并仅添加必要的布局样式。

#### Scenario: 默认状态样式
- **WHEN** 组件处于默认状态（无焦点、无悬停）
- **THEN** 输入框必须有与 shadcn/ui Input 组件相同的边框样式
- **AND** 圆角必须为 rounded-md
- **AND** 背景色必须为 bg-transparent
- **AND** 文字颜色必须为 text-foreground

#### Scenario: Focus 状态样式
- **WHEN** 用户聚焦到输入框
- **THEN** 输入框必须显示 focus-visible:ring-1 focus-visible:ring-ring 效果
- **AND** 边框颜色必须变化以指示聚焦状态
- **AND** 切换按钮的颜色必须变为 text-foreground

#### Scenario: Hover 状态样式
- **WHEN** 用户将鼠标悬停在切换按钮上
- **THEN** 按钮的颜色必须从 text-muted-foreground 变为 text-foreground
- **AND** 颜色变化必须有平滑的过渡动画（transition-colors）

#### Scenario: Disabled 状态样式
- **WHEN** 开发者设置 disabled 属性为 true
- **THEN** 输入框必须显示为禁用状态（disabled:cursor-not-allowed disabled:opacity-50）
- **AND** 切换按钮也必须显示为禁用状态
- **AND** 用户必须无法点击按钮或输入内容

### Requirement: 类型安全
组件必须使用 TypeScript 提供完整的类型定义，确保类型检查器能够捕获所有属性使用错误。组件的 Props 类型必须继承自 `React.ComponentProps<"input">`，以支持所有标准 input 属性。

#### Scenario: 属性类型检查
- **WHEN** 开发者在 TypeScript 代码中使用 PasswordInput
- **THEN** 所有标准 HTML input 属性必须被类型系统识别
- **AND** 传递不支持属性的代码必须产生类型错误

#### Scenario: Ref 类型推断
- **WHEN** 开发者使用 ref 获取组件的 DOM 引用
- **THEN** ref 的类型必须被正确推断为 HTMLInputElement
- **AND** TypeScript 必须能够识别 ref.current 上可用的所有 input 方法

### Requirement: 性能要求
组件必须高效运行，避免不必要的重新渲染。切换密码可见性状态时必须只重新渲染组件自身，不触发父组件或表单的额外重新渲染。

#### Scenario: 切换状态性能
- **WHEN** 用户点击切换按钮改变密码可见性
- **THEN** 组件必须只重新渲染自身
- **AND** 不应该触发父组件的重新渲染
- **AND** 状态更新必须在 16ms 内完成（60 FPS）

#### Scenario: 输入性能
- **WHEN** 用户在密码输入框中快速输入大量字符
- **THEN** 输入响应必须流畅，无卡顿
- **AND** 每次击字的延迟必须小于 50ms

### Requirement: 浏览器兼容性
组件必须在所有现代浏览器中正常工作，包括 Chrome、Firefox、Safari 和 Edge。组件必须优雅降级，在不支持的浏览器中仍能提供基本的密码输入功能。

#### Scenario: 现代浏览器支持
- **WHEN** 用户在任何现代浏览器（Chrome 90+、Firefox 88+、Safari 14+、Edge 90+）中使用组件
- **THEN** 所有功能必须正常工作
- **AND** 视觉效果必须在所有浏览器中一致

#### Scenario: 移动浏览器支持
- **WHEN** 用户在移动浏览器（iOS Safari、Chrome Mobile）中使用组件
- **THEN** 组件必须支持触摸交互
- **AND** 虚拟键盘必须能够正常弹出和收起
- **AND** 切换按钮必须足够大以便手指点击
