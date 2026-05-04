## MODIFIED Requirements

### Requirement: 采用 Istanbul 覆盖率提供者
系统 SHALL 使用 Istanbul 作为 Vitest 覆盖率提供者。Istanbul 在 Statement 覆盖率上比 V8 更准确。

#### Scenario: Istanbul provider 正确安装和配置
- **WHEN** 运行 `pnpm test:coverage`
- **THEN** Vitest SHALL 使用 Istanbul 覆盖率提供者，且所有测试正常通过

#### Scenario: Statement 覆盖率更准确
- **WHEN** 运行 `pnpm test:coverage`
- **THEN** Istanbul SHALL 提供比 V8 更准确的 Statement 覆盖率数据

### Requirement: 覆盖率阈值基于真实数据调整
采用 Istanbul provider 后，系统 SHALL 调整 `vite.config.ts` 中的覆盖率阈值，使阈值反映应用代码的真实覆盖目标。

#### Scenario: 阈值基于切换后的实际覆盖率设定
- **WHEN** 切换 Istanbul provider 后运行覆盖率
- **THEN** 各模块阈值 SHALL 基于实际覆盖率数据设定，确保所有模块的阈值检查通过

### Requirement: README 覆盖率目标同步更新
`src/__test__/README.md` 中的覆盖率阈值表格 SHALL 与 `vite.config.ts` 中的实际配置保持一致。

#### Scenario: README 阈值与配置一致
- **WHEN** 开发者查阅 README 覆盖率章节
- **THEN** 分模块阈值表 SHALL 反映采用 Istanbul provider 后的新阈值
