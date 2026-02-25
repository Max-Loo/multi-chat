# Implementation Tasks: 更新 ModelProviderKeyEnum 定义

## 1. 枚举定义修改

- [x] 1.1 备份 `src/utils/enums.ts` 文件
- [x] 1.2 修改 `ModelProviderKeyEnum` 枚举定义：
  - 删除 `KIMI = 'kimi'` 成员
  - 删除 `BIG_MODEL = 'bigmodel'` 成员
  - 添加 `MOONSHOTAI = 'moonshotai'` 成员
  - 添加 `ZHIPUAI = 'zhipuai'` 成员
  - 添加 `ZHIPUAI_CODING_PLAN = 'zhipuai-coding-plan'` 成员
  - 保持 `DEEPSEEK = 'deepseek'` 成员不变
- [x] 1.3 保存 `src/utils/enums.ts` 文件

## 2. 代码引用更新

- [x] 2.1 搜索所有使用 `ModelProviderKeyEnum.KIMI` 的代码
- [x] 2.2 将 `ModelProviderKeyEnum.KIMI` 替换为 `ModelProviderKeyEnum.MOONSHOTAI`
- [x] 2.3 搜索所有使用 `ModelProviderKeyEnum.BIG_MODEL` 的代码
- [x] 2.4 将 `ModelProviderKeyEnum.BIG_MODEL` 替换为 `ModelProviderKeyEnum.ZHIPUAI`
- [x] 2.5 搜索硬编码字符串 `'kimi'` 和 `"kimi"`，评估是否需要替换为枚举值
- [x] 2.6 搜索硬编码字符串 `'bigmodel'` 和 `"bigmodel"`，评估是否需要替换为枚举值

## 3. 验证和测试

- [x] 3.1 运行 TypeScript 类型检查：`pnpm tsc`
- [x] 3.2 修复类型检查报告的所有错误（如有）
- [x] 3.3 确认类型检查通过，无错误输出
- [x] 3.4 搜索遗留的旧枚举值引用：`rg "ModelProviderKeyEnum\.(KIMI|BIG_MODEL)" --type ts`
- [x] 3.5 搜索遗留的旧字符串字面量：`rg "['\"]kimi['\"]|['\"]bigmodel['\"]" --type ts`
- [x] 3.6 如有遗留引用，返回步骤 2 继续修复

## 4. 运行时验证（可选但推荐）

- [ ] 4.1 启动开发服务器：`pnpm tauri dev`
- [ ] 4.2 检查应用是否正常启动
- [ ] 4.3 检查模型供应商数据是否正确加载（Redux DevTools）
- [ ] 4.4 验证 `RemoteProviderData[].providerKey` 字段值是否正确
- [ ] 4.5 测试模型配置和选择功能是否正常工作

## 5. 数据迁移检查（如需要）

- [x] 5.1 检查 `src/store/storage/modelStorage.ts` 中的数据持久化逻辑
- [x] 5.2 检查本地存储文件（如 `models.json`）中是否存在旧的 `providerKey` 值
- [x] 5.3 如发现旧值，评估是否需要添加数据迁移逻辑
- [x] 5.4 如需迁移，实现数据迁移函数并测试

## 6. 代码质量检查

- [x] 6.1 运行 ESLint 检查：`pnpm lint`
- [x] 6.2 修复 ESLint 报告的所有问题（如有）
- [x] 6.3 检查修改的代码是否符合项目代码规范
- [x] 6.4 确认所有导入路径使用 `@/` 别名（如 `@/utils/enums`）

## 7. 文档更新（如需要）

- [x] 7.1 检查 AGENTS.md 中是否有关于 `ModelProviderKeyEnum` 的文档
- [x] 7.2 检查 README.md 中是否有相关说明需要更新
- [x] 7.3 更新相关文档（如有）
- [x] 7.4 确认文档与代码实现一致
