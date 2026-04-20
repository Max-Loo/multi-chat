## 1. P0 — 删除未使用文件和依赖

- [x] 1.1 删除 `src/__test__/fixtures/index.ts`
- [x] 1.2 删除 `src/__test__/helpers/integration/fixtures.ts`
- [x] 1.3 删除 `src/__test__/helpers/integration/testServer.ts`
- [x] 1.4 删除 `src/__test__/helpers/mocks/setup.ts`
- [x] 1.5 删除 `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/index.ts`
- [x] 1.6 移除 `msw` 开发依赖（`pnpm remove msw`）

## 2. P1 — 清理未使用的测试导出

- [x] 2.1 清理 `src/__test__/fixtures/modelProvider.ts` 中未使用的导出（`FixtureValidationError`、`createMockRemoteProvider`、`createKimiProvider`、`createZhipuProvider`）
- [x] 2.2 清理 `src/__test__/fixtures/models.ts` 中未使用的导出（`createMockModels`、`createDeepSeekModel`、`createKimiModel`、`createEncryptedModel`）
- [x] 2.3 清理 `src/__test__/helpers/assertions/setup.ts` 中未使用的自定义匹配器（`toBeEncrypted`、`toBeValidMasterKey`、`toHaveBeenCalledWithService`）
- [x] 2.4 清理 `src/__test__/services/lib/initialization/fixtures.ts` 中未使用的导出（`createMockInitError`、`createTestInitSteps`、`createMockExecutionContext`、`createSuccessfulStep`、`createFailingStep`、`createStepWithValue`）
- [x] 2.5 清理 `src/__test__/utils/tauriCompat/helpers.ts` 中未使用的导出（`mockTauriEnvironment`、`mockWebEnvironment`、`mockNavigator`、`mockConsole`）
- [x] 2.6 清理 `src/__test__/utils/tauriCompat/idb-helpers.ts` 中未使用的导出（`createTestDB`、`deleteTestDB`、`setupAutoCleanup`）

## 3. P1 — 清理未使用的 UI 组件导出

- [x] 3.1 移除 `src/components/Skeleton/index.ts` 中未使用的重导出（`SidebarSkeleton`、`MainContentSkeleton`、`SkeletonList`、`SkeletonMessage`）
- [x] 3.2 移除 `src/components/ui/alert-dialog.tsx` 中未使用的导出（`AlertDialogPortal`、`AlertDialogOverlay`、`AlertDialogTrigger`）
- [x] 3.3 移除 `src/components/ui/avatar.tsx` 中未使用的导出（`AvatarImage`、`AvatarFallback`）
- [x] 3.4 将 `src/components/AnimatedLogo/canvas-logo.ts` 中的 `COLORS` 从命名导出改为模块内部变量（移除 `export` 关键字，保留内部使用）
- [x] 3.5 统一 `src/components/InitializationController/index.tsx` 导出方式：移除 `export default`，仅保留命名导出 `export const InitializationController`（knip 检出的"重复导出"实为同一标识符同时存在命名导出和默认导出，非 bug，此处做风格统一）

## 4. P1 — 清理未使用的枚举成员

- [x] 4.1 移除 `src/services/modelRemote/index.ts` 中 `RemoteDataErrorType.PARSE_ERROR`
- [x] 4.2 移除 `src/services/modelRemote/index.ts` 中 `RemoteDataErrorType.ABORTED`

## 5. P2 — 精简 knip.json 配置

- [x] 5.1 移除 knip.json 中冗余的 ignore 模式（`src/**/*.test.{ts,tsx}`、`src/**/*.spec.{ts,tsx}`、`src/**/__tests__/**`、`src/**/__mocks__/**`、`dist/**`、`node_modules/**`、`src-tauri/**`）
- [x] 5.2 移除 knip.json 中冗余的 `src/main.tsx` 入口模式

## 6. 验证

- [x] 6.1 运行 `pnpm tsc` 确认类型检查通过
- [x] 6.2 运行 `pnpm lint` 确认代码规范检查通过
- [x] 6.3 运行 `pnpm analyze:unused` 确认 knip 检出项大幅减少
