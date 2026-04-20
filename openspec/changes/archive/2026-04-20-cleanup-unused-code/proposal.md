## Why

`pnpm analyze:unused` (knip) 检出 5 个未使用文件、1 个未使用开发依赖、89 个未使用导出和 2 个未使用枚举成员。这些死代码增加维护负担、混淆 IDE 自动补全、膨胀构建产物，应予以清理。

## What Changes

- 删除 5 个未使用文件（MSW 测试基础设施残留和空桶文件）
- 移除 `msw` 开发依赖
- 清理 89 个未使用导出：移除未被引用的测试 fixture 工厂函数、未使用的 UI 组件导出
- 移除 2 个未使用枚举成员（`PARSE_ERROR`、`ABORTED`）
- 精简 knip.json 配置，移除冗余 ignore 模式
- 统一 `InitializationController` 导出方式（移除 `export default`，仅保留命名导出）
- 保留合理导出：已导出的 TypeScript 类型/接口（供外部 API 使用）暂不清理，仅标记为"可审查"

## Capabilities

### New Capabilities

无。本变更为纯清理，不引入新能力。

### Modified Capabilities

无。不改变任何规格级行为，仅删除死代码。

## Impact

- **依赖**：`package.json` 移除 `msw`
- **测试文件**：`src/__test__/` 下删除 5 个文件、清理约 25 个未使用的 fixture/helper 导出
- **UI 组件**：`src/components/` 下移除 Skeleton 系列、AlertDialog 等未使用导出
- **枚举**：`src/services/modelRemote/index.ts` 移除 2 个枚举成员
- **配置**：`knip.json` 精简 ignore 列表
- **风险**：低。所有变更均为删除未引用代码，不影响运行时行为
