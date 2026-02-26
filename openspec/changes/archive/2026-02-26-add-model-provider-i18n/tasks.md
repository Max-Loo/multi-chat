## 1. 语言文件扩展

- [x] 1.1 在 `src/locales/zh/setting.json` 中添加所有新的翻译键
- [x] 1.2 在 `src/locales/en/setting.json` 中添加对应的英文翻译
- [x] 1.3 验证两个 JSON 文件的格式正确性（无语法错误）

## 2. ProviderHeader 组件国际化

- [x] 2.1 导入并使用 `useTranslation` hook
- [x] 2.2 替换标题"模型供应商"为 `t($ => $.setting.modelProvider.title)`
- [x] 2.3 替换描述文本为 `t($ => $.setting.modelProvider.description)`
- [x] 2.4 替换刷新按钮文本为 `t($ => $.setting.modelProvider.refreshButton)` 和 `t($ => $.setting.modelProvider.refreshing)`
- [x] 2.5 替换"最后更新:"标签文本
- [x] 2.6 修改日期格式化逻辑，使用 `i18n.language` 动态设置 locale

## 3. ErrorAlert 组件国际化

- [x] 3.1 导入并使用 `useTranslation` hook
- [x] 3.2 替换"刷新失败:"前缀文本为翻译键
- [x] 3.3 确保错误消息本身使用已翻译的 error 类型文本

## 4. ProviderCardHeader 组件国际化

- [x] 4.1 导入并使用 `useTranslation` hook
- [x] 4.2 替换"可用"状态标签为翻译键
- [x] 4.3 替换"不可用"状态标签为翻译键

## 5. ProviderCardSummary 组件国际化

- [x] 5.1 导入并使用 `useTranslation` hook
- [x] 5.2 替换"共 X 个模型"文本，使用插值功能 `{{count}}`
- [x] 5.3 替换"点击查看详情"提示文本为翻译键

## 6. ModelSearch 组件国际化

- [x] 6.1 导入并使用 `useTranslation` hook
- [x] 6.2 替换搜索框占位符文本为翻译键
- [x] 6.3 替换"找到 X 个模型"结果统计，使用插值功能
- [x] 6.4 替换"共 X 个模型"总数统计，使用插值功能

## 7. ProviderMetadata 组件国际化

- [x] 7.1 导入并使用 `useTranslation` hook
- [x] 7.2 替换"API 端点:"标签文本为翻译键
- [x] 7.3 替换"供应商 ID:"标签文本为翻译键
- [x] 7.4 替换"查看文档"按钮文本为翻译键

## 8. 测试与验证

- [x] 8.1 启动应用，切换到中文，验证所有文本正确显示
- [x] 8.2 切换到英文，验证所有文本正确显示
- [x] 8.3 测试日期格式随语言切换而变化
- [x] 8.4 验证模型数量插值正确显示（1 个模型、多个模型）
- [x] 8.5 测试搜索功能，验证结果统计文本正确
- [x] 8.6 测试刷新成功/失败场景，验证 Toast 消息正确
- [x] 8.7 运行 `pnpm lint` 确保无 linting 错误
- [x] 8.8 运行 `pnpm tsc` 确保无 TypeScript 错误
- [x] 8.9 手动检查是否还有遗留的硬编码中文文本
