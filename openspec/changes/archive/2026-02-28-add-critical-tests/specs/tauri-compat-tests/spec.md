# Spec: Tauri 兼容层测试能力

## ADDED Requirements

### Requirement: HTTP 兼容层测试覆盖
系统 MUST 为 HTTP 兼容层（`src/utils/tauriCompat/http.ts`）提供完整的测试覆盖，包括环境检测、fetch 函数和 getFetchFunc 的所有场景。

#### Scenario: 开发环境使用 Web fetch
- **WHEN** 运行环境为开发模式（`import.meta.env.DEV === true`）
- **THEN** 系统 MUST 使用原生 Web fetch API
- **AND** 系统 MUST NOT 尝试导入 Tauri fetch

#### Scenario: 生产 Tauri 环境使用 Tauri fetch
- **WHEN** 运行环境为生产模式且 `window.__TAURI__` 存在
- **THEN** 系统 MUST 动态导入 `@tauri-apps/plugin-http` 的 fetch
- **AND** 系统 MUST 使用导入的 Tauri fetch

#### Scenario: 生产 Web 环境使用 Web fetch
- **WHEN** 运行环境为生产模式且 `window.__TAURI__` 不存在
- **THEN** 系统 MUST 使用原生 Web fetch API

#### Scenario: Tauri fetch 导入失败时降级
- **WHEN** 动态导入 `@tauri-apps/plugin-http` 失败
- **THEN** 系统 MUST 降级到原生 Web fetch API
- **AND** 系统 MUST 在控制台输出警告日志

#### Scenario: GET 请求成功
- **WHEN** 调用 `fetch(url)` 发送 GET 请求
- **THEN** 系统 MUST 返回 Response 对象
- **AND** Response.status MUST 为 HTTP 状态码
- **AND** Response.json() MUST 解析 JSON 响应体

#### Scenario: POST 请求成功
- **WHEN** 调用 `fetch(url, { method: 'POST', body })` 发送 POST 请求
- **THEN** 系统 MUST 正确序列化请求体
- **AND** 系统 MUST 返回 Response 对象

#### Scenario: 请求头设置正确
- **WHEN** 调用 `fetch(url, { headers })` 设置请求头
- **THEN** 系统 MUST 正确传递请求头到目标服务器

#### Scenario: getFetchFunc 返回正确实例
- **WHEN** 调用 `getFetchFunc()`
- **THEN** 系统 MUST 返回已初始化的 fetch 函数实例
- **AND** 返回的函数 MUST 可用于第三方库注入

---

### Requirement: OS 兼容层测试覆盖
系统 MUST 为 OS 兼容层（`src/utils/tauriCompat/os.ts`）提供完整的测试覆盖，包括 locale() 函数的所有场景。

#### Scenario: Tauri 环境返回操作系统语言
- **WHEN** 运行环境为 Tauri 桌面环境
- **THEN** 系统 MUST 调用 `@tauri-apps/plugin-os` 的 locale() API
- **AND** 系统 MUST 返回操作系统语言（如 "zh-CN"、"en-US"）

#### Scenario: Tauri API 返回 null 时降级
- **WHEN** Tauri locale() API 返回 null 或空字符串
- **THEN** 系统 MUST 降级使用 `navigator.language`
- **AND** 系统 MUST 返回浏览器首选语言

#### Scenario: Web 环境返回浏览器语言
- **WHEN** 运行环境为 Web 浏览器环境
- **THEN** 系统 MUST 返回 `navigator.language`
- **AND** 系统 MUST 返回值格式为 BCP 47 语言标签（如 "ja-JP"）

#### Scenario: 返回格式符合 BCP 47 标准
- **WHEN** 调用 `locale()` 函数
- **THEN** 返回值 MUST 匹配 BCP 47 语言标签格式（`[a-z]{2}-[A-Z]{2}`）

---

### Requirement: Shell 兼容层测试覆盖
系统 MUST 为 Shell 兼容层（`src/utils/tauriCompat/shell.ts`）提供完整的测试覆盖，包括 Command.create()、shell.open() 和 isSupported() 的所有场景。

#### Scenario: Tauri 环境创建 TauriShellCommand
- **WHEN** 运行环境为 Tauri 桌面环境
- **THEN** Command.create() MUST 返回 TauriShellCommand 实例
- **AND** isSupported() MUST 返回 true

#### Scenario: Web 环境创建 WebShellCommand
- **WHEN** 运行环境为 Web 浏览器环境
- **THEN** Command.create() MUST 返回 WebShellCommand 实例
- **AND** isSupported() MUST 返回 false

#### Scenario: TauriShellCommand 执行命令成功
- **WHEN** 在 Tauri 环境调用 TauriShellCommand.execute()
- **THEN** 系统 MUST 调用 `@tauri-apps/plugin-shell` 的 execute()
- **AND** 系统 MUST 返回 ChildProcess 对象（包含 code、stdout、stderr）

#### Scenario: TauriShellCommand 执行命令失败
- **WHEN** Tauri Shell 命令执行失败（如命令不存在）
- **THEN** 系统 MUST 返回非零退出码
- **AND** stderr MUST 包含错误信息

#### Scenario: WebShellCommand 返回模拟成功状态
- **WHEN** 在 Web 环境调用 WebShellCommand.execute()
- **THEN** 系统 MUST 返回模拟的成功状态（code: 0, stdout: '', stderr: ''）
- **AND** 系统 MUST NOT 执行实际命令

#### Scenario: Tauri 环境 shell.open 打开 URL
- **WHEN** 在 Tauri 环境调用 `shell.open(url)`
- **THEN** 系统 MUST 调用 `@tauri-apps/plugin-shell` 的 open() API
- **AND** 系统 MUST 使用系统默认应用打开 URL

#### Scenario: Web 环境 shell.open 打开 URL
- **WHEN** 在 Web 环境调用 `shell.open(url)`
- **THEN** 系统 MUST 调用 `window.open(url, '_blank', 'noopener,noreferrer')`
- **AND** 系统 MUST 在新标签页打开 URL

#### Scenario: Web 环境 shell.open 无法打开本地文件
- **WHEN** 在 Web 环境调用 `shell.open(filePath)`（本地文件路径）
- **THEN** 系统 MUST 尝试调用 window.open()
- **AND** 系统 MAY 无法打开（浏览器安全限制）

---

### Requirement: 测试覆盖率和质量标准
系统 MUST 确保所有 Tauri 兼容层测试达到以下质量和覆盖率标准。

#### Scenario: 语句覆盖率达标
- **WHEN** 运行 `pnpm test:coverage`
- **THEN** 每个 Tauri 兼容层模块的语句覆盖率 MUST ≥ 85%

#### Scenario: 分支覆盖率达标
- **WHEN** 运行 `pnpm test:coverage`
- **THEN** 每个 Tauri 兼容层模块的分支覆盖率 MUST ≥ 80%

#### Scenario: 函数覆盖率达标
- **WHEN** 运行 `pnpm test:coverage`
- **THEN** 每个 Tauri 兼容层模块的函数覆盖率 MUST ≥ 90%

#### Scenario: 测试通过率 100%
- **WHEN** 运行 `pnpm test:run`
- **THEN** 所有 Tauri 兼容层测试 MUST 通过
- **AND** 失败测试数 MUST 为 0

#### Scenario: 测试代码质量
- **WHEN** 审查 Tauri 兼容层测试代码
- **THEN** 测试 MUST 使用清晰的三层结构（模块 → 功能 → 场景）
- **AND** 测试 MUST 包含适当的中文注释
- **AND** 测试 MUST 使用合理的 Mock 策略

#### Scenario: 测试辅助工具复用
- **WHEN** 编写多个 Tauri 兼容层测试
- **THEN** 系统 MUST 复用测试辅助工具函数（如 mockTauriEnvironment）
- **AND** 系统 MUST 避免重复代码

---

### Requirement: Mock 策略和测试隔离
系统 MUST 使用一致的 Mock 策略，确保测试隔离和可重复性。

#### Scenario: Mock Tauri 全局对象
- **WHEN** 测试需要 Tauri 环境
- **THEN** 系统 MUST 使用 `vi.stubGlobal('window', { __TAURI__: {} })`
- **AND** 测试完成后 MUST 调用 `vi.unstubAllGlobals()` 清理

#### Scenario: Mock Tauri 插件 API
- **WHEN** 测试需要 Mock Tauri 插件 API（如 `@tauri-apps/plugin-http`）
- **THEN** 系统 MUST 使用 `vi.mock('@tauri-apps/plugin-http', ...)`
- **AND** Mock 实现 MUST 返回与真实 API 兼容的数据结构

#### Scenario: Mock 浏览器 API
- **WHEN** 测试需要 Mock 浏览器 API（如 `navigator.language`）
- **THEN** 系统 MUST 使用 `vi.stubGlobal('navigator', { language: 'zh-CN' })`
- **AND** 测试完成后 MUST 恢复原始 API

#### Scenario: 测试隔离
- **WHEN** 运行多个测试用例
- **THEN** 每个测试 MUST 有独立的 Mock 状态
- **AND** 测试之间 MUST 不相互影响

---

### Requirement: 错误处理和边缘情况测试
系统 MUST 测试所有错误处理路径和边缘情况。

#### Scenario: 网络错误处理
- **WHEN** fetch() 遇到网络错误（如 DNS 失败、连接超时）
- **THEN** 系统 MUST 抛出错误或返回失败的 Response
- **AND** 测试 MUST 验证错误处理逻辑

#### Scenario: HTTP 错误状态码处理
- **WHEN** fetch() 返回 4xx 或 5xx 状态码
- **THEN** 系统 MUST 正确处理错误响应
- **AND** 测试 MUST 验证 Response.ok 为 false

#### Scenario: Tauri API 调用失败
- **WHEN** Tauri 插件 API 抛出异常
- **THEN** 系统 MUST 正确处理异常
- **AND** 测试 MUST 验证异常处理逻辑（如降级到 Web API）

#### Scenario: 无效输入处理
- **WHEN** 调用函数时传入无效参数（如 null、undefined、空字符串）
- **THEN** 系统 MUST 正确处理或抛出明确的错误
- **AND** 测试 MUST 验证错误消息清晰

---

### Requirement: 测试文档和维护性
系统 MUST 提供清晰的测试文档，确保未来维护的可行性。

#### Scenario: 测试文件头部注释
- **WHEN** 创建新的测试文件
- **THEN** 文件头部 MUST 包含模块描述
- **AND** 文件头部 MUST 包含测试覆盖范围说明

#### Scenario: 测试用例命名规范
- **WHEN** 编写测试用例
- **THEN** 测试名称 MUST 使用中文描述预期行为
- **AND** 测试名称 MUST 遵循"应该 [行为] 当 [条件]"格式

#### Scenario: 测试辅助工具文档
- **WHEN** 创建测试辅助工具函数
- **THEN** 函数 MUST 包含 JSDoc 注释
- **AND** 注释 MUST 说明用途、参数和返回值

#### Scenario: Mock 策略文档
- **WHEN** 使用复杂的 Mock 策略
- **THEN** 测试代码 MUST 包含注释说明 Mock 的原因
- **AND** 注释 MUST 说明 Mock 的行为与真实 API 的差异
