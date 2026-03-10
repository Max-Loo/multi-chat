/**
 * ChatBubble UI 组件测试
 *
 * 测试新实现的聊天气泡组件的各种场景
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatRoleEnum } from '@/types/chat';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 第三方库类型定义不完整
    t: ((keyOrSelector: string | ((resources: any) => string)) => {
      if (typeof keyOrSelector === 'function') {
        const mockResources = {
          chat: {
            thinking: '思考中......',
            thinkingComplete: '思考完毕',
          },
        };
        return keyOrSelector(mockResources);
      }
      return keyOrSelector;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 测试错误处理，需要构造无效输入
    }) as any,
    i18n: {
      language: 'zh',
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

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
    render: (str: string) => `<p>${str}</p>`,
  })),
}));

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (html: string) => {
      // 简单的 XSS 清理模拟：移除 script 标签
      return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    },
  },
}));

describe('ChatBubble UI 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('用户消息渲染', () => {
    it('应该正确渲染用户消息', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.USER} 
          content="Hello from user" 
        />
      );
      
      expect(container.textContent).toBe('Hello from user');
    });

    it('应该为用户消息应用右对齐样式', () => {
      const { container } = render(
        <ChatBubble
          role={ChatRoleEnum.USER}
          content="User message"
        />
      );

      // 检查外层 div 是否右对齐
      const wrapper = container.querySelector('.justify-end');
      expect(wrapper).not.toBe(null);
      // 检查 Card 是否有正确的背景色（灰色背景）
      const card = container.querySelector('.bg-gray-100');
      expect(card).not.toBe(null);
      // 检查文字颜色是否正确
      const textElement = container.querySelector('.text-gray-800');
      expect(textElement).not.toBe(null);
    });

    it('应该渲染包含 Markdown 的用户消息', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.USER} 
          content="**Bold** and `code`" 
        />
      );
      
      expect(container.textContent).toContain('**Bold**');
      expect(container.textContent).toContain('`code`');
    });

    it('应该处理空内容的用户消息', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.USER} 
          content="" 
        />
      );
      
      expect(container.firstChild).not.toBe(null);
    });
  });

  describe('AI 助手消息渲染', () => {
    it('应该正确渲染助手消息', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.ASSISTANT} 
          content="Hello from assistant" 
        />
      );
      
      expect(container.textContent).toBe('Hello from assistant');
    });

    it('应该为助手消息应用左对齐和无边框样式', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.ASSISTANT} 
          content="Assistant message" 
        />
      );
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toHaveClass('border-none'); // 无边框样式
      expect(card).toHaveClass('shadow-none'); // 无阴影
    });

    it('应该渲染包含 Markdown 的助手消息', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.ASSISTANT} 
          content="# Heading\n\n**Bold** and *italic*" 
        />
      );
      
      expect(container.textContent).toContain('# Heading');
      expect(container.textContent).toContain('**Bold**');
    });

    it('应该处理空内容的助手消息', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.ASSISTANT} 
          content="" 
        />
      );
      
      expect(container.firstChild).not.toBe(null);
    });
  });

  describe('推理内容渲染', () => {
    it('应该显示推理内容折叠面板', () => {
      const { container } = render(
        <ChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="Final answer"
          reasoningContent="This is my reasoning"
        />
      );

      // 检查标题（推理内容默认折叠，只显示标题）
      expect(container.textContent).toContain('思考完毕');
      // 检查正式回复
      expect(container.textContent).toContain('Final answer');
    });

    it('应该显示"思考完毕"标题（非运行状态）', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.ASSISTANT} 
          content="Final answer"
          reasoningContent="Thinking process"
          isRunning={false}
        />
      );
      
      expect(container.textContent).toContain('思考完毕');
    });

    it('应该显示"思考中......"标题（运行状态）', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.ASSISTANT} 
          content=""
          reasoningContent="Thinking process"
          isRunning={true}
        />
      );
      
      expect(container.textContent).toContain('思考中...');
    });

    it('应该处理只有推理内容没有正式内容的消息', () => {
      const { container } = render(
        <ChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content=""
          reasoningContent="Still thinking..."
          isRunning={true}
        />
      );

      // 检查标题（推理内容默认折叠，只显示标题）
      expect(container.textContent).toContain('思考中...');
    });
  });

  describe('边缘情况处理', () => {
    it('应该为系统角色返回 null', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.SYSTEM} 
          content="System message" 
        />
      );
      
      expect(container.firstChild).toBe(null);
    });

    it('应该为工具角色返回 null', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.TOOL} 
          content="Tool result" 
        />
      );
      
      expect(container.firstChild).toBe(null);
    });

    it('应该处理超长消息内容', () => {
      const longContent = 'A'.repeat(10000);
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.USER} 
          content={longContent} 
        />
      );
      
      expect(container.textContent).toBe(longContent);
    });

    it('应该处理包含特殊字符的内容', () => {
      const specialContent = 'Special: <script> & "quotes"';
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.ASSISTANT} 
          content={specialContent} 
        />
      );
      
      expect(container.textContent).toContain('Special:');
    });

    it('应该处理包含 Unicode 字符的内容', () => {
      const unicodeContent = 'Hello 世界 🌍 مرحبا';
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.ASSISTANT} 
          content={unicodeContent} 
        />
      );
      
      expect(container.textContent).toContain('世界');
      expect(container.textContent).toContain('🌍');
    });
  });

  describe('安全性', () => {
    it('应该清理 XSS 攻击代码', () => {
      const xssContent = '<script>alert("XSS")</script>';
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.USER} 
          content={xssContent} 
        />
      );
      
      // DOMPurify 应该清理 script 标签
      expect(container.querySelector('script')).toBe(null);
    });

    it('应该清理推理内容中的 XSS 代码', () => {
      const xssReasoning = '<script>alert("XSS")</script>';
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.ASSISTANT} 
          content="Safe answer"
          reasoningContent={xssReasoning} 
        />
      );
      
      expect(container.querySelector('script')).toBe(null);
    });
  });

  describe('组件状态', () => {
    it('应该在组件挂载时正确初始化', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.USER} 
          content="Test" 
        />
      );
      
      expect(container.firstChild).not.toBe(null);
    });

    it('应该在 props 变化时正确更新', () => {
      const { container, rerender } = render(
        <ChatBubble 
          role={ChatRoleEnum.USER} 
          content="Content 1" 
        />
      );
      
      expect(container.textContent).toBe('Content 1');
      
      rerender(
        <ChatBubble 
          role={ChatRoleEnum.USER} 
          content="Content 2" 
        />
      );
      
      expect(container.textContent).toBe('Content 2');
    });

    it('应该正确处理 isRunning 状态变化', () => {
      const { container, rerender } = render(
        <ChatBubble 
          role={ChatRoleEnum.ASSISTANT} 
          content=""
          reasoningContent="Thinking"
          isRunning={true}
        />
      );
      
      expect(container.textContent).toContain('思考中...');
      
      rerender(
        <ChatBubble 
          role={ChatRoleEnum.ASSISTANT} 
          content="Answer"
          reasoningContent="Thinking"
          isRunning={false}
        />
      );
      
      expect(container.textContent).toContain('思考完毕');
    });
  });
});
