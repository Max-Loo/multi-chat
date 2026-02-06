# Tasks: 密码输入组件实施清单

## 1. 国际化配置

- [x] 1.1 在 `src/locales/zh/common.json` 中添加 `show` 和 `hide` 翻译键
- [x] 1.2 在 `src/locales/en/common.json` 中添加 `show` 和 `hide` 翻译键
- [x] 1.3 重新生成 i18n 类型定义（运行 `pnpm generate-i18n-types`）

## 2. PasswordInput 组件开发

- [x] 2.1 创建 `src/components/ui/password-input.tsx` 文件
- [x] 2.2 实现组件基础结构（React.forwardRef + TypeScript 类型定义）
- [x] 2.3 实现本地状态管理（useState 管理显示/隐藏状态）
- [x] 2.4 实现相对定位容器和绝对定位按钮布局
- [x] 2.5 集成 Eye 和 EyeOff 图标（从 lucide-react 导入）
- [x] 2.6 实现输入框 type 属性动态切换（text ↔ password）
- [x] 2.7 添加国际化支持（useTranslation hook + aria-label）
- [x] 2.8 实现样式类（继承 Input 组件样式 + pr-10 + 按钮定位）
- [x] 2.9 添加交互状态样式（hover、focus、disabled）
- [x] 2.10 添加中文注释到所有函数和逻辑块

## 3. ModelConfigForm 集成

- [x] 3.1 在 `ModelConfigForm.tsx` 中导入 PasswordInput 组件
- [x] 3.2 替换 apiKey 字段的 Input组件为 PasswordInput
- [x] 3.3 移除 apiKey 输入框的 `type="password"` 属性（PasswordInput 内部处理）
- [x] 3.4 验证表单验证逻辑正常工作（onChange、onBlur 事件）
- [x] 3.5 验证 TanStack Form 的字段绑定和值同步

## 4. 功能测试

> **注意**：以下任务需要运行应用程序进行手动验证
> 建议使用 `pnpm tauri dev` 或 `pnpm web:dev` 启动应用后进行测试

- [ ] 4.1 测试组件初始渲染（默认隐藏状态，Eye 图标显示）
- [ ] 4.2 测试点击 Eye 图标切换到显示状态（type="text"，EyeOff 图标）
- [ ] 4.3 测试点击 EyeOff 图标切换回隐藏状态（type="password"，Eye 图标）
- [ ] 4.4 测试连续多次切换（状态正确更新，无延迟）
- [ ] 4.5 测试表单验证（空 API Key 提交时显示错误提示）
- [ ] 4.6 测试编辑模式（预填充已有 API Key，默认隐藏）
- [ ] 4.7 测试键盘导航（Tab 键聚焦，Shift+Tab 焦点到按钮）
- [ ] 4.8 测试 disabled 状态（输入框和按钮都禁用）
- [ ] 4.9 测试中文环境下的 aria-label（"显示密码"/"隐藏密码"）
- [ ] 4.10 测试英文环境下的 aria-label（"Show password"/"Hide password"）
- [ ] 4.11 测试浏览器兼容性（Chrome、Firefox、Safari、Edge）
- [ ] 4.12 测试移动端触摸交互（iOS Safari、Chrome Mobile）

## 5. 代码质量检查

- [x] 5.1 运行 lint 检查（`pnpm lint`）并修复所有警告
- [x] 5.2 运行类型检查（`pnpm tsc`）确保无类型错误
- [x] 5.3 验证组件遵循项目代码规范（@/ 别名导入、中文注释）
- [x] 5.4 确认组件与 shadcn/ui 设计系统一致（样式、交互）

## 6. 文档更新

- [x] 6.1 更新 AGENTS.md（如果有需要）
- [x] 6.2 更新 README.md（如果有需要）
- [x] 6.3 验证文档更新准确反映新功能和用法

## 7. 最终验证

> **注意**：以下任务需要运行应用程序进行手动验证
> 建议在完成功能测试后进行这些最终的端到端验证

- [ ] 7.1 完整的用户场景测试（创建新模型配置、编辑现有配置）
- [ ] 7.2 性能验证（切换密码可见性无卡顿，输入响应流畅）
- [ ] 7.3 无障碍验证（屏幕阅读器正确识别按钮功能）
- [ ] 7.4 回滚测试（验证可以安全回滚到变更前状态）
