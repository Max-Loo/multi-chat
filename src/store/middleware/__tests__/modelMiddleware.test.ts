import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import { saveModelsMiddleware } from '../modelMiddleware'
import {
  createModel,
  editModel,
  deleteModel,
} from '../../slices/modelSlice'
import { saveModels } from '../../vaults/modelVault'
import { createMockModels } from '../../../__tests__/fixtures/models'
import modelReducer from '../../slices/modelSlice'
import chatReducer from '../../slices/chatSlices'
import chatPageReducer from '../../slices/chatPageSlices'
import appConfigReducer from '../../slices/appConfigSlices'

// Mock the modelVault
vi.mock('../../vaults/modelVault', () => ({
  saveModels: vi.fn(),
}))

describe('modelMiddleware', () => {
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
        getDefaultMiddleware().prepend(saveModelsMiddleware.middleware),
      preloadedState: {
        models: {
          models: createMockModels(2),
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

  describe('saveModelsMiddleware', () => {
    it('should call saveModels when createModel is dispatched', async () => {
      // Arrange
      const mockSaveModels = vi.mocked(saveModels)
      mockSaveModels.mockResolvedValue(undefined)

      const mockModel = createMockModels(1)[0]

      // Act
      store.dispatch(createModel({
        model: mockModel,
      }))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockSaveModels).toHaveBeenCalledTimes(1)
      expect(mockSaveModels).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'model-1' }),
          expect.objectContaining({ id: 'model-2' }),
          expect.objectContaining({ id: mockModel.id }),
        ]),
      )
    })

    it('should call saveModels when editModel is dispatched', async () => {
      // Arrange
      const mockSaveModels = vi.mocked(saveModels)
      mockSaveModels.mockResolvedValue(undefined)

      const mockModel = createMockModels(1)[0]

      // Act
      store.dispatch(editModel({
        model: mockModel,
      }))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockSaveModels).toHaveBeenCalledTimes(1)
    })

    it('should call saveModels when deleteModel is dispatched', async () => {
      // Arrange
      const mockSaveModels = vi.mocked(saveModels)
      mockSaveModels.mockResolvedValue(undefined)

      const mockModel = createMockModels(1)[0]

      // Act
      store.dispatch(deleteModel({
        model: mockModel,
      }))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockSaveModels).toHaveBeenCalledTimes(1)
    })

    it('should not call saveModels for unrelated actions', async () => {
      // Arrange
      const mockSaveModels = vi.mocked(saveModels)
      mockSaveModels.mockResolvedValue(undefined)

      // Act - Dispatch an action that should not trigger the middleware
      store.dispatch({ type: 'UNRELATED_ACTION' })

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockSaveModels).not.toHaveBeenCalled()
    })

    it('should handle saveModels errors gracefully', async () => {
      // Arrange
      const mockSaveModels = vi.mocked(saveModels)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSaveModels.mockRejectedValue(new Error('Save failed'))

      const mockModel = createMockModels(1)[0]

      // Act
      store.dispatch(createModel({
        model: mockModel,
      }))

      // Wait for async middleware to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockSaveModels).toHaveBeenCalledTimes(1)
      // The middleware should not throw errors, but we can't easily test this
      // without modifying the middleware implementation to handle errors explicitly

      // Clean up
      consoleErrorSpy.mockRestore()
    })

    describe('错误场景测试', () => {
      it('应该处理saveModels错误', async () => {
        // Arrange
        const mockSaveModels = vi.mocked(saveModels)
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockSaveModels.mockRejectedValue(new Error('Failed to save models'))

        const mockModel = createMockModels(1)[0]

        // Act
        store.dispatch(createModel({
          model: mockModel,
        }))

        // Wait for async middleware to complete
        await new Promise(resolve => setTimeout(resolve, 0))

        // Assert
        expect(mockSaveModels).toHaveBeenCalledTimes(1)
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