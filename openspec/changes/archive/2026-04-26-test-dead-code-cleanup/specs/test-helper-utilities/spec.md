## REMOVED Requirements

### Requirement: 性能测试工具
**Reason**: `isolation/performance.ts` 中 5 个导出（`measurePerformance`、`measurePerformanceSync`、`expectDuration`、`benchmarkPerformance`、`PerformanceResult`）在全项目中零运行时消费者，属于过度设计的死代码。
**Migration**: 如果未来需要性能测试工具，可以从 git 历史恢复 `performance.ts` 或重新实现。

### Requirement: 自定义断言函数
**Reason**: `helpers/assertions/` 目录中 3 个自定义 matcher（`toBeEncrypted`、`toBeValidMasterKey`、`toHaveBeenCalledWithService`）已注册到 Vitest 但从未被任何测试调用。`cleanup.ts` 中 `setupCustomAssertions()` 在每次 afterEach 都执行注册，属于纯运行时浪费。
**Migration**: 如果未来需要自定义断言，可以重新实现。测试中可直接使用 `expect()` 的标准 matcher 替代。
