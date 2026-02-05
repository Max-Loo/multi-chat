# HTTP Fetch 跨平台兼容层 - 技术设计

## Context

### 当前状态

项目目前直接使用 `@tauri-apps/plugin-http` 的 `fetch` 函数进行 HTTP 请求。该插件仅在 Tauri 桌面环境中可用，在 Web 浏览器环境中无法加载和运行，导致应用在 Web 端无法正常工作。

### 现有兼容层架构

项目已经建立了 Tauri 插件兼容层体系（`src/utils/tauriCompat/`），为 Shell 和 OS 插件提供了跨平台封装。现有兼容层采用以下设计模式：

- **环境检测**：通过 `window.__TAURI__` 对象判断运行环境
- **接口统一**：定义兼容接口，Tauri 和 Web 环境分别实现
- **Null Object 模式**：Web 环境提供降级实现，永不抛出异常
- **类型兼容**：保持与 Tauri 原生 API 的类型一致性

### 约束条件

1. **开发环境特殊处理**：开发环境（`import.meta.env.DEV === true`）无论是否在 Tauri 容器中，都应使用原生 Web fetch，便于快速开发和调试
2. **生产环境区分**：生产环境需要根据运行平台（Tauri/Web）选择合适的 fetch 实现
3. **类型安全**：必须提供完整的 TypeScript 类型定义，确保编译时类型检查
4. **零依赖**：不引入新的外部依赖，复用现有的 `@tauri-apps/plugin-http`
5. **向后兼容**：新的兼容层 API 应与现有代码的使用方式保持一致

## Goals / Non-Goals

### Goals

- **统一 API**：提供跨平台统一的 fetch API，开发者无需关心底层实现
- **环境自适应**：根据运行环境（开发/生产 + Tauri/Web）自动选择合适的 fetch 实现
- **双重使用方式**：既支持直接调用 `fetch()` 函数，也支持通过 `getFetchFunc()` 获取函数实例
- **类型安全**：完整的 TypeScript 类型支持，RequestInfo 自定义定义，其他类型使用原生定义
- **零配置**：无需任何配置，开箱即用
- **与现有模式一致**：遵循项目兼容层的设计规范和代码风格

### Non-Goals

- **不实现请求拦截**：不在兼容层中实现请求/响应拦截、转换等功能
- **不实现重试逻辑**：不添加自动重试、超时处理等高级功能
- **不修改 API 行为**：保持与标准 Fetch API 完全一致的行为，不添加额外逻辑
- **不处理缓存**：不实现 HTTP 缓存策略
- **不实现请求队列**：不管理并发请求或请求队列

## Decisions

### 决策 1：环境判断策略

**选择**：基于开发模式和生产平台的双重判断

**判断逻辑**：
```
IF (开发模式: import.meta.env.DEV === true) THEN
  使用原生 Web fetch
ELSE IF (生产 Tauri 平台: window.__TAURI__ 存在) THEN
  使用 @tauri-apps/plugin-http 的 fetch
ELSE (生产 Web 平台)
  使用原生 Web fetch
```

**理由**：
- 开发环境优先使用 Web fetch，方便调试和网络请求查看（浏览器 DevTools）
- 生产环境 Tauri 使用 Tauri fetch，获得系统代理、证书管理等原生能力
- 生产环境 Web 使用 Web fetch，确保在浏览器中正常运行

**替代方案考虑**：
- **替代方案 A**：仅在 Tauri 环境使用 Tauri fetch，开发环境也检测 `window.__TAURI__`
  - **拒绝理由**：开发环境使用 Tauri fetch 难以调试，无法使用浏览器 DevTools 查看网络请求
- **替代方案 B**：提供配置选项让开发者手动选择
  - **拒绝理由**：增加配置复杂度，违反"零配置"目标

---

### 决策 2：实现模式选择

**选择**：**函数式实现 + 单例模式**，而非类模式

**实现方式**：
```typescript
/**
 * 创建并返回适合当前环境的 fetch 函数（异步版本）
 */
const createFetch = async (): Promise<FetchFunc> => {
  // 开发环境：使用原生 Web fetch
  if (import.meta.env.DEV) {
    return window.fetch.bind(window);
  }

  // 生产环境：检测平台
  if (isTauri()) {
    try {
      const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
      return tauriFetch;
    } catch (error) {
      console.warn('Failed to load Tauri fetch, falling back to Web fetch:', error);
      return window.fetch.bind(window);
    }
  }

  return window.fetch.bind(window);
};

/**
 * 使用顶层 await 初始化的 fetch 实例
 * 模块加载时会等待 createFetch() 完成后再导出
 */
const _fetchInstance: FetchFunc = await createFetch();

// 直接导出的 fetch 函数
export const fetch = async (input: RequestInfo, init?: RequestInit) => {
  return _fetchInstance(input, init);
};

// 获取 fetch 函数的方法
export const getFetchFunc = (): FetchFunc => {
  return _fetchInstance;
};
```

**理由**：
- fetch 本质是函数，使用函数式实现更自然、更简洁
- 避免不必要的类包装层，减少性能开销
- 单例模式确保多次调用返回同一实例，保持一致性
- 符合函数式编程范式，易于测试和组合

**替代方案考虑**：
- **替代方案 A**：采用与 Shell 兼容层相同的类模式
  - **拒绝理由**：fetch 是函数不是对象，类模式增加不必要的复杂度，违反 YAGNI 原则
- **替代方案 B**：每次调用都动态判断环境
  - **拒绝理由**：重复的环境判断影响性能，应缓存实现结果

---

### 决策 3：Tauri Fetch 动态导入策略

**选择**：使用顶层 `await` 动态导入，并配合 try-catch 降级

**实现方式**：
```typescript
const createFetch = async (): Promise<FetchFunc> => {
  // 开发环境：使用 Web fetch
  if (import.meta.env.DEV) {
    return window.fetch.bind(window);
  }

  // 生产环境：检测平台
  if (isTauri()) {
    // Tauri 环境：动态导入 Tauri fetch
    try {
      // 使用标准 ES 模块动态导入
      const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
      return tauriFetch;
    } catch (error) {
      // 导入失败降级到 Web fetch
      console.warn('Failed to load Tauri fetch, falling back to Web fetch:', error);
      return window.fetch.bind(window);
    }
  }

  // Web 环境：使用 Web fetch
  return window.fetch.bind(window);
};

// 使用顶层 await 初始化 fetch 实例
const _fetchInstance: FetchFunc = await createFetch();
```

**理由**：
- 动态导入避免在 Web 环境中加载 Tauri 插件，防止运行时错误
- try-catch 提供降级机制，确保即使导入失败也能正常工作
- 使用顶层 await 在模块加载时完成初始化，确保后续调用同步进行
- 绑定 `window` 确保 `this` 上下文正确
- 标准的 ES 模块 `import()` 动态导入，符合 ESM 规范

**替代方案考虑**：
- **替代方案 A**：静态导入 `@tauri-apps/plugin-http`
  - **拒绝理由**：在 Web 环境会导致构建失败或运行时错误
- **替代方案 B**：使用 require() 条件导入
  - **拒绝理由**：ESM 模块不支持条件 require，且不符合项目构建配置（type: "module"）

---

### 决策 4：类型定义方案

**选择**：自定义 `RequestInfo` 类型，其他类型使用原生定义

**类型定义**：
```typescript
// 自定义 RequestInfo 类型
export type RequestInfo = string | URL | Request;

// Fetch 函数类型（使用原生 RequestInit 和 Response）
export type FetchFunc = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response>;

// 导出 fetch 和 getFetchFunc
export const fetch: FetchFunc;
export const getFetchFunc: () => FetchFunc;

// 重新导出原生类型供外部使用
export type { RequestInit, Response, Headers, Request } from './types';
```

**理由**：
- RequestInfo 在 Web 和 Tauri 中可能有细微差异，自定义定义确保一致性
- RequestInit、Response、Headers 在两种环境中完全兼容，直接使用原生类型
- 避免重复定义，减少类型维护成本
- 保持与标准 Fetch API 的类型兼容性

**替代方案考虑**：
- **替代方案 A**：重新定义所有相关类型
  - **拒绝理由**：违反 DRY 原则，增加维护成本，且可能与原生类型不一致
- **替代方案 B**：直接使用 Tauri 的类型定义
  - **拒绝理由**：Tauri 类型在 Web 环境不可用，会导致类型错误

---

### 决策 5：错误处理策略

**选择**：不添加额外错误处理，保持 Fetch API 标准行为

**理由**：
- 标准 Fetch API 的错误处理已足够（网络错误抛出异常，HTTP 错误通过 Response 对象表示）
- 兼容层应保持透明，不改变原有行为
- 错误处理应由调用方根据业务需求实现

**行为规范**：
- 网络错误（断网、DNS 失败等）：抛出 `TypeError` 或 `Error`
- HTTP 错误（4xx、5xx）：返回 `Response` 对象，`ok` 为 `false`，`status` 包含状态码
- 超时、取消等：遵循标准 Fetch API 行为

---

## Risks / Trade-offs

### Risk 1：动态导入失败导致功能降级

**风险描述**：在生产 Tauri 环境中，如果动态导入 `@tauri-apps/plugin-http` 失败（如插件未正确配置），会降级到 Web fetch，失去 Tauri 原生能力（系统代理、证书管理等）。

**影响范围**：生产 Tauri 环境的网络请求功能

**缓解措施**：
- 在 try-catch 中捕获导入错误，记录警告日志
- 降级到 Web fetch 后功能仍然可用，只是失去部分 Tauri 特性
- 在 AGENTS.md 中明确说明插件配置要求
- 建议在生产构建前测试 Tauri 环境

**监控方案**：
- 开发环境可通过浏览器控制台查看警告日志
- 生产环境可通过应用日志监控导入失败情况

---

### Risk 2：开发环境无法测试 Tauri Fetch 行为

**风险描述**：由于开发环境始终使用 Web fetch，开发者无法在开发阶段测试 Tauri fetch 的特定行为（如系统代理、证书验证）。

**影响范围**：仅在开发阶段影响测试覆盖度

**缓解措施**：
- 在文档中明确说明此限制
- 建议使用生产构建进行完整测试（`pnpm tauri build` 后测试）
- Tauri fetch 与 Web fetch 的 API 行为一致，主要差异在于底层网络能力
- 大部分业务逻辑测试在开发环境使用 Web fetch 已足够

**测试策略**：
- 开发环境：测试业务逻辑和 API 调用
- 生产环境：测试网络层面的集成（代理、证书、跨域等）

---

### Risk 3：与现有兼容层模式不一致

**风险描述**：HTTP 兼容层使用函数式实现，而 Shell 兼容层使用类模式，可能导致代码风格不一致。

**影响范围**：代码维护和学习成本

**缓解措施**：
- 在 AGENTS.md 中详细说明设计差异的原因
- 函数式实现更适合 fetch，因为 fetch 本质是函数
- 保持一致的文档风格、注释规范、命名约定
- 提供清晰的使用示例和类型定义

**设计权衡**：
- **优点**：函数式实现更简洁、性能更好、符合函数式编程范式
- **缺点**：与 Shell 兼容层模式不同
- **结论**：权衡利弊后选择函数式，因为 fetch 的特性更适合函数式实现

---

### Trade-off 1：灵活性与复杂度的权衡

**权衡描述**：是否提供配置选项让开发者自定义环境判断逻辑

**选择**：不提供配置选项，使用固定的环境判断逻辑

**理由**：
- 当前判断逻辑满足所有已知使用场景
- 遵循"约定优于配置"原则
- 减少配置复杂度，降低学习成本
- 如果未来确实需要，可以通过扩展函数支持配置

---

## Implementation Details

### 文件结构

```
src/utils/tauriCompat/
├── http.ts              # HTTP 兼容层实现（新建）
├── env.ts              # 环境检测工具（已存在）
├── shell.ts            # Shell 兼容层（已存在）
├── os.ts               # OS 兼容层（已存在）
└── index.ts            # 统一导出（需修改）
```

### http.ts 模块设计

**导出内容**：
```typescript
// 类型定义
export type RequestInfo = string | URL | Request;
export type FetchFunc = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

// 功能导出
export const fetch: FetchFunc;
export const getFetchFunc: () => FetchFunc;

// 重新导出原生类型
export type { RequestInit, Response, Headers, Request };
```

**核心函数**：
- `createFetch()`: 异步函数，根据环境判断并创建 fetch 实例
  - 开发环境：返回 Web fetch（同步）
  - 生产 Tauri：动态导入 Tauri fetch（异步，约 10-50ms）
  - 生产 Web：返回 Web fetch（同步）
- `_fetchInstance`: 使用顶层 await 初始化的 fetch 实例（模块级常量）
  - 模块加载时等待 `createFetch()` 完成
  - 后续所有调用直接使用此实例，无需额外判断
- `fetch`: 直接调用的 fetch 函数，委托给 `_fetchInstance`
- `getFetchFunc()`: 获取已初始化的 fetch 实例

**初始化时机**：
- 模块加载时使用顶层 await 等待 `createFetch()` 完成
- 开发/生产 Web 环境：立即完成（0ms 延迟）
- 生产 Tauri 环境：等待动态导入完成（约 10-50ms 一次性延迟）
- 初始化完成后，所有后续调用无额外开销

### index.ts 修改

**新增导出**：
```typescript
// HTTP 插件兼容层
export { fetch, getFetchFunc } from './http';
export type { RequestInfo, FetchFunc, RequestInit, Response, Headers, Request } from './http';
```

### 使用示例

**示例 1：直接使用 fetch**
```typescript
import { fetch } from '@/utils/tauriCompat';

// 发起 GET 请求
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// 发起 POST 请求
const response = await fetch('https://api.example.com/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'test' }),
});
```

**示例 2：使用 getFetchFunc 封装**
```typescript
import { getFetchFunc, type RequestInfo } from '@/utils/tauriCompat';

class ApiClient {
  private fetch: FetchFunc;

  constructor() {
    this.fetch = getFetchFunc();
  }

  async request(url: string, options?: RequestInit) {
    const response = await this.fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
}

const client = new ApiClient();
const data = await client.request('https://api.example.com/data');
```

**示例 3：注入第三方库（如 Axios）**
```typescript
import { getFetchFunc } from '@/utils/tauriCompat';
import axios from 'axios';

const api = axios.create({
  adapter: getFetchFunc(),
});

const response = await api.get('https://api.example.com/data');
```

---

## Migration Plan

### 阶段 1：实现兼容层（不破坏现有功能）

**任务**：
- 创建 `src/utils/tauriCompat/http.ts` 模块
- 更新 `src/utils/tauriCompat/index.ts` 导出
- 运行类型检查确保类型定义正确

**验证**：
- `pnpm tsc` 类型检查通过
- 在开发环境和 Web 环境测试 fetch 调用

---

### 阶段 2：更新现有代码（逐步迁移）

**任务**：
- 使用 `grep` 查找所有使用 `@tauri-apps/plugin-http` 的代码
- 逐个文件替换导入路径：`import { fetch as tauriFetch } from '@tauri-apps/plugin-http'` → `import { fetch } from '@/utils/tauriCompat'`
- 删除 `@tauri-apps/plugin-http` 的直接导入

**验证**：
- 每次替换后运行相关功能测试
- 确保在 Tauri 和 Web 环境都能正常工作

---

### 阶段 3：文档更新

**任务**：
- 在 AGENTS.md 中新增"HTTP 兼容层"章节
- 添加使用示例和最佳实践
- 说明开发环境和生产环境的差异

---

### 阶段 4：清理和优化

**任务**：
- 移除未使用的 `@tauri-apps/plugin-http` 导入（如果存在）
- 运行 lint 检查确保代码质量
- 在 Tauri 生产环境进行完整测试

---

## Rollback Strategy

如果迁移后出现问题，可以按以下步骤回滚：

1. **代码回滚**：
   - 恢复 `import { fetch as tauriFetch } from '@tauri-apps/plugin-http'` 导入
   - 删除 `import { fetch } from '@/utils/tauriCompat'` 替换

2. **兼容层保留**：
   - 保留 `http.ts` 兼容层代码，不影响现有功能
   - 新功能可以选择性使用兼容层

3. **文档回滚**：
   - 从 AGENTS.md 中移除 HTTP 兼容层章节

**回滚风险**：低（兼容层是新增模块，不修改现有代码结构）

---

## Open Questions

**问题 1**：是否需要在 getFetchFunc() 中支持参数化的环境选择？

**状态**：已解决

**决策**：不需要，当前设计已满足所有使用场景。如果未来需要，可以扩展为 `getFetchFunc(options?: { forceWeb?: boolean })`

---

**问题 2**：如何处理需要使用 Tauri 特定功能的场景（如文件上传进度）？

**状态**：已解决

**决策**：本兼容层专注于基础 fetch API。如果需要 Tauri 特定功能，开发者可以直接导入 `@tauri-apps/plugin-http` 使用，但这会失去跨平台兼容性。建议在设计上避免依赖平台特定功能。

---

**问题 3**：是否需要提供 fetch 实例的切换能力（运行时从 Web fetch 切换到 Tauri fetch）？

**状态**：已解决

**决策**：不需要。fetch 实例在首次调用时确定，运行时不需要切换。如果确实需要，可以通过修改 `_fetchInstance` 变量实现，但这不是常见需求。
