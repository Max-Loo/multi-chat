## ADDED Requirements

### Requirement: 英文版 README 作为默认展示
系统 SHALL 将英文版 README 作为 `README.md` 文件存储在仓库根目录，作为 GitHub 仓库首页默认展示内容。

#### Scenario: 访问仓库首页看到英文版
- **WHEN** 用户访问 GitHub 仓库首页
- **THEN** GitHub 自动渲染 `README.md`，展示英文内容

### Requirement: 中文版 README 作为独立文件
系统 SHALL 将中文版 README 存储为 `README.zh-CN.md`，内容与原中文 README 完全一致（除顶部语言切换链接外）。

#### Scenario: 中文版内容完整保留
- **WHEN** 用户打开 `README.zh-CN.md`
- **THEN** 内容与原中文 README 完全一致，仅顶部增加了 `[English](./README.md) | **中文**` 语言切换行

### Requirement: 双向语言切换链接
两个版本 SHALL 在文件顶部第一行提供语言切换链接，格式为当前语言高亮、另一语言可点击跳转。

#### Scenario: 英文版切换到中文版
- **WHEN** 用户在 `README.md`（英文版）顶部点击「中文」链接
- **THEN** 页面跳转到 `README.zh-CN.md`

#### Scenario: 中文版切换到英文版
- **WHEN** 用户在 `README.zh-CN.md`（中文版）顶部点击「English」链接
- **THEN** 页面跳转到 `README.md`

### Requirement: AGENTS.md 双语同步硬约束
AGENTS.md 的文档同步要求 SHALL 包含 README 双语同步的硬约束规则：修改任一版本时必须同步翻译另一版本，且两个版本的章节结构必须保持一致。

#### Scenario: 修改英文版时触发同步
- **WHEN** 修改了 `README.md`（英文版）的内容
- **THEN** 必须同步翻译到 `README.zh-CN.md`，确保章节结构一致

#### Scenario: 修改中文版时触发同步
- **WHEN** 修改了 `README.zh-CN.md`（中文版）的内容
- **THEN** 必须同步翻译到 `README.md`，确保章节结构一致

#### Scenario: 新增章节时同步添加
- **WHEN** 在任一版本中新增章节
- **THEN** 另一版本必须同步添加对应翻译的章节
