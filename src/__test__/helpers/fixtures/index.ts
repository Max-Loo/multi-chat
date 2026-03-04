/**
 * 测试数据工厂模块导出
 * 
 * 提供创建测试数据的工厂函数
 */

export * from './model';
export * from './crypto';
export * from './modelProvider';
export * from './reduxState';

// 导出路由和聊天测试数据（从 src/__test__/fixtures/ 目录）
export * from '@/__test__/fixtures/router';
export * from '@/__test__/fixtures/chat';
