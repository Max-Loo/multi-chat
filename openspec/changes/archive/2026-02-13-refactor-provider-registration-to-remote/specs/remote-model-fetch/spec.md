# Remote Model Fetch Capability Specification (Delta)

## REMOVED Requirements

### Requirement: DynamicFetchApi 聊天请求逻辑

**Reason**：聊天请求逻辑已迁移到独立的 `ChatService`，`DynamicFetchApi` 类不再需要。

**Migration**：使用 `ChatService.streamChatCompletion()` 替代 `DynamicFetchApi.fetch()`。

系统 MUST NOT 在 `registerDynamicProviders.ts` 中定义 `DynamicFetchApi` 类。

系统 MUST NOT 在 `DynamicFetchApi` 中实现聊天请求逻辑（如 `fetch()` 方法）。

系统 MUST NOT 在 `DynamicModelProvider` 中创建 `DynamicFetchApi` 实例。

---

### Requirement: BaseFetchApi 基类

**Reason**：所有聊天请求逻辑已迁移到 `ChatService`，`BaseFetchApi` 基类不再需要。

**Migration**：删除 `src/lib/factory/modelProviderFactory/base/BaseFetchApi.ts` 文件。

系统 MUST NOT 使用 `BaseFetchApi` 基类作为 `DynamicModelProvider` 的父类。

系统 MUST NOT 在 `BaseFetchApi` 中定义通用的聊天请求接口。

---

### Requirement: BaseApiAddress 基类

**Reason**：URL 标准化逻辑已迁移到独立的 `UrlNormalizer` 模块，`BaseApiAddress` 基类不再需要。

**Migration**：使用 `UrlNormalizer.normalize()` 替代 `BaseApiAddress` 的 URL 处理逻辑。

系统 MUST NOT 使用 `BaseApiAddress` 基类作为 `DynamicModelProvider` 的父类。

系统 MUST NOT 在 `BaseApiAddress` 中定义 API 地址处理逻辑。

---

## MODIFIED Requirements

### Requirement: 动态注册 Provider 实例

系统 MUST 根据远程获取的供应商数据动态创建 Provider 实例并注册到工厂中。

系统 MUST 使用 `registerDynamicProviders` 函数遍历供应商数据数组。

系统 MUST 为每个供应商创建 `DynamicModelProvider` 实例（基于 `ConfigurableModelProvider` 基类）。

系统 MUST 将创建的 Provider 实例注册到 `ModelProviderFactory` 中，使用 `providerKey` 作为键。

系统 MUST 在 `DynamicModelProvider` 构造函数中设置：
- `key`：从 `remoteProvider.providerKey` 转换为 `ModelProviderKeyEnum`
- `name`：从 `remoteProvider.providerName` 获取
- `modelList`：从 `remoteProvider.models` 获取
- `_apiValue`：从 `remoteProvider.api` 获取（使用对齐后的参数名）

系统 MUST NOT 在 `DynamicModelProvider` 中创建 `DynamicFetchApi` 实例。

系统 MUST NOT 在 `DynamicModelProvider` 中实现 `getFetchApi()` 方法。

#### Scenario: 成功动态注册多个供应商（简化版）

- **WHEN** 从远程获取到 4 个供应商的数据（moonshotai、deepseek、zhipuai、zhipuai-coding-plan）
- **THEN** 系统调用 `registerDynamicProviders` 遍历数据
- **AND** 为每个供应商创建 `DynamicModelProvider` 实例
  - 实例的 `key` 设置为 `ModelProviderKeyEnum.MOONSHOTAI`（示例）
  - 实例的 `name` 设置为供应商名称
  - 实例的 `modelList` 设置为模型列表
  - 实例的 `_apiValue` 设置为 API 地址
- **AND** 将实例注册到工厂中，键为 `providerKey`
- **AND** 注册完成后，系统可以通过工厂创建这些供应商的实例

#### Scenario: DynamicModelProvider 不包含聊天请求逻辑

- **WHEN** `DynamicModelProvider` 实例被创建
- **THEN** 实例不包含 `DynamicFetchApi` 实例
- **AND** 实例不包含 `getFetchApi()` 方法
- **AND** 实例不包含 `fetch()` 方法
- **AND** 实例只负责元数据管理（供应商名称、模型列表、API 地址）
