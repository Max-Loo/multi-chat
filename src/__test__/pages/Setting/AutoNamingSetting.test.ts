/**
 * AutoNamingSetting 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Setting/components/GeneralSetting/components/AutoNamingSetting.test.tsx，
 * 保留核心行为语义：
 * - 按初始 store 状态渲染开关（开启/关闭）
 * - 切换开关更新 store
 * - 连续快速点击同步正确
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

import AutoNamingSetting from '@/pages/Setting/components/GeneralSetting/components/AutoNamingSetting.vue';
import { createAppPinia, useAppConfigStore } from '@/stores';

/** 渲染 AutoNamingSetting（可选预设初始状态） */
function renderAutoNaming(enabled = true) {
  const pinia = createAppPinia();
  useAppConfigStore(pinia).setAutoNamingEnabled(enabled);
  const result = render(AutoNamingSetting, { global: { plugins: [pinia] } });
  return { ...result, pinia };
}

describe('AutoNamingSetting（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正常渲染组件（开关开启状态）', () => {
    renderAutoNaming(true);

    expect(screen.getByRole('switch')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByText('自动命名')).toBeInTheDocument();
  });

  it('应该正常渲染组件（开关关闭状态）', () => {
    renderAutoNaming(false);

    expect(screen.getByRole('switch')).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('应该能够切换开关状态（从开启到关闭）', async () => {
    const { pinia } = renderAutoNaming(true);
    const appConfigStore = useAppConfigStore(pinia);

    await fireEvent.click(screen.getByRole('switch'));

    expect(appConfigStore.autoNamingEnabled).toBe(false);
  });

  it('应该能够切换开关状态（从关闭到开启）', async () => {
    const { pinia } = renderAutoNaming(false);
    const appConfigStore = useAppConfigStore(pinia);

    await fireEvent.click(screen.getByRole('switch'));

    expect(appConfigStore.autoNamingEnabled).toBe(true);
  });

  it('应该正确处理连续快速点击开关', async () => {
    const { pinia } = renderAutoNaming(true);
    const appConfigStore = useAppConfigStore(pinia);

    await fireEvent.click(screen.getByRole('switch'));
    await fireEvent.click(screen.getByRole('switch'));

    // 两次点击后回到初始值
    expect(appConfigStore.autoNamingEnabled).toBe(true);
  });
});
