/**
 * 自研分割面板组件测试
 *
 * 覆盖面板注册、指针拖拽调整尺寸、边界 clamp 与嵌套分组
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/vue';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

/**
 * 查询全部面板元素
 */
function getPanels(container: Element): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-resizable-panel]'));
}

describe('ResizablePanelGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该按 defaultSize 设置面板初始尺寸', () => {
    const { container } = render({
      components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
      template: `
        <ResizablePanelGroup>
          <ResizablePanel :default-size="60">
            <div>left</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel :default-size="40">
            <div>right</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      `,
    });

    const panels = getPanels(container);
    expect(panels).toHaveLength(2);
    expect(panels[0].style.flex).toBe('0 0 60%');
    expect(panels[1].style.flex).toBe('0 0 40%');
  });

  it('拖拽分隔条应该在两个面板间转移尺寸', async () => {
    const { container } = render({
      components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
      template: `
        <ResizablePanelGroup>
          <ResizablePanel :default-size="50">
            <div>left</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel :default-size="50">
            <div>right</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      `,
    });

    // 模拟面板组宽度 1000px（clientWidth 在 happy-dom 中默认 0，stub offset）
    const group = container.firstElementChild as HTMLElement;
    vi.spyOn(group, 'clientWidth', 'get').mockReturnValue(1000);

    const handle = container.querySelector('[role="separator"]') as HTMLElement;
    const panels = getPanels(container);

    // 按下并拖动 +200px（即 +20%）
    await fireEvent.pointerDown(handle, { clientX: 500, button: 0 });
    await fireEvent.pointerMove(window, { clientX: 700 });
    await fireEvent.pointerUp(window);

    expect(panels[0].style.flex).toBe('0 0 70%');
    expect(panels[1].style.flex).toBe('0 0 30%');
  });

  it('拖拽超过边界时应该被 clamp 到最小尺寸', async () => {
    const { container } = render({
      components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
      template: `
        <ResizablePanelGroup>
          <ResizablePanel :default-size="20">
            <div>left</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel :default-size="80">
            <div>right</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      `,
    });

    const group = container.firstElementChild as HTMLElement;
    vi.spyOn(group, 'clientWidth', 'get').mockReturnValue(1000);

    const handle = container.querySelector('[role="separator"]') as HTMLElement;
    const panels = getPanels(container);

    // 向左拖动 -500px（-50%），面板 0 最小为 5%
    await fireEvent.pointerDown(handle, { clientX: 500, button: 0 });
    await fireEvent.pointerMove(window, { clientX: 0 });
    await fireEvent.pointerUp(window);

    expect(panels[0].style.flex).toBe('0 0 5%');
    expect(panels[1].style.flex).toBe('0 0 95%');
  });

  it('拖拽结束后 pointermove 不应继续生效', async () => {
    const { container } = render({
      components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
      template: `
        <ResizablePanelGroup>
          <ResizablePanel :default-size="50">
            <div>left</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel :default-size="50">
            <div>right</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      `,
    });

    const group = container.firstElementChild as HTMLElement;
    vi.spyOn(group, 'clientWidth', 'get').mockReturnValue(1000);

    const handle = container.querySelector('[role="separator"]') as HTMLElement;
    const panels = getPanels(container);

    await fireEvent.pointerDown(handle, { clientX: 500, button: 0 });
    await fireEvent.pointerMove(window, { clientX: 600 });
    await fireEvent.pointerUp(window);

    const sizeAfterUp = panels[0].style.flex;

    // pointerup 之后的 move 不应改变尺寸
    await fireEvent.pointerMove(window, { clientX: 900 });
    expect(panels[0].style.flex).toBe(sizeAfterUp);
  });

  it('多个面板组应该独立工作', async () => {
    const { container } = render({
      components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
      template: `
        <div>
          <ResizablePanelGroup class="group-a">
            <ResizablePanel :default-size="50"><div>a1</div></ResizablePanel>
            <ResizableHandle />
            <ResizablePanel :default-size="50"><div>a2</div></ResizablePanel>
          </ResizablePanelGroup>
          <ResizablePanelGroup class="group-b">
            <ResizablePanel :default-size="30"><div>b1</div></ResizablePanel>
            <ResizableHandle />
            <ResizablePanel :default-size="70"><div>b2</div></ResizablePanel>
          </ResizablePanelGroup>
        </div>
      `,
    });

    const groups = Array.from(container.querySelectorAll('[data-orientation]')) as HTMLElement[];
    expect(groups).toHaveLength(2);

    for (const g of groups) {
      vi.spyOn(g, 'clientWidth', 'get').mockReturnValue(1000);
    }

    const handleA = groups[0].querySelector('[role="separator"]') as HTMLElement;
    await fireEvent.pointerDown(handleA, { clientX: 0, button: 0 });
    await fireEvent.pointerMove(window, { clientX: 100 });
    await fireEvent.pointerUp(window);

    const panelsA = getPanels(groups[0]);
    const panelsB = getPanels(groups[1]);

    expect(panelsA[0].style.flex).toBe('0 0 60%');
    // B 组不受影响
    expect(panelsB[0].style.flex).toBe('0 0 30%');
    expect(panelsB[1].style.flex).toBe('0 0 70%');
  });
});
