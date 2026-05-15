## 1. tauriCompat/env.ts 单元测试

- [x] 1.1 创建 `src/__test__/utils/tauriCompat/env.test.ts` 测试文件，通过 `vi.importActual` 导入真实模块
- [x] 1.2 实现 `isTauri()` 测试：存在 `__TAURI__` 返回 true、不存在返回 false、`window` 为 undefined 返回 false
- [x] 1.3 实现 `isTestEnvironment()` 测试：`globalThis.vitest`、`__VITEST__`、`process.env.VITEST`、`import.meta.env.VITEST` 四种策略逐一验证，全部不满足时返回 false
- [x] 1.4 实现 `getPBKDF2Iterations()` 测试：测试环境返回 1000、非测试环境返回 100000（注意模块级缓存 `_isTestEnv` 的影响）
- [x] 1.5 实现 `beforeEach`/`afterEach` 环境隔离，确保每个测试清理全局变量修改

## 2. ChatExportSetting.tsx 组件测试

- [x] 2.1 创建 `src/__test__/pages/Setting/ChatExportSetting.test.tsx` 测试文件，mock `@/services/chatExport` 和 `@/services/toast`
- [x] 2.2 实现导出全部成功路径测试：验证调用 `exportAllChats`、触发文件下载（mock Blob/URL.createObjectURL）、显示成功 toast
- [x] 2.3 实现导出全部失败路径测试：验证错误 toast 显示、loading 状态恢复
- [x] 2.4 实现导出已删除成功路径测试：验证正常下载流程和成功 toast
- [x] 2.5 实现导出已删除为空路径测试：验证 info toast、不触发下载
- [x] 2.6 实现导出已删除失败路径测试：验证错误 toast、loading 恢复
- [x] 2.7 实现 loading 状态测试：验证导出过程中两个按钮同时 disabled、完成后恢复

## 3. navigation.tsx 配置完整性测试

- [x] 3.1 创建 `src/__test__/config/navigation.test.ts` 测试文件
- [x] 3.2 实现字段完整性校验：每项包含 id、i18nKey、path、icon、IconComponent、theme（base/active/inactive）
- [x] 3.3 实现 ID 唯一性校验
- [x] 3.4 实现 NAVIGATION_ITEM_MAP 与 NAVIGATION_ITEMS 一致性校验
- [x] 3.5 实现路径格式校验（以 `/` 开头）
- [x] 3.6 实现 i18nKey 格式校验（符合 `navigation.<id>` 格式）
