## MODIFIED Requirements

### Requirement: 集成测试无 act() 警告
`drawer-state.integration.test.tsx` SHALL 所有测试用例执行完毕后不产生任何 React `act()` 警告。

#### Scenario: 抽屉状态切换无警告
- **WHEN** 集成测试执行抽屉打开/关闭操作
- **THEN** 控制台无 "An update to ... was not wrapped in act(...)" 警告
