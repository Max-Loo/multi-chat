import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ErrorAlert } from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ErrorAlert';

/**
 * Mock react-i18next 模块
 * 提供测试用的国际化函数模拟实现
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: ((keyOrSelector: string | ((_: any) => string)) => {
      if (typeof keyOrSelector === 'function') {
        const mockResources = {
          setting: {
            modelProvider: {
              refreshFailedPrefix: '模型供应商加载失败：',
            },
          },
        };
        return keyOrSelector(mockResources);
      }
      return keyOrSelector;
    }) as unknown,
  }),
}));

describe('ErrorAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('错误信息展示', () => {
    it('应该显示错误信息当 error 不为 null', () => {
      const errorMessage = '网络连接失败';
      render(<ErrorAlert error={errorMessage} />);

      expect(screen.getByText(/网络连接失败/i)).toBeInTheDocument();
    });

    it('应该显示错误图标', () => {
      const { container } = render(<ErrorAlert error="测试错误" />);
      const svgIcon = container.querySelector('svg');

      expect(svgIcon).toBeInTheDocument();
    });

    it('不应该渲染任何内容当 error 为 null', () => {
      const { container } = render(<ErrorAlert error={null} />);

      expect(container.firstChild).toBeNull();
    });

    it('不应该渲染任何内容当 error 为空字符串', () => {
      const { container } = render(<ErrorAlert error="" />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('国际化文本', () => {
    it('应该显示国际化错误前缀', () => {
      render(<ErrorAlert error="测试错误" />);

      expect(screen.getByText(/模型供应商加载失败：/i)).toBeInTheDocument();
    });

    it('应该组合前缀和错误信息', () => {
      render(<ErrorAlert error="连接超时" />);

      const fullText = screen.getByText(/模型供应商加载失败：.*连接超时/i);
      expect(fullText).toBeInTheDocument();
    });
  });

  describe('组件渲染', () => {
    it('应该渲染 Alert 容器', () => {
      const { container } = render(<ErrorAlert error="测试错误" />);

      expect(container.firstChild).not.toBeNull();
      expect(container.firstChild?.childNodes.length).toBeGreaterThan(0);
    });

    it('应该渲染包含错误文本的元素', () => {
      render(<ErrorAlert error="测试错误" />);

      expect(screen.getByText(/测试错误/)).toBeInTheDocument();
    });

    it('应该渲染 SVG 图标', () => {
      const { container } = render(<ErrorAlert error="测试错误" />);
      const svgIcon = container.querySelector('svg');

      expect(svgIcon).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理长错误信息', () => {
      const longErrorMessage = '这是一个非常长的错误信息，包含了很多详细的描述和堆栈跟踪信息'.repeat(10);
      render(<ErrorAlert error={longErrorMessage} />);

      expect(screen.getByText(new RegExp(longErrorMessage.slice(0, 50)))).toBeInTheDocument();
    });

    it('应该处理特殊字符', () => {
      const specialCharsError = '错误: <script>alert("xss")</script> & "quotes"';
      render(<ErrorAlert error={specialCharsError} />);

      expect(screen.getByText(/<script>/)).toBeInTheDocument();
    });

    it('应该处理数字和符号', () => {
      const numericError = 'Error 404: Not Found (HTTP/1.1 500)';
      render(<ErrorAlert error={numericError} />);

      expect(screen.getByText(/404.*Not Found/i)).toBeInTheDocument();
    });
  });

  describe('React.memo 优化', () => {
    it('应该正确设置 displayName', () => {
      expect(ErrorAlert.displayName).toBe('ErrorAlert');
    });
  });

  describe('错误类型', () => {
    it('应该处理网络错误', () => {
      render(<ErrorAlert error="Failed to fetch" />);
      expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
    });

    it('应该处理解析错误', () => {
      render(<ErrorAlert error="JSON parse error" />);
      expect(screen.getByText(/JSON parse error/i)).toBeInTheDocument();
    });

    it('应该处理验证错误', () => {
      render(<ErrorAlert error="Validation failed" />);
      expect(screen.getByText(/Validation failed/i)).toBeInTheDocument();
    });
  });
});
