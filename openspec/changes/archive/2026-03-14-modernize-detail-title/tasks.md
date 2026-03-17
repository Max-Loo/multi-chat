## 1. 依赖安装

- [x] 1.1 安装 shadcn Tooltip 组件 (`npx shadcn@latest add tooltip`)
- [x] 1.2 验证 `@radix-ui/react-tooltip` 依赖已添加到 package.json
- [x] 1.3 验证 `src/components/ui/tooltip.tsx` 文件已创建

## 2. 国际化准备

- [x] 2.1 在 i18n 文件中添加 Tooltip 标签翻译键（supplier、model、nickname）
- [x] 2.2 确认现有 Badge 翻译键（chat.disabled、chat.deleted）可用

## 3. 组件重构

- [x] 3.1 在 DetailTitle 组件中导入 ProviderLogo 和 Tooltip 相关组件
- [x] 3.2 重构布局结构：使用 TooltipProvider + Tooltip 包裹内容
- [x] 3.3 添加 ProviderLogo 组件显示供应商 Logo
- [x] 3.4 添加昵称显示区域，配置 truncate + min-w-0 样式
- [x] 3.5 实现昵称为空时显示 modelName 的逻辑
- [x] 3.6 实现 TooltipContent，使用 i18n 显示完整模型信息
- [x] 3.7 调整状态 Badge 显示逻辑（仅异常状态显示）

## 4. 样式调整

- [x] 4.1 添加 flex 容器的 gap 间距
- [x] 4.2 配置 Tooltip 的 side 属性为 "bottom"
- [x] 4.3 验证暗色模式下的显示效果

## 5. 测试验证

- [x] 5.1 验证鼠标 hover 显示 Tooltip
- [x] 5.2 验证键盘 Tab 聚焦显示 Tooltip
- [x] 5.3 验证长昵称截断效果
- [x] 5.4 验证昵称为空时显示模型名称
- [x] 5.5 验证异常状态 Badge 显示
- [x] 5.6 验证模型不存在时的错误提示

## 6. 单元测试

- [x] 6.1 测试正常状态渲染（Logo + 昵称）
- [x] 6.2 测试昵称为空时显示模型名称
- [x] 6.3 测试长昵称截断样式
- [x] 6.4 测试 Tooltip 内容正确性（供应商、模型、昵称）
- [x] 6.5 测试异常状态 Badge 显示（已禁用、已删除）
- [x] 6.6 测试模型不存在时的错误提示
