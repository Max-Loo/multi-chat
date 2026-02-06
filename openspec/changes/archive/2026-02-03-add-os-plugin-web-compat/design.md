# 设计文档：OS 插件 locale() API Web 兼容层

## Context

**当前状态**：

- 项目已实现 Tauri 和 Web 双运行模式支持
- 已有 Shell 插件的 Web 兼容层实现（`src/utils/tauriCompat/shell.ts`）
- `src/lib/global.ts` 直接使用 `@tauri-apps/plugin-os` 的 `locale()` API 获取系统语言
- `ChatPanelSender.tsx` 使用 `platform()` API 检测 macOS 平台（用于 Safari 中文输入法 bug 处理）

**问题**：

- `locale()` 和 `platform()` API 在 Web 环境中不可用，会导致运行时错误
- 需要为这两个功能提供 Web 环境的替代方案

**约束**：

- 必须保持与 Tauri 原生 API 的类型一致性
- 不能影响 Tauri 桌面环境的现有功能
- 遵循已有的 Shell 插件兼容层设计模式

## Goals / Non-Goals

**Goals**：

- 为 `locale()` API 实现 Web 兼容层，在 Web 环境使用 `navigator.language`
- 移除 `platform()` 的使用，改为浏览器 UserAgent 检测
- 保持代码的模块化和可维护性
- 更新相关文档（AGENTS.md）

**Non-Goals**：

- 不实现 OS 插件的其他 API（如 `version()`, `arch()`, `tempdir()` 等）
- 不为 `platform()` 创建兼容层（直接改为浏览器检测）
- 不修改现有的国际化逻辑（仅替换数据源）

## Decisions

### 决策 1：仅实现 `locale()` 的兼容层

**选择**：只为 `locale()` 创建兼容层，`platform()` 改为浏览器检测

**理由**：

- 项目仅使用这两个 OS 插件 API
- `locale()` 需要在应用启动时获取（阻断式初始化），必须提供兼容层
- `platform()` 仅用于 Safari bug 处理，可通过浏览器 UserAgent 检测替代
- 遵循 YAGNI 原则，不过度设计

**替代方案**：为 OS 插件的所有 API 创建完整兼容层

- **不采用原因**：项目不需要其他 API，会增加维护成本

### 决策 2：使用工厂模式实现 locale() 兼容层

**选择**：参考 Shell 插件的 `Command.create()` 模式，创建 `locale()` 函数

**理由**：

- 保持与现有兼容层模式的一致性（KISS 原则）
- `locale()` 是同步 API，不需要类封装，直接使用函数即可
- 通过 `isTauri()` 环境检测返回不同实现

**实现方式**：

```typescript
// Tauri 环境：调用原生 API
// Web 环境：返回 navigator.language
export const locale = (): string => {
  if (isTauri()) {
    // 动态导入避免 Web 环境加载错误
    return localeImpl();
  } else {
    return navigator.language;
  }
};
```

### 决策 3：使用浏览器 UserAgent 检测替代 platform()

**选择**：在 `ChatPanelSender.tsx` 中使用 UserAgent 解析逻辑

**理由**：

- `platform()` 在该场景下仅用于判断是否为 macOS 的 Safari
- 可通过 `navigator.userAgent` 检测浏览器和操作系统
- 减少对 Tauri API 的依赖，提升 Web 环境的独立性

**实现方式**：

```typescript
// 检测是否为 macOS 平台的 Safari 浏览器
const isMacSafari = (): boolean => {
  const ua = navigator.userAgent;
  return (
    /Mac|macOS/.test(ua) && /Safari/.test(ua) && !/Chrome|Edge|Firefox/.test(ua)
  );
};
```

### 决策 4：动态导入 Tauri API 避免 Web 环境报错

**选择**：在兼容层中使用动态导入（或条件导入）

**理由**：

- 静态导入 `@tauri-apps/plugin-os` 会在 Web 环境触发构建错误
- 动态导入或条件导入可避免打包工具处理 Tauri 专用模块
- 参考现有的 Shell 插件实现方式

**实现方式**：

```typescript
// 仅在 Tauri 环境导入原生 API
let tauriLocale: (() => string) | null = null;

if (isTauri()) {
  import("@tauri-apps/plugin-os").then((module) => {
    tauriLocale = module.locale;
  });
}
```

### 决策 5：不提供 isSupported() 方法

**选择**：`locale()` 兼容层不提供 `isSupported()` 方法

**理由**：

- `locale()` 在两种环境都有语义正确的实现（Tauri 系统语言，Web 浏览器语言）
- 不存在"功能不可用"的情况，无需额外判断
- 简化 API，保持 KISS 原则

与 Shell 插件的对比：

- Shell 的 `Command.execute()` 在 Web 环境无法实际执行，需要 `isSupported()` 标记
- `locale()` 只是数据来源不同，功能始终可用

## Risks / Trade-offs

### 风险 1：动态导入可能导致异步问题

**风险**：使用动态导入时，`locale()` 可能在 Tauri API 加载前被调用

**缓解措施**：

- 在应用启动时预加载 Tauri API（在 `initializeMasterKey()` 之前）
- 使用同步的条件导入而非动态导入（通过 Vite 的条件编译）

**最终方案**：使用静态条件导入

```typescript
import { locale as tauriLocale } from "@tauri-apps/plugin-os";
// 通过 isTauri() 决定是否调用
```

### 风险 2：浏览器语言与系统语言不一致

**风险**：`navigator.language` 返回浏览器语言，可能与系统语言不同

**影响**：Web 环境的初始语言可能与用户预期不符

**缓解措施**：

- 用户可以通过设置手动更改语言（localStorage 优先级高于系统语言）
- 在文档中说明 Web 环境使用浏览器语言
- 这是合理的降级行为，符合 Web 应用的惯例

### 风险 3：UserAgent 检测可能失效

**风险**：浏览器 UserAgent 字符串可能被伪造或未来格式变化

**缓解措施**：

- 仅用于处理特定 Safari bug，不影响核心功能
- 如果检测失败，最坏情况是中文输入体验稍差（不影响功能）
- 可以考虑使用特性检测替代平台检测（如检查 `isComposing` 是否有效）

### Trade-offs：兼容层 vs 直接条件判断

**选择兼容层的好处**：

- 统一的 API 接口，调用者无需关心环境差异
- 易于维护和测试
- 符合项目现有的兼容层架构

**代价**：

- 增加一层抽象（轻微的性能开销）
- 需要额外的文件和代码

**结论**：收益大于成本，采用兼容层方案

## Migration Plan

**实施步骤**：

1. 创建 `src/utils/tauriCompat/os.ts`，实现 `locale()` 函数
2. 更新 `src/utils/tauriCompat/index.ts`，导出 `locale`
3. 修改 `src/lib/global.ts`，将导入改为兼容层
4. 修改 `ChatPanelSender.tsx`，移除 `platform()` 使用，添加 UserAgent 检测函数
5. 在两种环境测试：
   - `pnpm tauri dev`（Tauri 环境）
   - `pnpm web:dev`（Web 环境）
6. 运行类型检查：`pnpm tsc`
7. 更新 AGENTS.md 文档

**回滚策略**：

- 保留 git 提交历史，可随时回退到变更前状态
- 如果出现兼容性问题，可暂时移除兼容层，恢复原有直接导入

## Open Questions

**Q1**: 是否需要为 `locale()` 添加单元测试？

**考虑**：

- 当前项目未建立完善的测试体系
- 兼容层逻辑简单（环境判断 + API 调用）
- 手动测试在两种环境验证即可

**决策**：暂不添加单元测试，通过手动验证功能正确性

**Q2**: 是否需要在 AGENTS.md 中详细说明 UserAgent 检测逻辑？

**考虑**：

- `ChatPanelSender.tsx` 的 Safari bug 处理是组件内部逻辑
- 与兼容层设计关系不大

**决策**：仅在 AGENTS.md 中说明 OS 插件兼容层，UserAgent 检测作为实现细节留在组件代码注释中

**Q3**: 如果未来需要其他 OS 插件 API（如 `arch()`），如何扩展？

**考虑**：

- 当前设计仅实现 `locale()`
- 可能需要为其他 API 添加兼容层

**决策**：遵循开放封闭原则，在 `os.ts` 中按需添加新 API，保持当前的架构模式
