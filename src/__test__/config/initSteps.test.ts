/**
 * initSteps 配置验证测试
 *
 * 测试初始化步骤配置的结构正确性和有效性
 */

import { describe, it, expect } from 'vitest';
import { initSteps } from '@/config/initSteps';

describe('initSteps 配置验证', () => {
  describe('步骤名称唯一性', () => {
    it('应该所有步骤名称唯一', () => {
      const names = initSteps.map((step) => step.name);
      const uniqueNames = new Set(names);

      expect(names.length).toBe(uniqueNames.size);
      expect(names.length).toBe(7); // 7 个步骤
    });

    it('应该检测重复的步骤名称', () => {
      const names = initSteps.map((step) => step.name);
      const nameCount = names.reduce((acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const duplicates = Object.entries(nameCount).filter(([_, count]) => count > 1);
      expect(duplicates).toHaveLength(0);
    });
  });

  describe('依赖存在性验证', () => {
    it('应该所有依赖的步骤存在', () => {
      const stepNames = new Set(initSteps.map((step) => step.name));

      for (const step of initSteps) {
        if (step.dependencies) {
          for (const dep of step.dependencies) {
            expect(stepNames.has(dep)).toBe(true);
          }
        }
      }
    });

    it('应该检测依赖不存在的步骤', () => {
      const stepNames = new Set(initSteps.map((step) => step.name));

      for (const step of initSteps) {
        if (step.dependencies) {
          for (const dep of step.dependencies) {
            expect(
              stepNames.has(dep),
              `步骤 "${step.name}" 依赖的步骤 "${dep}" 不存在`
            ).toBe(true);
          }
        }
      }
    });
  });

  describe('必要字段完整性', () => {
    it('应该每个步骤包含 name、critical、execute、onError 字段', () => {
      for (const step of initSteps) {
        expect(step.name).toBeDefined();
        expect(typeof step.name).toBe('string');
        expect(step.name.length).toBeGreaterThan(0);

        expect(step.critical).toBeDefined();
        expect(typeof step.critical).toBe('boolean');

        expect(step.execute).toBeDefined();
        expect(typeof step.execute).toBe('function');

        expect(step.onError).toBeDefined();
        expect(typeof step.onError).toBe('function');
      }
    });

    it('应该验证字段类型正确', () => {
      for (const step of initSteps) {
        expect(typeof step.name).toBe('string');
        expect(typeof step.critical).toBe('boolean');
        expect(typeof step.execute).toBe('function');
        expect(typeof step.onError).toBe('function');
      }
    });
  });

  describe('错误严重程度有效性', () => {
    it('应该调用每个步骤的 onError 并验证 severity 有效', async () => {
      const validSeverities = ['fatal', 'warning', 'ignorable'] as const;

      for (const step of initSteps) {
        const error = new Error('Test error');
        const result = step.onError(error);

        expect(result).toBeDefined();
        expect(validSeverities).toContain(result.severity);
        expect(result.message).toBeDefined();
        expect(typeof result.message).toBe('string');
      }
    });

    it('应该验证 severity 为 fatal、warning 或 ignorable', () => {
      const validSeverities = ['fatal', 'warning', 'ignorable'] as const;

      for (const step of initSteps) {
        const error = new Error('Test error');
        const result = step.onError(error);

        expect(
          validSeverities.includes(result.severity),
          `步骤 "${step.name}" 的 onError 返回了无效的 severity: ${result.severity}`
        ).toBe(true);
      }
    });
  });

  describe('initSteps 导出测试', () => {
    it('应该 initSteps 可以正常导入', () => {
      expect(initSteps).toBeDefined();
      expect(Array.isArray(initSteps)).toBe(true);
    });

    it('应该 initSteps 为数组类型', () => {
      expect(Array.isArray(initSteps)).toBe(true);
    });

    it('应该数组长度为 7', () => {
      // i18n、masterKey、models、chatList、appLanguage、includeReasoningContent、modelProvider
      expect(initSteps.length).toBe(7);
    });

    it('应该包含所有预期的步骤名称', () => {
      const expectedSteps = [
        'i18n',
        'masterKey',
        'models',
        'chatList',
        'appLanguage',
        'includeReasoningContent',
        'modelProvider',
      ];

      const actualSteps = initSteps.map((step) => step.name);

      for (const expected of expectedSteps) {
        expect(actualSteps).toContain(expected);
      }
    });
  });

  describe('依赖关系验证', () => {
    it('应该 masterKey 在 models 之前执行', () => {
      const models = initSteps.find((step) => step.name === 'models');
      expect(models?.dependencies).toContain('masterKey');
    });

    it('应该 i18n 在 appLanguage 之前执行', () => {
      const appLanguage = initSteps.find((step) => step.name === 'appLanguage');
      expect(appLanguage?.dependencies).toContain('i18n');
    });

    it('应该无依赖步骤在第一批次并行执行', () => {
      // i18n、masterKey、chatList、includeReasoningContent、modelProvider 没有依赖
      const noDepSteps = initSteps.filter(
        (step) => !step.dependencies || step.dependencies.length === 0
      );

      expect(noDepSteps.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('关键步骤标记', () => {
    it('应该只有 i18n 和 masterKey 是关键步骤', () => {
      const criticalSteps = initSteps.filter((step) => step.critical);

      expect(criticalSteps.length).toBe(2);
      // eslint-disable-next-line unicorn/no-array-sort
      expect(criticalSteps.map((s) => s.name).sort()).toEqual(['i18n', 'masterKey']);
    });
  });
});
