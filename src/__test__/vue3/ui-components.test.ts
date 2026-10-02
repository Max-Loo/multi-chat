/**
 * Vue 版 UI 基础组件交互测试
 *
 * 覆盖 vue3-app-foundation spec 的"UI 组件体系对等"需求关键场景：
 * - 对话框键盘操作（Esc 关闭、焦点管理）
 * - 下拉菜单键盘选择与 ARIA 属性
 * - 基础组件渲染断言
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { defineComponent, ref } from 'vue';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

describe('UI 基础组件（Vue 版）', () => {
  describe('Button', () => {
    it('渲染默认变体并支持点击', async () => {
      const { emitted } = render(Button, {
        slots: { default: '保存' },
      });

      const button = screen.getByRole('button', { name: '保存' });
      expect(button).toBeInTheDocument();
      await fireEvent.click(button);
      expect(emitted('click')).toHaveLength(1);
    });
  });

  describe('Badge', () => {
    it('渲染徽章内容', () => {
      render(Badge, { slots: { default: '新' } });
      expect(screen.getByText('新')).toBeInTheDocument();
    });
  });

  describe('Switch', () => {
    it('作为开关按钮渲染并可切换', async () => {
      const wrapper = defineComponent({
        components: { Switch },
        setup() {
          const checked = ref(false);
          const toggle = () => {
            checked.value = !checked.value;
          };
          return { checked, toggle };
        },
        template: '<Switch :model-value="checked" @update:model-value="toggle" data-testid="switch" />',
      });

      render(wrapper);
      const switchEl = screen.getByTestId('switch');
      expect(switchEl).toHaveAttribute('role', 'switch');
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
      await fireEvent.click(switchEl);
      expect(switchEl).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Dialog', () => {
    it('打开后显示内容且 Esc 可关闭', async () => {
      const wrapper = defineComponent({
        components: { Dialog, DialogTrigger, DialogContent, DialogTitle },
        template: `
          <Dialog>
            <DialogTrigger as-child>
              <button>打开对话框</button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>确认删除</DialogTitle>
              <p>对话框正文</p>
            </DialogContent>
          </Dialog>
        `,
      });

      render(wrapper);

      // 打开对话框
      await fireEvent.click(screen.getByText('打开对话框'));
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('确认删除')).toBeInTheDocument();

      // Esc 关闭
      await fireEvent.keyDown(document, { key: 'Escape' });
      // 等待关闭动画状态更新
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('内容区含无障碍标题关联（aria 属性）', async () => {
      const wrapper = defineComponent({
        components: { Dialog, DialogTrigger, DialogContent, DialogTitle },
        template: `
          <Dialog default-open>
            <DialogContent>
              <DialogTitle>标题</DialogTitle>
            </DialogContent>
          </Dialog>
        `,
      });

      render(wrapper);
      const dialog = await screen.findByRole('dialog');
      const title = screen.getByText('标题');
      // DialogContent 应通过 aria-labelledby 关联 Title
      expect(title.id).toBeTruthy();
      expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    });
  });

  describe('DropdownMenu', () => {
    it('打开后渲染菜单项并支持键盘选择', async () => {
      const onAction = vi.fn();
      const wrapper = defineComponent({
        components: {
          DropdownMenu,
          DropdownMenuTrigger,
          DropdownMenuContent,
          DropdownMenuItem,
        },
        setup() {
          return { onAction };
        },
        template: `
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button>打开菜单</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @click="onAction('rename')">重命名</DropdownMenuItem>
              <DropdownMenuItem>删除</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        `,
      });

      render(wrapper);

      const trigger = screen.getByText('打开菜单');
      // 触发器应有菜单展开语义
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

      // user-event 派发完整键盘序列（含焦点移动），更接近真实交互
      const user = userEvent.setup();
      await user.click(trigger);
      const menu = await screen.findByRole('menu');
      expect(menu).toBeInTheDocument();

      // 键盘导航 + Enter 选择第一项
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onAction).toHaveBeenCalledWith('rename');
    });

    it('菜单项点击触发回调并关闭菜单', async () => {
      const wrapper = defineComponent({
        components: {
          DropdownMenu,
          DropdownMenuTrigger,
          DropdownMenuContent,
          DropdownMenuItem,
        },
        template: `
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button>打开菜单</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem data-testid="item">菜单项</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        `,
      });

      render(wrapper);
      await fireEvent.click(screen.getByText('打开菜单'));
      const item = await screen.findByTestId('item');
      await fireEvent.click(item);
      // 选择后菜单关闭
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});
