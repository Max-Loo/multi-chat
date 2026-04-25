## MODIFIED Requirements

### Requirement: 不可测代码排除
系统 SHALL 在覆盖率配置的 `exclude` 列表中排除不可测代码，使覆盖率数字反映真实测试质量。

#### Scenario: 类型声明文件被排除
- **WHEN** 运行覆盖率检查
- **THEN** `src/@types/` 目录 SHALL 不被纳入覆盖率计算

#### Scenario: 纯 re-export 空壳组件被排除
- **WHEN** 运行覆盖率检查
- **THEN** `src/pages/Model/index.tsx` SHALL 不被纳入覆盖率计算

#### Scenario: 第三方库薄包装被排除
- **WHEN** 运行覆盖率检查
- **THEN** `src/utils/utils.ts` 中的 `cn` 函数 SHALL 不被纳入覆盖率计算
- **NOTE** `cn` 是 `clsx` + `twMerge` 的一行组合，不含业务逻辑

#### Scenario: 纯映射文件被排除
- **WHEN** 运行覆盖率检查
- **THEN** `src/utils/highlightLanguageIndex.ts` SHALL 不被纳入覆盖率计算
- **NOTE** 该文件是 46 个动态 import 的 switch 映射，已被上层测试完整 mock
