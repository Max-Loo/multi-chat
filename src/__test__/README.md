# 测试规范与辅助工具文档

本目录提供标准化的 Mock、Fixtures 和测试工具函数。测试栈：vitest + @testing-library/vue + happy-dom + fake-indexeddb + MSW。

## 目录结构

```
src/__test__/
├── README.md                    # 本文档
├── setup.ts                     # Vitest 全局设置（瘦入口）
├── setup/                       # 设置子模块
│   ├── base.ts                  # Polyfill、jest-dom 扩展、mock 工厂注册
│   ├── mocks.ts                 # 全局 vi.mock（AI SDK、存储、Skeleton 等）
│   └── cleanup.ts               # afterEach 清理钩子
├── helpers/                     # 测试辅助工具
│   ├── index.ts                 # 统一导出
│   ├── testing-utils.ts         # asTestType / createMockChat 等工具
│   ├── mocks/                   # Mock 工厂（框架无关）
│   │   ├── aiSdk.ts             # AI SDK Mock
│   │   ├── tauriCompat.ts       # 平台兼容层 Mock
│   │   ├── storage.ts           # 存储内存 Mock
│   │   ├── fetch.ts             # Fetch API Mock
│   │   ├── i18n.ts              # 国际化 Mock
│   │   ├── highlight.ts         # 代码高亮 Mock
│   │   ├── toast.ts             # Toast Mock
│   │   └── ...
│   ├── fixtures/                # 测试数据工厂
│   └── isolation/               # 环境隔离
├── vue3/                        # Vue 组件与组合式函数测试
│   ├── ui-components.test.ts    # UI 基础组件交互（对话框键盘/下拉键盘/ARIA）
│   ├── masonry.test.ts          # 瀑布流布局断点与分列
│   └── smoke.test.ts            # Vue 挂载冒烟
├── composables/                 # 组合式函数测试
├── stores/                      # Pinia store 测试
├── services/                    # 服务层测试（框架无关）
├── utils/                       # 工具函数测试
└── config/                      # 配置测试（initSteps/navigation）
```

## 编写规范

### 渲染测试（Vue）

使用 `@testing-library/vue` 的 `render`，基于用户视角断言（role/text/testid），
不依赖组件内部实现：

```ts
import { render, screen, fireEvent } from '@testing-library/vue';
import { Button } from '@/components/ui/button';

render(Button, { slots: { default: '保存' } });
expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
```

键盘交互优先使用 `@testing-library/user-event`（完整的焦点/输入序列）。

### Pinia store 测试

组件外使用 store 时通过 `getAppPinia()` 单例或 `createAppPinia()` 创建实例，
并注意 pinia 4 的插件队列冲刷语义（见 `src/stores/index.ts` 注释）：

```ts
import { createAppPinia } from '@/stores';
import { useChatStore } from '@/stores';

const pinia = createAppPinia();
const store = useChatStore(pinia);
```

### 模块 mock

- `vi.mock` 的工厂会被提升：工厂内引用的变量需用 `vi.hoisted` 创建。
- 全局 mock（AI SDK、存储等）在 `setup/mocks.ts` 统一注册；
  各测试文件可通过 `vi.mocked()` 覆写返回值。

### 清理

`setup/cleanup.ts` 在每个测试后自动执行：`@testing-library/vue` 的 cleanup、
存储/密钥/i18n/toast 状态重置。测试内无需手动清理。

## 变异测试（stryker）

配置见 `stryker.config.json`，mutate 范围覆盖服务层、Pinia store 与
组合式函数。运行：`pnpm test:mutation`。

## 覆盖率

配置在 `vite.config.ts` 的 `test.coverage`（Istanbul provider，分模块阈值）。
运行：`pnpm test:coverage`。
