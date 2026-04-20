## 1. i18n mock 工厂优化

- [x] 1.1 更新 `helpers/mocks/i18n.ts` 的 JSDoc 示例模板，确保模板代码不超过 10 行有效代码，包含 `vi.hoisted` 内联工厂定义和 `vi.mock` 调用的完整示例
- [x] 1.2 验证更新后的模板在至少 2 个不同测试文件中可用（覆盖纯字符串键和选择器函数两种场景）

## 2. react-i18next mock 迁移（批量替换）

- [x] 2.1 迁移 `pages/` 目录下的测试文件（ChatContent、ChatSidebar、SettingPage、GeneralSetting 等）
- [x] 2.2 迁移 `components/` 目录下的测试文件（Sidebar、BottomNav、ChatPanel、ModelSelect 等）
- [x] 2.3 迁移 `hooks/`、`integration/`、`performance/` 等其他目录下的测试文件
- [x] 2.4 删除迁移后残留的冗余代码和未使用的导入
- [x] 2.5 运行全量测试确认所有迁移后的测试通过

## 3. `as unknown as` 统一迁移

- [x] 3.1 将 `services/modelRemoteService.test.ts` 中的 10 处 `as unknown as` 替换为 `asTestType<T>()`
- [x] 3.2 将 `services/chat/streamProcessor.integration.test.ts` 中的 3 处替换为 `asTestType<T>()`
- [x] 3.3 将其余 8 个文件中的 9 处替换为 `asTestType<T>()`
- [x] 3.4 运行全量测试确认所有替换后的测试通过

## 4. 验证与清理

- [x] 4.1 确认 `as unknown as` 在测试代码中数量为 0（排除 `helpers/testing-utils.tsx` 自身的定义和 `helpers/mocks/i18n.ts` 中的参考实现）
- [x] 4.2 确认所有测试文件的 react-i18next mock 块不超过 10 行有效代码
- [x] 4.3 运行全量测试套件，确认 143 个测试套件全部通过
