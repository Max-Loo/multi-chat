/**
 * Vitest 集成测试环境设置（瘦入口）
 *
 * 按职责分层引入：环境基础设施 → 清理钩子（不引入全局 Mock）
 */

import '../setup/base';
import '../setup/cleanup';
