/**
 * Vue useExistingModels 组合式函数测试
 *
 * 行为基线与迁移前 React 版一致：过滤掉已删除的模型
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useExistingModels } from '@/composables/useExistingModels';
import { useModelStore } from '@/store/pinia/model';
import type { Model } from '@/types/model';

/** 构造模型测试数据 */
const makeModel = (overrides: Partial<Model> = {}): Model =>
  ({
    id: 'm1',
    modelName: '模型1',
    isDeleted: false,
    ...overrides,
  }) as Model;

describe('useExistingModels（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('过滤掉已删除的模型', () => {
    const modelStore = useModelStore();
    modelStore.models = [
      makeModel({ id: 'a', isDeleted: false }),
      makeModel({ id: 'b', isDeleted: true }),
      makeModel({ id: 'c', isDeleted: false }),
    ] as never;

    const existing = useExistingModels();

    expect(existing.value.map((m) => m.id)).toEqual(['a', 'c']);
  });

  it('模型列表变化后保持响应式过滤', () => {
    const modelStore = useModelStore();
    modelStore.models = [makeModel({ id: 'a' })] as never;
    const existing = useExistingModels();
    expect(existing.value).toHaveLength(1);

    // 新增一条已删除模型 → 仍只显示未删除的
    modelStore.models = [
      makeModel({ id: 'a' }),
      makeModel({ id: 'b', isDeleted: true }),
    ] as never;

    expect(existing.value.map((m) => m.id)).toEqual(['a']);
  });
});
