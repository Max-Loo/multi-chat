import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import { saveChatListMiddleware } from '../chatMiddleware'
import {
  startSendChatMessage,
  createChat,
  editChat,
  editChatName,
  deleteChat,
} from '../../slices/chatSlices'
import { saveChatList } from '../../vaults/chatVault'
import { createMockChats } from '../../../__tests__/fixtures/chats'
import modelReducer from '../../slices/modelSlice'
import chatReducer from '../../slices/chatSlices'
import chatPageReducer from '../../slices/chatPageSlices'
import appConfigReducer from '../../slices/appConfigSlices'

// Mock the chatVault
vi.mock('../../vaults/chatVault', () => ({
  saveChatList: vi.fn(),
}))

describe('chatMiddleware', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a store with the middleware
    store = configureStore({
      reducer: {
        models: modelReducer,
        chat: chatReducer,
        chatPage: chatPageReducer,
        appConfig: appConfigReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(saveChatListMiddleware.middleware),
      preloadedState: {
        chat: {
          chatList: createMockChats(2),
          loading: false,
          selectedChatId: 'chat-1',
          error: null,
          initializationError: null,
          runningChat: {},
        },
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
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

  describe('saveChatListMiddleware', () => {
    it('should call saveChatList when startSendChatMessage.fulfilled is dispatched', async () => {
      // Arrange
      const mockSaveChatList = vi.mocked(saveChatList)
      mockSaveChatList.mockResolvedValue(undefined)

      const mockChat = createMockChats(1)[0]

      // Act
      store.dispatch(startSendChatMessage.fulfilled(undefined, '', {
        chat: mockChat,
        message: 'Test message',
      }))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockSaveChatList).toHaveBeenCalledTimes(1)
      expect(mockSaveChatList).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'chat-1' }),
          expect.objectContaining({ id: 'chat-2' }),
        ]),
      )
    })

    it('should call saveChatList when startSendChatMessage.rejected is dispatched', async () => {
      // Arrange
      const mockSaveChatList = vi.mocked(saveChatList)
      mockSaveChatList.mockResolvedValue(undefined)

      const mockChat = createMockChats(1)[0]

      // Act - Dispatch the rejected action directly
      // The test is simplified to verify that the middleware handles the action,
      // even if the reducer itself doesn't have proper runningChat state
      store.dispatch(startSendChatMessage.rejected(new Error('Test error'), '', {
        chat: mockChat,
        message: 'Test message',
      }))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Assert
      expect(mockSaveChatList).toHaveBeenCalledTimes(1)
      expect(mockSaveChatList).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: mockChat.id }),
        ]),
      )
    })

    it('should call saveChatList when createChat is dispatched', async () => {
      // Arrange
      const mockSaveChatList = vi.mocked(saveChatList)
      mockSaveChatList.mockResolvedValue(undefined)

      const mockChat = createMockChats(1)[0]

      // Act
      store.dispatch(createChat({
        chat: mockChat,
      }))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockSaveChatList).toHaveBeenCalledTimes(1)
    })

    it('should call saveChatList when editChat is dispatched', async () => {
      // Arrange
      const mockSaveChatList = vi.mocked(saveChatList)
      mockSaveChatList.mockResolvedValue(undefined)

      const mockChat = createMockChats(1)[0]

      // Act
      store.dispatch(editChat({
        chat: mockChat,
      }))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockSaveChatList).toHaveBeenCalledTimes(1)
    })

    it('should call saveChatList when editChatName is dispatched', async () => {
      // Arrange
      const mockSaveChatList = vi.mocked(saveChatList)
      mockSaveChatList.mockResolvedValue(undefined)

      // Act
      store.dispatch(editChatName({
        id: 'chat-1',
        name: 'New Name',
      }))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockSaveChatList).toHaveBeenCalledTimes(1)
    })

    it('should call saveChatList when deleteChat is dispatched', async () => {
      // Arrange
      const mockSaveChatList = vi.mocked(saveChatList)
      mockSaveChatList.mockResolvedValue(undefined)

      const mockChat = createMockChats(1)[0]

      // Act
      store.dispatch(deleteChat({
        chat: mockChat,
      }))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockSaveChatList).toHaveBeenCalledTimes(1)
    })

    it('should not call saveChatList for unrelated actions', async () => {
      // Arrange
      const mockSaveChatList = vi.mocked(saveChatList)
      mockSaveChatList.mockResolvedValue(undefined)

      // Act - Dispatch an action that should not trigger the middleware
      store.dispatch({ type: 'UNRELATED_ACTION' })

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockSaveChatList).not.toHaveBeenCalled()
    })

    it('should handle saveChatList errors gracefully', async () => {
      // Arrange
      const mockSaveChatList = vi.mocked(saveChatList)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSaveChatList.mockRejectedValue(new Error('Save failed'))

      const mockChat = createMockChats(1)[0]

      // Act
      store.dispatch(createChat({
        chat: mockChat,
      }))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockSaveChatList).toHaveBeenCalledTimes(1)
      // The middleware should not throw errors, but we can't easily test this
      // without modifying the middleware implementation to handle errors explicitly

      // Clean up
      consoleErrorSpy.mockRestore()
    })

    describe('错误场景测试', () => {
      it('应该处理saveChatList错误', async () => {
        // Arrange
        const mockSaveChatList = vi.mocked(saveChatList)
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockSaveChatList.mockRejectedValue(new Error('Failed to save chat list'))

        const mockChat = createMockChats(1)[0]

        // Act
        store.dispatch(createChat({
          chat: mockChat,
        }))

        // Wait for async middleware to complete
        await new Promise(resolve => setTimeout(resolve, 0))

        // Assert
        expect(mockSaveChatList).toHaveBeenCalledTimes(1)
        // listenerMiddleware会自动捕获错误并记录
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'listenerMiddleware/error',
          expect.any(Error),
          expect.objectContaining({ raisedBy: 'effect' }),
        )

        // Clean up
        consoleErrorSpy.mockRestore()
      })
    })
  })
})