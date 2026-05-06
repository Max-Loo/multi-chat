/**
 * ModelSelect 组件单元测试
 *
 * 测试策略：Mock useFormField 返回 error 状态，验证 RadioGroup 交互和验证错误边框
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ModelDetail } from '@/types/model';

// Mock useFormField because 来自 shadcn/ui form 组件，需要控制 error 返回值
let mockError: string | undefined;
vi.mock('@/components/ui/form', () => ({
  useFormField: () => ({ error: mockError, invalid: !!mockError }),
}));

// Mock radio-group because shadcn/ui 组件依赖 Radix UI
vi.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children, className, value, onValueChange }: any) => (
    <div data-testid="radio-group" className={className} data-value={value} onClick={() => onValueChange?.('test-value')}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ value, id }: any) => (
    <button data-testid={`radio-item-${id}`} value={value} />
  ),
}));

import ModelSelect from '@/pages/Model/components/ModelSelect';

const mockOptions: ModelDetail[] = [
  { modelKey: 'model-a', modelName: 'Model A' },
  { modelKey: 'model-b', modelName: 'Model B' },
];

describe('ModelSelect', () => {
  beforeEach(() => {
    mockError = undefined;
  });

  it('应该渲染所有选项', () => {
    render(<ModelSelect options={mockOptions} />);

    expect(screen.getByTestId('model-option-model-a')).toBeInTheDocument();
    expect(screen.getByTestId('model-option-model-b')).toBeInTheDocument();
  });

  it('应该显示红色边框 当存在验证错误', () => {
    mockError = '请选择模型';
    const { container } = render(<ModelSelect options={mockOptions} />);

    const radioGroup = container.querySelector('[data-testid="radio-group"]');
    expect(radioGroup?.className).toContain('border-red-500');
  });

  it('应该不显示红色边框 当无验证错误', () => {
    const { container } = render(<ModelSelect options={mockOptions} />);

    const radioGroup = container.querySelector('[data-testid="radio-group"]');
    expect(radioGroup?.className).not.toContain('border-red-500');
  });

  it('应该调用 onChange 当选中值变化', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    // 需要更新 mock 以便点击能触发 onValueChange
    const { container } = render(<ModelSelect options={mockOptions} onChange={onChange} />);

    // 点击 radio-group 触发 onValueChange
    await user.click(container.querySelector('[data-testid="radio-group"]')!);

    expect(onChange).toHaveBeenCalledWith('test-value');
  });
});
