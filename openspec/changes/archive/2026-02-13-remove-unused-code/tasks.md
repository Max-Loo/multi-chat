## 1. 工具安装和配置

- [x] 1.1 安装 knip 工具：`pnpm add -D knip`
- [x] 1.2 创建 `knip.json` 配置文件，配置入口点和忽略规则
- [x] 1.3 在 `package.json` 中添加分析脚本：`"analyze:unused": "knip"`
- [x] 1.4 测试 knip 配置能否正常运行

## 2. 初始代码扫描

- [x] 2.1 运行全量扫描命令：`pnpm analyze:unused`
- [x] 2.2 生成并保存初始检测报告到 `unused-code-report.json`
- [x] 2.3 分类整理检测到的未使用代码（按类型：函数、类型、导入、变量等）
- [x] 2.4 审查报告，标记明显安全的删除目标（如未使用的导入语句）

## 3. 安全删除未使用代码 - 第一阶段

- [x] 3.1 删除所有未使用的 import 语句
- [x] 3.2 删除未使用的类型定义（interface、type alias）
- [x] 3.3 运行类型检查：`pnpm tsc`
- [x] 3.4 运行测试套件：`pnpm test`
- [x] 3.5 提交删除结果：`git commit -m "chore: remove unused imports and types"`

## 4. 安全删除未使用代码 - 第二阶段

- [x] 4.1 识别并删除未使用的工具函数（逐个确认）
- [x] 4.2 识别并删除未使用的 React 组件（逐个确认）
- [x] 4.3 运行类型检查验证
- [x] 4.4 运行测试套件验证
- [x] 4.5 提交删除结果：`git commit -m "chore: remove unused functions and components"`

## 5. 安全删除未使用代码 - 第三阶段

- [x] 5.1 检查并删除未使用的常量/变量
- [x] 5.2 检查并删除未使用的枚举定义
- [x] 5.3 运行完整测试套件确保功能完整性
- [x] 5.4 运行应用手动测试关键功能
- [x] 5.5 提交删除结果：`git commit -m "chore: remove unused constants and enums"`

## 6. CI/CD 集成

- [ ] ~~6.1 在 `.github/workflows/build-and-release.yml` 中添加 knip 检查步骤~~ (保持构建脚本简洁，不添加)
- [ ] ~~6.2 配置 CI 在发现新的未使用代码时返回非零退出码~~ (暂不集成)
- [ ] ~~6.3 测试 CI 流水线能否正确运行 knip 检查~~ (暂不集成)
- [ ] ~~6.4 可选：配置预提交钩子运行 knip~~ (暂不集成)

## 7. 文档更新

- [x] 7.1 在 `README.md` 中添加代码质量说明
- [x] ~~7.2 在 `CONTRIBUTING.md` 中添加关于死代码清理的说明~~ (文件已删除)
- [x] 7.3 更新 `AGENTS.md`，说明项目中使用的代码分析工具
- [x] 7.4 添加 knip 配置文件注释，说明各配置项用途

## 8. 验证和清理

- [x] 8.1 再次运行全量扫描确认无剩余未使用代码
- [x] 8.2 运行生产构建测试：`pnpm tauri build`
- [x] 8.3 验证应用功能完整（手动测试主要功能）
- [x] 8.4 检查构建产物大小是否有明显减小
- [x] 8.5 最终提交和代码审查
