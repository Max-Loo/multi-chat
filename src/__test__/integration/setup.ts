/**
 * Vitest 集成测试环境设置（瘦入口）
 *
 * 按职责分层引入：环境基础设施 → 清理钩子（不引入全局 Mock 层）
 * 仅叠加 react-i18next 纯默认 mock（集成测试依赖同样的 i18n 默认行为）
 */

import '../setup/base';
import '../setup/i18n';
import '../setup/cleanup';
