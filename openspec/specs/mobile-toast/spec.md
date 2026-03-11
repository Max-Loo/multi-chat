# Spec: 移动端 Toast 优化

## Purpose

提供移动端友好的 Toast 通知系统，支持响应式位置适配、手势关闭和自动间距配置。

## Requirements

### Requirement: 响应式位置适配
系统 SHALL 根据设备屏幕尺寸自动调整 Toast 显示位置：
- 移动端（屏幕宽度 ≤ 767px）时，Toast 显示在屏幕中上部（`top-center`）
- 桌面端（屏幕宽度 ≥ 768px）时，Toast 显示在右下角（`bottom-right`）

#### Scenario: 移动端 Toast 位置
- **WHEN** 用户在移动端设备（屏幕宽度 ≤ 767px）上触发 Toast
- **THEN** Toast 显示在屏幕中上部（`top-center`），距离顶部 16px

#### Scenario: 桌面端 Toast 位置
- **WHEN** 用户在桌面端设备（屏幕宽度 ≥ 768px）上触发 Toast
- **THEN** Toast 显示在右下角（`bottom-right`），距离底部 24px、右侧 24px

#### Scenario: 响应式切换
- **WHEN** 用户调整窗口大小，从移动端切换到桌面端（或反之）
- **THEN** Toast 位置立即更新，无需刷新页面

---

### Requirement: 手势关闭支持
系统 SHALL 支持用户通过手势关闭 Toast：
- 移动端：支持左右滑动关闭
- 桌面端：支持右滑关闭

#### Scenario: 移动端左滑关闭
- **WHEN** 用户在移动端 Toast 上向左滑动
- **THEN** Toast 被关闭，并显示滑出动画

#### Scenario: 移动端右滑关闭
- **WHEN** 用户在移动端 Toast 上向右滑动
- **THEN** Toast 被关闭，并显示滑出动画

#### Scenario: 桌面端右滑关闭
- **WHEN** 用户在桌面端 Toast 上向右滑动
- **THEN** Toast 被关闭，并显示滑出动画

---

### Requirement: 移动端间距配置
系统 SHALL 为移动端和桌面端设置不同的 Toast 间距：
- 移动端：顶部间距 16px（`mobileOffset={{ top: 16 }}`）
- 桌面端：顶部间距 24px、右侧间距 24px（`offset={{ top: 24, right: 24 }}`）

#### Scenario: 移动端间距
- **WHEN** Toast 在移动端显示
- **THEN** Toast 距离屏幕顶部 16px，避免遮挡状态栏

#### Scenario: 桌面端间距
- **WHEN** Toast 在桌面端显示
- **THEN** Toast 距离屏幕顶部 24px、右侧 24px，保持视觉平衡

---

### Requirement: 多个 Toast 堆叠展示
系统 SHALL 支持多个 Toast 同时显示时垂直堆叠，保持间距一致。

#### Scenario: 多个 Toast 移动端堆叠
- **WHEN** 移动端同时显示多个 Toast
- **THEN** Toast 从上到下垂直堆叠，每个 Toast 之间保持固定间距

#### Scenario: 多个 Toast 桌面端堆叠
- **WHEN** 桌面端同时显示多个 Toast
- **THEN** Toast 从上到下垂直堆叠，每个 Toast 之间保持固定间距

---

### Requirement: 响应式状态同步
系统 SHALL 通过 `useToastQueue` hook 同步移动端状态到 `toastQueue` 单例，确保状态一致性。

#### Scenario: 初始状态同步
- **WHEN** 应用启动，`ToasterWrapper` 组件挂载
- **THEN** `useToastQueue` hook 立即同步当前的 `isMobile` 状态到 `toastQueue` 单例

#### Scenario: 窗口大小变化时状态同步
- **WHEN** 用户调整窗口大小，触发 `useResponsive` 的 `isMobile` 状态变化
- **THEN** `useToastQueue` hook 立即将新的 `isMobile` 状态同步到 `toastQueue` 单例

---

### Requirement: 位置保护机制
系统 SHALL 自动移除单个 Toast 调用中的 `position` 选项，防止覆盖全局配置。

#### Scenario: 移除 position 选项
- **WHEN** 开发者调用 `toastQueue.success('消息', { position: 'bottom-left' })`
- **THEN** 系统自动移除 `position` 选项，使用全局配置的位置（移动端 `top-center`，桌面端 `top-right`）

#### Scenario: 其他选项不受影响
- **WHEN** 开发者调用 `toastQueue.success('消息', { description: '详细说明', duration: 5000 })`
- **THEN** 系统保留 `description` 和 `duration` 选项，仅移除 `position`

---

### Requirement: 原始 API 导出
系统 SHALL 导出原始 sonner API（`rawToast`），供特殊场景使用（如需要自定义位置的 Toast）。

#### Scenario: 使用 rawToast 自定义位置
- **WHEN** 开发者调用 `rawToast.success('消息', { position: 'bottom-left' })`
- **THEN** Toast 按照指定的 `bottom-left` 位置显示，不受全局配置约束

#### Scenario: rawToast 警告
- **WHEN** 开发者在代码中使用 `rawToast`
- **THEN** 系统在文档中明确说明使用场景和风险

**rawToast 的使用场景**：
- ✅ 需要在特定位置显示 Toast（如底部通知、中心弹窗）
- ✅ 需要动态位置（根据业务逻辑决定位置）
- ✅ 需要测试 Toast 的不同位置效果

**禁止使用场景**：
- ❌ 普通的成功/失败提示（应使用 `toastQueue`）
- ❌ 移动端的所有 Toast（应使用 `toastQueue`，位置由系统自动管理）
- ❌ 需要响应式位置的 Toast（应使用 `toastQueue`，系统自动适配移动端/桌面端）
