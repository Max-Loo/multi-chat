# Design: 密码输入组件技术设计

## Context

### 当前状态
- 项目使用 shadcn/ui 作为基础 UI 组件库，所有输入框组件（`Input`）是简单的包装器，不包含密码显示/隐藏功能
- `ModelConfigForm` 组件使用 TanStack Form 管理表单状态，包括 API Key 输入字段
- 项目已安装 lucide-react 图标库，提供了 `Eye` 和 `EyeOff` 图标
- 项目使用 react-i18next 进行国际化管理，支持中英文双语

### 技术约束
- 必须与现有的 shadcn/ui 设计系统保持一致
- 必须兼容 TanStack Form 的字段验证机制
- 必须遵循项目的导入路径规范（使用 `@/` 别名）
- 必须使用中文注释
- React 19 + TypeScript 严格模式

### 利益相关者
- **用户**：需要能够验证 API Key 输入的正确性
- **开发者**：需要可复用的组件，避免在未来重复实现相同功能

## Goals / Non-Goals

**Goals:**
- 创建可复用的 `PasswordInput` 组件，支持密码显示/隐藏切换功能
- 保持与 shadcn/ui 设计系统的视觉和交互一致性
- 确保组件与 TanStack Form 的无缝集成
- 提供无障碍支持（ARIA 标签）
- 支持国际化（中英文）

**Non-Goals:**
- 不修改其他表单字段的行为
- 不改变现有的表单验证逻辑
- 不引入新的外部依赖（仅使用已安装的 lucide-react）
- 不实现复杂的密码强度检测功能

## Decisions

### 1. 组件架构模式

**决策**：使用 React.forwardRef + 受控组件模式

**理由**：
- 与项目中现有的 `Input` 组件（`src/components/ui/input.tsx`）保持一致
- forwardRef 允许父组件（如 TanStack Form）获取 DOM 引用，用于焦点管理和验证
- 受控组件模式确保与 TanStack Form 的值同步机制兼容

**替代方案考虑**：
- *非受控组件 + useRef*：不采用，因为 TanStack Form 依赖受控组件的值同步
- *Compound Component 模式*：不采用，过于复杂，当前需求不需要

### 2. 状态管理

**决策**：使用本地 `useState` 管理显示/隐藏状态

**理由**：
- 显示/隐藏状态是纯粹的 UI 状态，不需要提升到父组件
- 每个密码输入框独立控制，互不影响
- 简单且性能高效

**替代方案考虑**：
- *全局状态管理（Redux）*：不采用，过度设计，本地状态足够
- *URL 参数*：不采用，密码可见性不应持久化或分享

### 3. UI 布局结构

**决策**：使用相对定位容器 + 绝对定位按钮

**理由**：
- 相对定位容器（`relative`）作为上下文
- 输入框设置 `pr-10`（padding-right: 2.5rem）为按钮预留空间
- 切换按钮使用绝对定位（`absolute`）固定在右侧，使用 flexbox 垂直居中

**实现细节**：
```tsx
<div className="relative">
  <Input type={showPassword ? "text" : "password"} className="pr-10" />
  <button className="absolute right-3 top-1/2 -translate-y-1/2">
    {showPassword ? <EyeOff /> : <Eye />}
  </button>
</div>
```

**替代方案考虑**：
- *使用 Grid 布局*：不采用，相对定位更简单且不影响输入框宽度
- *使用 Input group 组件*：shadcn/ui 无此组件，需自行实现，相对定位更直接

### 4. 国际化实现

**决策**：使用 `useTranslation` hook 获取 aria-label 文本

**理由**：
- 项目已使用 react-i18next，保持一致性
- 使用项目的类型安全翻译函数：`t($ => $.common.show)`
- 翻译键名使用 `show` / `hide`，放在 `common.json` 中（通用 UI 文本）

**实现细节**：
- 在 `src/locales/zh/common.json` 添加：`"show": "显示", "hide": "隐藏"`
- 在 `src/locales/en/common.json` 添加：`"show": "Show", "hide": "Hide"`
- 组件中使用：`aria-label={t($ => $.common.show)}`

**替代方案考虑**：
- *硬编码文本*：不采用，违反项目的国际化规范
- *创建独立的 password-input.json*：不采用，文本过于通用，应放在 common.json

### 5. 组件接口设计

**决策**：继承 HTMLInputElement 的所有属性，通过 TypeScript 泛型实现

**理由**：
- 保持与原生 input 元素的完全兼容性
- 支持所有标准属性（placeholder, disabled, required, autoComplete 等）
- 类型安全，避免拼写错误

**实现细节**：
```tsx
type PasswordInputProps = React.ComponentProps<"input">

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    // ...
  }
)
```

**替代方案考虑**：
- *自定义 Props 接口*：不采用，需要手动维护所有属性，容易遗漏

### 6. 默认可见性状态

**决策**：默认隐藏密码（`showPassword = false`）

**理由**：
- 符合安全最佳实践
- 符合用户对密码字段的预期
- 保持与现有 `type="password"` 行为的一致性

**替代方案考虑**：
- *默认显示*：不采用，存在安全风险

## Risks / Trade-offs

### 风险 1：按钮可能与输入框内容重叠
**缓解措施**：
- 输入框设置 `pr-10`（padding-right: 2.5rem）为按钮预留充足空间
- 按钮使用 `right-3`（right: 0.75rem）定位，与 padding 保持一致

### 风险 2：与其他输入框样式不一致
**缓解措施**：
- 完全继承 `Input` 组件的样式类和结构
- 仅添加必要的布局容器（`relative` div）
- 按钮使用项目标准颜色（`text-muted-foreground hover:text-foreground`）

### 风险 3：TanStack Form 集成问题
**缓解措施**：
- 使用 forwardRef 确保 TanStack Form 可以获取 DOM 引用
- 完全支持受控组件属性（value, onChange, onBlur）
- 验证机制不受影响（字段验证器仍然正常工作）

### 权衡 1：组件复杂度 vs 复用性
**选择**：创建独立组件而非在 `ModelConfigForm` 中直接实现
**理由**：
- 一次性实现，多处复用（未来可能有其他密码输入场景）
- 遵循 DRY 原则
- 符合项目的组件化架构

### 权衡 2：性能 vs 用户体验
**选择**：每次点击切换按钮时触发状态更新
**理由**：
- 状态更新开销极小（仅重新渲染一个图标和一个 type 属性）
- 用户即时反馈，体验更好
- 不影响表单验证性能（验证在 onChange/onBlur 时触发）

## Migration Plan

### 部署步骤
1. **创建国际化文本**（无破坏性）
   - 在 `src/locales/zh/common.json` 和 `src/locales/en/common.json` 添加 `show` / `hide` 键
   - 重启应用以加载新的翻译资源

2. **创建 PasswordInput 组件**（无破坏性）
   - 创建 `src/components/ui/password-input.tsx`
   - 组件尚未被使用，不影响现有功能

3. **修改 ModelConfigForm**（渐进式迁移）
   - 替换 apiKey 字段的 `Input` 为 `PasswordInput`
   - 保持所有表单验证逻辑不变
   - 测试表单提交和验证功能

4. **测试验证**
   - 测试密码显示/隐藏功能
   - 测试表单验证（提交空 API Key）
   - 测试编辑模式（预填充已有 API Key）
   - 测试国际化切换

### 回滚策略
- **Git 回滚**：如果出现问题，可以轻松回滚到修改前的提交
- **向后兼容**：旧版本的 API Key 配置不受影响（仅 UI 变更）
- **数据无影响**：此变更不涉及数据模型或存储逻辑变更

### 部署影响
- **零停机时间**：纯前端变更，无需后端迁移
- **用户无需操作**：现有用户的 API Key 配置保持不变
- **即开即用**：部署后用户立即看到新的显示/隐藏按钮

## Open Questions

无。所有技术决策已明确，实现细节清晰。

## Implementation Notes

### 关键文件路径
- 新组件：`src/components/ui/password-input.tsx`
- 修改文件：`src/pages/Model/components/ModelConfigForm.tsx`
- 国际化文件：`src/locales/zh/common.json`、`src/locales/en/common.json`

### 依赖关系
- `lucide-react`：`Eye`、`EyeOff` 图标（已安装）
- `@/components/ui/input`：基础 Input 组件
- `@/lib/utils`：`cn` 工具函数（className 合并）
- `react-i18next`：国际化支持

### 技术栈
- React 19.2.0
- TypeScript 5.9.3
- TanStack Form 1.28.0
- Tailwind CSS 4.1.14
