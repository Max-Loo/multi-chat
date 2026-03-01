## Why

当前项目中时间戳生成逻辑分散在多个文件中，存在代码重复和不一致的问题。`chatService.ts` 中定义了 `getCurrentTimestamp()` 私有函数，而 `chatSlices.ts` 等文件直接使用 `Date.now() / 1000`。这种不一致性增加了维护成本，容易引入错误（如时间单位混淆），并且违背了 DRY（Don't Repeat Yourself）原则。

## What Changes

- 在 `src/utils/utils.ts` 中添加时间戳工具函数
- 导出 `getCurrentTimestamp()` 函数（返回秒级 Unix 时间戳）
- 导出 `getCurrentTimestampMs()` 函数（返回毫秒级时间戳，用于需要高精度时间戳的场景）
- 替换 `chatService.ts` 中的私有函数使用导出的工具函数
- 替换 `chatSlices.ts` 中的 `Date.now() / 1000` 为工具函数
- 在相关类型和文档中明确时间戳的单位约定

## Capabilities

### New Capabilities
- `timestamp-utils`: 提供统一的时间戳生成工具函数，确保项目中所有时间戳生成逻辑的一致性和可维护性

### Modified Capabilities
(无现有功能的需求变更，仅重构实现)

## Impact

**受影响的代码**:
- `src/services/chatService.ts`: 移除私有 `getCurrentTimestamp()` 函数，改为导入
- `src/store/slices/chatSlices.ts`: 替换 `Date.now() / 1000` 为工具函数
- `src/utils/tauriCompat/keyring.ts`: 根据需求决定是否替换毫秒时间戳生成

**受影响的 API**:
- 扩展公共 API: `@/utils/utils.ts` 新增时间戳函数导出

**依赖变化**:
- 无新增外部依赖

**测试影响**:
- 可能需要更新测试中的 mock 数据生成逻辑
- 需要为新工具函数添加单元测试
