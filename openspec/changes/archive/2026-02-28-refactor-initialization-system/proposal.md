# 提案：重构初始化系统

## Why

当前应用的初始化逻辑存在多个问题：

1. **错误处理不统一**：不同初始化步骤的错误处理方式不一致，有些静默失败（如 `initI18n`），有些抛出异常但未被捕获（如 `initializeMasterKey`），导致应用可能卡在加载屏幕
2. **缺乏统一的错误展示**：用户在初始化失败时无法得知具体的错误原因和恢复建议
3. **无法支持依赖关系**：初始化步骤之间无法声明依赖关系，未来需要添加依赖其他步骤的初始化逻辑时难以扩展
4. **开发体验差**：初始化逻辑分散在多处，添加新初始化步骤需要修改 `main.tsx`，缺乏统一的配置管理

这些问题影响用户体验和应用的可维护性，需要建立统一的初始化管理系统。

## What Changes

### 核心改动

- **新增初始化管理器**：实现 `InitializationManager` 类，统一管理所有初始化步骤的执行、错误处理和状态管理
- **新增执行上下文**：实现 `ExecutionContext` 接口，支持在初始化步骤之间传递数据（如主密钥、语言配置等）
- **新增依赖声明机制**：在初始化步骤中支持 `dependencies` 字段，自动进行拓扑排序，优化并行执行
- **实现三级错误处理**：
  - **致命错误**（fatal）：显示全屏错误提示，提供"刷新页面"按钮
  - **警告错误**（warning）：显示 Toast 弹窗通知，不打断用户操作
  - **可忽略错误**（ignorable）：在控制台输出错误信息
- **简化架构，统一入口**：将 `AppRoot.tsx` 的逻辑融入 `main.tsx`，实现单一入口和初始化逻辑
  - `modelProvider` 的致命错误检查在初始化完成后直接在 `main.tsx` 中处理
  - 移除 `AppRoot.tsx` 组件，减少不必要的组件层
  - `main.tsx` 完整负责：初始化 → 错误检查 → 渲染应用 → 显示警告
- **新增 UI 组件**：
  - `<FatalErrorScreen />`：显示致命错误和恢复选项
  - `<InitializationScreen />`：替代当前的 `<FullscreenLoading />`，提供骨架屏动画
- **集中管理初始化配置**：创建 `config/initSteps.ts` 文件，统一管理所有初始化步骤的定义
- **重构 `main.tsx`**：使用新的初始化系统，融入 `AppRoot` 的错误处理逻辑，成为应用的唯一入口

### 具体文件变更

**新增文件**：
- `src/lib/initialization/InitializationManager.ts`：初始化管理器核心逻辑
- `src/lib/initialization/types.ts`：类型定义
- `src/lib/initialization/index.ts`：导出模块
- `src/components/InitializationScreen/index.tsx`：初始化屏幕组件
- `src/components/FatalErrorScreen/index.tsx`：致命错误屏幕组件
- `src/config/initSteps.ts`：初始化步骤配置

**修改文件**：
- `src/main.tsx`：使用 `InitializationManager` 重构初始化流程，并融入 `AppRoot.tsx` 的逻辑，实现单一入口
- `src/lib/i18n.ts`：移除 `initI18n()` 函数中的 try-catch，让错误向上传播以便 `InitializationManager` 捕获
- 可能需要更新国际化文件：`src/locales/zh/common.json`、`src/locales/en/common.json`（新增错误提示文本）

**移除文件**：
- `src/components/FullscreenLoading/index.tsx`：被 `InitializationScreen` 替代
- `src/components/AppRoot.tsx`：逻辑融入 `main.tsx`，简化架构

### 现有模块适配说明

现有初始化函数需要轻微调整以适配新的初始化系统：

#### 1. 独立函数改造

**`initI18n()` - `src/lib/i18n.ts`**
- **当前问题**：函数内部捕获异常并返回 `undefined`，阻止错误向上传播
- **改造内容**：移除 try-catch 块，让初始化失败时抛出错误
- **影响范围**：仅修改该函数的错误处理逻辑，不影响其他代码
- **向后兼容**：保留函数签名和导出，不影响现有调用

**`initializeMasterKey()` - `src/store/keyring/masterKey.ts`**
- **无需改造**：函数本身正确抛出错误并返回主密钥
- **使用方式调整**：在 `InitStep.execute` 中将返回的主密钥存入 `ExecutionContext`

#### 2. Redux Thunk 改造

以下 Redux Thunk 函数**无需修改内部实现**，但需要改变调用方式：

**`initializeModels()` - `src/store/slices/modelSlice.ts`**
**`initializeChatList()` - `src/store/slices/chatSlices.ts`**
**`initializeAppLanguage()` - `src/store/slices/appConfigSlices.ts`**
**`initializeIncludeReasoningContent()` - `src/store/slices/appConfigSlices.ts`**
**`initializeModelProvider()` - `src/store/slices/modelProviderSlice.ts`**

- **当前调用方式**：`store.dispatch(initializeModels())`
- **新的调用方式**：`await store.dispatch(initializeModels()).unwrap()`
- **改造原因**：
  - Redux Toolkit 的 Thunk 返回 Promise
  - 使用 `.unwrap()` 可以等待完成并在失败时抛出错误
  - 使错误能被 `InitializationManager` 统一捕获和处理
- **影响范围**：仅在 `config/initSteps.ts` 中改变调用方式，不影响 Thunk 内部实现
- **向后兼容**：保留 Thunk 的原有导出，不影响其他代码中的 dispatch 调用

#### 3. 适配层实现

**`config/initSteps.ts`（新增）**
- 定义所有 `InitStep` 配置
- 封装现有初始化函数的调用逻辑
- 处理 `ExecutionContext` 的读写（将结果存入 context 供依赖步骤使用）
- 定义每个步骤的错误处理策略（`onError`）
- 示例：
  ```typescript
  {
    name: 'masterKey',
    critical: true,
    execute: async (context) => {
      const key = await initializeMasterKey();
      context.setResult('masterKey', key); // 存入 context
      return key;
    },
    onError: (error) => ({
      severity: 'fatal',
      message: '无法初始化主密钥',
    }),
  },
  {
    name: 'models',
    critical: false,
    dependencies: ['masterKey'], // 声明依赖
    execute: async (context) => {
      // 使用 .unwrap() 等待 Thunk 完成
      const models = await store.dispatch(initializeModels()).unwrap();
      context.setResult('models', models);
      return models;
    },
    onError: (error) => ({
      severity: 'warning',
      message: '模型数据加载失败',
    }),
  }
  ```

### 改造影响评估

| 函数/模块 | 改造类型 | 改造内容 | 影响程度 | 向后兼容 |
|---------|---------|---------|---------|---------|
| `initI18n()` | 修改函数 | 移除 try-catch | 🟢 轻微 | ✅ 是 |
| `initializeMasterKey()` | 使用方式 | 在 InitStep 中存入 context | 🟢 轻微 | ✅ 是 |
| `initializeModels()` | 使用方式 | 使用 `.unwrap()` | 🟢 轻微 | ✅ 是 |
| `initializeChatList()` | 使用方式 | 使用 `.unwrap()` | 🟢 轻微 | ✅ 是 |
| `initializeAppLanguage()` | 使用方式 | 使用 `.unwrap()` | 🟢 轻微 | ✅ 是 |
| `initializeIncludeReasoningContent()` | 使用方式 | 使用 `.unwrap()` | 🟢 轻微 | ✅ 是 |
| `initializeModelProvider()` | 使用方式 | 使用 `.unwrap()` | 🟢 轻微 | ✅ 是 |

**总结**：
- ✅ 所有改造都是轻微的，不影响核心逻辑
- ✅ 所有改动都保持向后兼容，不破坏现有代码
- ✅ 主要通过新增适配层（`config/initSteps.ts`）来集成现有函数

## Capabilities

### New Capabilities

- **`initialization-system`**：统一的初始化管理系统，提供步骤定义、依赖管理、错误处理和进度追踪功能
- **`initialization-error-handling`**：三级错误处理机制，根据错误严重程度提供不同的展示和恢复策略

### Modified Capabilities

- 无（本次变更主要重构实现细节，不改变现有功能的需求规格）

## Impact

### 受影响的代码模块

- **应用入口**：`src/main.tsx` 将从直接调用初始化函数改为使用 `InitializationManager`，并融入 `AppRoot.tsx` 的错误处理逻辑
- **组件架构**：移除 `AppRoot.tsx` 组件，简化组件层级，`main.tsx` 直接渲染 `RouterProvider` 或错误提示
- **Redux Store 初始化**：`initializeModels`、`initializeChatList` 等 Thunk 将作为非关键步骤并行执行
- **错误处理逻辑**：
  - 初始化阶段错误：由 `InitializationManager` 统一处理
  - `modelProvider` 致命错误：在 `main.tsx` 的初始化完成后检查并处理
  - 不再需要在 React 组件中监听 Redux state 进行错误处理

### 受影响的 API

- **内部 API**：初始化步骤的定义接口（`InitStep`、`ExecutionContext`）为新增的内部 API
- **无外部 API 变更**：对用户和外部系统无影响

### 依赖变更

- **无新增外部依赖**：仅使用现有的 Redux、React、TypeScript 和 i18next
- **内部依赖关系变更**：初始化步骤之间可以声明依赖关系，自动优化执行顺序

### 性能影响

- **正面影响**：通过并行执行非关键步骤和步骤间的依赖优化，可能略微提升启动速度
- **可忽略的额外开销**：`InitializationManager` 本身的逻辑开销极小

### 用户体验影响

- **改进**：初始化失败时用户能看到清晰的错误提示和恢复建议
- **改进**：警告错误不会打断用户操作，通过 Toast 友好提示
- **保持不变**：正常情况下的初始化体验（骨架屏动画）与当前一致

### 开发者体验影响

- **改进**：添加新初始化步骤只需在 `config/initSteps.ts` 中添加配置，无需修改 `main.tsx`
- **改进**：统一的错误处理和日志记录，便于调试
- **改进**：支持步骤间依赖声明，便于构建复杂的初始化流程
- **简化**：移除 `AppRoot.tsx`，减少组件层级，应用入口更清晰
- **统一**：所有初始化和启动逻辑集中在 `main.tsx`，更容易理解和维护
