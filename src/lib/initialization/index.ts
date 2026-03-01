/**
 * 初始化系统模块
 * 
 * 提供统一的初始化管理功能，支持依赖关系、并行执行和错误处理
 */

export { InitializationManager } from './InitializationManager';
export type {
  InitConfig,
  InitError,
  InitResult,
  InitStep,
  ExecutionContext,
  ErrorSeverity,
} from './types';
