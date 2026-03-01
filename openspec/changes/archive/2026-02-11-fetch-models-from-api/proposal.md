## Why

当前应用中的模型供应商（Model Providers）数据是硬编码的，每次添加新模型或供应商都需要手动更新代码。这不仅增加了维护成本，还导致用户无法及时获得最新的模型信息。models.dev 提供了标准化的 API（`https://models.dev/api.json`），可以集中管理和更新模型数据，改为从该 API 动态获取可以自动同步最新模型，降低维护成本并提升用户体验。

## What Changes

- **新增远程数据获取能力**：从 `https://models.dev/api.json` API 动态获取模型供应商数据
- **应用启动时自动更新**：每次应用启动时自动请求最新数据，失败时降级到本地缓存
- **手动刷新功能**：在设置页面添加"刷新模型数据"按钮，允许用户手动触发更新
- **供应商过滤机制**：从 API 响应中只提取需要的供应商，并在常量文件中维护允许的供应商列表
- **数据缓存策略**：使用本地 store 缓存获取的模型数据，确保离线可用性
- **错误处理和降级**：网络请求失败时使用缓存数据，保证应用正常运行

## Capabilities

### New Capabilities
- `remote-model-fetch`: 从远程 API 动态获取和管理模型供应商数据，包括启动时自动更新、手动刷新、供应商过滤、缓存机制和错误降级处理

### Modified Capabilities
（无现有 spec 需要修改）

## Impact

**受影响的代码模块**：
- 模型数据加载逻辑（`src/store/storage/`）
- 设置页面组件（添加刷新按钮）
- 常量文件（添加供应商白名单列表）
- 可能需要新增模型数据服务层（`src/services/modelService.ts` 或类似）

**数据存储**：
- 需要在 store 中存储远程获取的模型数据
- 需要缓存最后更新时间戳（用于判断数据新鲜度）

**外部依赖**：
- 网络请求：使用现有的 `@/utils/tauriCompat/http.ts` 中的 `fetch` 函数
- 无需新增第三方库

**供应商过滤**：
- 在 `src/utils/constants.ts` 或 `src/constants/model.ts` 中定义 `ALLOWED_MODEL_PROVIDERS` 常量
- 当前支持的供应商：`moonshotai`（Kimi）、`deepseek`、`zhipuai`（智谱 AI）、`zhipuai-coding-plan`（智谱 AI 编程模型）

**兼容性**：
- 确保 Tauri 和 Web 环境都能正常工作（通过 tauriCompat 兼容层）
- 确保在离线环境下应用仍可正常运行（使用缓存数据降级）
- API 响应格式变化时需要适配层处理
