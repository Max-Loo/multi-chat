## ADDED Requirements

### Requirement: 变异测试 SHALL 验证 WebShellCommand.execute 返回值结构
测试套件 SHALL 杀死 `{ code: 0, signal: null, stdout: '', stderr: '' }` 的对象字面量变异体。

#### Scenario: execute 返回正确的模拟结果
- **WHEN** 调用 WebShellCommand.execute()
- **THEN** SHALL 返回 { code: 0, signal: null, stdout: '', stderr: '' }（精确值匹配）

### Requirement: 变异测试 SHALL 验证 WebShellCommand.isSupported 返回 false
测试套件 SHALL 杀死 `return false` 的布尔变异体。

#### Scenario: Web 环境命令不支持
- **WHEN** 调用 WebShellCommand.isSupported()
- **THEN** SHALL 返回 false

### Requirement: 变异测试 SHALL 验证 WebShell.open 调用 window.open
测试套件 SHALL 杀死 `window.open(path, ...)` 的函数调用变异体。注意：Stryker 配置 `excludedMutations: ["StringLiteral"]` 排除了字符串参数变异，因此不要求杀死 `'_blank'` → `'_self'` 等字符串字面量变异体。

#### Scenario: open 调用 window.open
- **WHEN** 调用 shell.open('https://example.com')
- **THEN** SHALL 调用 window.open 且第一个参数为 'https://example.com'

### Requirement: 变异测试 SHALL 验证 WebShell.isSupported 返回 true
测试套件 SHALL 杀死 `return true` 的布尔变异体。

#### Scenario: Web 环境 shell 支持 open
- **WHEN** 调用 WebShell.isSupported()
- **THEN** SHALL 返回 true

### Requirement: 变异测试 SHALL 验证 Command.create 环境分发
测试套件 SHALL 杀死 `isTauri() ? TauriShellCommand : WebShellCommand` 的条件变异体。

#### Scenario: Web 环境创建 WebShellCommand
- **WHEN** 在 Web 环境调用 Command.create('ls')
- **THEN** SHALL 返回 isSupported()=false 且 execute() 返回模拟结果的实例

### Requirement: 变异测试 SHALL 验证 shell 实例环境分发
测试套件 SHALL 杀死 `isTauri() ? TauriShell : WebShell` 的条件变异体。

#### Scenario: Web 环境 shell 实例 isSupported 返回 true
- **WHEN** 在 Web 环境访问 shell.isSupported()
- **THEN** SHALL 返回 true
