# 模型供应商列表功能测试计划

## 文档信息

- **创建日期**: 2026-03-12
- **版本**: 1.1
- **测试类型**: E2E (Playwright + Tauri)
- **测试范围**: 模型供应商列表完整功能测试
- **修订说明**: 根据代码审查建议修正 Tauri 测试配置、缓存清除方法、网络节流策略、性能测量方法等

## 1. 测试概述

### 1.1 测试目标

验证 Multi-Chat 应用的模型供应商列表功能完整性和用户体验一致性，包括：

- 供应商数据获取流程（远程 API 或本地缓存）
- 供应商列表初始化流程
- 供应商列表展示和交互
- 供应商卡片展开/折叠操作
- 手动刷新功能
- 后台静默刷新机制
- 错误处理和降级策略
- 缓存管理

### 1.2 系统架构

```
应用启动
    ↓
初始化模型供应商 (initializeModelProvider)
    ├── 优先加载缓存（快速路径）
    │   └── 缓存有效 → 立即返回
    └── 无缓存/缓存无效 → 远程请求
        ├── 成功 → 保存缓存 → 返回数据
        └── 失败 → 返回错误状态
    ↓
后台静默刷新 (silentRefreshModelProvider)
    └── 更新数据新鲜度（失败静默处理）
    ↓
组件渲染
    ├── ProviderHeader（标题、刷新按钮、最后更新时间）
    ├── ErrorAlert（错误提示）
    └── ProviderGrid（供应商卡片网格）
        └── ProviderCard（供应商卡片）
            ├── ProviderCardHeader（名称、状态）
            ├── ProviderCardSummary（模型数量）
            └── ProviderCardDetails（模型列表、API 端点）
```

### 1.3 支持的供应商白名单

| 供应商 Key | 供应商名称 | API 端点 |
|-----------|----------|---------|
| `moonshotai` | Kimi | https://api.moonshot.ai |
| `deepseek` | DeepSeek | https://api.deepseek.com |
| `zhipuai` | Zhipu | https://open.bigmodel.cn |
| `zhipuai-coding-plan` | Zhipu Coding Plan | - |

### 1.4 核心配置

| 配置项 | 值 | 说明 |
|-------|---|------|
| API 端点 | https://models.dev/api.json | 远程模型数据源 |
| 请求超时 | 5000ms | 单次请求超时时间 |
| 最大重试次数 | 2 | 失败后重试次数 |
| 重试延迟基数 | 1000ms | 指数退避基数 |
| 缓存过期时间 | 24 小时 | 本地缓存有效期 |
| 缓存文件 | remote-cache.json | Tauri 持久化存储 |

---

## 2. 测试场景

### 2.1 初始化流程测试

#### 2.1.1 首次启动（无缓存）

**测试 ID**: `provider-init-001`

**测试目标**: 验证首次启动时从远程 API 获取供应商数据

**前置条件**:
- 清除本地缓存
- 网络连接正常

**测试步骤**:

1. 清除应用缓存
   - **Web 版本**：清除 localStorage 或使用浏览器开发者工具
   - **Tauri 开发版**：删除 `~/Library/Application Support/com.multi-chat.app/remote-cache.json`（macOS）
   - **Tauri 测试**：使用 `clearModelProviderCache()` 辅助函数
2. 启动应用，等待初始化完成
3. 观察网络请求（Network 面板）
4. 导航到设置 → 常规设置 → 模型供应商
5. 验证供应商列表正确显示
6. 验证最后更新时间显示为当前时间

**预期结果**:
- 发起 API 请求到 `https://models.dev/api.json`
- 供应商数据成功加载并显示
- 缓存文件被创建
- 最后更新时间正确显示

**验证点**:
- Network 面板显示 API 请求
- 供应商卡片数量与白名单一致（4 个）
- 每个供应商卡片显示正确的名称和模型数量

---

#### 2.1.2 使用缓存启动（快速路径）

**测试 ID**: `provider-init-002`

**测试目标**: 验证缓存数据存在时优先使用缓存（快速路径）

**前置条件**:
- 本地存在有效的缓存数据
- 缓存数据未过期

**测试步骤**:

1. 确保本地存在有效的缓存文件
2. 启动应用，等待初始化完成
3. 观察网络请求（Network 面板）
4. 验证没有立即发起远程 API 请求
5. 导航到设置 → 常规设置 → 模型供应商
6. 验证供应商列表立即显示

**预期结果**:
- 启动时不立即发起 API 请求
- 供应商数据从缓存立即加载
- 后台静默刷新在稍后触发
- 用户体验流畅，无等待

**验证点**:
- 初始化加载时间 < 100ms
- 供应商列表立即可见
- 后台刷新 Network 请求在页面加载后出现

---

#### 2.1.3 缓存无效时降级到远程请求

**测试 ID**: `provider-init-003`

**测试目标**: 验证缓存数据格式无效时自动降级到远程请求

**前置条件**:
- 本地存在无效的缓存文件（空数组或损坏数据）

**测试步骤**:

1. 在缓存文件中写入无效数据（如 `[]`）
2. 启动应用，等待初始化完成
3. 观察网络请求
4. 导航到设置 → 常规设置 → 模型供应商
5. 验证供应商列表正确显示

**预期结果**:
- 检测到无效缓存
- 自动发起远程 API 请求
- 供应商数据成功加载
- 缓存被更新为有效数据

**验证点**:
- Network 面板显示 API 请求
- 控制台无严重错误
- 供应商列表正确显示

---

#### 2.1.4 无网络且无缓存

**测试 ID**: `provider-init-004`

**测试目标**: 验证无网络且无缓存时的错误处理

**前置条件**:
- 清除本地缓存
- 断开网络连接

**测试步骤**:

1. 清除应用缓存
2. 断开网络连接（Chrome DevTools Network → Offline）
3. 启动应用
4. 观察应用行为
5. 验证显示无供应商可用错误页面

**预期结果**:
- 应用检测到无法获取供应商数据
- 显示 `NoProvidersAvailable` 组件
- 提示用户检查网络连接
- 提供重新加载按钮

**验证点**:
- 全屏显示错误提示
- 错误消息为 "无法获取模型供应商数据，请检查网络连接"
- 重新加载按钮可点击

---

#### 2.1.5 缓存过期后自动刷新

**测试 ID**: `provider-init-005`

**测试目标**: 验证缓存数据过期时自动发起新的远程请求

**前置条件**:
- 本地存在过期的缓存数据（模拟 25 小时前的缓存）
- 网络连接正常

**测试步骤**:

1. 修改缓存文件中的 `metadata.lastRemoteUpdate` 为 25 小时前的时间戳
2. 启动应用，等待初始化完成
3. 观察网络请求（Network 面板）
4. 验证自动发起新的 API 请求
5. 验证供应商数据被更新
6. 验证最后更新时间更新为当前时间

**预期结果**:
- 检测到缓存过期
- 自动发起远程 API 请求
- 新数据成功加载并缓存
- 最后更新时间更新

**验证点**:
- Network 面板显示 API 请求
- 供应商数据正确显示
- 缓存文件被更新

**测试数据准备**:

```typescript
// 模拟过期缓存数据
const expiredCache = {
  apiResponse: { /* 原始 API 响应 */ },
  metadata: {
    lastRemoteUpdate: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 小时前
    source: "remote"
  }
};
```

---

### 2.2 刷新功能测试

#### 2.2.1 手动刷新成功

**测试 ID**: `provider-refresh-001`

**测试目标**: 验证手动刷新按钮正常工作

**前置条件**:
- 应用已启动
- 用户处于设置页面

**测试步骤**:

1. 导航到设置 → 常规设置 → 模型供应商
2. 点击 "刷新模型供应商" 按钮
3. 观察按钮状态变化
4. 等待刷新完成
5. 验证 Toast 提示显示成功
6. 验证最后更新时间更新

**预期结果**:
- 点击后按钮显示 "刷新中..." 并禁用
- 刷新图标旋转动画
- Toast 提示 "模型供应商数据已更新"
- 最后更新时间更新为当前时间

**验证点**:
- 按钮 loading 状态正确
- Toast 消息内容正确
- Network 面板显示 API 请求

---

#### 2.2.2 手动刷新失败（网络错误）

**测试 ID**: `provider-refresh-002`

**测试目标**: 验证刷新失败时的错误处理

**前置条件**:
- 应用已启动
- 可模拟网络失败

**测试步骤**:

1. 导航到设置 → 常规设置 → 模型供应商
2. 在 Network 面板中阻止 API 请求（Block request URL）
3. 点击 "刷新模型供应商" 按钮
4. 等待请求失败
5. 验证 Toast 提示显示错误
6. 验证错误提示框显示

**预期结果**:
- Toast 提示 "刷新失败"
- 红色错误提示框显示详细错误信息
- 供应商列表保持原有数据不变

**验证点**:
- Toast 类型为 error
- ErrorAlert 组件正确渲染
- 供应商数据未被清空

---

#### 2.2.3 刷新过程中取消请求

**测试 ID**: `provider-refresh-003`

**测试目标**: 验证刷新过程中组件卸载时请求被取消

**前置条件**:
- 应用已启动
- Network 面板设置为 Slow 3G

**测试步骤**:

1. 导航到设置 → 常规设置 → 模型供应商
2. 设置网络为 Slow 3G
3. 点击 "刷新模型供应商" 按钮
4. 在请求完成前导航到其他页面
5. 观察 Network 面板

**预期结果**:
- 组件卸载时 AbortController 取消请求
- Network 面板显示请求被取消
- 无未处理的 Promise 错误

**验证点**:
- 控制台无错误日志
- 请求状态为 canceled

---

#### 2.2.4 后台静默刷新成功

**测试 ID**: `provider-refresh-004`

**测试目标**: 验证应用初始化后自动触发后台刷新

**前置条件**:
- 本地存在有效缓存
- 网络连接正常

**测试步骤**:

1. 确保本地存在缓存
2. 启动应用
3. 打开 Network 面板
4. 等待页面加载完成
5. 观察是否有后台 API 请求
6. 验证供应商数据被更新

**预期结果**:
- 应用启动后几秒内触发后台刷新
- 刷新成功时静默更新数据
- 不显示任何 Toast 提示
- 最后更新时间更新

**验证点**:
- Network 面板显示后台请求
- 控制台日志显示刷新成功
- 无 Toast 弹出

---

#### 2.2.5 后台静默刷新失败

**测试 ID**: `provider-refresh-005`

**测试目标**: 验证后台刷新失败时静默处理，不影响用户

**前置条件**:
- 本地存在有效缓存
- 可模拟网络失败

**测试步骤**:

1. 确保本地存在缓存
2. 在 Network 面板中阻止 API 请求
3. 启动应用
4. 等待后台刷新尝试
5. 验证应用正常运行

**预期结果**:
- 后台刷新失败时不显示任何错误
- 应用继续使用缓存数据
- 用户体验不受影响
- 控制台有失败日志

**验证点**:
- 无 Toast 提示
- 供应商列表正常显示
- 控制台日志显示刷新失败

---

#### 2.2.6 并发刷新控制

**测试 ID**: `provider-refresh-006`

**测试目标**: 验证防止并发刷新请求

**前置条件**:
- 应用已启动
- Network 面板设置为 Slow 3G

**测试步骤**:

1. 导航到设置 → 常规设置 → 模型供应商
2. 设置网络为 Slow 3G
3. 点击 "刷新模型供应商" 按钮
4. 立即再次点击按钮（在第一次完成前）
5. 观察按钮状态和网络请求

**预期结果**:
- 第一次点击后按钮被禁用
- 第二次点击无效果
- 只有一个网络请求被发出

**验证点**:
- 按钮禁用状态正确
- Network 面板只有一个请求

---

### 2.3 供应商列表展示测试

#### 2.3.1 供应商卡片基本展示

**测试 ID**: `provider-display-001`

**测试目标**: 验证供应商卡片正确展示所有信息

**前置条件**:
- 应用已启动
- 供应商数据已加载

**测试步骤**:

1. 导航到设置 → 常规设置 → 模型供应商
2. 观察供应商卡片列表
3. 验证每个卡片包含：
   - 供应商名称
   - 供应商状态（可用/不可用）
   - 模型数量
   - 展开/折叠指示

**预期结果**:
- 所有白名单供应商正确显示
- 卡片布局整齐，无溢出
- 状态标签正确显示

**验证点**:
- 4 个供应商卡片全部显示
- 状态标签为 "可用" 或 "Available"
- 模型数量显示正确格式

---

#### 2.3.2 供应商卡片展开/折叠

**测试 ID**: `provider-display-002`

**测试目标**: 验证点击供应商卡片可以展开/折叠详情

**前置条件**:
- 应用已启动
- 供应商数据已加载

**测试步骤**:

1. 导航到设置 → 常规设置 → 模型供应商
2. 点击第一个供应商卡片
3. 验证卡片展开，显示详情
4. 再次点击同一卡片
5. 验证卡片折叠，隐藏详情
6. 点击多个卡片，验证可以同时展开多个

**预期结果**:
- 点击卡片切换展开/折叠状态
- 展开时显示模型列表和 API 端点
- 可以同时展开多个卡片
- 动画过渡流畅

**验证点**:
- 展开状态视觉反馈正确
- 模型列表正确渲染
- API 端点信息显示

---

#### 2.3.3 供应商详情展示

**测试 ID**: `provider-display-003`

**测试目标**: 验证展开后显示完整的供应商详情

**前置条件**:
- 应用已启动
- 供应商数据已加载

**测试步骤**:

1. 导航到设置 → 常规设置 → 模型供应商
2. 点击 DeepSeek 供应商卡片展开
3. 验证详情区域显示：
   - API 端点地址
   - 供应商 ID
   - 模型列表（名称和 ID）
   - 文档链接按钮

**预期结果**:
- 所有详情信息正确显示
- 模型列表可滚动（如果模型较多）
- 文档链接可点击

**验证点**:
- API 端点格式正确
- 模型列表完整
- 文档链接 URL 正确

---

#### 2.3.4 空数据状态

**测试 ID**: `provider-display-004`

**测试目标**: 验证供应商数据为空时的提示

**前置条件**:
- 供应商列表为空（通过 mock 或特殊场景）

**测试步骤**:

1. 模拟供应商数据为空的情况
2. 导航到设置 → 常规设置 → 模型供应商
3. 验证显示空状态提示

**预期结果**:
- 显示 "暂无模型供应商数据" 提示
- 布局居中显示

**验证点**:
- 空状态文本正确显示
- 无 JavaScript 错误

---

#### 2.3.5 响应式布局

**测试 ID**: `provider-display-005`

**测试目标**: 验证供应商网格在不同屏幕尺寸下的响应式布局

**前置条件**:
- 应用已启动

**测试步骤**:

1. 导航到设置 → 常规设置 → 模型供应商
2. 调整浏览器窗口宽度
3. 验证布局变化：
   - 宽屏（≥ 1560px）：3 列
   - 中屏（1024px - 1560px）：2 列
   - 小屏（< 1024px）：1 列

**预期结果**:
- 网格自动适应屏幕宽度
- 卡片不被截断
- 布局整洁美观

**验证点**:
- 各断点布局正确
- 卡片宽度自适应
- 无水平滚动条

---

### 2.4 错误处理测试

#### 2.4.1 网络超时

**测试 ID**: `provider-error-001`

**测试目标**: 验证网络超时时的重试机制

**前置条件**:
- 可模拟网络超时

**测试步骤**:

1. 设置网络延迟超过 5 秒
2. 清除本地缓存
3. 启动应用
4. 观察网络请求
5. 验证重试行为

**预期结果**:
- 首次请求超时后自动重试
- 重试间隔为指数退避（首次失败后 1s 重试，第二次失败后 2s 重试）
- 最多重试 2 次（共 3 次尝试）
- 最终失败时显示错误

**验证点**:
- Network 面板显示多次请求
- 重试间隔符合预期
- 错误消息正确

---

#### 2.4.2 服务器错误（5xx）

**测试 ID**: `provider-error-002`

**测试目标**: 验证服务器返回 5xx 错误时的处理

**前置条件**:
- 可模拟服务器错误

**测试步骤**:

1. 在 Network 面板中设置 API 返回 500 错误
2. 清除本地缓存
3. 启动应用
4. 验证错误处理

**预期结果**:
- 检测到服务器错误
- 自动重试（5xx 错误可重试）
- 最终显示错误提示

**验证点**:
- 重试机制触发
- 错误消息为 "服务器错误"

---

#### 2.4.3 客户端错误（4xx）

**测试 ID**: `provider-error-003`

**测试目标**: 验证服务器返回 4xx 错误时不重试

**前置条件**:
- 可模拟客户端错误

**测试步骤**:

1. 在 Network 面板中设置 API 返回 404 错误
2. 清除本地缓存
3. 启动应用
4. 验证错误处理

**预期结果**:
- 检测到客户端错误
- 不进行重试
- 直接显示错误提示

**验证点**:
- 无重试请求
- 错误消息为 "客户端错误"

---

#### 2.4.4 JSON 解析失败

**测试 ID**: `provider-error-004`

**测试目标**: 验证 API 返回无效 JSON 时的处理

**前置条件**:
- 可模拟响应内容

**测试步骤**:

1. 在 Network 面板中设置 API 返回非 JSON 内容
2. 清除本地缓存
3. 启动应用
4. 验证错误处理

**预期结果**:
- JSON 解析失败被捕获
- 显示解析错误提示
- 应用不崩溃

**验证点**:
- 错误类型为 PARSE_ERROR
- 应用正常运行

---

#### 2.4.5 错误提示清除

**测试 ID**: `provider-error-005`

**测试目标**: 验证刷新成功后错误提示被清除

**前置条件**:
- 供应商列表显示错误状态

**测试步骤**:

1. 模拟刷新失败，显示错误提示
2. 恢复网络连接
3. 点击 "刷新模型供应商" 按钮
4. 验证错误提示消失

**预期结果**:
- 刷新成功后错误提示框消失
- 供应商列表正常显示
- Toast 提示刷新成功

**验证点**:
- ErrorAlert 组件不渲染
- 状态已清除

---

### 2.5 国际化测试

#### 2.5.1 中文界面

**测试 ID**: `provider-i18n-001`

**测试目标**: 验证中文界面下所有文本正确显示

**前置条件**:
- 应用语言设置为中文

**测试步骤**:

1. 设置语言为中文
2. 导航到设置 → 常规设置 → 模型供应商
3. 验证所有文本为中文：
   - 标题："模型供应商"
   - 描述："从远程服务器获取最新的模型供应商信息"
   - 刷新按钮："刷新模型供应商"
   - 状态："可用"
   - 模型数量："共 X 个模型"

**预期结果**:
- 所有文本正确翻译为中文
- 无英文残留
- 布局适应中文文本

**验证点**:
- 标题和描述正确
- 按钮文本正确
- 状态标签正确

---

#### 2.5.2 英文界面

**测试 ID**: `provider-i18n-002`

**测试目标**: 验证英文界面下所有文本正确显示

**前置条件**:
- 应用语言设置为英文

**测试步骤**:

1. 设置语言为英文
2. 导航到设置 → 常规设置 → 模型供应商
3. 验证所有文本为英文：
   - 标题："Model Provider"
   - 描述："Fetch the latest model provider information from remote server"
   - 刷新按钮："Refresh Model Provider"
   - 状态："Available"
   - 模型数量："X models"

**预期结果**:
- 所有文本正确翻译为英文
- 布局适应英文文本

**验证点**:
- 标题和描述正确
- 按钮文本正确
- 状态标签正确

---

#### 2.5.3 刷新成功/失败消息

**测试 ID**: `provider-i18n-003`

**测试目标**: 验证刷新操作后的 Toast 消息国际化

**前置条件**:
- 应用语言设置为中文

**测试步骤**:

1. 设置语言为中文
2. 导航到设置 → 常规设置 → 模型供应商
3. 验证供应商列表已加载
4. 点击刷新按钮（确保成功）
5. 验证 Toast 显示 "模型供应商数据已更新"
6. 验证供应商列表数据未丢失
7. 切换语言到英文
8. 验证供应商列表保持原有数据（语言切换不影响数据）
9. 再次点击刷新按钮
10. 验证 Toast 显示 "Model provider data updated"

**预期结果**:
- Toast 消息随语言切换正确显示
- 消息内容准确
- 语言切换不影响供应商数据状态
- 语言切换不触发额外的 API 请求

**验证点**:
- 中文消息正确
- 英文消息正确
- 切换语言前后供应商数据一致
- 切换语言时无新的 Network 请求

---

---

### 2.6 性能测试

#### 2.6.1 初始化加载性能

**测试 ID**: `provider-perf-001`

**测试目标**: 验证供应商初始化对应用启动性能的影响

**前置条件**:
- Performance 面板已打开（手动测试）
- 或准备好自动化性能测试脚本

**测试步骤**:

1. 清除浏览器缓存和应用缓存
2. 使用 Performance 面板记录加载过程
3. 启动应用
4. 分析性能指标

**预期结果**:
- 有缓存时初始化时间 < 100ms
- 无缓存时初始化时间 < 2000ms
- 不阻塞其他初始化步骤

**验证点**:
- initializeModelProvider 执行时间
- 首次内容渲染时间

**自动化测量方法**:

```typescript
// 测量从应用启动到供应商数据加载完成的时间
test('初始化性能测试', async ({ page }) => {
  // 清除缓存
  await clearModelProviderCache(page);
  
  // 记录开始时间
  const startTime = Date.now();
  
  // 启动应用
  await page.goto('/');
  
  // 等待供应商数据加载完成（通过检查 Redux state 或 UI 元素）
  await page.waitForSelector('[data-testid="provider-card"]', { state: 'visible' });
  
  // 记录结束时间
  const loadTime = Date.now() - startTime;
  
  // 验证性能指标
  expect(loadTime).toBeLessThan(2000); // 无缓存情况 < 2000ms
  
  console.log(`无缓存初始化时间: ${loadTime}ms`);
});

// 测量有缓存时的初始化性能
test('缓存初始化性能测试', async ({ page }) => {
  // 确保有缓存
  await page.goto('/');
  await page.waitForSelector('[data-testid="provider-card"]');
  
  // 重新加载
  const startTime = Date.now();
  await page.reload();
  await page.waitForSelector('[data-testid="provider-card"]', { state: 'visible' });
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(100); // 有缓存情况 < 100ms
  
  console.log(`有缓存初始化时间: ${loadTime}ms`);
});
```

---

#### 2.6.2 刷新操作响应时间

**测试 ID**: `provider-perf-002`

**测试目标**: 验证手动刷新的响应速度

**前置条件**:
- 应用已启动
- Performance 面板已打开（手动测试）

**测试步骤**:

1. 导航到设置 → 常规设置 → 模型供应商
2. 使用 Performance 面板记录
3. 点击刷新按钮
4. 分析从点击到 Toast 显示的时间

**预期结果**:
- 按钮点击后立即显示 loading 状态
- 正常网络下刷新完成时间 < 3000ms
- Toast 及时显示

**验证点**:
- loading 状态立即响应
- 网络请求时间合理

**自动化测量方法**:

```typescript
test('刷新操作响应时间测试', async ({ page }) => {
  await navigateToModelProviderSetting(page);
  
  // 等待初始加载完成
  await waitForProviderLoaded(page);
  
  // 记录刷新开始时间
  const refreshStartTime = Date.now();
  
  // 点击刷新按钮
  await clickRefreshButton(page);
  
  // 等待 Toast 显示
  await waitForToast(page, '模型供应商数据已更新');
  
  // 记录刷新完成时间
  const refreshTime = Date.now() - refreshStartTime;
  
  // 验证性能指标
  expect(refreshTime).toBeLessThan(3000);
  
  console.log(`刷新操作响应时间: ${refreshTime}ms`);
});
```

---

### 2.7 边界条件测试

#### 2.7.1 供应商无模型

**测试 ID**: `provider-edge-001`

**测试目标**: 验证供应商模型列表为空时的显示

**前置条件**:
- 某供应商模型列表为空

**测试步骤**:

1. 模拟某供应商 models 数组为空
2. 导航到设置 → 常规设置 → 模型供应商
3. 验证该供应商卡片显示

**预期结果**:
- 供应商状态显示 "不可用"
- 模型数量显示 "共 0 个模型"
- 卡片正常渲染

**验证点**:
- 状态标签为 "不可用"
- 无 JavaScript 错误

---

#### 2.7.2 大量模型

**测试 ID**: `provider-edge-002`

**测试目标**: 验证供应商有大量模型时的性能和显示

**前置条件**:
- 某供应商有 100+ 个模型

**测试步骤**:

1. 模拟某供应商有大量模型
2. 导航到设置 → 常规设置 → 模型供应商
3. 展开该供应商卡片
4. 验证模型列表渲染

**预期结果**:
- 模型列表正确渲染
- 无明显卡顿
- 列表可滚动

**验证点**:
- 渲染性能良好
- 布局无溢出

---

#### 2.7.3 网络恢复后刷新

**测试 ID**: `provider-edge-003`

**测试目标**: 验证网络恢复后可以正常刷新

**前置条件**:
- 初始无网络，显示错误状态

**测试步骤**:

1. 断开网络连接
2. 清除缓存并启动应用
3. 验证显示错误状态
4. 恢复网络连接
5. 点击刷新按钮
6. 验证数据成功加载

**预期结果**:
- 网络恢复后刷新成功
- 供应商数据正常显示
- 错误状态被清除

**验证点**:
- 刷新成功
- Toast 提示成功

---

#### 2.7.4 快速连续点击刷新

**测试 ID**: `provider-edge-004`

**测试目标**: 验证快速连续点击刷新按钮时的行为

**前置条件**:
- 应用已启动
- Network 面板设置为 Slow 3G

**测试步骤**:

1. 导航到设置 → 常规设置 → 模型供应商
2. 设置网络为 Slow 3G
3. 快速连续点击刷新按钮 5 次
4. 观察网络请求

**预期结果**:
- 按钮在第一次点击后被禁用
- 只有一个网络请求被发出
- 后续点击无效果

**验证点**:
- 按钮禁用状态
- 请求数量为 1

---

#### 2.7.5 并发初始化（应用快速重启）

**测试 ID**: `provider-edge-005`

**测试目标**: 验证应用被快速重启多次时，不会导致重复请求

**前置条件**:
- 网络连接正常

**测试步骤**:

1. 启动应用
2. 立即关闭并重新启动（在初始化完成前）
3. 重复步骤 2 共 3 次
4. 观察 Network 面板的请求数量

**预期结果**:
- 每次启动只发起一个 API 请求
- 没有并发重复请求
- 数据加载正常

**验证点**:
- 请求数量与启动次数一致
- 无重复请求

---

#### 2.7.6 API 返回部分数据

**测试 ID**: `provider-edge-006`

**测试目标**: 验证 API 只返回白名单中的部分供应商时的处理

**前置条件**:
- 可 mock API 响应

**测试步骤**:

1. Mock API 只返回 `deepseek` 和 `moonshotai` 两个供应商
2. 启动应用
3. 导航到设置 → 常规设置 → 模型供应商
4. 验证供应商列表显示

**预期结果**:
- 只显示 API 返回的 2 个供应商
- 应用正常运行，不崩溃
- 无错误提示

**验证点**:
- 供应商卡片数量为 2
- 显示的供应商与 API 返回一致

**测试数据**:

```typescript
const partialMockResponse = {
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    api: "https://api.deepseek.com",
    models: { /* ... */ }
  },
  moonshotai: {
    id: "moonshotai",
    name: "Kimi",
    api: "https://api.moonshot.ai",
    models: { /* ... */ }
  }
  // 注意：缺少 zhipuai 和 zhipuai-coding-plan
};
```

---

#### 2.7.7 缓存文件损坏（非 JSON）

**测试 ID**: `provider-edge-007`

**测试目标**: 验证缓存文件存在但内容完全损坏（不是 JSON）时的处理

**前置条件**:
- 缓存文件存在但内容为非 JSON 格式

**测试步骤**:

1. 在缓存文件中写入非 JSON 内容（如 "CORRUPTED DATA"）
2. 启动应用
3. 观察应用行为
4. 验证供应商列表正确显示

**预期结果**:
- 检测到缓存损坏
- 自动发起远程 API 请求
- 供应商数据成功加载
- 缓存被更新为有效数据

**验证点**:
- Network 面板显示 API 请求
- 控制台无严重错误
- 供应商列表正确显示

---

## 3. 测试数据要求

### 3.1 供应商数据结构

```typescript
/**
 * models.dev API 响应的实际数据结构（键值对对象）
 * API 返回格式: { [providerKey: string]: ModelsDevApiProvider }
 */
interface ModelsDevApiResponse {
  [providerKey: string]: ModelsDevApiProvider;
}

/**
 * 单个模型供应商的 API 数据结构
 */
interface ModelsDevApiProvider {
  /** 供应商唯一标识符 */
  id: string;
  /** 环境变量名数组 */
  env: string[];
  /** NPM 包名 */
  npm: string;
  /** API 基础地址 */
  api: string;
  /** 供应商名称 */
  name: string;
  /** 文档链接 */
  doc: string;
  /** 支持的模型列表（键值对对象） */
  models: {
    [modelId: string]: ModelsDevApiModelDetail;
  };
}

/**
 * 模型详细信息
 */
interface ModelsDevApiModelDetail {
  id: string;
  name: string;
}

/**
 * 模型供应商数据（公共类型）
 * 从 models.dev API 获取并过滤后的供应商数据
 */
interface RemoteProviderData {
  /** 供应商唯一标识符 */
  providerKey: string;
  /** 供应商名称 */
  providerName: string;
  /** API 基础地址 */
  api: string;
  /** 支持的模型列表 */
  models: ModelDetail[];
}

/**
 * 模型详细信息（公共类型）
 */
interface ModelDetail {
  /** 模型唯一标识符 */
  modelKey: string;
  /** 模型名称 */
  modelName: string;
}
```

### 3.2 Mock 数据示例

```typescript
const mockProviders: RemoteProviderData[] = [
  {
    providerKey: "deepseek",
    providerName: "DeepSeek",
    api: "https://api.deepseek.com",
    models: [
      { modelKey: "deepseek-chat", modelName: "DeepSeek Chat" },
      { modelKey: "deepseek-reasoner", modelName: "DeepSeek Reasoner" },
    ],
  },
  {
    providerKey: "moonshotai",
    providerName: "Kimi",
    api: "https://api.moonshot.ai",
    models: [
      { modelKey: "moonshot-v1-8k", modelName: "Moonshot V1 8K" },
      { modelKey: "moonshot-v1-32k", modelName: "Moonshot V1 32K" },
    ],
  },
  {
    providerKey: "zhipuai",
    providerName: "Zhipu",
    api: "https://open.bigmodel.cn",
    models: [
      { modelKey: "glm-4", modelName: "GLM-4" },
      { modelKey: "glm-4-flash", modelName: "GLM-4-Flash" },
    ],
  },
  {
    providerKey: "zhipuai-coding-plan",
    providerName: "Zhipu Coding Plan",
    api: "",
    models: [],
  },
];
```

### 3.3 缓存数据结构

```typescript
/**
 * 缓存数据结构
 */
interface CachedModelData {
  /** 完整的 models.dev API 响应（未过滤） */
  apiResponse: ModelsDevApiResponse;
  /** 缓存元数据 */
  metadata: {
    /** 最后更新时间（ISO 8601 格式） */
    lastRemoteUpdate: string;
    /** 数据来源标记 */
    source: "remote" | "fallback";
  };
}
```

### 3.4 测试数据准备工具

```typescript
// e2e/fixtures/test-data.ts

/**
 * 创建完整的 Mock API 响应
 */
export function createMockApiResponse(
  providers: Partial<ModelsDevApiProvider>[]
): ModelsDevApiResponse {
  const response: ModelsDevApiResponse = {};
  
  providers.forEach(provider => {
    const models: Record<string, ModelsDevApiModelDetail> = {};
    if (provider.models) {
      Object.entries(provider.models).forEach(([key, model]) => {
        models[key] = {
          id: model.id || key,
          name: model.name || key
        };
      });
    }
    
    response[provider.id!] = {
      id: provider.id || '',
      name: provider.name || '',
      api: provider.api || '',
      env: provider.env || [],
      npm: provider.npm || '',
      doc: provider.doc || '',
      models
    };
  });
  
  return response;
}

/**
 * 创建 Mock 缓存数据
 */
export function createMockCacheData(
  apiResponse: ModelsDevApiResponse,
  hoursAgo: number = 0
): CachedModelData {
  return {
    apiResponse,
    metadata: {
      lastRemoteUpdate: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
      source: "remote"
    }
  };
}

/**
 * 创建大量模型的测试数据
 */
export function createLargeModelList(count: number): Record<string, ModelsDevApiModelDetail> {
  const models: Record<string, ModelsDevApiModelDetail> = {};
  for (let i = 0; i < count; i++) {
    models[`model-${i}`] = {
      id: `model-${i}`,
      name: `Model ${i}`
    };
  }
  return models;
}
```

---

## 4. 测试环境要求

### 4.1 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

### 4.2 设备支持

- 桌面端 (1920x1080, 1366x768)
- 平板端 (768x1024)
- 移动端 (375x667, 414x896)

### 4.3 网络条件

- 正常网络
- 慢速 3G
- 离线模式
- 网络不稳定（随机失败）

---

## 5. 成功标准

### 5.1 功能标准

- [ ] 初始化流程正确（有缓存快速路径、无缓存远程请求）
- [ ] 手动刷新功能正常工作
- [ ] 后台静默刷新正常触发
- [ ] 供应商卡片正确展示和交互
- [ ] 错误处理和降级策略正确
- [ ] 国际化文本正确显示
- [ ] 缓存管理正确

### 5.2 性能标准

- [ ] 有缓存初始化时间 < 100ms
- [ ] 无缓存初始化时间 < 2000ms
- [ ] 刷新操作响应时间 < 3000ms
- [ ] 无内存泄漏

### 5.3 用户体验标准

- [ ] 刷新过程有 loading 指示
- [ ] Toast 提示清晰准确
- [ ] 错误提示友好
- [ ] 移动端和桌面端体验一致

---

## 6. 测试执行顺序

### 6.1 基础功能测试 (P0)

1. `provider-init-001` - 首次启动（无缓存）
2. `provider-init-002` - 使用缓存启动（快速路径）
3. `provider-display-001` - 供应商卡片基本展示
4. `provider-refresh-001` - 手动刷新成功

### 6.2 核心功能测试 (P1)

1. `provider-init-003` - 缓存无效时降级到远程请求
2. `provider-init-005` - 缓存过期后自动刷新
3. `provider-display-002` - 供应商卡片展开/折叠
4. `provider-refresh-004` - 后台静默刷新成功
5. `provider-error-001` - 网络超时
6. `provider-i18n-001` - 中文界面

### 6.3 扩展功能测试 (P2)

1. `provider-init-004` - 无网络且无缓存
2. `provider-refresh-002` - 手动刷新失败
3. `provider-refresh-006` - 并发刷新控制
4. `provider-display-005` - 响应式布局
5. `provider-perf-001` - 初始化加载性能

### 6.4 边界条件测试 (P3)

1. `provider-edge-001` - 供应商无模型
2. `provider-edge-002` - 大量模型
3. `provider-edge-003` - 网络恢复后刷新
4. `provider-edge-004` - 快速连续点击刷新
5. `provider-edge-005` - 并发初始化（应用快速重启）
6. `provider-edge-006` - API 返回部分数据
7. `provider-edge-007` - 缓存文件损坏（非 JSON）

---

## 7. 自动化测试脚本建议

### 7.0 Tauri 测试配置说明

**重要**：本项目是 Tauri 桌面应用，需要特殊配置才能运行 Playwright 测试。

#### 7.0.1 方案一：使用 Web 版本测试

如果项目支持 Web 构建（`pnpm dev` 启动 Web 服务），可以直接测试 Web 版本：

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e/specs',
  use: {
    baseURL: 'http://localhost:5173', // Vite dev server
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**限制**：
- 无法测试 Tauri 特定功能（如文件系统、系统通知等）
- HTTP 请求可能通过浏览器 fetch 而非 Tauri HTTP 插件

#### 7.0.2 方案二：使用 Playwright Electron Launcher

使用 Playwright 的 Electron 支持测试桌面应用：

```typescript
// e2e/fixtures/tauri-app.ts
import { _electron as electron, ElectronApplication, Page } from 'playwright';
import { test as base } from '@playwright/test';

type TauriFixtures = {
  electronApp: ElectronApplication;
  page: Page;
};

export const test = base.extend<TauriFixtures>({
  electronApp: async ({}, use) => {
    const electronApp = await electron.launch({
      args: ['target/release/multi-chat'], // Tauri 构建产物
      env: {
        ...process.env,
        // 可以设置测试环境变量
      }
    });
    await use(electronApp);
    await electronApp.close();
  },
  
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    await use(page);
  },
});
```

**前置条件**：
```bash
# 先构建 Tauri 应用
pnpm tauri build

# 或使用开发模式（需要额外配置）
pnpm tauri dev
```

#### 7.0.3 方案三：使用 tauri-driver（官方推荐）

Tauri 官方提供的测试工具：

```bash
# 安装 tauri-driver
cargo install tauri-driver

# 运行测试
pnpm tauri test
```

```typescript
// e2e/tauri.spec.ts
import { test, expect } from '@playwright/test';

test('模型供应商测试', async ({ page }) => {
  // tauri-driver 会自动处理 Tauri 应用启动
  await page.goto('tauri://localhost');
  
  // 正常编写测试
  await page.click('[data-testid="settings-nav"]');
  // ...
});
```

#### 7.0.4 推荐方案

根据项目情况选择：

| 测试类型 | 推荐方案 | 说明 |
|---------|---------|------|
| UI 交互测试 | Web 版本 | 速度快，易于调试 |
| 数据流测试 | Web 版本 | 大部分逻辑可在 Web 测试 |
| Tauri API 测试 | Electron Launcher | 测试文件系统、通知等 |
| 完整集成测试 | tauri-driver | 最接近真实环境 |

**本项目建议**：
1. 优先使用 **Web 版本** 测试 UI 交互和数据流
2. 对于 Tauri 特定功能（如缓存文件操作），使用 **Electron Launcher**
3. 在 CI/CD 中使用 **tauri-driver** 进行完整测试

#### 7.0.5 缓存文件路径

不同测试方案下，缓存文件路径不同：

| 方案 | 缓存文件路径 |
|-----|------------|
| Web 版本 | `localStorage` 或 `IndexedDB` |
| Tauri 开发模式 | `<app_data_dir>/remote-cache.json` |
| Tauri 生产模式 | `<user_data_dir>/remote-cache.json` |

**macOS 示例**：
```
~/Library/Application Support/com.multi-chat.app/remote-cache.json
```

**Windows 示例**：
```
%APPDATA%\multi-chat\remote-cache.json
```

**Linux 示例**：
```
~/.config/multi-chat/remote-cache.json
```

---

### 7.1 Playwright 测试文件结构

```
e2e/
├── specs/
│   └── model-providers/
│       ├── initialization.spec.ts
│       ├── refresh.spec.ts
│       ├── display.spec.ts
│       ├── error-handling.spec.ts
│       ├── i18n.spec.ts
│       └── performance.spec.ts
├── fixtures/
│   └── model-provider-fixtures.ts
└── utils/
    └── model-provider-helpers.ts
```

### 7.2 测试工具函数

```typescript
// e2e/utils/model-provider-helpers.ts

import { Page } from '@playwright/test';

/**
 * data-testid 验证清单
 * 
 * 在编写测试前，请确认以下组件已添加 data-testid 属性：
 * - [ ] 设置导航按钮: data-testid="settings-nav"
 * - [ ] 常规设置导航: data-testid="general-setting-nav"
 * - [ ] 模型供应商设置区域: data-testid="model-provider-setting"
 * - [ ] 供应商卡片: data-testid="provider-card"
 * - [ ] 刷新按钮: data-testid="refresh-provider-button"
 * - [ ] Toast 容器: data-testid="toast"
 * - [ ] 错误提示: data-testid="error-alert"
 * 
 * 如果组件未添加 data-testid，请使用其他选择器（如 CSS 类、文本内容）
 */

/**
 * 导航到模型供应商设置页面
 */
export async function navigateToModelProviderSetting(page: Page) {
  await page.click('[data-testid="settings-nav"]');
  await page.click('[data-testid="general-setting-nav"]');
  await page.waitForSelector('[data-testid="model-provider-setting"]');
}

/**
 * 清除模型供应商缓存
 * 注意：Tauri 应用使用 tauri-plugin-store 管理缓存
 * 缓存文件路径：<app_data_dir>/remote-cache.json
 */
export async function clearModelProviderCache(page: Page) {
  await page.evaluate(async () => {
    try {
      // 方法 1: 通过 Tauri Store API 删除缓存键
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = new Store('remote-cache.json');
      await store.delete('remoteModelCache');
      await store.save();
    } catch (error) {
      console.warn('Failed to clear cache via Store API:', error);
      // 方法 2: 如果 Store API 失败，可以尝试直接删除文件（需要 Rust 端支持）
      // 或者在测试前手动删除缓存文件
    }
  });
}

/**
 * Mock 供应商数据（用于测试）
 */
export async function mockProviderData(page: Page, mockData: RemoteProviderData[]) {
  await page.route('**/models.dev/api.json', async (route) => {
    // 将 mock 数据转换为 API 响应格式
    const apiResponse: Record<string, any> = {};
    mockData.forEach(provider => {
      const models: Record<string, any> = {};
      provider.models.forEach(model => {
        models[model.modelKey] = { id: model.modelKey, name: model.modelName };
      });
      apiResponse[provider.providerKey] = {
        id: provider.providerKey,
        name: provider.providerName,
        api: provider.api,
        models
      };
    });
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse)
    });
  });
}

/**
 * 等待供应商数据加载完成
 */
export async function waitForProviderLoaded(page: Page) {
  await page.waitForSelector('[data-testid="provider-card"]', {
    state: 'visible',
  });
}

/**
 * 获取供应商卡片数量
 */
export async function getProviderCardCount(page: Page): Promise<number> {
  return page.locator('[data-testid="provider-card"]').count();
}

/**
 * 点击刷新按钮
 */
export async function clickRefreshButton(page: Page) {
  await page.click('[data-testid="refresh-provider-button"]');
}

/**
 * 等待 Toast 消息
 */
export async function waitForToast(page: Page, expectedText: string) {
  await page.waitForSelector(`[data-testid="toast"]:has-text("${expectedText}")`);
}

/**
 * 模拟网络离线
 */
export async function goOffline(page: Page) {
  const context = page.context();
  await context.setOffline(true);
}

/**
 * 模拟网络恢复
 */
export async function goOnline(page: Page) {
  const context = page.context();
  await context.setOffline(false);
}

/**
 * 模拟缓存过期（修改缓存时间戳）
 */
export async function mockExpiredCache(page: Page, hoursAgo: number = 25) {
  await page.evaluate(async (hours) => {
    try {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = new Store('remote-cache.json');
      await store.init();
      
      const cached = await store.get('remoteModelCache');
      if (cached) {
        cached.metadata.lastRemoteUpdate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        await store.set('remoteModelCache', cached);
        await store.save();
      }
    } catch (error) {
      console.warn('Failed to mock expired cache:', error);
    }
  }, hoursAgo);
}

/**
 * 模拟损坏的缓存文件
 */
export async function mockCorruptedCache(page: Page, content: string = 'CORRUPTED DATA') {
  await page.evaluate(async (corruptedContent) => {
    try {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = new Store('remote-cache.json');
      await store.init();
      
      // 写入无效数据
      await store.set('remoteModelCache', corruptedContent);
      await store.save();
    } catch (error) {
      console.warn('Failed to mock corrupted cache:', error);
    }
  }, content);
}

/**
 * 等待后台静默刷新完成
 */
export async function waitForSilentRefresh(page: Page, timeout: number = 10000) {
  // 等待网络请求完成（通过监听 response 事件）
  await page.waitForResponse(
    response => response.url().includes('models.dev/api.json'),
    { timeout }
  );
}

/**
 * 设置 API 网络延迟（仅针对 models.dev API）
 */
export async function setApiNetworkThrottling(page: Page, profile: 'Slow3G' | 'Fast3G') {
  const context = page.context();
  await context.route('**/models.dev/api.json', async (route) => {
    // 只延迟 API 请求，避免影响其他资源
    await new Promise((resolve) => setTimeout(resolve, profile === 'Slow3G' ? 2000 : 500));
    await route.continue();
  });
}

/**
 * 模拟 API 超时（仅针对 models.dev API）
 */
export async function setApiTimeout(page: Page, timeoutMs: number = 6000) {
  const context = page.context();
  await context.route('**/models.dev/api.json', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, timeoutMs));
    await route.abort('failed');
  });
}

/**
 * 模拟 API 返回错误状态码
 */
export async function mockApiError(page: Page, statusCode: number) {
  const context = page.context();
  await context.route('**/models.dev/api.json', async (route) => {
    await route.fulfill({
      status: statusCode,
      body: JSON.stringify({ error: `Mocked ${statusCode} error` })
    });
  });
}
```

### 7.3 测试 Fixtures

```typescript
// e2e/fixtures/model-provider-fixtures.ts

import { test as base, Page } from '@playwright/test';

/**
 * 模型供应商测试 Fixtures
 */
type ModelProviderFixtures = {
  modelProviderPage: Page;
  mockProviders: RemoteProviderData[];
};

export const test = base.extend<ModelProviderFixtures>({
  modelProviderPage: async ({ page }, use) => {
    // Tauri 应用需要特殊启动方式
    // 如果是 Web 版本，使用 page.goto('/')
    // 如果是 Tauri 桌面应用，需要使用 electron launcher
    await page.goto('/');
    await navigateToModelProviderSetting(page);
    await use(page);
  },

  mockProviders: async ({}, use) => {
    // 导入 Mock 数据
    const providers: RemoteProviderData[] = [
      {
        providerKey: "deepseek",
        providerName: "DeepSeek",
        api: "https://api.deepseek.com",
        models: [
          { modelKey: "deepseek-chat", modelName: "DeepSeek Chat" },
          { modelKey: "deepseek-reasoner", modelName: "DeepSeek Reasoner" },
        ],
      },
      // ... 其他供应商
    ];
    await use(providers);
  },
});
```

---

## 8. 测试注意事项

### 8.1 data-testid 验证

在编写测试前，请先验证以下组件已添加 `data-testid` 属性：

| 组件 | data-testid | 选择器示例 | 备选选择器 |
|-----|------------|-----------|-----------|
| 设置导航按钮 | `settings-nav` | `[data-testid="settings-nav"]` | `text=设置` |
| 常规设置导航 | `general-setting-nav` | `[data-testid="general-setting-nav"]` | `text=常规` |
| 模型供应商设置区域 | `model-provider-setting` | `[data-testid="model-provider-setting"]` | `.model-provider-setting` |
| 供应商卡片 | `provider-card` | `[data-testid="provider-card"]` | `.provider-card` |
| 刷新按钮 | `refresh-provider-button` | `[data-testid="refresh-provider-button"]` | `text=刷新模型供应商` |
| Toast 容器 | `toast` | `[data-testid="toast"]` | `.toast-container` |
| 错误提示 | `error-alert` | `[data-testid="error-alert"]` | `.error-alert` |

**验证方法**：
```typescript
// 在测试开始前验证 data-testid 是否存在
test('验证 data-testid', async ({ page }) => {
  await page.goto('/');
  
  const elements = [
    'settings-nav',
    'general-setting-nav',
    'provider-card',
    'refresh-provider-button'
  ];
  
  for (const testId of elements) {
    const element = await page.$(`[data-testid="${testId}"]`);
    if (!element) {
      console.warn(`Missing data-testid: ${testId}`);
    }
  }
});
```

### 8.2 网络请求拦截

Playwright 的 `route` 方法可以拦截和修改网络请求：

```typescript
// 拦截 API 请求并返回 Mock 数据
await page.route('**/models.dev/api.json', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockResponse)
  });
});

// 拦截并延迟请求
await page.route('**/models.dev/api.json', async route => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  route.continue();
});

// 拦截并返回错误
await page.route('**/models.dev/api.json', route => {
  route.fulfill({
    status: 500,
    body: JSON.stringify({ error: 'Internal Server Error' })
  });
});

// 取消拦截
await page.unroute('**/models.dev/api.json');
```

### 8.3 Redux State 验证

可以通过 `page.evaluate()` 访问 Redux store：

```typescript
// 获取 Redux state
const state = await page.evaluate(() => {
  return (window as any).__REDUX_STATE__;
});

console.log('Provider state:', state.modelProvider);

// 验证 Redux state
expect(state.modelProvider.providers).toHaveLength(4);
expect(state.modelProvider.loading).toBe(false);
```

### 8.4 性能指标收集

使用 Playwright 的性能 API：

```typescript
// 收集性能指标
const metrics = await page.metrics();
console.log('Performance metrics:', metrics);

// 获取导航时间
const timing = await page.evaluate(() => {
  return performance.timing;
});

const loadTime = timing.loadEventEnd - timing.navigationStart;
console.log(`Page load time: ${loadTime}ms`);
```

### 8.5 测试隔离

确保每个测试相互独立：

```typescript
// 在 beforeEach 中清理环境
test.beforeEach(async ({ page }) => {
  // 清除缓存
  await clearModelProviderCache(page);
  
  // 清除 localStorage
  await page.evaluate(() => localStorage.clear());
  
  // 清除所有路由拦截
  await page.unrouteAll();
});

// 在 afterEach 中清理
test.afterEach(async ({ page }) => {
  // 关闭所有打开的对话框
  await page.keyboard.press('Escape');
});
```

### 8.6 调试技巧

```typescript
// 截图
await page.screenshot({ path: 'screenshot.png' });

// 保存页面 HTML
const html = await page.content();
fs.writeFileSync('page.html', html);

// 暂停测试（交互式调试）
await page.pause();

// 慢速执行（观察测试过程）
await page.click('button', { slowMo: 1000 });

// 打印控制台日志
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

// 打印页面错误
page.on('pageerror', error => console.error('PAGE ERROR:', error));
```

---

## 9. 相关文档

- [远程模型数据获取设计文档](../../docs/design/model-remote.md)
- [模型供应商 Slice 源码](../../src/store/slices/modelProviderSlice.ts)
- [远程模型服务源码](../../src/services/modelRemote/index.ts)
- [模型供应商设置组件](../../src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting.tsx)
- [国际化翻译文件](../../src/locales/zh/setting.json)
- [Tauri Store 插件文档](https://v2.tauri.app/plugin/store/)
- [Playwright Electron 测试](https://playwright.dev/docs/api/class-electron)

---

## 10. 修订历史

| 版本 | 日期 | 修订内容 | 作者 |
|-----|------|---------|-----|
| 1.0 | 2026-03-12 | 初始版本 | - |
| 1.1 | 2026-03-12 | 根据代码审查建议修正：1. 添加 Tauri 测试配置说明（3 种方案）<br>2. 修正缓存清除方法（使用 Store API）<br>3. 修正网络节流函数（仅针对 API 端点）<br>4. 添加缓存过期测试场景<br>5. 明确性能测试测量方法和自动化代码<br>6. 添加完整的类型定义和导入<br>7. 修正 Fixtures 语法<br>8. 添加 data-testid 验证清单<br>9. 补充 3 个边界测试场景<br>10. 修正重试逻辑描述（1s → 2s，共 3 次尝试）<br>11. 补充国际化测试验证点 | - |
