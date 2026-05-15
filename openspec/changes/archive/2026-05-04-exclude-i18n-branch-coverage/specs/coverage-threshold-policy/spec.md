## MODIFIED Requirements

### Requirement: 分模块覆盖率阈值配置
系统 SHALL 在 `vite.config.ts` 中配置按模块目录的覆盖率阈值，替代全局一刀切配置。每个模块的阈值 SHALL 根据其测试难度和实际覆盖率设定合理目标。采用 Istanbul 覆盖率提供者后，阈值 SHALL 基于实际覆盖率数据校准。

#### Scenario: hooks 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/hooks/` 目录的行覆盖率 SHALL 不低于 90%，分支覆盖率 SHALL 不低于 85%

#### Scenario: services 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/services/` 目录的行覆盖率 SHALL 不低于 80%，分支覆盖率 SHALL 不低于 75%

#### Scenario: store 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/store/` 目录的行覆盖率 SHALL 不低于 80%，分支覆盖率 SHALL 不低于 75%

#### Scenario: utils 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/utils/` 目录的行覆盖率 SHALL 不低于 80%，分支覆盖率 SHALL 不低于 70%

#### Scenario: components 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/components/` 目录的行覆盖率 SHALL 不低于 70%，分支覆盖率 SHALL 不低于 55%

#### Scenario: config 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/config/` 目录的行覆盖率 SHALL 不低于 55%，分支覆盖率 SHALL 不低于 55%

#### Scenario: pages 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/pages/` 目录的行覆盖率 SHALL 不低于 55%，分支覆盖率 SHALL 不低于 45%

#### Scenario: router 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/router/` 目录的行覆盖率 SHALL 不低于 50%，分支覆盖率 SHALL 不低于 40%
