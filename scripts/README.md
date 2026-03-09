# Scripts

本目录包含项目开发和维护所需的各种脚本工具。

## 翻译检查工具

### check-i18n.js

国际化翻译完整性检查工具，验证所有支持语言的翻译文件具有相同的键值结构。

**用途：**
- 检测缺失的翻译键值
- 生成清晰的差异报告
- 防止翻译遗漏进入代码库

**使用方法：**

```bash
# 直接运行
node scripts/check-i18n.js

# 使用 npm script
npm run lint:i18n

# 显示详细信息
npm run lint:i18n -- --verbose
```

**退出码：**
- `0`：所有翻译完整，无缺失
- `1`：发现缺失的翻译键值
- `2`：文件读取错误或其他问题

**功能特性：**
- ✅ 以英文为基准语言进行比较
- ✅ 支持嵌套键值的深度检查
- ✅ 自动检测所有翻译文件
- ✅ 清晰的命令行输出和报告
- ✅ 支持 verbose 模式显示详细信息

**集成：**
- 已集成到 `package.json` 的 `lint:i18n` script
- 已集成到 `package.json` 的 `validate` script
- 可选：可配置到 Git Hook 中实现提交前自动检查

## 其他脚本

### generate-i18n-types-resources.js

生成国际化类型定义和资源。

**使用方法：**
```bash
npm run generate-i18n-types
```

### update-version.js

更新项目版本号。

**使用方法：**
```bash
npm run update-version
```

### detect-unused-i18n-keys.mjs

检测未使用的国际化键值。

**使用方法：**
```bash
npm run analyze:unused
# 或
node scripts/detect-unused-i18n-keys.mjs
```
