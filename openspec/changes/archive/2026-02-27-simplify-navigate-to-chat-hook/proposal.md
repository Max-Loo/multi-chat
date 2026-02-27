## Why

当前 `useNavigateToPage.ts` hook 中的 `navigateToChat` 和 `navigateToChatWithoutParams` 两个方法功能高度相似，区别仅在于是否传递 `chatId` 查询参数。这种设计违反了 DRY（Don't Repeat Yourself）原则，增加了不必要的维护成本。需要简化为单一方法，通过可选参数来统一处理两种跳转场景。

## What Changes

- **合并方法**: 将 `navigateToChat` 和 `navigateToChatWithoutParams` 合并为单一的 `navigateToChat` 方法
- **参数调整**: 将 `chatId` 参数改为可选（`chatId?: string`），方法内部根据参数是否存在决定路由格式
- **保持向后兼容**: 新的 API 设计保持了原有的功能，调用方式更加简洁直观
- **移除冗余**: 删除 `navigateToChatWithoutParams` 方法和 `NavigateToChatOptions` 接口的 `chatId` 必填约束

## Capabilities

### New Capabilities
*(无新业务功能引入，这是内部重构)*

### Modified Capabilities
*(无业务需求变更，仅优化实现方式)*

## Impact

- **受影响的文件**:
  - `src/hooks/useNavigateToPage.ts` (仅修改文件)
- **API 变更**:
  - 导出的 `navigateToChat` 方法签名保持不变，仍然接受 `{ chatId?: string, ...options }` 参数
  - 移除 `navigateToChatWithoutParams` 方法
- **破坏性变更**: **BREAKING** - 任何使用 `navigateToChatWithoutParams` 的代码需要改为调用 `navigateToChat()` 或 `navigateToChat({})`
- **依赖项**: 无变更
- **系统影响**: 无，此为纯前端 hook 内部优化
