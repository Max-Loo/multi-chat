## 1. 准备和调查

- [x] 1.1 检查 `src/types/i18n.d.ts` 的类型定义生成方式（手动还是自动）
- [x] 1.2 验证 knip 工具是否原生支持检测未使用的 i18n keys
- [x] 1.3 检查项目中是否有其他工具或脚本依赖 i18n keys（如文档生成、测试工具）
- [x] 1.4 创建独立的 git 分支用于此工作（如 `cleanup/remove-unused-i18n-keys`）

## 2. 检测未使用的 keys

- [x] 2.1 运行 knip 工具检测未使用的代码和导出
- [x] 2.2 如 knip 不支持 i18n keys 检测，编写自定义脚本扫描 `t()` 函数调用
- [x] 2.3 收集所有语言文件中定义的 key 列表（7 个英文 + 7 个中文文件）
- [x] 2.4 对比代码中使用的 key 和语言文件中定义的 key，生成候选列表
- [x] 2.5 按语言文件分组输出未使用 key 的候选报告

## 3. 人工审核

- [x] 3.1 审查 `common.json` 的候选 key，使用 grep 搜索每个 key 的所有出现
- [x] 3.2 审查 `chat.json` 的候选 key，使用 grep 搜索每个 key 的所有出现
- [x] 3.3 审查 `model.json` 的候选 key，使用 grep 搜索每个 key 的所有出现
- [x] 3.4 审查 `navigation.json` 的候选 key，使用 grep 搜索每个 key 的所有出现
- [x] 3.5 审查 `provider.json` 的候选 key，使用 grep 搜索每个 key 的所有出现
- [x] 3.6 审查 `setting.json` 的候选 key，使用 grep 搜索每个 key 的所有出现
- [x] 3.7 审查 `table.json` 的候选 key，使用 grep 搜索每个 key 的所有出现
- [x] 3.8 排除通过字符串拼接动态使用的 key
- [x] 3.9 排除可能被第三方工具使用的 key
- [x] 3.10 生成最终确认的待移除 key 列表（按语言文件分组）

## 4. 执行移除

- [x] 4.1 从 `src/locales/en/common.json` 中移除确认的 key
- [x] 4.2 从 `src/locales/zh/common.json` 中移除对应的 key
- [x] 4.3 从 `src/locales/en/chat.json` 中移除确认的 key
- [x] 4.4 从 `src/locales/zh/chat.json` 中移除对应的 key
- [x] 4.5 从 `src/locales/en/model.json` 中移除确认的 key（无需移除，所有 key 都在使用中）
- [x] 4.6 从 `src/locales/zh/model.json` 中移除对应的 key（无需移除，所有 key 都在使用中）
- [x] 4.7 从 `src/locales/en/navigation.json` 中移除确认的 key（无需移除，所有 key 都在使用中）
- [x] 4.8 从 `src/locales/zh/navigation.json` 中移除对应的 key（无需移除，所有 key 都在使用中）
- [x] 4.9 从 `src/locales/en/provider.json` 中移除确认的 key
- [x] 4.10 从 `src/locales/zh/provider.json` 中移除对应的 key
- [x] 4.11 从 `src/locales/en/setting.json` 中移除确认的 key
- [x] 4.12 从 `src/locales/zh/setting.json` 中移除对应的 key
- [x] 4.13 从 `src/locales/en/table.json` 中移除确认的 key（无需移除，所有 key 都在使用中）
- [x] 4.14 从 `src/locales/zh/table.json` 中移除对应的 key（无需移除，所有 key 都在使用中）
- [x] 4.15 更新 TypeScript 类型定义（`src/types/i18n.d.ts`）以反映移除的 key
- [x] 4.16 运行 `pnpm tsc` 验证类型检查通过

## 5. 验证和测试

- [x] 5.1 启动应用（`pnpm tauri dev`）并检查无启动错误
- [x] 5.2 检查所有页面的翻译显示正常（无 key 缺失错误）
- [x] 5.3 运行测试套件（`pnpm test`）并确保所有测试通过
- [x] 5.4 如发现被误删的 key，从 git 历史中恢复并重新验证
- [x] 5.5 生成移除报告（包含移除的 key 列表和数量对比）
- [ ] 5.6 提交变更并创建 pull request（如适用）
