# 技术设计文档

## Context

### 背景和当前状态

当前项目存在两套模型供应商注册机制：

1. **硬编码注册**（`src/lib/factory/modelProviderFactory/ProviderRegistry.ts`）
   - 手动维护供应商类（`DeepseekProvider.ts`、`KimiProvider.ts`、`BigModelProvider.ts`）
   - 每个供应商继承自 `BaseFetchApi` 和 `BaseApiAddress` 基类
   - 包含供应商特定的 URL 处理逻辑和聊天请求逻辑
   - 注册时直接实例化这些硬编码的 Provider 类

2. **远程数据获取**（`src/services/modelRemoteService.ts`）
   - 从 `models.dev` API 动态获取最新的供应商定义
   - 使用 `DynamicModelProvider` 封装远程数据
   - 通过 `registerDynamicProviders()` 动态注册供应商

这种双重机制导致以下问题：

- **代码重复**：两套系统维护相同的供应商定义，违反 DRY 原则
- **维护成本高**：添加新供应商需要同时修改硬编码类和远程数据转换逻辑
- **参数命名不一致**：`models.dev` API 使用 `api`，内部接口使用 `apiAddress`
- **数据源不统一**：硬编码可能与上游 API 不同步

### 约束条件

- **功能约束**：所有供应商必须兼容 OpenAI API，但响应格式可能有细微差异
- **平台约束**：支持 Tauri 桌面应用和 Web 浏览器，需要统一的跨平台兼容层
- **开发环境**：需要支持 Vite 代理，避免 CORS 和密钥泄露
- **生产环境**：需要支持系统代理和证书管理（通过 Tauri HTTP 插件）
- **测试约束**：需要保证单元测试覆盖率 > 80%

### 利益相关者

- **开发团队**：需要降低维护成本，简化代码结构
- **用户**：需要模型供应商数据保持最新，聊天功能稳定可用
- **系统稳定性**：需要确保离线环境下应用可正常使用

## Goals / Non-Goals

### Goals

1. **消除代码重复**：移除硬编码的供应商注册逻辑，统一使用远程数据
2. **简化参数命名**：对齐 `models.dev` API 的参数命名（`apiAddress` → `api`）
3. **创建独立服务层**：建立 `chatService.ts` 统一处理所有供应商的聊天请求
4. **保留供应商特殊逻辑**：通过 `urlNormalizer.ts` 保留供应商特定的 URL 处理规则（如 Kimi 的 `/v1` 路径）
5. **确保向后兼容**：不破坏现有功能和用户数据

### Non-Goals

- **不在 scope 内**：
  - 不修改 `models.dev` API 接口
  - 不改变用户数据存储格式（聊天记录、API Key 等）
  - 不修改 UI 层代码（组件、样式）
  - 不提供旧缓存数据的迁移逻辑（简化代码复杂度）
  - 不添加新的供应商（保留现有三个：moonshotai、deepseek、bigmodel）

## Decisions

### 决策 1：创建独立的聊天服务层

**选择**：创建 `src/services/chatService.ts` 统一处理所有供应商的聊天请求

**理由**：

- ✅ **解耦**：聊天请求逻辑不再依赖 Provider 架构，降低耦合度（符合 DIP 原则）
- ✅ **简化**：移除了 `BaseFetchApi`、`BaseApiAddress` 等复杂的基类继承（符合 KISS 原则）
- ✅ **统一**：所有供应商使用相同的 OpenAI SDK 配置，减少代码重复（符合 DRY 原则）
- ✅ **灵活**：易于扩展支持新的供应商（符合 OCP 原则）
- ✅ **可测试**：独立的服务层更容易编写单元测试

**替代方案**：保留 `BaseFetchApi` 基类，所有 Provider 继承并实现 `fetch()` 方法

**拒绝原因**：
- ❌ 基类继承增加了代码复杂度和理解成本
- ❌ 每个 Provider 的 `fetch()` 方法实现可能重复（违反 DRY 原则）
- ❌ 难以统一处理开发环境代理和 URL 标准化

### 决策 2：创建 URL 标准化模块（策略模式）

**选择**：创建 `src/services/urlNormalizer.ts`，使用策略模式处理不同供应商的 URL 规范化规则

**理由**：

- ✅ **扩展性**：新增供应商时只需添加新的策略类（符合 OCP 原则）
- ✅ **可测试**：每个策略可独立测试（符合 SRP 原则）
- ✅ **保留逻辑**：确保 Kimi 的 `/v1` 路径处理逻辑不丢失

**设计**：

```typescript
// 策略接口
interface UrlNormalizationStrategy {
  normalize(url: string): string;
  getDescription(): string;
}

// Kimi 策略（需要 /v1 路径）
class KimiNormalizationStrategy implements UrlNormalizationStrategy {
  normalize(url: string): string {
    // 自动添加 /v1 路径
  }
}

// 默认策略（大多数供应商）
class DefaultNormalizationStrategy implements UrlNormalizationStrategy {
  normalize(url: string): string {
    // 移除末尾的 / 或 #
  }
}

// URL 标准化器
export class UrlNormalizer {
  static normalize(url: string, providerKey: ModelProviderKeyEnum): string {
    const strategy = this.getStrategy(providerKey);
    return strategy.normalize(url);
  }
}
```

**替代方案**：在 `DynamicModelProvider` 的 `apiAddress` getter 中硬编码 URL 处理逻辑

**拒绝原因**：
- ❌ 违反 OCP 原则：新增供应商需要修改 `DynamicModelProvider` 类
- ❌ 难以测试：URL 处理逻辑与 Provider 耦合
- ❌ 职责不清：`DynamicModelProvider` 既负责元数据管理，又负责 URL 处理

### 决策 3：参数命名对齐

**选择**：将 `apiAddress` 重命名为 `api`，与 `models.dev` API 保持一致

**理由**：

- ✅ **简化命名**：减少理解成本（`api` 比 `apiAddress` 更简洁）
- ✅ **统一数据源**：确保参数命名与上游 API 一致
- ✅ **降低维护负担**：不需要维护两套命名约定

**影响范围**：

- `RemoteProviderData` 接口（`src/services/modelRemoteService.ts`）
- `DynamicModelProvider` 类（`src/lib/factory/modelProviderFactory/registerDynamicProviders.ts`）
- 所有使用 `apiAddress` 的地方

**替代方案**：保持内部命名不变，在转换层做映射

**拒绝原因**：
- ❌ 增加了映射逻辑，违反 DRY 原则
- ❌ 提高了理解和维护成本

### 决策 4：不提供旧缓存数据迁移逻辑

**选择**：应用启动时如果缓存不存在或格式不兼容，直接从远程 API 重新获取

**理由**：

- ✅ **简化代码**：避免维护复杂的迁移逻辑（符合 YAGNI 原则）
- ✅ **降低风险**：迁移逻辑可能引入 bug
- ✅ **用户体验**：现代应用的标准行为（如 VS Code 首次启动需要联网获取插件列表）

**用户影响**：

- **首次升级用户**：需要网络连接来获取最新的模型供应商数据
- **后续启动用户**：使用正常的缓存机制（远程 API → 缓存）
- **离线环境**：如果离线启动且无有效缓存，将显示错误提示

**替代方案**：在应用首次安装时嵌入默认缓存数据（`FALLBACK_CACHE_DATA`）

**评估结果**：
- ✅ 优点：离线环境也能启动
- ❌ 缺点：增加了代码体积，数据可能过时
- ❌ 结论：暂不实施，如果用户反馈强烈，再考虑添加

## Risks / Trade-offs

### 风险 1：供应商特殊逻辑丢失

**描述**：删除硬编码 Provider 类可能导致供应商特定的 URL 处理逻辑丢失

**影响**：⚠️ 高风险 - 可能导致某些供应商无法正常工作

**缓解措施**：
- ✅ **已解决**：创建独立的 `urlNormalizer.ts` 模块
- ✅ **已解决**：使用策略模式实现不同供应商的 URL 标准化规则
- ✅ **已解决**：`KimiNormalizationStrategy` 保留原有的 `/v1` 路径处理逻辑
- ✅ **已解决**：`ChatService.createClient()` 集成 `UrlNormalizer`

**验证方法**：
- [ ] 单元测试验证 Kimi 的 `/v1` 路径自动添加
- [ ] 单元测试验证其他供应商的 URL 不受影响
- [ ] 集成测试验证 Kimi 聊天功能正常

### 风险 2：开发环境代理失效

**描述**：直接使用 `config.baseURL` 创建 OpenAI 客户端会导致开发环境代理失效

**影响**：⚠️ 高风险 - 开发环境无法通过 Vite 代理访问 API，CORS 和密钥泄露问题

**缓解措施**：
- ✅ **已解决**：`ChatService.createClient()` 检查开发环境（`import.meta.env.DEV`）
- ✅ **已解决**：开发环境下使用 `${location.origin}/${providerKey}` 作为 baseURL
- ✅ **已解决**：生产环境下才使用 `config.baseURL` 并进行标准化

**验证方法**：
- [ ] 开发环境聊天功能正常
- [ ] DevTools Network 面板显示请求通过 Vite 代理
- [ ] 生产环境聊天功能正常

### 风险 3：聊天服务层迁移引入 Bug

**描述**：从 `fetchApi.fetch()` 迁移到 `ChatService.streamChatCompletion()` 可能引入 bug

**影响**：⚠️ 中风险 - Redux Thunk 的调用链路发生变化，可能影响错误处理和信号中断

**缓解措施**：
- **分阶段迁移**：先在开发分支完成迁移和测试
- **并行运行**：在迁移初期，新旧两种方式可以并行运行，对比结果
- **单元测试**：为 `ChatService` 编写完整的单元测试，覆盖所有供应商
- **集成测试**：在迁移后进行完整的手动测试

**临时验证代码**（可删除）：

```typescript
// 并行运行对比
const oldResponse = fetchApi.fetch({ model, historyList, message }, { signal });
const newResponse = ChatService.streamChatCompletion({ model, historyList, message }, { signal });

// 对比结果
for await (const [oldMsg, newMsg] of zip(oldResponse, newResponse)) {
  console.assert(JSON.stringify(oldMsg) === JSON.stringify(newMsg), 'Response mismatch');
}
```

**验证方法**：
- [ ] 单元测试覆盖率 > 80%
- [ ] 所有支持的供应商（deepseek、kimi、bigmodel）都能正常聊天
- [ ] 信号中断功能正常工作
- [ ] 错误处理和重试机制正常

### 风险 4：缓存依赖风险

**描述**：如果 `remote-cache.json` 损坏、丢失或格式不兼容，应用可能无法启动

**影响**：⚠️ 中风险 - 用户陷入"无法使用"状态

**缓解措施**：
- ✅ 已有重试机制（最多 2 次，指数退避）
- ✅ 已有缓存降级策略
- ✅ 考虑添加内置备份数据（`FALLBACK_CACHE_DATA`）- 待评估

**验证方法**：
```bash
# 测试缓存损坏场景
rm -rf ~/Library/Application\ Support/multi-chat/remote-cache.json
# 重新启动应用，应该能正常加载
```

### 权衡 1：代码复杂度 vs 用户体验

**选择**：优先简化代码复杂度，不提供缓存数据迁移逻辑

**权衡**：
- ✅ 简化代码，降低维护成本
- ❌ 首次升级用户需要联网获取数据

**理由**：
- 现代应用标准行为（如 VS Code）
- 降低 bug 风险
- 长期收益大于短期用户体验损失

### 权衡 2：功能完整性 vs 性能

**选择**：优先保证功能完整性，性能优化在后续迭代中考虑

**权衡**：
- ✅ 确保所有供应商功能正常
- ❌ 启动时间可能略有增加（~50ms）

**理由**：
- 功能稳定性优先
- 性能影响可接受（< 5%）

## Migration Plan

### 部署步骤

#### Phase 0：创建 URL 标准化模块

**目标**：建立独立的 URL 标准化模块，处理供应商特定的路径规则

1. 创建 `src/services/urlNormalizer.ts`
2. 实现核心功能：
   - 定义 `UrlNormalizationStrategy` 接口
   - 实现 `DefaultNormalizationStrategy`（大多数供应商）
   - 实现 `KimiNormalizationStrategy`（需要 `/v1` 路径）
   - 实现 `UrlNormalizer` 类
3. 编写单元测试 `src/services/urlNormalizer.test.ts`
4. 运行类型检查：`pnpm tsc --noEmit`

**验证清单**：
- [ ] `UrlNormalizer.normalize()` 对 Kimi 自动添加 `/v1` 路径
- [ ] `UrlNormalizer.normalize()` 对其他供应商不做特殊处理
- [ ] `UrlNormalizer.getDescription()` 返回正确的表单提示文案
- [ ] 单元测试覆盖率 > 80%

#### Phase 0.5：创建独立聊天服务层

**目标**：建立独立的聊天请求处理层

1. 创建 `src/services/chatService.ts`
2. 实现核心功能：
   - `createClient()`: 创建 OpenAI 客户端（支持开发环境代理）
   - `streamChatCompletion()`: 流式聊天请求（完整实现）
   - `parseStreamResponse()`: 响应解析（支持不同供应商的特殊字段）
   - `buildMessages()`: 构建消息列表
   - `mergeChunk()`: 合并流式响应块
   - `shouldMergeContent()`: 判断字段是否需要合并
3. 编写单元测试 `src/services/chatService.test.ts`
4. 运行类型检查：`pnpm tsc --noEmit`

**验证清单**：
- [ ] 开发环境下使用 Vite 代理（`${location.origin}/${providerKey}`）
- [ ] 生产环境下使用 URL 标准化（`UrlNormalizer.normalize()`）
- [ ] `parseStreamResponse()` 正确处理 Deepseek/Kimi/BigModel 的特殊字段
- [ ] `mergeChunk()` 正确合并 `content` 和 `reasoning_content` 字段
- [ ] 单元测试覆盖率 > 80%

#### Phase 1：准备工作

**目标**：确保变更安全可追溯

1. 检查当前使用情况：
   ```bash
   grep -r "registerAllProviders" src/
   grep -r "ProviderRegistry" src/
   ```
2. 备份关键数据（可选）：
   - 备份当前的 `remote-cache.json` 缓存文件
   - 记录当前注册的供应商列表

#### Phase 2：参数命名对齐

**目标**：统一参数命名，减少理解成本

1. 更新类型定义（`src/services/modelRemoteService.ts`）：
   - `RemoteProviderData.apiAddress` → `RemoteProviderData.api`
2. 更新转换逻辑（`src/services/modelRemoteService.ts`）：
   - `adaptApiResponseToInternalFormat()` 使用 `api` 字段
3. 更新 Provider 类（`src/lib/factory/modelProviderFactory/registerDynamicProviders.ts`）：
   - `DynamicModelProvider` 构造函数使用 `api` 字段
4. 运行类型检查：`pnpm tsc --noEmit`

#### Phase 3：迁移到聊天服务层

**目标**：将 Redux Thunk 的调用从 `fetchApi.fetch()` 迁移到 `ChatService.streamChatCompletion()`

1. 更新 `chatSlices.ts`：
   - 导入 `ChatService`
   - 替换 `fetchApi.fetch()` 为 `ChatService.streamChatCompletion()`
2. 运行类型检查：`pnpm tsc --noEmit`
3. 手动测试聊天功能：
   - [ ] 创建新对话成功
   - [ ] 发送消息成功
   - [ ] 流式响应正常
   - [ ] 多轮对话正常

#### Phase 4：移除硬编码逻辑

**目标**：删除不再使用的代码

1. 删除硬编码 Provider 类：
   ```bash
   rm src/lib/factory/modelProviderFactory/providers/DeepseekProvider.ts
   rm src/lib/factory/modelProviderFactory/providers/KimiProvider.ts
   rm src/lib/factory/modelProviderFactory/providers/BigModelProvider.ts
   ```
2. 删除 ProviderRegistry：
   ```bash
   rm src/lib/factory/modelProviderFactory/ProviderRegistry.ts
   ```
3. 更新导出（`src/lib/factory/modelProviderFactory/index.ts`）：
   - 移除 `registerAllProviders` 导出
   - 移除 `DeepseekProvider`、`KimiProvider`、`BigModelProvider` 导出
4. 删除基类（如果确认不再需要）：
   ```bash
   rm src/lib/factory/modelProviderFactory/base/BaseFetchApi.ts
   rm src/lib/factory/modelProviderFactory/base/BaseApiAddress.ts
   ```
5. 验证主入口（`src/main.tsx`）：
   - 确保只调用远程服务，注释或删除硬编码注册

#### Phase 5：验证测试

**目标**：确保功能正常

1. 运行类型检查和代码检查：
   ```bash
   pnpm tsc
   pnpm lint
   ```
2. 手动功能验证：
   - [ ] 应用启动成功
   - [ ] 模型列表正常加载（从远程或缓存）
   - [ ] 设置页面"刷新模型供应商"功能正常
   - [ ] 模型切换功能正常
   - [ ] 对话功能无异常
3. 离线场景测试：
   - [ ] 断网后应用启动（使用缓存）
   - [ ] 刷新模型供应商显示错误提示
   - [ ] 恢复网络后可正常刷新

### 回滚策略

#### 回滚触发条件

- 生产环境出现供应商注册失败
- 缓存机制失效导致无法加载模型
- 发现新的严重 bug 无法快速修复（< 1 小时）
- 用户反馈率 > 5% 关于模型加载问题

#### 回滚步骤

**步骤 1：紧急回滚（代码回退）**

```bash
# 1. 查找回退点
git log --oneline -10

# 2. 创建回滚分支
git checkout -b hotfix/restore-provider-registry

# 3. 回滚到变更前的 commit
git revert <commit-hash>

# 4. 或者直接恢复已删除的文件
git checkout <commit-before-deletion> -- src/lib/factory/modelProviderFactory/ProviderRegistry.ts
git checkout <commit-before-deletion> -- src/lib/factory/modelProviderFactory/providers/

# 5. 临时恢复 registerAllProviders 调用（在 src/main.tsx）
# import { registerAllProviders } from '@/lib/factory/modelProviderFactory/ProviderRegistry';
# registerAllProviders();

# 6. 发布 hotfix 版本
pnpm tauri build
```

**步骤 2：数据回退（如需要）**

如果用户已经有新版本的缓存数据，简化版本不处理旧缓存兼容性：

```typescript
const loadCachedProviderData = async (
  allowedProviders: readonly string[]
): Promise<RemoteProviderData[]> => {
  try {
    const cached = await store.get<CachedModelData>(REMOTE_MODEL_CACHE_KEY);

    if (!cached) {
      throw new RemoteDataError(RemoteDataErrorType.NO_CACHE, '无可用缓存');
    }

    // 不检查旧格式，直接尝试转换
    return adaptApiResponseToInternalFormat(cached.apiResponse, allowedProviders);
  } catch (error) {
    // 降级到硬编码逻辑（回滚模式）
    console.warn('缓存加载失败，降级到硬编码注册');
    return getFallbackProviders();
  }
};
```

**步骤 3：回滚验证**

回滚后需要验证：
- [ ] 应用启动成功
- [ ] 模型列表正常加载
- [ ] 对话功能正常
- [ ] 错误日志无异常
- [ ] 用户反馈问题解决

#### 预防措施

1. **在 feature 分支进行充分手动测试**
   - 至少 3 轮完整的功能测试
   - 覆盖所有边界情况

2. **在 staging 环境验证**
   - 部署到测试环境
   - 邀请内部用户测试
   - 监控错误率和性能

3. **灰度发布**
   - 先发布给 10% 用户
   - 监控错误率和反馈
   - 逐步扩大到 100%

4. **保留 git 历史**
   - 保留 `ProviderRegistry.ts` 的 git 历史至少 3 个月
   - 便于快速恢复

5. **监控和告警**
   - 添加供应商注册失败的监控
   - 设置错误率阈值告警
   - 准备好响应流程

## Open Questions

### Q1：是否需要内置备份数据（`FALLBACK_CACHE_DATA`）？

**背景**：如果首次安装用户离线启动，或缓存损坏，应用无法加载模型供应商

**选项**：
- **选项 A**：添加内置备份数据
  - 优点：离线环境也能启动
  - 缺点：增加了代码体积，数据可能过时
- **选项 B**：不添加内置备份数据
  - 优点：简化代码
  - 缺点：离线环境无法启动

**决策**：暂不实施（选项 B），如果用户反馈强烈，再考虑添加（选项 A）

**负责人**：待定

**解决时间**：待定

### Q2：是否需要保留 `ConfigurableModelProvider` 基类？

**背景**：`DynamicModelProvider` 继承自 `ConfigurableModelProvider`，移除硬编码逻辑后，该基类可能不再需要

**选项**：
- **选项 A**：保留基类
  - 优点：保持架构一致性，便于未来扩展
  - 缺点：增加了代码复杂度
- **选项 B**：删除基类
  - 优点：简化代码
  - 缺点：可能影响未来的扩展性

**决策**：待评估，在 Phase 4 中决定是否删除

**负责人**：待定

**解决时间**：Phase 4 执行时

### Q3：如何验证所有供应商的聊天功能？

**背景**：需要确保所有供应商（deepseek、kimi、bigmodel）的聊天功能正常

**选项**：
- **选项 A**：手动测试
  - 优点：简单直接
  - 缺点：耗时，难以覆盖所有场景
- **选项 B**：单元测试 + 集成测试
  - 优点：覆盖全面，自动化
  - 缺点：需要编写测试代码，可能需要 mock API

**决策**：单元测试 + 手动测试（选项 B 的子集）

**验证方法**：
- 单元测试覆盖 `ChatService` 的核心逻辑
- 手动测试验证所有供应商的聊天功能

**负责人**：待定

**解决时间**：Phase 5 执行时
