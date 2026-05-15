## ADDED Requirements

### Requirement: 安装 Stryker 突变测试依赖

系统 SHALL 安装以下 npm 包为开发依赖：
- `@stryker-mutator/core`
- `@stryker-mutator/vitest-runner`

#### Scenario: 依赖安装后可执行 stryker 命令
- **WHEN** 运行 `npx stryker --version`
- **THEN** SHALL 成功输出版本号，不报错

### Requirement: 创建 Stryker 配置文件

系统 SHALL 在项目根目录创建 `stryker.config.json`，配置以下内容：
- testRunner 设为 `vitest`
- vitest.configFile 指向 `vite.config.ts`
- vitest.related 设为 `true`
- mutate 指定试点文件范围
- reporters 包含 `html`、`clear-text`、`progress`
- concurrency 设为 2
- mutator 排除 `StringLiteral` 变异

#### Scenario: 配置文件被 Stryker 正确加载
- **WHEN** 运行 `npx stryker run`
- **THEN** SHALL 成功启动突变测试，不报配置错误

### Requirement: 添加突变测试 npm 脚本

系统 SHALL 在 `package.json` 中添加以下脚本：
- `test:mutation`：运行完整试点突变测试
- `test:mutation:core`：仅运行核心模块的突变测试

#### Scenario: npm 脚本可正常执行
- **WHEN** 运行 `pnpm test:mutation`
- **THEN** SHALL 执行 Stryker 突变测试并输出报告

### Requirement: 试点文件突变测试通过

系统 SHALL 对以下文件成功运行突变测试：
- `src/services/chat/index.ts`
- `src/services/chat/providerLoader.ts`
- `src/store/slices/chatSlices.ts`
- `src/utils/crypto.ts`

#### Scenario: 试点运行完成并输出报告
- **WHEN** 对试点文件运行突变测试
- **THEN** SHALL 输出突变分数报告，包含存活突变和被杀突变的详细信息

### Requirement: 突变测试报告可访问

系统 SHALL 生成 HTML 格式的突变测试报告，存放在 `reports/mutation/` 目录。

#### Scenario: HTML 报告包含完整的突变详情
- **WHEN** 突变测试运行完成
- **THEN** SHALL 在 `reports/mutation/mutation.html` 生成可浏览的报告，展示每个文件的突变分数、存活突变详情
