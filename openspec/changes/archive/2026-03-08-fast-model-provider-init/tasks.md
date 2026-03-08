## 1. 核心实现 - modelProviderSlice

- [x] 1.1 修改 `initializeModelProvider` 实现快速路径逻辑
  - 在函数开头先尝试加载缓存
  - 有缓存且验证通过则立即返回缓存数据
  - 无缓存或缓存无效时才执行远程请求逻辑
  - 确保错误处理逻辑正确（无缓存且远程失败时返回 error）

- [x] 1.2 新增 `silentRefreshModelProvider` Thunk
  - 创建新的 createAsyncThunk
  - 实现远程请求逻辑（调用 `fetchRemoteData`）
  - 成功时返回数据并保存缓存
  - 失败时返回空对象（静默失败）

- [x] 1.3 更新 `modelProviderSlice` extraReducers
   - 添加 `silentRefreshModelProvider.pending` case（设置 backgroundRefreshing = true）
   - 添加 `silentRefreshModelProvider.fulfilled` case（静默更新 store，释放锁）
   - 添加 `silentRefreshModelProvider.rejected` case（释放锁，静默失败）
   - 确保 `initializeModelProvider` 的现有逻辑正确
   - 验证 `refreshModelProvider` 的现有逻辑不受影响

- [x] 1.4 在 `modelProviderSlice` 的 `initialState` 中添加 `backgroundRefreshing` 字段
   - 字段类型：boolean
   - 默认值：false
   - 确保字段名与 spec 中的描述一致

## 2. 触发后台刷新 - main.tsx

- [x] 2.1 在初始化完成后触发后台刷新
  - 在 `main.tsx` 中找到 `await handleSecurityWarning()` 调用位置
  - 在其后添加 `store.dispatch(silentRefreshModelProvider())`
  - 添加注释说明后台刷新的目的

## 3. 单元测试

- [x] 3.1 更新 `modelProviderSlice.test.ts` - 快速路径测试
  - 添加测试用例：有缓存时立即返回缓存数据
  - 添加测试用例：缓存无效或为空时降级到远程请求
  - 添加测试用例：无缓存时等待远程请求
  - 添加测试用例：无缓存且远程失败时返回错误

- [x] 3.2 新增 `silentRefreshModelProvider` 测试
   - 添加测试用例：成功时静默更新 store
   - 添加测试用例：失败时保持所有状态不变（包括 error）
   - 添加测试用例：loading 为 true 时不执行刷新（去重逻辑）
   - 添加测试用例：backgroundRefreshing 为 true 时不执行刷新（去重逻辑）
   - 添加测试用例：pending 时设置 backgroundRefreshing 为 true
   - 添加测试用例：fulfilled 时释放 backgroundRefreshing 锁
   - 添加测试用例：rejected 时释放 backgroundRefreshing 锁
   - 验证成功清除旧的 error（如果有）
   - 验证失败时不清除现有的 error

- [x] 3.3 更新现有测试以适配新逻辑
   - 检查 `initializeModelProvider` 的现有测试是否需要调整
   - 确保 `refreshModelProvider` 的测试不受影响
   - 确保 `backgroundRefreshing` 字段的初始状态正确（false）
   - 验证 `initializeModelProvider` 不改变 `backgroundRefreshing` 状态

## 4. 集成测试

- [ ] 4.1 添加快速启动场景测试
  - Mock 缓存存在
  - 验证应用启动时间 < 500ms
  - 验证后台刷新被触发

- [ ] 4.2 添加无缓存场景测试
  - Mock 缓存不存在
  - Mock 远程请求成功
  - 验证远程请求被调用

- [ ] 4.3 添加网络错误场景测试
  - Mock 缓存不存在
  - Mock 远程请求失败
  - 验证 `NoProvidersAvailable` 组件显示

## 5. 手动测试验证

- [x] 5.1 准备测试环境
  - 清除应用缓存（删除 `remote-cache.json`）
  - 确保网络连接正常
  - 准备浏览器开发工具监控网络请求

- [x] 5.2 测试首次启动场景（无缓存）
  - 启动应用
  - 验证应用等待远程请求完成
  - 验证成功后正常显示供应商数据
  - 验证缓存文件被创建

- [x] 5.3 测试正常启动场景（有缓存）
  - 确保缓存文件存在
  - 启动应用
  - 验证应用快速启动（< 1 秒）
  - 验证立即显示缓存数据
  - 验证后台刷新触发：
    - 打开浏览器 DevTools → Network 面板
    - 过滤 "Fetch/XHR" 请求
    - 观察是否有对 `models.dev/api.json` 的请求
    - 验证请求在初始化完成后 1-2 秒内触发

- [x] 5.4 测试网络错误场景
  - 断开网络连接或模拟网络错误
  - 清除缓存
  - 启动应用
  - 验证显示 `NoProvidersAvailable` 组件
  - 验证错误提示信息正确

- [x] 5.5 测试后台刷新成功场景
  - 确保缓存存在（可能过期）
  - 启动应用
  - 验证快速显示缓存数据
  - 验证后台刷新触发（观察 Network 面板，应有对 `models.dev/api.json` 的请求）
  - 等待刷新完成后：
    - 验证 `lastUpdate` 时间戳已更新
    - 验证 `lastUpdate` 为最近的时间（而非 null）
    - 如果远程数据与缓存不同，验证数据已更新

- [x] 5.6 测试后台刷新失败场景
  - 确保缓存存在
  - 启动应用
  - 在后台刷新触发时断开网络
  - 验证应用继续使用缓存数据
  - 验证不显示任何错误提示
  - 验证应用功能完全正常

- [x] 5.7 测试并发刷新去重场景
  - 确保缓存存在
  - 启动应用（触发后台刷新）
  - 立即进入设置页面
  - 在后台刷新进行中时点击"刷新"按钮
  - 验证后台刷新被跳过（不会发起重复请求）
  - 验证手动刷新正常执行
  - 观察 Network 面板，应该只有一个远程请求（手动刷新）

- [x] 5.8 测试手动刷新功能
  - 进入设置页面的模型供应商设置
  - 点击"刷新"按钮
  - 验证显示加载状态
  - 验证成功/失败时显示正确的 Toast
  - 验证手动刷新的行为与优化前一致

## 6. 代码质量检查

- [x] 6.1 运行 linter 检查
  - 运行 `pnpm lint` 确保代码符合规范
  - 修复任何 linter 错误和警告

- [x] 6.2 运行类型检查
  - 运行 `pnpm tsc` 确保类型正确
  - 修复任何类型错误

- [x] 6.3 运行所有测试
  - 运行 `pnpm test` 执行单元测试
  - 运行 `pnpm test:integration` 执行集成测试
  - 确保所有测试通过

## 7. 文档更新

- [x] 7.1 更新 AGENTS.md（如必要）
  - 检查是否需要更新架构说明
  - 检查是否需要添加新的代码约定

- [x] 7.2 添加代码注释
  - 在 `initializeModelProvider` 中添加快速路径逻辑的注释
  - 在 `silentRefreshModelProvider` 中添加刷新去重逻辑的注释
  - 在 `main.tsx` 中添加后台刷新触发的注释

- [x] 7.3 添加开发环境日志
  - 在 `silentRefreshModelProvider` 中添加 console.log
  - 仅在开发环境输出（`import.meta.env.DEV`）
  - 记录刷新开始、成功、失败事件
  - 记录去重跳过事件（loading 为 true 时）

## 8. 性能验证

- [ ] 8.1 测量启动时间（有缓存）
  - 使用浏览器开发工具的 Performance 面板
  - 测量 10 次启动时间，记录所有数据
  - 计算 P50（中位数）和 P95 指标
  - 验证 P50 < 100ms，P95 < 200ms
  - 与优化前的测量数据对比

- [ ] 8.2 测量启动时间（无缓存）
  - 清除缓存
  - 测量 5 次启动时间，记录所有数据
  - 计算平均值和范围
  - 验证平均值在 5-12 秒范围内
  - 与优化前的测量数据对比

## 9. 发布准备

- [ ] 9.1 代码审查
  - 自我审查代码，确保符合最佳实践
  - 检查是否有硬编码值或魔法数字
  - 检查是否有 TODO 或 FIXME 需要处理

- [ ] 9.2 准备变更说明
  - 准备 changelog 条目（如需要）
  - 总结性能提升和用户体验改进

- [ ] 9.3 合并到主分支
  - 创建 Pull Request
  - 等待代码审查和合并
  - 删除变更分支（如使用分支）
