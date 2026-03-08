## 1. 翻译文件准备

- [x] 1.1 创建 `src/locales/fr/` 目录
- [x] 1.2 使用 AI 工具翻译 `common.json`（25 个条目）
- [x] 1.3 使用 AI 工具翻译 `chat.json`（33 个条目）
- [x] 1.4 使用 AI 工具翻译 `navigation.json`（5 个条目）
- [x] 1.5 使用 AI 工具翻译 `setting.json`（约 20+ 个字符串）
- [x] 1.6 使用 AI 工具翻译 `model.json`（28 个条目）
- [x] 1.7 使用 AI 工具翻译 `table.json`（10 个条目）
- [x] 1.8 创建空的 `provider.json` 文件（与英文版本保持一致）
- [x] 1.9 人工审核所有翻译文件，验证术语准确性
- [x] 1.10 人工审核所有翻译文件，验证插值变量（如 `{{count}}`）是否保留
- [x] 1.11 人工审核所有翻译文件，验证 JSON 格式有效性
- [x] 1.12 验证所有翻译文件的键名与英文版本一致

## 2. 配置文件更新

- [x] 2.1 修改 `src/utils/constants.ts`：在 `SUPPORTED_LANGUAGE_LIST` 数组添加 `'fr'`
- [x] 2.2 验证 `SUPPORTED_LANGUAGE_LIST` 的值顺序（建议：`['zh', 'en', 'fr']`）

## 3. 语言选择器更新

- [x] 3.1 修改 `LanguageSetting.tsx`：在 `LANGUAGE_OPTIONS` 数组添加法语选项
- [x] 3.2 验证法语选项格式：`{ value: "fr", label: "🇫🇷 Français" }`
- [x] 3.3 确认语言选项的显示顺序（中文、English、Français）

## 4. 功能验证

- [x] 4.1 启动开发服务器（`pnpm tauri dev`）
- [x] 4.2 进入设置页面，验证语言选择器显示法语选项
- [x] 4.3 选择法语，验证 Redux store 更新为 `'fr'`
- [x] 4.4 验证界面文本立即更新为法语
- [x] 4.5 刷新页面，验证语言偏好保持在法语（localStorage 持久化）
- [x] 4.6 检查所有页面（Chat、Model、Setting）的法语显示是否正常
- [x] 4.7 测试系统语言检测：将系统语言设置为法语，清空 localStorage，重启应用
- [x] 4.8 验证应用启动时自动选择法语

## 5. 翻译质量检查

- [ ] 5.1 逐页检查法语翻译的准确性和自然度
- [ ] 5.2 检查是否有文本过长导致布局溢出的问题
- [ ] 5.3 验证所有插值变量正确显示（如计数、动态文本）
- [ ] 5.4 检查控制台是否有 JSON 解析错误或缺失键的警告
- [ ] 5.5 验证常用 UI 术语的翻译是否符合法语习惯（如 "Annuler"、"Confirmer"）

## 6. 代码质量保证

- [ ] 6.1 创建翻译文件验证脚本（可选但推荐）
  - 验证法语文件与英文文件的键名一致性
  - 验证插值变量完整性
  - 验证 JSON 格式有效性
- [x] 6.2 运行 `pnpm lint`，确保代码符合 ESLint 规范
- [x] 6.3 运行 `pnpm tsc`，确保 TypeScript 类型检查通过
- [x] 6.4 确认所有翻译文件保存为 UTF-8 编码（无 BOM）
- [x] 6.5 如有测试，运行相关测试确保未破坏现有功能

## 7. 文档

- [ ] 7.1 更新 README 或 CHANGELOG（如果需要）
- [x] 7.3 编写清晰的 commit message，说明添加了法语国际化支持
