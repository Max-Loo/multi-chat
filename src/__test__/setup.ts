/**
 * Vitest 单元测试环境设置（瘦入口）
 *
 * 按职责分层引入：环境基础设施 → 全局 Mock → 清理钩子
 */

import './setup/base';
import './setup/mocks';
import './setup/cleanup';
