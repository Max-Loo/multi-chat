# test-configuration Delta Spec

## 变更类型

修改现有 spec `test-configuration` 的并行执行策略配置。

## 新增需求

### Requirement: 并行执行使用 forks 池

系统 SHALL 使用 `pool: "forks"` 替代 `pool: "threads"` 执行测试，消除 react-redux ESM 模块初始化竞态。

#### Scenario: 单元测试使用 forks 池

- **WHEN** Vitest 使用 `vite.config.ts` 中的 test 配置
- **THEN** `pool` SHALL 为 `"forks"`
- **THEN** `poolOptions.forks.maxForks` SHALL 为 2

#### Scenario: 集成测试使用 forks 池

- **WHEN** Vitest 使用 `vitest.integration.config.ts`
- **THEN** `pool` SHALL 为 `"forks"`
- **THEN** `poolOptions.forks.maxForks` SHALL 为 1（保持串行语义）

### Requirement: 移除 threads 相关配置

系统 SHALL NOT 包含以下过时的 threads 池配置项：
- `pool: "threads"`
- `singleThread`
- `minThreads`
- `maxThreads`
- `useAtomics`

#### Scenario: 配置文件不含 threads 相关字段

- **WHEN** 检查 `vite.config.ts` 的 test 配置块
- **THEN** SHALL NOT 存在 `singleThread`、`minThreads`、`maxThreads`、`useAtomics` 字段

## 不变的需求

以下 test-configuration spec 中的需求不受影响：
- 集成 Vite 配置
- 配置测试环境（happy-dom）
- 配置测试文件匹配模式
- 配置覆盖率报告
- 配置 Mock 文件路径
- 添加测试脚本
- 全局测试辅助工具导入
- globals 配置统一
