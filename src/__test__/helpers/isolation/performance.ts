/**
 * 性能测试工具
 * 
 * 提供测试执行时间测量和性能断言功能
 */

/**
 * 性能测量结果
 */
export interface PerformanceResult<T> {
  /** 执行结果 */
  result: T;
  /** 执行时间（毫秒） */
  duration: number;
}

/**
 * 测量异步函数执行时间
 * @param fn 要测量的异步函数
 * @returns 执行结果和时间
 */
export const measurePerformance = async <T>(fn: () => Promise<T>): Promise<PerformanceResult<T>> => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();

  return {
    result,
    duration: endTime - startTime,
  };
};

/**
 * 测量同步函数执行时间
 * @param fn 要测量的同步函数
 * @returns 执行结果和时间
 */
export const measurePerformanceSync = <T>(fn: () => T): PerformanceResult<T> => {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();

  return {
    result,
    duration: endTime - startTime,
  };
};

/**
 * 期望执行时间在指定阈值内
 * @param fn 要测试的异步函数
 * @param maxDuration 最大执行时间（毫秒）
 * @param message 可选的错误消息
 */
export const expectDuration = async <T>(
  fn: () => Promise<T>,
  maxDuration: number,
  message?: string
): Promise<T> => {
  const { result, duration } = await measurePerformance(fn);

  if (duration > maxDuration) {
    throw new Error(
      message ?? `Expected function to complete within ${maxDuration}ms, but it took ${duration.toFixed(2)}ms`
    );
  }

  return result;
};

/**
 * 批量性能测试
 * @param fn 要测试的函数
 * @param iterations 迭代次数
 * @returns 性能统计信息
 */
export const benchmarkPerformance = async <T>(
  fn: () => Promise<T>,
  iterations: number
): Promise<{
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDuration: number;
}> => {
  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    await fn();
    const endTime = performance.now();
    durations.push(endTime - startTime);
  }

  return {
    averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    totalDuration: durations.reduce((a, b) => a + b, 0),
  };
};
