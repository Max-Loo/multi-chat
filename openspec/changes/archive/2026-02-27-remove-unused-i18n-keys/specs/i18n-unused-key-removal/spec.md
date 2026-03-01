## ADDED Requirements

### Requirement: 检测未使用的国际化翻译 key
系统应能够自动检测所有在代码中未被使用的国际化翻译 key。

#### Scenario: 成功生成未使用 key 列表
- **WHEN** 开发者运行检测工具
- **THEN** 系统扫描所有 TypeScript/TSX 文件中的 `t()` 函数调用
- **AND** 系统对比语言文件中定义的所有 key
- **AND** 系统生成未使用 key 的候选列表，按语言文件分组

#### Scenario: 排除动态使用的 key
- **WHEN** 检测工具分析 key 使用情况
- **THEN** 系统标记可能通过字符串拼接动态使用的 key
- **AND** 系统在候选列表中注明这些 key 需要人工审核

### Requirement: 移除未使用的翻译 key
系统应能够从语言文件中移除确认未使用的翻译 key。

#### Scenario: 成功移除未使用的 key
- **WHEN** 开发者确认移除未使用的 key
- **THEN** 系统从英文语言文件（`src/locales/en/*.json`）中删除对应的 key-value 对
- **AND** 系统从中文语言文件（`src/locales/zh/*.json`）中删除对应的 key-value 对
- **AND** 系统保持语言文件的 JSON 格式正确性

#### Scenario: 保持类型定义同步
- **WHEN** 系统移除未使用的 key
- **THEN** 系统同步更新 TypeScript 类型定义（`src/types/i18n.d.ts`）
- **AND** 类型检查（`pnpm tsc`）应通过，无类型错误

### Requirement: 验证翻译功能完整性
系统应在移除 key 后验证应用的翻译功能仍正常工作。

#### Scenario: 应用启动和页面显示
- **WHEN** 开发者启动应用（`pnpm tauri dev`）
- **THEN** 应用应正常启动，无翻译 key 缺失错误
- **AND** 所有页面的翻译文本应正确显示

#### Scenario: 测试套件通过
- **WHEN** 开发者运行测试套件（`pnpm test`）
- **THEN** 所有测试应通过
- **AND** 无翻译 key 相关的测试失败

### Requirement: 人工审核流程
系统应提供人工审核机制，避免误删动态使用的 key。

#### Scenario: 人工审核候选列表
- **WHEN** 检测工具生成未使用 key 的候选列表
- **THEN** 开发者应能够查看每个候选 key 的上下文信息
- **AND** 开发者应能够使用 grep 等工具搜索 key 的所有出现
- **AND** 开发者应能够决定保留或移除该 key

#### Scenario: 保留动态使用的 key
- **WHEN** 开发者识别出动态使用的 key（如字符串拼接）
- **THEN** 开发者应能够将该 key 从待移除列表中排除
- **AND** 系统应保留这些 key，不执行移除操作

### Requirement: 生成检测报告
系统应生成清晰的检测报告，记录移除操作。

#### Scenario: 生成移除报告
- **WHEN** 系统完成 key 移除操作
- **THEN** 系统应生成报告，列出被移除的 key
- **AND** 报告应包含移除前后的 key 数量对比
- **AND** 报告应按语言文件分组显示移除的 key
