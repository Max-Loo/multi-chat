/**
 * FilterInput 组件测试
 *
 * 验证渲染、默认/自定义占位文本、v-model 行为
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import FilterInput from '@/components/FilterInput/FilterInput.vue';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      common: { search: '搜索' },
    }).useTranslation(),
}));

describe('FilterInput', () => {
  it('应该渲染输入框和搜索图标', () => {
    const { container } = render(FilterInput);

    expect(screen.getByTestId('filter-input')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('未传自定义值时应该显示默认国际化占位文本', () => {
    render(FilterInput);

    expect(screen.getByPlaceholderText('搜索')).toBeInTheDocument();
  });

  it('传入 placeholder prop 时应该显示自定义占位文本', () => {
    render(FilterInput, { props: { placeholder: '按名称过滤' } });

    expect(screen.getByPlaceholderText('按名称过滤')).toBeInTheDocument();
  });

  it('应该显示传入的 modelValue', () => {
    render(FilterInput, { props: { modelValue: 'openai' } });

    expect(screen.getByTestId('filter-input')).toHaveValue('openai');
  });

  it('输入变化时应该触发 update:modelValue', async () => {
    const onUpdate = vi.fn();

    render(FilterInput, { props: { modelValue: '', 'onUpdate:modelValue': onUpdate } });

    await fireEvent.update(screen.getByTestId('filter-input'), 'new');

    expect(onUpdate).toHaveBeenCalledWith('new');
  });
});
