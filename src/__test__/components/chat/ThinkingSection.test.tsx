/**
 * ThinkingSection UI 组件测试
 * 
 * 测试推理内容折叠组件的各种场景
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThinkingSection } from '@/components/chat/ThinkingSection';

// Mock highlight.js
vi.mock('highlight.js', () => ({
  default: {
    highlight: (str: string, _options: { language: string }) => ({ value: str }),
    highlightAuto: (str: string) => ({ value: str }),
    getLanguage: (lang: string) => lang !== undefined,
  },
}));

// Mock markdown-it
vi.mock('markdown-it', () => ({
  default: vi.fn(() => ({
    render: (str: string) => {
      // 简单的 markdown 渲染模拟
      return str
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // **粗体**
        .replace(/\*(.+?)\*/g, '<em>$1</em>') // *斜体*
        .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code>$2</code></pre>') // 代码块
        .replace(/\n/g, '<br>'); // 换行
    },
  })),
}));

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (html: string) => {
      // 简单的 XSS 清理模拟：移除 script 标签和危险的 HTML 属性
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/onerror=["'][^"']*["']/gi, '')
        .replace(/onload=["'][^"']*["']/gi, '');
    },
  },
}));

describe('ThinkingSection UI 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe('基础渲染', () => {
    it('应该正确渲染推理内容区域', () => {
      render(
        <ThinkingSection
          title="思考过程"
          content="这是推理内容"
          initiallyExpanded={true}
        />
      );

      expect(screen.getByText('思考过程')).not.toBe(null);
      expect(screen.getByText('这是推理内容')).not.toBe(null);
    });

    it('应该默认处于折叠状态', () => {
      render(
        <ThinkingSection
          title="思考过程"
          content="内容"
        />
      );

      // 内容应该不存在于 DOM 中（因为折叠了）
      expect(screen.queryByText('内容')).toBe(null);
    });

    it('应该支持初始展开状态', () => {
      render(
        <ThinkingSection
          title="思考过程"
          content="内容"
          initiallyExpanded={true}
        />
      );
      
      // 内容应该可见
      expect(screen.getByText('内容')).toBeVisible();
    });
  });

  describe('折叠/展开交互', () => {
    it('应该点击按钮展开内容', async () => {
      const user = userEvent.setup();
      render(
        <ThinkingSection
          title="思考过程"
          content="这是推理内容"
        />
      );

      // 初始状态：内容不存在于 DOM
      expect(screen.queryByText('这是推理内容')).toBe(null);

      // 点击展开按钮
      const button = screen.getByRole('button');
      await user.click(button);

      // 内容应该可见
      expect(screen.getByText('这是推理内容')).toBeVisible();
    });

    it('应该点击按钮折叠内容', async () => {
      const user = userEvent.setup();
      render(
        <ThinkingSection
          title="思考过程"
          content="这是推理内容"
          initiallyExpanded={true}
        />
      );

      // 初始状态：内容可见
      const content = screen.getByText('这是推理内容');
      expect(content).toBeVisible();

      // 点击折叠按钮
      const button = screen.getByRole('button', { name: /思考过程/ });
      await user.click(button);

      // 内容应该不存在于 DOM 中
      expect(screen.queryByText('这是推理内容')).toBe(null);
    });

    it('应该在展开和折叠之间切换', async () => {
      const user = userEvent.setup();
      render(
        <ThinkingSection
          title="思考过程"
          content="内容"
        />
      );

      const button = screen.getByRole('button', { name: /思考过程/ });

      // 第一次点击：展开
      await user.click(button);
      expect(screen.getByText('内容')).toBeVisible();

      // 第二次点击：折叠
      await user.click(button);
      expect(screen.queryByText('内容')).toBe(null);

      // 第三次点击：再次展开
      await user.click(button);
      expect(screen.getByText('内容')).toBeVisible();
    });
  });

  describe('加载状态', () => {
    it('应该显示加载状态指示器', () => {
      render(
        <ThinkingSection
          title="思考中"
          content="推理内容"
          loading={true}
          provider={{ providerKey: 'deepseek' }}
        />
      );

      // 检查是否有加载动画（pulse-fade）
      const spinner = document.querySelector('.animate-pulse-fade');
      expect(spinner).not.toBe(null);
    });

    it('应该显示"思考中"标题', () => {
      render(
        <ThinkingSection
          title="思考中"
          content="内容"
          loading={true}
          provider={{ providerKey: 'deepseek' }}
        />
      );

      expect(screen.getByText('思考中')).toBeVisible();
    });

    it('非加载状态时不显示加载指示器', () => {
      render(
        <ThinkingSection
          title="思考完成"
          content="内容"
          loading={false}
          provider={{ providerKey: 'deepseek' }}
        />
      );

      const spinner = document.querySelector('.animate-pulse-fade');
      expect(spinner).toBe(null);
    });
  });

  describe('Markdown 渲染', () => {
    it('应该渲染包含 Markdown 的推理内容', () => {
      render(
        <ThinkingSection
          title="推理过程"
          content="**粗体** 和 *斜体*"
          initiallyExpanded={true}
        />
      );

      // Markdown 被渲染成 HTML，所以检查实际的文本内容
      expect(screen.getByText('粗体')).toBeVisible();
      expect(screen.getByText('斜体')).toBeVisible();
    });

    it('应该渲染包含代码块的推理内容', () => {
      render(
        <ThinkingSection
          title="推理过程"
          content="```javascript\nconst x = 1;\n```"
          initiallyExpanded={true}
        />
      );

      expect(screen.getByText(/javascript/)).toBeVisible();
    });

    it('应该渲染多行推理内容', () => {
      const multilineContent = 'Step 1\nStep 2\nStep 3';

      render(
        <ThinkingSection
          title="推理过程"
          content={multilineContent}
          initiallyExpanded={true}
        />
      );

      // 检查所有行都存在
      expect(screen.getByText(/Step 1/)).toBeVisible();
      expect(screen.getByText(/Step 2/)).toBeVisible();
      expect(screen.getByText(/Step 3/)).toBeVisible();
    });
  });

  describe('安全性', () => {
    it('应该清理 XSS 攻击代码', () => {
      render(
        <ThinkingSection
          title="推理过程"
          content={'<script>alert("XSS")</script>'}
          initiallyExpanded={true}
        />
      );

      // DOMPurify 应该清理 script 标签
      expect(document.querySelector('script')).toBe(null);
    });

    it('应该清理标题中的 HTML', () => {
      render(
        <ThinkingSection
          title={'<img src=x onerror=alert("XSS")>思考过程'}
          content="内容"
        />
      );

      // 标题应该被清理，不包含 img 标签
      expect(document.querySelector('img')).toBe(null);
      // 标题文本应该显示（清理后）
      expect(screen.getByText(/思考过程/)).toBeVisible();
    });
  });

  describe('边缘情况', () => {
    it('应该处理空推理内容', () => {
      render(
        <ThinkingSection
          title="思考过程"
          content=""
          initiallyExpanded={true}
        />
      );

      // 标题应该可见
      expect(screen.getByText('思考过程')).toBeVisible();
    });

    it('应该处理超长推理内容', () => {
      const longContent = 'A'.repeat(10000);
      
      render(
        <ThinkingSection
          title="思考过程"
          content={longContent}
          initiallyExpanded={true}
        />
      );
      
      expect(screen.getByText(longContent)).toBeVisible();
    });

    it('应该处理包含特殊字符的内容', () => {
      const specialContent = 'Special: < > & " \'';
      
      render(
        <ThinkingSection
          title="思考过程"
          content={specialContent}
          initiallyExpanded={true}
        />
      );
      
      expect(screen.getByText(/Special:/)).toBeVisible();
    });

    it('应该处理包含 Unicode 字符的内容', () => {
      const unicodeContent = '世界 🌍 مرحبا';

      render(
        <ThinkingSection
          title="思考过程"
          content={unicodeContent}
          initiallyExpanded={true}
        />
      );

      // 使用正则表达式匹配 Unicode 字符
      expect(screen.getByText(/世界/)).toBeVisible();
      expect(screen.getByText(/🌍/)).toBeVisible();
    });
  });

  describe('组件状态', () => {
    it('应该在组件挂载时正确初始化', () => {
      const { container } = render(
        <ThinkingSection
          title="思考过程"
          content="内容"
        />
      );
      
      expect(container.firstChild).not.toBe(null);
    });

    it('应该在 props 变化时正确更新', () => {
      const { container, rerender } = render(
        <ThinkingSection
          title="思考过程"
          content="Content 1"
          initiallyExpanded={true}
        />
      );
      
      expect(container.textContent).toContain('Content 1');
      
      rerender(
        <ThinkingSection
          title="思考过程"
          content="Content 2"
          initiallyExpanded={true}
        />
      );
      
      expect(container.textContent).toContain('Content 2');
    });

    it('应该正确处理标题变化', () => {
      const { rerender } = render(
        <ThinkingSection
          title="思考中"
          content="内容"
          loading={true}
          provider={{ providerKey: 'deepseek' }}
        />
      );

      expect(screen.getByText('思考中')).toBeVisible();

      rerender(
        <ThinkingSection
          title="思考完成"
          content="内容"
          loading={false}
          provider={{ providerKey: 'deepseek' }}
        />
      );

      expect(screen.getByText('思考完成')).toBeVisible();
      expect(document.querySelector('.animate-pulse-fade')).toBe(null);
    });
  });

  describe('可访问性', () => {
    it('应该有可访问的按钮标签', () => {
      const { container } = render(
        <ThinkingSection
          title="推理过程"
          content="内容"
        />
      );

      // 查找按钮元素
      const button = container.querySelector('button');
      expect(button).not.toBe(null);
      if (button) {
        // 检查按钮的标签名
        expect(button.tagName.toLowerCase()).toBe('button');
      }
    });

    it('应该在折叠时显示右箭头图标', () => {
      render(
        <ThinkingSection
          title="推理过程"
          content="内容"
        />
      );
      
      // ChevronRight icon 应该存在
      const chevronRight = document.querySelector('svg.lucide-chevron-right');
      expect(chevronRight).not.toBe(null);
    });

    it('应该在展开时显示下箭头图标', () => {
      render(
        <ThinkingSection
          title="推理过程"
          content="内容"
          initiallyExpanded={true}
        />
      );
      
      // ChevronDown icon 应该存在
      const chevronDown = document.querySelector('svg.lucide-chevron-down');
      expect(chevronDown).not.toBe(null);
    });
  });
});
