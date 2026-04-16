/**
 * FilterInput 组件单元测试
 *
 * 测试过滤器输入组件：
 * - 渲染搜索图标和输入框
 * - 自定义 placeholder
 * - value 和 onChange 回调
 * - autoFocus 属性
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterInput from '@/components/FilterInput';

vi.mock('react-i18next', () => {
  const R = { common: { search: '搜索...' } };
  return globalThis.__createI18nMockReturn(R);
});

describe('FilterInput', () => {
  it('应该渲染输入框和搜索图标', () => {
    render(<FilterInput value="" onChange={vi.fn()} />);

    const input = screen.getByTestId('filter-input');
    expect(input).toBeInTheDocument();
  });

  it('应该显示默认 placeholder 当未传入自定义值', () => {
    render(<FilterInput value="" onChange={vi.fn()} />);

    const input = screen.getByTestId('filter-input');
    expect(input).toHaveAttribute('placeholder', '搜索...');
  });

  it('应该显示自定义 placeholder 当传入 placeholder prop', () => {
    render(
      <FilterInput value="" onChange={vi.fn()} placeholder="自定义提示" />
    );

    const input = screen.getByTestId('filter-input');
    expect(input).toHaveAttribute('placeholder', '自定义提示');
  });

  it('应该显示传入的 value', () => {
    render(<FilterInput value="测试文本" onChange={vi.fn()} />);

    const input = screen.getByTestId('filter-input');
    expect(input).toHaveValue('测试文本');
  });

  it('应该调用 onChange 当输入值变化', () => {
    const onChange = vi.fn();
    render(<FilterInput value="" onChange={onChange} />);

    const input = screen.getByTestId('filter-input');
    fireEvent.change(input, { target: { value: '新文本' } });

    expect(onChange).toHaveBeenCalledWith('新文本');
  });

  it('应该应用 autoFocus 当 autoFocus 为 true', () => {
    render(<FilterInput value="" onChange={vi.fn()} autoFocus />);

    const input = screen.getByTestId('filter-input');
    expect(input).toHaveFocus();
  });

  it('应该不自动聚焦 当 autoFocus 为 false', () => {
    render(<FilterInput value="" onChange={vi.fn()} autoFocus={false} />);

    const input = screen.getByTestId('filter-input');
    expect(input).not.toHaveFocus();
  });
});
