# Capability: i18n-completeness-check

## Purpose

验证所有支持语言的翻译文件具有相同的键值结构，确保不存在遗漏的翻译。提供自动化检查工具，防止新的翻译遗漏进入代码库。

## Requirements

### Requirement: 翻译键值完整性验证
系统必须能够验证所有支持语言的翻译文件具有相同的键值结构，确保不存在遗漏的翻译。

#### Scenario: 验证法语翻译完整性
- **WHEN** 系统检查 `src/locales/fr/setting.json` 文件
- **THEN** 系统必须检测到缺失的键值：`autoNaming.title`、`autoNaming.description`、`languageSwitchFailed`

#### Scenario: 验证所有语言文件键值一致性
- **WHEN** 系统比较所有语言的翻译文件
- **THEN** 系统必须报告每种语言相对于基准语言（英文）缺失的键值数量和具体键名

### Requirement: 翻译差异报告
系统必须生成清晰的翻译差异报告，标识所有缺失的翻译键值及其位置。

#### Scenario: 生成缺失翻译报告
- **WHEN** 执行翻译完整性检查
- **THEN** 系统必须输出包含以下信息的报告：
  - 文件路径
  - 缺失的键名
  - 缺失键值的数量
  - 受影响的语言

### Requirement: 缺失翻译补充
系统必须能够自动补充或提示补充缺失的翻译键值。

#### Scenario: 补充法语缺失翻译
- **WHEN** 检测到 `src/locales/fr/setting.json` 缺失键值
- **THEN** 系统必须添加以下翻译：
  - `autoNaming.title`: "Attribution automatique d'un nom"
  - `autoNaming.description`: "Générer automatiquement des titres pour les chats, activé par défaut"
  - `languageSwitchFailed`: "Échec du changement de langue"

### Requirement: 翻译文件结构验证
系统必须验证翻译文件的结构有效性，包括 JSON 格式正确性和必需的顶层键。

#### Scenario: 验证 JSON 格式
- **WHEN** 读取翻译文件
- **THEN** 系统必须确保文件是有效的 JSON 格式

#### Scenario: 验证文件覆盖范围
- **WHEN** 检查翻译目录
- **THEN** 系统必须验证所有语言具有相同的文件集合（common.json, chat.json, navigation.json 等）

### Requirement: 持续集成检查
系统必须在代码提交前自动执行翻译完整性检查，防止新的翻译遗漏进入代码库。

#### Scenario: Git Hook 检查
- **WHEN** 开发者尝试提交包含翻译文件更改的代码
- **THEN** 系统必须自动运行翻译完整性检查
- **AND** 如果发现缺失的翻译，必须阻止提交并显示错误信息

#### Scenario: CI/CD Pipeline 检查
- **WHEN** 代码在持续集成环境中构建
- **THEN** 系统必须执行翻译完整性检查作为构建过程的一部分
- **AND** 如果检查失败，必须标记构建为失败
