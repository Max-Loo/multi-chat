/**
 * OS 插件 Mock 实现
 * 用于测试环境，提供与真实 API 一致的接口
 */

import { vi } from 'vitest';

/**
 * Mock locale 函数
 * 模拟获取系统或浏览器语言设置
 */
export const locale = vi.fn().mockResolvedValue('zh-CN');
