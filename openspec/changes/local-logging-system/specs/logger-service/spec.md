# logger-service 规格说明

日志服务的核心能力，包括日志写入、存储、轮转和脱敏。

## ADDED Requirements

### Requirement: 日志级别支持

系统 SHALL 支持 DEBUG、INFO、WARN、ERROR 四个日志级别。

#### Scenario: 记录不同级别的日志
- **WHEN** 调用 logger.debug()、logger.info()、logger.warn()、logger.error()
- **THEN** 日志条目包含对应的级别标识

#### Scenario: 生产环境过滤 DEBUG 级别
- **WHEN** 应用运行在生产模式
- **THEN** DEBUG 级别的日志 SHALL NOT 被写入文件

### Requirement: 日志格式

系统 SHALL 使用 JSON Lines 格式存储日志，每行一个 JSON 对象。

#### Scenario: 日志条目格式
- **WHEN** 写入日志
- **THEN** 每条日志 SHALL 包含以下字段：
  - timestamp: ISO 8601 格式时间戳
  - level: 日志级别
  - source: 来源（frontend/backend）
  - message: 日志消息
  - context: 上下文信息（可选）

### Requirement: 日志轮转

系统 SHALL 按天轮转日志文件，保留最近 30 天的日志。

#### Scenario: 按天创建新日志文件
- **WHEN** 日期变更（跨过午夜）
- **THEN** 系统 SHALL 创建新的日志文件

#### Scenario: 自动清理过期日志
- **WHEN** 日志文件超过 30 天
- **THEN** 系统 SHALL 自动删除该文件

### Requirement: 敏感信息脱敏

系统 SHALL 在写入日志前自动脱敏敏感信息。

#### Scenario: API Key 脱敏
- **WHEN** 日志上下文包含 apiKey 或 token 字段
- **THEN** 系统 SHALL 将其替换为保留前4后4的格式（如 sk-xxxx****yyyy）

#### Scenario: 聊天内容脱敏
- **WHEN** 日志上下文包含 content 或 message 字段
- **THEN** 系统 SHALL 将其替换为 [CONTENT: xxxB] 格式（无论内容长短）

#### Scenario: 嵌套对象脱敏
- **WHEN** 日志上下文包含嵌套对象或数组
- **THEN** 系统 SHALL 递归遍历并脱敏所有匹配的字段

#### Scenario: 个人信息脱敏
- **WHEN** 日志上下文包含邮箱或手机号
- **THEN** 系统 SHALL 将其分别替换为 [EMAIL] 或 [PHONE]

### Requirement: 前端日志接口

系统 SHALL 提供统一的前端 Logger 类。

#### Scenario: 创建日志实例
- **WHEN** 调用 createLogger({ context: { module: 'chat' } })
- **THEN** 返回的 logger 实例 SHALL 在所有日志中包含预设的 context

#### Scenario: 调用日志方法
- **WHEN** 调用 logger.info('message', { extra: 'data' })
- **THEN** 系统 SHALL 将日志传递给 Rust 后端写入文件

### Requirement: 全局错误捕获

系统 SHALL 自动捕获未处理的错误。

#### Scenario: 捕获未处理的异常
- **WHEN** JavaScript 抛出未捕获的异常
- **THEN** 系统 SHALL 自动记录 ERROR 级别日志

#### Scenario: 捕获未处理的 Promise 拒绝
- **WHEN** Promise 被 reject 且没有 catch 处理
- **THEN** 系统 SHALL 自动记录 ERROR 级别日志

### Requirement: 开发模式行为

系统 SHALL 在开发模式下提供额外的调试支持。

#### Scenario: 控制台输出
- **WHEN** 应用运行在开发模式
- **THEN** 日志 SHALL 同时输出到浏览器控制台

#### Scenario: 完整堆栈信息
- **WHEN** 记录 ERROR 级别日志
- **THEN** 开发模式 SHALL 包含完整的错误堆栈
