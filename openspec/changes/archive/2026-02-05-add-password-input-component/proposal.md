# Proposal: 添加密码输入组件

## Why

当前 `ModelConfigForm` 中的 API Key 输入框使用 `type="password"` 隐藏输入内容，但缺少显示/隐藏切换功能。用户在输入较长的 API Key 时无法验证输入是否正确，容易导致配置错误和使用体验不佳。这是一个常见的密码输入 UX 问题，需要在保持安全性的同时提供更好的用户验证能力。

## What Changes

- 创建可复用的 `PasswordInput` 组件（`src/components/ui/password-input.tsx`），支持密码显示/隐藏切换
- 修改 `ModelConfigForm.tsx` 中的 apiKey 字段，将 `Input` 组件替换为 `PasswordInput` 组件
- 添加国际化文本支持（中文/英文）
- 引入 lucide-react 图标库的 `Eye` 和 `EyeOff` 图标（项目已安装，无需新增依赖）

## Capabilities

### New Capabilities
- `password-input`: 可复用的密码输入组件，提供以下功能：
  - 密码显示/隐藏切换按钮
  - 与 shadcn/ui 设计系统一致的外观和交互
  - 支持与 TanStack Form 集成
  - 无障碍支持（aria-label）
  - 国际化支持

### Modified Capabilities
- 无（现有规范级别的需求无变更）

## Impact

### 受影响的代码
- **新增文件**:
  - `src/components/ui/password-input.tsx` - 新的密码输入组件
- **修改文件**:
  - `src/pages/Model/components/ModelConfigForm.tsx` - 替换 apiKey 字段使用 `PasswordInput` 组件
  - `src/locales/zh/common.json` - 添加"显示"/"隐藏"文本
  - `src/locales/en/common.json` - 添加"Show"/"Hide"文本

### 依赖项
- **无新增依赖**：lucide-react 图标库已安装（package.json 第 49 行）
- **兼容性**：与现有 shadcn/ui 组件（Input、FormControl）完全兼容

### 用户体验
- **正面影响**：
  - 用户可以验证 API Key 输入的正确性
  - 减少因输入错误导致的配置失败
  - 提升整体表单填写体验
- **无负面影响**：保持默认隐藏状态，不影响安全性

### 技术架构
- 遵循项目现有的组件设计模式（参考 `src/components/ui/input.tsx`）
- 与 TanStack Form 的字段验证机制兼容
- 遵循项目的导入路径规范（使用 `@/` 别名）
- 遵循项目的国际化实现方式（react-i18next）
