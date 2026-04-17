## 1. 存储层：保留 enc: 值 + 返回失败统计

- [x] 1.1 修改 `decryptModelSensitiveFields`（`modelStorage.ts`）：解密失败时保留原始 `enc:` 值而非置空，记录 console.error 日志
- [x] 1.2 新增 `LoadModelsResult` 接口（`modelStorage.ts`）：`{ models: Model[]; decryptionFailureCount: number }`
- [x] 1.3 修改 `loadModelsFromJson`（`modelStorage.ts`）：统计解密失败数量，返回 `LoadModelsResult`
- [x] 1.4 处理 `masterKey = null` 的边界：主密钥不存在时 apiKey 置空但 `decryptionFailureCount` 为 0（未尝试解密不算失败）

## 2. 初始化层：传递失败统计到 InitResult

- [x] 2.1 `InitResult` 接口新增 `decryptionFailureCount?: number` 字段（`types.ts`）
- [x] 2.2 修改 `initializeModels` thunk（`modelSlice.ts`）：适配 `LoadModelsResult` 返回结构，返回整个结果对象
- [x] 2.3 修改 `initializeModels.fulfilled` reducer（`modelSlice.ts`）：从 `action.payload` 中提取 `models` 数组赋值给 `state.models`（`state.models = action.payload.models`），避免将 `LoadModelsResult` 对象直接赋值
- [x] 2.4 修改 models 步骤（`initSteps.ts`）：从 thunk 返回值解构 `models` 和 `decryptionFailureCount`，分别通过 `context.setResult` 存入 context
- [x] 2.5 修改 `InitializationManager`：从 context 提取 `decryptionFailureCount` 写入 `InitResult`

## 3. UI 层：解密失败通知

- [x] 3.1 `MainApp.tsx` 新增 useEffect：检测 `result.decryptionFailureCount > 0` 时显示 Toast 警告，`duration: Infinity`
- [x] 3.2 Toast 包含失败模型数量信息和"导入密钥"按钮（导航到 `/setting/key-management`）
- [x] 3.3 合并逻辑：当 `masterKeyRegenerated` 和 `decryptionFailureCount > 0` 同时存在时，只显示解密失败通知

## 4. 测试更新

- [x] 4.1 更新 `modelStorage.test.ts`：解密失败场景的断言从 `expect(apiKey).toBe("")` 改为 `expect(apiKey).toMatch(/^enc:/)`
- [x] 4.2 更新 `modelStorage.test.ts`：`loadModelsFromJson` 的返回值断言适配 `LoadModelsResult` 结构
- [x] 4.3 更新 `crypto-storage.integration.test.ts`：解密失败场景的断言适配新行为
- [x] 4.4 补充新增场景测试：`decryptionFailureCount` 统计准确性、`masterKey = null` 边界
