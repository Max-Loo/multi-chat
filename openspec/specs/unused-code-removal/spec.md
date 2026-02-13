## Requirements

### Requirement: 代码删除自动化
系统 SHALL 提供自动化工具来删除已识别的未使用代码。

#### Scenario: 批量删除
- **GIVEN** 检测报告已确认安全删除的代码列表
- **WHEN** 执行批量删除命令
- **THEN** 系统 SHALL 自动删除所有标记的代码块

#### Scenario: 交互式删除
- **GIVEN** 检测报告
- **WHEN** 运行交互式删除工具
- **THEN** 系统 SHALL 逐个显示检测到的未使用代码并请求用户确认

#### Scenario: 删除后验证
- **WHEN** 代码删除完成后
- **THEN** 系统 SHALL 自动运行类型检查和测试套件

### Requirement: 删除前安全检查
系统 SHALL 在删除代码前执行安全检查以防止误删。

#### Scenario: 动态引用检查
- **GIVEN** 某个导出被标记为未使用
- **WHEN** 系统检测到该导出可能被动态引用（如字符串拼接导入）
- **THEN** 系统 SHALL 发出警告并要求手动确认

#### Scenario: 测试覆盖检查
- **WHEN** 准备删除代码
- **THEN** 系统 SHALL 检查是否有测试用例覆盖该代码

#### Scenario: 公共 API 保护
- **GIVEN** 某个导出是库的公共 API
- **WHEN** 检测到此导出未被内部使用
- **THEN** 系统 SHALL 将其标记为公共 API 而不是未使用代码
