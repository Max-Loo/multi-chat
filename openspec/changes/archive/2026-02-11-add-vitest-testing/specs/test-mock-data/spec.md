# test-mock-data Spec

## ADDED Requirements

### Requirement: 提供 Mock 数据目录
系统 SHALL 创建 `src/__mock__/` 目录，用于集中管理测试所需的 Mock 数据和模拟对象。

#### Scenario: 访问 Mock 数据
- **WHEN** 测试代码从 `@/mock/xxx` 导入数据
- **THEN** 系统正确解析为 `src/__mock__/xxx` 文件或目录

### Requirement: 支持 Mock 函数模块
系统 SHALL 支持在 `src/__mock__/` 目录中创建 Mock 函数模块，用于模拟外部依赖。

#### Scenario: 导入 Mock 函数
- **WHEN** 测试代码导入 Mock 函数模块
- **THEN** 系统返回模拟函数而非真实实现

#### Scenario: Mock 函数可配置返回值
- **WHEN** 测试代码调用 Mock 函数的 `mockReturnValue()` 方法
- **THEN** Mock 函数返回指定的值

### Requirement: 支持 Mock 数据文件
系统 SHALL 支持在 `src/__mock__/` 目录中存储 JSON、TS 等格式的 Mock 数据文件。

#### Scenario: 导入 JSON Mock 数据
- **WHEN** 测试代码导入 `@/mock/data/users.json`
- **THEN** 系统返回 JSON 对象用于测试断言

#### Scenario: 导入 TS Mock 数据
- **WHEN** 测试代码导入 `@/mock/data/testModels.ts`
- **THEN** 系统返回导出的数据对象

### Requirement: 支持 Mock 模块覆盖
系统 SHALL 支持 Vitest 的 `vi.mock()` API，允许在测试文件中临时覆盖模块实现。

#### Scenario: Mock 外部依赖模块
- **WHEN** 测试代码调用 `vi.mock('@/utils/tauriCompat')`
- **THEN** 系统使用提供的 Mock 实现替代真实模块

#### Scenario: 自动恢复 Mock
- **WHEN** 测试执行完毕
- **THEN** 系统自动清除 Mock 模块，避免影响其他测试

### Requirement: 支持 Mock 定时器
系统 SHALL 支持 Vitest 的定时器 Mock 功能，允许测试代码控制时间流逝。

#### Scenario: 使用 Mock 定时器
- **WHEN** 测试代码启用 `vi.useFakeTimers()`
- **THEN** 系统使用模拟定时器，`setTimeout` 等函数需要手动触发

#### Scenario: 快进时间
- **WHEN** 测试代码调用 `vi.advanceTimersByTime(1000)`
- **THEN** 系统触发所有在 1000ms 内的定时器回调
