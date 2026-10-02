/**
 * Masonry 瀑布流布局测试（Vue 版）
 *
 * 覆盖 masonry-layout spec 场景：
 * - 响应式列数配置（min-width 语义）
 * - 卡片按列 round-robin 填充
 * - 窗口尺寸变化重算布局
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/vue';
import { defineComponent, h } from 'vue';
import { Masonry } from '@/components/Masonry';

/** 模拟窗口宽度并触发 resize */
function setWindowWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

afterEach(() => {
  cleanup();
  // 恢复默认宽度，避免影响其他测试文件
  setWindowWidth(1024);
});

describe('Masonry 瀑布流布局', () => {
  /** 构造包含 N 个卡片的 Masonry 包装组件 */
  function createWrapper(itemCount: number) {
    return defineComponent({
      components: { Masonry },
      setup() {
        const items = Array.from({ length: itemCount }, (_, i) =>
          h('div', { 'data-testid': `item-${i}` }, `卡片 ${i}`),
        );
        return () =>
          h(
            Masonry,
            {
              breakpointCols: { default: 3, 1560: 2, 1024: 1 },
              className: 'masonry-root',
              columnClassName: 'masonry-col',
            },
            { default: () => items },
          );
      },
    });
  }

  it('按断点 min-width 语义解析列数：<1024 为 3 列', async () => {
    setWindowWidth(800);
    const { container } = render(createWrapper(6));

    // rAF 防抖后生效
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const columns = container.querySelectorAll('.masonry-col');
    expect(columns).toHaveLength(3);
  });

  it('按断点 min-width 语义解析列数：1024-1559 为 1 列', async () => {
    setWindowWidth(1200);
    const { container } = render(createWrapper(6));

    await new Promise((resolve) => requestAnimationFrame(resolve));
    const columns = container.querySelectorAll('.masonry-col');
    expect(columns).toHaveLength(1);
  });

  it('按断点 min-width 语义解析列数：≥1560 为 2 列', async () => {
    setWindowWidth(1600);
    const { container } = render(createWrapper(6));

    await new Promise((resolve) => requestAnimationFrame(resolve));
    const columns = container.querySelectorAll('.masonry-col');
    expect(columns).toHaveLength(2);
  });

  it('卡片按列 round-robin 填充（顺序分列）', async () => {
    setWindowWidth(1600); // 2 列
    const { container } = render(createWrapper(4));

    await new Promise((resolve) => requestAnimationFrame(resolve));
    const columns = container.querySelectorAll('.masonry-col');
    expect(columns).toHaveLength(2);
    // round-robin：0、2 号进第一列；1、3 号进第二列
    expect(columns[0].textContent).toContain('卡片 0');
    expect(columns[0].textContent).toContain('卡片 2');
    expect(columns[1].textContent).toContain('卡片 1');
    expect(columns[1].textContent).toContain('卡片 3');
  });

  it('窗口尺寸变化时重算列数（rAF 防抖）', async () => {
    setWindowWidth(800); // 3 列
    const { container } = render(createWrapper(6));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(container.querySelectorAll('.masonry-col')).toHaveLength(3);

    // 切换到 2 列断点
    setWindowWidth(1600);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(container.querySelectorAll('.masonry-col')).toHaveLength(2);

    // 切换到 1 列断点
    setWindowWidth(1200);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(container.querySelectorAll('.masonry-col')).toHaveLength(1);
  });

  it('列宽平分容器（100/N%）', async () => {
    setWindowWidth(1600); // 2 列
    const { container } = render(createWrapper(2));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const columns = container.querySelectorAll<HTMLElement>('.masonry-col');
    expect(columns[0].style.width).toBe('50%');
  });

  it('所有卡片都渲染（无丢失）', async () => {
    setWindowWidth(1200); // 1 列
    render(createWrapper(5));
    expect(screen.getByTestId('item-0')).toBeInTheDocument();
    expect(screen.getByTestId('item-4')).toBeInTheDocument();
  });
});
