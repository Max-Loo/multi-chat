/**
 * Button 组件测试
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

/** Mock @radix-ui/react-slot——预构建环境下 forwardRef 不可用 */
vi.mock('@radix-ui/react-slot', () => ({
  Slot: (props: any) => props.children,
}));

import { Button } from '@/components/ui/button';

describe('Button 组件', () => {
  
  it('应该渲染按钮文本', () => {
    render(<Button>点击我</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('点击我');
  });

  it('应该响应点击事件', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>点击我</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('应该渲染不同的变体样式', () => {
    const { rerender } = render(<Button variant="default">默认按钮</Button>);
    const defaultClass = screen.getByRole('button').className;

    rerender(<Button variant="destructive">危险按钮</Button>);
    const destructiveClass = screen.getByRole('button').className;
    expect(destructiveClass).not.toBe(defaultClass);

    rerender(<Button variant="outline">轮廓按钮</Button>);
    const outlineClass = screen.getByRole('button').className;
    expect(outlineClass).not.toBe(defaultClass);
    expect(outlineClass).not.toBe(destructiveClass);
  });

  it('应该渲染不同尺寸', () => {
    const { rerender } = render(<Button size="default">默认尺寸</Button>);
    const defaultClass = screen.getByRole('button').className;

    rerender(<Button size="sm">小尺寸</Button>);
    const smClass = screen.getByRole('button').className;
    expect(smClass).not.toBe(defaultClass);

    rerender(<Button size="lg">大尺寸</Button>);
    const lgClass = screen.getByRole('button').className;
    expect(lgClass).not.toBe(defaultClass);
    expect(lgClass).not.toBe(smClass);
  });

  it('禁用状态下不应响应点击', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        禁用按钮
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
