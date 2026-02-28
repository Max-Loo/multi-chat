/**
 * 初始化管理器
 * 
 * 统一管理应用初始化流程，支持依赖关系、并行执行和错误处理
 */

import type {
  InitConfig,
  InitError,
  InitResult,
  InitStep,
  ExecutionContext,
} from './types';

/**
 * 执行上下文实现类
 */
class ExecutionContextImpl implements ExecutionContext {
  private results = new Map<string, unknown>();
  private stepStatus = new Map<string, boolean>();

  getResult<T>(name: string): T | undefined {
    return this.results.get(name) as T | undefined;
  }

  setResult(name: string, value: unknown): void {
    this.results.set(name, value);
  }

  isSuccess(name: string): boolean {
    return this.stepStatus.get(name) ?? false;
  }

  markSuccess(name: string): void {
    this.stepStatus.set(name, true);
  }
}

/**
 * 初始化管理器类
 */
export class InitializationManager {
  /**
   * 运行初始化流程
   * @param config 初始化配置
   * @returns 初始化结果
   */
  async runInitialization(config: InitConfig): Promise<InitResult> {
    const { steps, onProgress } = config;
    const context = new ExecutionContextImpl();
    const result: InitResult = {
      success: false,
      fatalErrors: [],
      warnings: [],
      ignorableErrors: [],
      completedSteps: [],
    };

    try {
      // 验证依赖关系
      this.validateDependencies(steps);

      // 检测循环依赖
      this.detectCircularDependencies(steps);

      // 构建执行计划（拓扑排序）
      const executionPlan = this.topologicalSort(steps);

      // 执行步骤
      let completedCount = 0;
      for (const group of executionPlan) {
        // 并行执行同组步骤
        await Promise.all(
          group.map(async (step) => {
            try {
              const value = await step.execute(context);
              context.setResult(step.name, value);
              context.markSuccess(step.name);
              result.completedSteps.push(step.name);
            } catch (error) {
              const initError = step.onError(error);
              this.handleError(result, initError);

              // 如果是关键步骤失败，抛出错误以终止初始化
              if (step.critical && initError.severity === 'fatal') {
                throw initError;
              }
            } finally {
              completedCount++;
              if (onProgress) {
                onProgress(completedCount, steps.length, step.name);
              }
            }
          })
        );
      }

      // 判断是否成功（没有致命错误）
      result.success = result.fatalErrors.length === 0;
    } catch (error) {
      // 捕获未处理的错误
      if (error instanceof Object && 'severity' in error) {
        // 已经是 InitError，不需要额外处理
      } else {
        // 未知错误，添加到致命错误列表
        result.fatalErrors.push({
          severity: 'fatal',
          message: '未知初始化错误',
          originalError: error,
        });
      }
      result.success = false;
    }

    return result;
  }

  /**
   * 验证依赖关系
   * @param steps 初始化步骤列表
   */
  private validateDependencies(steps: InitStep[]): void {
    const stepNames = new Set(steps.map((s) => s.name));

    for (const step of steps) {
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          if (!stepNames.has(dep)) {
            throw new Error(
              `步骤 "${step.name}" 依赖的步骤 "${dep}" 不存在`
            );
          }
        }
      }
    }
  }

  /**
   * 检测循环依赖
   * @param steps 初始化步骤列表
   */
  private detectCircularDependencies(steps: InitStep[]): void {
    const graph = new Map<string, string[]>();
    
    // 构建依赖图
    for (const step of steps) {
      graph.set(step.name, step.dependencies || []);
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string): boolean => {
      if (recursionStack.has(node)) {
        throw new Error(`检测到循环依赖：步骤 "${node}" 形成了循环依赖`);
      }
      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recursionStack.add(node);

      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        if (dfs(dep)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const step of steps) {
      if (!visited.has(step.name)) {
        dfs(step.name);
      }
    }
  }

  /**
   * 拓扑排序（构建执行计划）
   * @param steps 初始化步骤列表
   * @returns 执行计划（分组步骤列表）
   */
  private topologicalSort(steps: InitStep[]): InitStep[][] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const stepMap = new Map<string, InitStep>();

    // 初始化
    for (const step of steps) {
      graph.set(step.name, []);
      inDegree.set(step.name, 0);
      stepMap.set(step.name, step);
    }

    // 构建依赖图和计算入度
    for (const step of steps) {
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          graph.get(dep)?.push(step.name);
          inDegree.set(step.name, (inDegree.get(step.name) || 0) + 1);
        }
      }
    }

    // 拓扑排序
    const executionPlan: InitStep[][] = [];
    const queue: string[] = [];

    // 找出所有入度为 0 的节点
    for (const [name, degree] of inDegree) {
      if (degree === 0) {
        queue.push(name);
      }
    }

    while (queue.length > 0) {
      const currentLevel = [...queue];
      executionPlan.push(
        currentLevel.map((name) => stepMap.get(name)!).filter(Boolean)
      );
      queue.length = 0;

      for (const name of currentLevel) {
        const neighbors = graph.get(name) || [];
        for (const neighbor of neighbors) {
          const newDegree = (inDegree.get(neighbor) || 0) - 1;
          inDegree.set(neighbor, newDegree);
          if (newDegree === 0) {
            queue.push(neighbor);
          }
        }
      }
    }

    return executionPlan;
  }

  /**
   * 处理错误
   * @param result 初始化结果
   * @param error 初始化错误
   */
  private handleError(result: InitResult, error: InitError): void {
    switch (error.severity) {
      case 'fatal':
        result.fatalErrors.push(error);
        break;
      case 'warning':
        result.warnings.push(error);
        break;
      case 'ignorable':
        result.ignorableErrors.push(error);
        break;
    }
  }
}
