import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import { saveDefaultAppLanguage } from '../appConfigMiddleware'
import { setAppLanguage } from '../../slices/appConfigSlices'
import { changeAppLanguage } from '../../../lib/i18n'
import modelReducer from '../../slices/modelSlice'
import chatReducer from '../../slices/chatSlices'
import chatPageReducer from '../../slices/chatPageSlices'
import appConfigReducer from '../../slices/appConfigSlices'

// Mock the global functions
vi.mock('../../../lib/i18n', () => ({
  changeAppLanguage: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('appConfigMiddleware', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset changeAppLanguage mock to resolve by default
    vi.mocked(changeAppLanguage).mockResolvedValue(undefined)

    // Create a store with the middleware
    store = configureStore({
      reducer: {
        models: modelReducer,
        chat: chatReducer,
        chatPage: chatPageReducer,
        appConfig: appConfigReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(saveDefaultAppLanguage.middleware),
      preloadedState: {
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        chat: {
          chatList: [],
          loading: false,
          selectedChatId: null,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          language: 'en',
        },
        chatPage: {
          isSidebarCollapsed: false,
          isShowChatPage: false,
        },
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('saveDefaultAppLanguage', () => {
    it('should save language to localStorage and call changeAppLanguage when setAppLanguage is dispatched', async () => {
      // Arrange
      const mockChangeAppLanguage = vi.mocked(changeAppLanguage)
      mockChangeAppLanguage.mockResolvedValue(undefined)

      // Act
      store.dispatch(setAppLanguage('zh-CN'))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith('multi-chat-language', 'zh-CN')
      expect(mockChangeAppLanguage).toHaveBeenCalledWith('zh-CN')
    })

    it('should not call localStorage or changeAppLanguage for unrelated actions', async () => {
      // Arrange
      const mockChangeAppLanguage = vi.mocked(changeAppLanguage)

      // Act - Dispatch an action that should not trigger the middleware
      store.dispatch({ type: 'UNRELATED_ACTION' })

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
      expect(mockChangeAppLanguage).not.toHaveBeenCalled()
    })

    it('should handle localStorage errors gracefully', async () => {
      // Arrange
      const mockChangeAppLanguage = vi.mocked(changeAppLanguage)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      mockChangeAppLanguage.mockResolvedValue(undefined)

      // Act
      store.dispatch(setAppLanguage('fr'))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith('multi-chat-language', 'fr')
      // The middleware should not throw errors, but we can't easily test this
      // without modifying the middleware implementation to handle errors explicitly

      // Clean up
      consoleErrorSpy.mockRestore()
    })

    it('should handle changeAppLanguage errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock changeAppLanguage to throw an error
      vi.mocked(changeAppLanguage).mockRejectedValue(new Error('Language change failed'))

      // Act
      store.dispatch(setAppLanguage('ja'))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 300))

      // Assert - Check that localStorage was called (meaning the middleware started execution)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('multi-chat-language', 'ja')

      // Assert - Check that error was logged (meaning the middleware caught and handled the error)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to change app language:', expect.any(Error))

      // Clean up
      consoleErrorSpy.mockRestore()
    })

    describe('错误场景测试', () => {
      it('应该处理changeAppLanguage错误', async () => {
        // Arrange
        const mockChangeAppLanguage = vi.mocked(changeAppLanguage)
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockChangeAppLanguage.mockRejectedValue(new Error('Failed to change language'))

        // Act
        store.dispatch(setAppLanguage('ja'))

        // Wait for async middleware to complete
        await new Promise(resolve => setTimeout(resolve, 0))

        // Assert
        expect(localStorageMock.setItem).toHaveBeenCalledWith('multi-chat-language', 'ja')
        // 当localStorage出错时，changeAppLanguage可能不会被调用
        // 我们只验证localStorage被调用了
        // 验证错误被记录
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to change app language:',
          expect.any(Error),
        )

        // Clean up
        consoleErrorSpy.mockRestore()
      })
    })
  })
})