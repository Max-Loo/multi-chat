## MODIFIED Requirements

### Requirement: 初始化动画优先加载
系统 SHALL 将初始化动画相关代码独立打包，使其能够尽快加载和显示。

**技术要求**：
- InitializationController、initSteps 及相关 UI 组件统一打包为 `chunk-init`
- chunk-init 体积目标 ~60KB（gzip 后），上限 120KB
- chunk-init 不包含 store 等重型依赖
- 主应用代码不阻塞初始化动画的显示

#### Scenario: initSteps 与初始化 UI 统一加载
- **WHEN** App 组件挂载
- **THEN** 系统加载 `chunk-init`（包含 initSteps 和初始化 UI 组件）
- **AND** 用户在此期间仍看到 HTML Spinner
- **AND** chunk-init 加载完成后开始初始化流程

#### Scenario: 初始化动画独立加载
- **WHEN** chunk-init 加载完成
- **THEN** 系统渲染 InitializationController
- **AND** 初始化动画立即显示

#### Scenario: 主应用延迟加载
- **WHEN** 初始化动画显示中
- **THEN** 主应用代码（router 等）尚未完全加载
- **AND** 主应用在初始化完成后才开始加载

## ADDED Requirements

### Requirement: 无循环 chunk 依赖
`manualChunks` 配置 SHALL NOT 产生循环 chunk 依赖。

#### Scenario: 构建成功无循环 chunk 报错
- **WHEN** 执行 `pnpm tauri build`
- **THEN** 构建成功完成，不出现 `Circular chunk` 错误

#### Scenario: 运行时无因 chunk 循环导致的错误
- **WHEN** 应用启动并加载初始化模块
- **THEN** 不出现因 chunk 循环依赖导致的 ReferenceError

### Requirement: 无失效的 manualChunks 规则
`manualChunks` 配置 SHALL NOT 包含无法匹配当前代码库路径的规则。

#### Scenario: 无失效匹配规则
- **WHEN** 检查 `vite.config.ts` 的 `manualChunks` 配置
- **THEN** 每条路径匹配规则都能在 `src/` 目录下找到对应的文件或目录
