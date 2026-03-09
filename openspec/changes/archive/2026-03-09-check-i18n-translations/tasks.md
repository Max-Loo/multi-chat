## 1. 补充法语翻译缺失内容

- [x] 1.1 在 `src/locales/fr/setting.json` 中添加 `autoNaming.title` 翻译："Attribution automatique d'un nom"
- [x] 1.2 在 `src/locales/fr/setting.json` 中添加 `autoNaming.description` 翻译："Générer automatiquement des titres pour les chats, activé par défaut"
- [x] 1.3 在 `src/locales/fr/setting.json` 中添加 `languageSwitchFailed` 翻译："Échec du changement de langue"
- [ ] 1.4 验证法语翻译在应用中正确显示

## 2. 创建翻译完整性检查工具

- [x] 2.1 创建 `scripts/` 目录（如不存在）
- [x] 2.2 创建 `scripts/check-i18n.js` 脚本文件
- [x] 2.3 实现翻译文件读取功能（支持读取 `src/locales/` 下所有语言目录）
- [x] 2.4 实现键值比较逻辑（以英文为基准，比较其他语言）
- [x] 2.5 实现差异报告生成功能（输出缺失的键值、文件路径、受影响语言）
- [x] 2.6 实现退出码逻辑（发现缺失时返回非零退出码）
- [x] 2.7 添加命令行参数支持（如 `--verbose` 显示详细信息）

## 3. 集成到开发工作流

- [x] 3.1 在 `package.json` 中添加 `lint:i18n` script，指向 `scripts/check-i18n.js`
- [x] 3.2 在 `package.json` 中添加 `validate` script，包含 `lint:i18n` 和其他验证
- [x] 3.3 测试 `npm run lint:i18n` 命令能正确执行
- [x] 3.4 （可选）配置 Husky Git Hook，在 commit 前自动运行 `lint:i18n`
- [x] 3.5 （可选）添加 `.husky/pre-commit` 文件，执行 `npm run lint:i18n`

## 4. 测试和验证

- [x] 4.1 运行 `scripts/check-i18n.js`，验证能检测到当前缺失的翻译（在补充前）
- [x] 4.2 补充法语翻译后，再次运行检查工具，验证通过（无缺失）
- [x] 4.3 测试错误情况：故意删除一个翻译键值，验证工具能检测到
- [x] 4.4 测试输出格式：验证差异报告清晰易读
- [ ] 4.5 验证 CI/CD 集成（如已配置）：模拟 CI 环境运行检查

## 5. 文档和代码审查

- [x] 5.1 在 `scripts/check-i18n.js` 顶部添加 JSDoc 注释，说明工具用途和使用方法
- [x] 5.2 在 `scripts/README.md`（如存在）中添加 `check-i18n.js` 的说明
- [x] 5.3 更新 AGENTS.md（如有必要），添加翻译检查相关的开发规范
- [x] 5.4 代码审查：确保代码符合项目规范（ESLint 通过）
- [x] 5.5 运行 `npm run lint` 和 `npm run tsc`，确保无错误
- [ ] 5.6 邀请法语使用者审查新增的法语翻译质量（可选但推荐）

## 6. 收尾和清理

- [x] 6.1 确认所有任务已完成，运行最终验证
- [ ] 6.2 （可选）创建 GitHub Issue 记录未来的改进方向（如自动修复功能）
