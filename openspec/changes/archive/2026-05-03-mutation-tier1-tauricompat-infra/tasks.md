## 0. Stryker 配置更新

- [x] 0.1 将 `src/utils/tauriCompat/store.ts`、`src/utils/tauriCompat/http.ts`、`src/utils/tauriCompat/shell.ts` 添加到 `stryker.config.json` 的 `mutate` 数组
- [x] 0.2 分别运行每个文件的变异测试基线：`pnpm test:mutation --mutate "src/utils/tauriCompat/store.ts"`、`pnpm test:mutation --mutate "src/utils/tauriCompat/http.ts"`、`pnpm test:mutation --mutate "src/utils/tauriCompat/shell.ts"`，记录存活变异体数量和位置

## 1. 前置修复：store.test.ts 全局 mock 阻断

- [x] 1.1 在 store.test.ts 顶部添加 `vi.unmock('@/utils/tauriCompat/store')` 绕过全局 mock
- [x] 1.2 添加 `vi.mock('@/utils/tauriCompat/env')` 控制 isTauri 返回值
- [x] 1.3 按需引入 `vi.resetModules()` + 动态 `import()` 隔离模块状态（参考 http.test.ts 模式）
- [x] 1.4 重写现有测试用例，确保测试操作真实的 WebStoreCompat（IndexedDB 实现），而非 createMemoryStorageMock（Map 实现）
- [x] 1.5 运行 `pnpm test` 确认重写后的测试全部通过

## 2. 前置修复：shell.test.ts 全局 mock 阻断

- [x] 2.1 在 shell.test.ts 顶部添加 `vi.unmock('@/utils/tauriCompat/shell')` 绕过全局 mock
- [x] 2.2 添加 `vi.mock('@/utils/tauriCompat/env')` 控制 isTauri 返回值
- [x] 2.3 按需引入 `vi.resetModules()` + 动态 `import()` 隔离模块状态
- [x] 2.4 重写现有测试用例，确保测试操作真实的 WebShellCommand/WebShell，而非 vi.fn() 桩
- [x] 2.5 运行 `pnpm test` 确认重写后的测试全部通过

## 3. store.ts 变异测试补强

- [x] 3.1 验证 `WebStoreCompat.get` 值提取条件：补充测试 set→get roundtrip 精确值匹配、读取错误返回 null 的场景
- [x] 3.2 验证 `WebStoreCompat.set` 写入成功：补充测试 set 后 get 返回精确值的场景
- [x] 3.3 验证 `WebStoreCompat.delete` 删除生效：补充测试 delete 后 get 返回 null 的场景
- [x] 3.4 验证 `WebStoreCompat.keys` 返回正确键列表：补充测试设置多个键后 keys 返回完整列表的场景
- [x] 3.5 验证 `WebStoreCompat.close` 关闭数据库：补充测试 close 后 get 抛出错误的场景
- [x] 3.6 验证 `WebStoreCompat.isSupported`：补充测试 fake-indexedDB 环境下返回 true 的场景
- [x] 3.7 验证 `createLazyStore` 环境分发：补充测试 Web 环境创建 WebStoreCompat 实例的场景
- [x] 3.8 运行 `pnpm test:mutation --mutate "src/utils/tauriCompat/store.ts"` 验证杀死率 ≥ 90%

## 4. http.ts 变异测试补强

- [x] 4.1 验证 `createFetch` 三路环境分支：补充测试 DEV=true+isTauri=true 仍返回原生 fetch 的场景
- [x] 4.2 验证 Tauri 插件导入失败降级：补充测试动态导入失败时输出 console.warn 并降级到原生 fetch 的场景
- [x] 4.3 验证 `getFetchFunc` 实例一致性：补充测试多次调用返回引用相等函数的场景
- [x] 4.4 验证 `fetch` 函数参数透传：补充测试带完整参数和无 init 参数的调用场景
- [x] 4.5 运行 `pnpm test:mutation --mutate "src/utils/tauriCompat/http.ts"` 验证杀死率 ≥ 90%

## 5. shell.ts 变异测试补强

- [x] 5.1 验证 `WebShellCommand.execute` 返回值结构：补充测试返回 { code: 0, signal: null, stdout: '', stderr: '' } 的场景
- [x] 5.2 验证 `WebShellCommand.isSupported` 返回 false：补充测试精确布尔值断言的场景
- [x] 5.3 验证 `WebShell.open` 调用 window.open：补充测试通过 spyOn 验证 window.open 被正确调用的场景（注意：Stryker `excludedMutations: ["StringLiteral"]` 排除了字符串参数变异，测试验证调用行为本身）
- [x] 5.4 验证 `WebShell.isSupported` 返回 true：补充测试精确布尔值断言的场景
- [x] 5.5 验证 `Command.create` 环境分发：补充测试 Web 环境创建 isSupported()=false 的实例的场景
- [x] 5.6 验证 `shell` 实例环境分发：补充测试 shell.isSupported() 返回 true 的场景
- [x] 5.7 运行 `pnpm test:mutation --mutate "src/utils/tauriCompat/shell.ts"` 验证杀死率 ≥ 90%

## 6. 最终验证

- [x] 6.1 运行 `pnpm test` 确认所有单元测试通过
- [x] 6.2 运行 `pnpm test:mutation` 确认 3 个新增模块的变异测试杀死率均 ≥ 90%
