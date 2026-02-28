/**
 * 初始化系统核心类型定义
 */

/**
 * 错误严重程度
 */
export type ErrorSeverity = 'fatal' | 'warning' | 'ignorable';

/**
 * 初始化步骤接口
 */
export interface InitStep {
  /** 步骤名称（唯一标识符） */
  name: string;
  /** 是否为关键步骤（关键步骤失败将导致应用无法运行） */
  critical: boolean;
  /** 依赖的步骤名称列表（可选） */
  dependencies?: string[];
  /** 步骤执行函数 */
  execute: (context: ExecutionContext) => Promise<unknown>;
  /** 错误处理回调 */
  onError: (error: unknown) => InitError;
}

/**
 * 初始化错误信息
 */
export interface InitError {
  /** 错误严重程度 */
  severity: ErrorSeverity;
  /** 错误消息 */
  message: string;
  /** 原始错误对象（可选） */
  originalError?: unknown;
}

/**
 * 执行上下文接口
 */
export interface ExecutionContext {
  /** 获取步骤执行结果 */
  getResult<T>(name: string): T | undefined;
  /** 设置步骤执行结果 */
  setResult(name: string, value: unknown): void;
  /** 检查步骤是否成功执行 */
  isSuccess(name: string): boolean;
}

/**
 * 初始化配置
 */
export interface InitConfig {
  /** 初始化步骤列表 */
  steps: InitStep[];
  /** 进度回调（可选） */
  onProgress?: (current: number, total: number, currentStep: string) => void;
}

/**
 * 初始化结果
 */
export interface InitResult {
  /** 是否成功完成所有关键步骤 */
  success: boolean;
  /** 致命错误列表 */
  fatalErrors: InitError[];
  /** 警告错误列表 */
  warnings: InitError[];
  /** 可忽略错误列表 */
  ignorableErrors: InitError[];
  /** 成功执行的步骤名称列表 */
  completedSteps: string[];
}
