## 1. 迁移 cn() 到 src/utils/utils.ts

- [x] 1.1 将 `cn()` 函数从 `src/lib/utils.ts` 复制追加到 `src/utils/utils.ts`
- [x] 1.2 全局替换 `@/lib/utils` → `@/utils/utils`（约 30+ 文件）
- [x] 1.3 删除 `src/lib/utils.ts`
- [x] 1.4 运行 `pnpm tsc` 验证

## 2. 原子迁移 global.ts + toast/ + i18n.ts 到 src/services/

> i18n.ts 通过相对路径（`./global`、`./toast/toastQueue`）依赖 global.ts 和 toast/，必须同批迁移以避免中间态构建失败。

- [x] 2.1 将 `src/lib/global.ts` 移动到 `src/services/global.ts`
- [x] 2.2 将 `src/lib/toast/` 目录移动到 `src/services/toast/`
- [x] 2.3 将 `src/lib/i18n.ts` 移动到 `src/services/i18n.ts`
- [x] 2.4 验证 i18n.ts 内部相对 import（`./global`、`./toast/toastQueue`）在迁移后路径正确
- [x] 2.5 全局替换外部文件的 `@/lib/global` → `@/services/global`（约 5 文件）
- [x] 2.6 全局替换外部文件的 `@/lib/toast` → `@/services/toast`（约 20 文件）
- [x] 2.7 全局替换外部文件的 `@/lib/i18n` → `@/services/i18n`（约 9 文件）
- [x] 2.8 运行 `pnpm tsc` 验证

## 3. 迁移 initialization/ 到 src/services/initialization/

- [x] 3.1 将 `src/lib/initialization/` 目录移动到 `src/services/initialization/`
- [x] 3.2 全局替换 `@/lib/initialization` → `@/services/initialization`（约 12 文件）
- [x] 3.3 运行 `pnpm tsc` 验证

## 4. 清理和验证

- [x] 4.1 将 `src/__test__/lib/` 目录重命名为 `src/__test__/services/`
- [x] 4.2 更新测试文件中的 import 路径（`@/lib/xxx` → `@/services/xxx`）
- [x] 4.3 删除 `src/lib/` 目录
- [x] 4.4 运行 `pnpm test` 全量测试
- [x] 4.5 更新 `docs/` 和 `CLAUDE.md` 中引用 `src/lib/` 的文件路径
