## Why

`next-themes` 是引入 shadcn/ui Sonner 组件时作为附带依赖安装的，并非为暗色模式功能主动选型。当前项目中 `next-themes` 仅被 `src/components/ui/sonner.tsx` 使用（`useTheme()` 获取主题值传给 Sonner 的 `theme` prop）。项目是 Tauri 桌面应用，不需要 `next-themes` 的 SSR 兼容能力，移除可减少不必要的依赖。

## What Changes

- **BREAKING**: 移除 `next-themes` 依赖包
- 适配 `src/components/ui/sonner.tsx`，使用自定义方案替代 `useTheme()` 获取当前主题状态
- 更新引用 `next-themes` 的测试文件中的注释说明

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

（无规格级别的需求变更，仅为内部实现调整）

## Impact

- **依赖层**: 从 `package.json` 中移除 `next-themes`，执行 `pnpm install` 更新 lockfile
- **组件层**: `src/components/ui/sonner.tsx` 需移除 `import { useTheme } from "next-themes"`，改用替代方案获取主题
- **测试层**: 3 个测试文件的注释引用了 `next-themes`，需同步更新
