## Requirements

### Requirement: 未使用代码检测
系统 SHALL 能够检测项目中的未使用代码，包括函数、类、变量、导入、类型定义等。

#### Scenario: 检测未使用的导出函数
- **WHEN** 运行代码分析工具扫描 `src/` 目录
- **THEN** 系统 SHALL 识别所有未被其他模块引用的导出函数

#### Scenario: 检测未使用的类型定义
- **WHEN** 运行代码分析工具扫描 TypeScript 文件
- **THEN** 系统 SHALL 识别所有未被使用的接口和类型别名

#### Scenario: 检测未使用的导入
- **WHEN** 分析模块依赖关系
- **THEN** 系统 SHALL 识别所有未被使用的导入语句

#### Scenario: 生成检测报告
- **WHEN** 检测完成
- **THEN** 系统 SHALL 生成包含文件路径、代码位置、代码类型的详细报告

### Requirement: 安全删除未使用代码
系统 SHALL 能够安全地删除已识别的未使用代码，并确保不影响现有功能。

#### Scenario: 删除未使用的导出
- **GIVEN** 已识别出未使用的导出函数
- **WHEN** 执行删除操作
- **THEN** 系统 SHALL 仅删除该导出及其相关定义，不影响其他代码

#### Scenario: 级联删除
- **GIVEN** 某个函数未被使用，但该函数内部调用了其他未使用的辅助函数
- **WHEN** 执行删除操作
- **THEN** 系统 SHALL 识别并删除所有级联的未使用代码

#### Scenario: 删除前验证
- **WHEN** 准备删除代码前
- **THEN** 系统 SHALL 运行测试套件确保功能完整性

### Requirement: 检测配置和工具集成
系统 SHALL 支持配置检测规则和集成到开发工作流中。

#### Scenario: 配置忽略规则
- **WHEN** 配置 `.unused-code-config.json` 文件
- **THEN** 系统 SHALL 支持忽略特定文件、目录或代码模式

#### Scenario: 命令行接口
- **WHEN** 运行 `pnpm analyze:unused` 命令
- **THEN** 系统 SHALL 执行代码分析并输出结果

#### Scenario: CI/CD 集成
- **WHEN** 在 CI 流水线中运行检测
- **THEN** 系统 SHALL 返回退出码以指示是否发现新的未使用代码
