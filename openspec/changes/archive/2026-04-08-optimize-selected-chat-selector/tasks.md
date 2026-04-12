## 1. 创建 selector 文件

- [x] 1.1 创建 `src/store/selectors/chatSelectors.ts`，实现 `selectSelectedChat`（含内部 input selectors）
- [x] 1.2 创建 `src/store/selectors/index.ts`，导出 `selectSelectedChat`

## 2. 简化 hook

- [x] 2.1 修改 `src/hooks/useCurrentSelectedChat.ts`，移除 `useMemo` 和多余的 `useAppSelector`，改用 `selectSelectedChat`

## 3. 验证

- [x] 3.1 运行 `pnpm tsc` 确认类型检查通过
- [x] 3.2 运行 `pnpm test:all` 确认测试通过
