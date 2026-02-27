## ADDED Requirements

### Requirement: Vendor chunk 体积限制

生产构建的每个 vendor chunk 文件体积不得超过 500 KB。

**理由**：大型 chunk 文件会导致首屏加载时间过长，影响用户体验。将大型依赖分离到独立的 vendor chunk 可以：
- 减少主 chunk 体积，提升首屏加载速度
- 利用浏览器缓存策略，vendor chunk 更新频率低，可被长期缓存
- 优化整体网络传输性能

#### Scenario: 验证 vendor chunk 大小

- **WHEN** 执行 `pnpm build` 命令完成生产构建
- **THEN** 每个 vendor chunk 文件体积应小于或等于 500 KB
- **AND** 主 chunk（`index-*.js`）文件体积应小于或等于 500 KB

#### Scenario: 验证依赖分离到独立 chunk

- **WHEN** 执行 `pnpm build` 命令完成生产构建
- **THEN** 以下依赖应被分离到独立的 vendor chunk：
  - `vendor-react.js`: 包含 `react` 和 `react-dom`
  - `vendor-redux.js`: 包含 `@reduxjs/toolkit` 和 `react-redux`
  - `vendor-zod.js`: 包含 `zod`
  - `vendor-antd-x.js`: 包含 `@ant-design/x`
  - `vendor-ai.js`: 包含 `ai`、`@ai-sdk/deepseek`、`@ai-sdk/moonshotai`
  - `vendor-icons.js`: 包含 `lucide-react`
  - `vendor-radix.js`: 包含 `@radix-ui/*`
  - `vendor.js`: 包含其他所有 `node_modules` 依赖

### Requirement: Chunk 大小警告配置

Vite 配置文件必须设置 `chunkSizeWarningLimit` 为 500 KB。

**理由**：在开发阶段尽早发现超过推荐体积限制的 chunk，避免生产环境出现性能问题。

#### Scenario: 验证 Vite 配置

- **WHEN** 查看 `vite.config.ts` 文件
- **THEN** 应包含 `build.chunkSizeWarningLimit: 500` 配置

### Requirement: 应用功能完整性

代码分割不得影响应用的任何功能。

**理由**：代码分割是一个纯粹的构建优化，不应改变应用的行为或功能。

#### Scenario: 验证应用启动

- **WHEN** 启动生产构建的应用
- **THEN** 应用应正常启动，无控制台错误
- **AND** 所有 UI 组件应正常渲染

#### Scenario: 验证路由导航

- **WHEN** 用户在应用中导航到不同页面
- **THEN** 所有路由应正常工作，无模块加载错误

#### Scenario: 验证 AI 聊天功能

- **WHEN** 用户发送聊天消息
- **THEN** AI 应正常响应，无 SDK 加载错误

#### Scenario: 验证状态管理

- **WHEN** 用户修改应用设置（如语言、主题）
- **THEN** 状态应正确保存和恢复，无 Redux 相关错误
