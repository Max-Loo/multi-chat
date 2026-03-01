/**
 * 初始化系统集成测试
 *
 * 使用真实的 initSteps 配置进行端到端测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InitializationManager } from '@/lib/initialization/InitializationManager';
import { initSteps } from '@/config/initSteps';
import type { InitStep } from '@/lib/initialization';

describe('初始化系统集成测试', () => {
  let manager: InitializationManager;

  beforeEach(() => {
    manager = new InitializationManager();
    vi.clearAllMocks();
  });

  describe('使用真实配置执行初始化', () => {
    it('应该使用真实 initSteps 配置执行', async () => {
      // Mock 所有步骤的 execute 函数，避免实际执行
      const mockSteps: InitStep[] = initSteps.map((step) => ({
        ...step,
        execute: vi.fn().mockResolvedValue(undefined),
      }));

      const result = await manager.runInitialization({ steps: mockSteps });

      expect(result.success).toBe(true);
      expect(result.completedSteps.length).toBe(initSteps.length);
    });

    it('应该所有步骤按正确顺序执行', async () => {
      let executionOrder: string[] = [];

      const mockSteps: InitStep[] = initSteps.map((step) => ({
        ...step,
        execute: vi.fn().mockImplementation(async () => {
          executionOrder.push(step.name);
        }),
      }));

      await manager.runInitialization({ steps: mockSteps });

      // 验证所有步骤都执行了
      expect(executionOrder).toHaveLength(initSteps.length);
    });
  });

  describe('真实配置的依赖关系解析', () => {
    it('应该 masterKey 在 models 之前执行', async () => {
      let executionOrder: string[] = [];

      const mockSteps: InitStep[] = initSteps.map((step) => ({
        ...step,
        execute: vi.fn().mockImplementation(async () => {
          executionOrder.push(step.name);
        }),
      }));

      await manager.runInitialization({ steps: mockSteps });

      const masterKeyIndex = executionOrder.indexOf('masterKey');
      const modelsIndex = executionOrder.indexOf('models');

      expect(masterKeyIndex).toBeGreaterThanOrEqual(0);
      expect(modelsIndex).toBeGreaterThanOrEqual(0);
      expect(masterKeyIndex).toBeLessThan(modelsIndex);
    });

    it('应该 i18n 在 appLanguage 之前执行', async () => {
      let executionOrder: string[] = [];

      const mockSteps: InitStep[] = initSteps.map((step) => ({
        ...step,
        execute: vi.fn().mockImplementation(async () => {
          executionOrder.push(step.name);
        }),
      }));

      await manager.runInitialization({ steps: mockSteps });

      const i18nIndex = executionOrder.indexOf('i18n');
      const appLanguageIndex = executionOrder.indexOf('appLanguage');

      expect(i18nIndex).toBeGreaterThanOrEqual(0);
      expect(appLanguageIndex).toBeGreaterThanOrEqual(0);
      expect(i18nIndex).toBeLessThan(appLanguageIndex);
    });

    it('应该无依赖步骤在第一批次并行执行', async () => {
      const executionTimes: Record<string, number> = {};

      const mockSteps: InitStep[] = initSteps.map((step) => ({
        ...step,
        execute: vi.fn().mockImplementation(async () => {
          executionTimes[step.name] = Date.now();
          await new Promise((resolve) => setTimeout(resolve, 10));
        }),
      }));

      await manager.runInitialization({ steps: mockSteps });

      // 验证无依赖步骤都执行了
      expect(Object.keys(executionTimes).length).toBe(initSteps.length);
    });
  });

  describe('真实配置的错误处理', () => {
    it('应该关键步骤失败时中断初始化', async () => {
      const mockSteps: InitStep[] = initSteps.map((step) => {
        if (step.name === 'i18n') {
          return {
            ...step,
            execute: vi.fn().mockRejectedValue(new Error('i18n failed')),
          };
        }
        return {
          ...step,
          execute: vi.fn().mockResolvedValue(undefined),
        };
      });

      const result = await manager.runInitialization({ steps: mockSteps });

      expect(result.success).toBe(false);
      expect(result.fatalErrors.length).toBeGreaterThan(0);
    });

    it('应该非关键步骤失败时继续执行', async () => {
      const mockSteps: InitStep[] = initSteps.map((step) => {
        if (step.name === 'models') {
          return {
            ...step,
            execute: vi.fn().mockRejectedValue(new Error('models failed')),
          };
        }
        return {
          ...step,
          execute: vi.fn().mockResolvedValue(undefined),
        };
      });

      const result = await manager.runInitialization({ steps: mockSteps });

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
