/**
 * ChatBubble UI 组件测试
 *
 * 测试新实现的聊天气泡组件的各种场景
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatRoleEnum } from '@/types/chat';

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    chat: {
      thinkingComplete: '思考完毕',
    },
  }));

// Mock highlight.js
vi.mock('highlight.js', () => {
  const { highlightJsMockFactory } = require('@/__test__/helpers/mocks/highlight');
  return highlightJsMockFactory;
});

// 使用真实的 markdown-it 和 DOMPurify 进行测试

describe('ChatBubble UI 组件', () => {
  describe('用户消息渲染', () => {
    it('应该正确渲染用户消息', () => {
      const { container } = render(
        <ChatBubble 
          role={ChatRoleEnum.USER} 
          content="Hello from user" 
        />
      );
      
      // 真实 markdown-it 渲染为 <p>Hello from user</p>，textContent 会带尾部换行
      expect(container.textContent).toContain('Hello from user');
    });

    it('应该为用户消息渲染正确的标识', () => {
      render(
        <ChatBubble
          role={ChatRoleEnum.USER}
          content="User message"
        />
      );

      screen.getByTestId('user-message');
    });

    it('应该渲染包含 Markdown 的用户消息', () => {
      const { container } = render(
        <ChatBubble
          role={ChatRoleEnum.USER}
          content="**Bold** and `code`"
        />
      );

      // 真实 markdown-it 渲染：**Bold** → <strong>Bold</strong>, `code` → <code>code</code>
      expect(container.querySelector('strong')).not.toBe(null);
      expect(container.querySelector('strong')?.textContent).toBe('Bold');
      expect(container.querySelector('code')).not.toBe(null);
      expect(container.querySelector('code')?.textContent).toBe('code');
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
      
      // 真实 markdown-it 渲染为 <p>Hello from assistant</p>，textContent 会带尾部换行
      expect(container.textContent).toContain('Hello from assistant');
    });

    it('应该为助手消息渲染正确的标识', () => {
      render(
        <ChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="Assistant message"
        />
      );

      screen.getByTestId('assistant-message');
    });

    it('应该渲染包含 Markdown 的助手消息', () => {
      const { container } = render(
        <ChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="# Heading\n\n**Bold** and *italic*"
        />
      );

      // 真实 markdown-it 渲染：# Heading → <h1>Heading</h1>, **Bold** → <strong>Bold</strong>
      expect(container.querySelector('h1')).not.toBe(null);
      expect(container.querySelector('h1')?.textContent).toContain('Heading');
      expect(container.querySelector('strong')).not.toBe(null);
      expect(container.querySelector('strong')?.textContent).toBe('Bold');
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
      
      // 真实 markdown-it 渲染为 <p>...</p>，textContent 会带尾部换行
      expect(container.textContent).toContain(longContent);
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
      
      // 真实 markdown-it 渲染为 <p>...</p>，textContent 会带尾部换行
      expect(container.textContent).toContain('Content 1');

      rerender(
        <ChatBubble
          role={ChatRoleEnum.USER}
          content="Content 2"
        />
      );

      expect(container.textContent).toContain('Content 2');
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
