## ADDED Requirements

### Requirement: 法语翻译文件结构
系统必须在 `src/locales/fr/` 目录下包含所有必需的法语翻译文件。

#### Scenario: 验证翻译文件存在
- **WHEN** 应用启动或国际化初始化时
- **THEN** 系统应能找到以下文件：
  - `src/locales/fr/common.json`
  - `src/locales/fr/chat.json`
  - `src/locales/fr/navigation.json`
  - `src/locales/fr/setting.json`
  - `src/locales/fr/model.json`
  - `src/locales/fr/table.json`
  - `src/locales/fr/provider.json`

### Requirement: 翻译文件格式
所有法语翻译文件必须使用有效的 JSON 格式，并且包含与英文版本相同的键结构。

#### Scenario: 验证 JSON 格式有效性
- **WHEN** 系统加载法语翻译文件时
- **THEN** 所有文件必须能够被成功解析为 JSON 对象
- **AND** 不得存在 JSON 语法错误

#### Scenario: 验证键名一致性
- **WHEN** 比较法语和英文翻译文件时
- **THEN** 法语文件必须包含英文文件中的所有顶层键
- **AND** 嵌套对象的键结构必须与英文版本保持一致

### Requirement: 翻译完整性
所有在英文翻译文件中定义的键，都必须在法语翻译文件中有对应的翻译值。

#### Scenario: 验证所有键已翻译
- **WHEN** 遍历所有翻译键时
- **THEN** 每个英文翻译键都必须在法语文件中有对应值
- **AND** 翻译值不得为空字符串或 null
- **AND** 翻译值应该是有效的法语文本

#### Scenario: 验证插值变量
- **WHEN** 翻译文本包含插值变量（如 `{{count}}`）时
- **THEN** 法语翻译必须保留相同的插值变量
- **AND** 变量名称和格式必须与英文版本一致

### Requirement: 语言配置
系统配置必须将法语 (`'fr'`) 列为支持的语言之一。

#### Scenario: 验证语言列表配置
- **WHEN** 检查 `SUPPORTED_LANGUAGE_LIST` 常量时
- **THEN** 数组必须包含值 `'fr'`
- **AND** 数组应至少包含 `'zh'`、`'en'` 和 `'fr'` 三个元素

### Requirement: 语言选择器UI
语言选择器组件必须提供法语选项，并正确显示法语语言标签。

#### Scenario: 验证语言选项存在
- **WHEN** 用户打开语言选择下拉菜单时
- **THEN** 菜单必须包含法语选项
- **AND** 法语选项的值必须为 `"fr"`
- **AND** 法语选项的标签应显示为 `"🇫🇷 Français"` 或等效格式

#### Scenario: 验证语言选项顺序
- **WHEN** 显示语言选择列表时
- **THEN** 法语选项应显示在合理的位置（如按字母顺序或按语言代码顺序）

### Requirement: 语言切换功能
用户必须能够通过语言选择器将应用语言切换为法语，并且界面应立即更新为法语。

#### Scenario: 用户选择法语
- **WHEN** 用户从语言选择器中选择法语
- **THEN** 系统必须更新 Redux store 中的语言状态为 `'fr'`
- **AND** 系统必须调用 i18next 的 `changeLanguage('fr')` 方法
- **AND** 系统必须将语言偏好保存到 localStorage
- **AND** 界面上的所有文本必须立即更新为法语显示

#### Scenario: 法语作为系统语言
- **WHEN** 用户的操作系统语言设置为法语（如 `'fr-FR'` 或 `'fr'`）
- **AND** 用户首次启动应用（localStorage 中无语言偏好）
- **THEN** 系统必须自动检测并选择法语作为应用语言
- **AND** 应用界面应显示为法语

### Requirement: 翻译资源加载
系统必须能够成功加载和注册法语翻译资源到 i18next。

#### Scenario: 验证资源加载
- **WHEN** i18next 初始化时
- **THEN** `getLocalesResources()` 函数必须成功加载所有法语 JSON 文件
- **AND** 法语资源必须被注册到 i18next 的 `resources.fr.translation` 对象中
- **AND** 每个翻译文件的内容必须被正确合并（如 `common.json` → `resources.fr.translation.common`）

#### Scenario: 验证资源结构
- **WHEN** 检查 i18next 的资源对象时
- **THEN** `resources.fr.translation` 必须包含以下命名空间：
  - `common`
  - `chat`
  - `navigation`
  - `setting`
  - `model`
  - `table`
  - `provider`

### Requirement: 法语文本质量
法语翻译应当准确、自然，符合法语语言习惯和 UI/UX 最佳实践。

#### Scenario: 验证常用术语翻译
- **WHEN** 翻译常见 UI 术语时
- **THEN** 应使用标准的法语 UI 术语：
  - "Submit" → "Valider"（表单提交）或 "Enregistrer"（保存）
  - "Cancel" → "Annuler"
  - "Confirm" → "Confirmer"
  - "Settings" → "Paramètres"
  - "Language" → "Langue"
  - "Delete" → "Supprimer"

#### Scenario: 验证变量插值语法
- **WHEN** 翻译包含变量的文本时
- **THEN** 法语翻译应正确处理语法变化（如性数配合）
- **AND** 变量插值位置应符合法语语法规则
- **EXAMPLE**: "Found {{count}} models" → "{{count}} modèles trouvés" (注意性数配合)
