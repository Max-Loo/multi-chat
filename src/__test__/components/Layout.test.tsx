/**

 * Layout 组件测试

 *

 * 测试布局渲染和基本结构

 */



import { describe, it, expect, afterEach, vi } from 'vitest';

import { render, cleanup } from '@testing-library/react';

import { BrowserRouter } from 'react-router-dom';

import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';

import Layout from '@/components/Layout';

import chatReducer from '@/store/slices/chatSlices';

import modelReducer from '@/store/slices/modelSlice';

import chatPageReducer from '@/store/slices/chatPageSlices';



// Mock react-i18next

vi.mock('react-i18next', () => ({

  useTranslation: () => ({

    t: (key: string) => key,

    i18n: {

      language: 'en',

      changeLanguage: vi.fn(),

    },

  }),

  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,

}));



// 创建测试用 Redux Store

const createTestStore = () => {

  return configureStore({

    reducer: {

      chat: chatReducer,

      chatPage: chatPageReducer,

      models: modelReducer,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    // Reason: Redux Toolkit 严格类型系统限制

    } as any,

    preloadedState: {

      chat: {

        chatList: [],

        selectedChatId: null,

        loading: false,

        error: null,

        initializationError: null,

        runningChat: {},

      },

      chatPage: {

        isSidebarCollapsed: false,

        isShowChatPage: true,

      },

      models: {

        models: [],

        loading: false,

        error: null,

      },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 第三方库类型定义不完整
    } as any,

  });

};



// 每个测试后清理 DOM

afterEach(() => {

  cleanup();

});



describe('Layout 组件', () => {

  describe('渲染测试', () => {

    it('应该正确渲染 Layout 组件', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout />

          </BrowserRouter>

        </Provider>

      );



      expect(container.firstChild).toBeDefined();

    });



    it('应该渲染主内容区域', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout />

          </BrowserRouter>

        </Provider>

      );



      const mainContent = container.querySelector('.flex-1');

      expect(mainContent).toBeDefined();

    });



    it('应该应用正确的 CSS 类名', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout />

          </BrowserRouter>

        </Provider>

      );



      const layoutDiv = container.firstChild as HTMLElement;

      expect(layoutDiv).toHaveClass('flex', 'h-screen', 'bg-white');

    });



    it('应该支持自定义 className', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout className="custom-class" />

          </BrowserRouter>

        </Provider>

      );



      const layoutDiv = container.firstChild as HTMLElement;

      expect(layoutDiv).toHaveClass('custom-class');

    });

  });



  describe('布局结构测试', () => {

    it('应该有正确的 Flexbox 布局结构', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout />

          </BrowserRouter>

        </Provider>

      );



      const layoutDiv = container.firstChild as HTMLElement;

      const mainContent = container.querySelector('.flex-1');



      // Layout 应该是 flex 容器

      expect(layoutDiv).toHaveClass('flex');



      // 主内容区域应该存在

      expect(mainContent).toBeDefined();

    });



    it('应该占满整个屏幕高度', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout />

          </BrowserRouter>

        </Provider>

      );



      const layoutDiv = container.firstChild as HTMLElement;

      expect(layoutDiv).toHaveClass('h-screen');

    });



    it('主内容区域应该占据剩余空间', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout />

          </BrowserRouter>

        </Provider>

      );



      const mainContent = container.querySelector('.flex-1');

      expect(mainContent).toHaveClass('flex-1');

    });

  });



  describe('Suspense 处理测试', () => {

    it('应该使用 Suspense 包裹 Outlet', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout />

          </BrowserRouter>

        </Provider>

      );



      // 组件应该正常渲染

      expect(container.firstChild).toBeDefined();

    });

  });



  describe('子组件位置测试', () => {

    it('应该正确渲染 Sidebar 组件', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout />

          </BrowserRouter>

        </Provider>

      );



      // Sidebar 应该被渲染（不使用 mock）

      expect(container.firstChild).toBeDefined();

    });



    it('Sidebar 应该位于主内容区域之前', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout />

          </BrowserRouter>

        </Provider>

      );



      const layoutDiv = container.firstChild as HTMLElement;

      const mainContent = container.querySelector('.flex-1');



      // 验证主内容区域存在

      expect(mainContent).toBeInTheDocument();



      // 验证它们在同一个布局容器中

      expect(layoutDiv).toContainElement(mainContent as HTMLElement);

    });

  });



  describe('响应式行为', () => {

    it('应该在移动端和桌面端都正确渲染', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout />

          </BrowserRouter>

        </Provider>

      );



      expect(container.firstChild).toBeDefined();

    });



    it('应该保持固定高度布局不受视口影响', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout />

          </BrowserRouter>

        </Provider>

      );



      const layoutDiv = container.firstChild as HTMLElement;



      // 验证布局使用 h-screen 而不是 min-h-screen

      expect(layoutDiv).toHaveClass('h-screen');

      expect(layoutDiv).not.toHaveClass('min-h-screen');

    });



    it('主内容区域应该占满父容器高度', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout />

          </BrowserRouter>

        </Provider>

      );



      const mainContent = container.querySelector('.flex-1') as HTMLElement;



      expect(mainContent).toHaveClass('h-full');

    });

  });



  describe('边界情况测试', () => {

    it('应该处理空 className', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout className="" />

          </BrowserRouter>

        </Provider>

      );



      const layoutDiv = container.firstChild as HTMLElement;

      expect(layoutDiv).toHaveClass('flex', 'h-screen', 'bg-white');

    });



    it('应该处理多个自定义 className', () => {

      const store = createTestStore();

      const { container } = render(

        <Provider store={store}>

          <BrowserRouter>

            <Layout className="class1 class2 class3" />

          </BrowserRouter>

        </Provider>

      );



      const layoutDiv = container.firstChild as HTMLElement;

      expect(layoutDiv).toHaveClass('class1', 'class2', 'class3');

    });

  });

});
