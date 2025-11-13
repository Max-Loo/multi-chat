import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "..";
import { Chat } from "@/types/chat";
import { isError, isNotNil } from "es-toolkit";
import { ModelProviderFactoryCreator } from "@/lib/factory/modelProviderFactory";
import { Model } from "@/types/model";


interface ChatModelState {
  // 当前正在运行中的聊天（还有网络传输）。chatId - modelId - history
  runningChat: Record<string, Record<string, {
    isSending: boolean;
    historyList: string[];
  }>>
}

const initialState: ChatModelState = {
  runningChat: {},
}

/**
 * @description 针对某个聊天的每个模型来发送消息
 */
const sendMessage = createAsyncThunk<
  string,
  {
    chat: Chat;
    message: string;
    model: Model;
  }
>(
  'chatModel/sendMessage',
  async({
    // chat,
    message,
    model,
  }, { }) => {
    try {
      const fetchApi = ModelProviderFactoryCreator.getFactory(model.providerKey).getModelProvider().fetchApi

      const fetchFn = fetchApi.getFetch()

      return await fetchFn(message)

    } catch (error) {
      throw new Error(isError(error) ? error.message : '失败')
    }
  },
)


/**
 * @description 触发发送聊天消息
 */
export const startSendChatMessage = createAsyncThunk<
  void,
  {
    chat: Chat;
    message: string;
  },
  { state: RootState }
>(
  'chatModel/startSendChatMessage',
  async({
    chat,
    message,
  }, { getState, dispatch, signal }) => {
    const state = getState()

    const {
      models,
    } = state.models

    const {
      chatModelList = [],
    } = chat

    chatModelList.forEach(async (chatModel) => {
      const model = models.find(model => model.id === chatModel.modelId)
      // model 可能因为被删除掉而是空的
      if (isNotNil(model)) {
        dispatch(sendMessage({
          chat,
          message,
          model,
        }, {
          // 传递令牌，使得能够中断
          signal,
        }))
      }
    })
  },
)

/**
 * @description chat 模块管理的 slice
 */
const chatModelSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 向某个模型发送消息 - 开始
      .addCase(sendMessage.pending, (state, action) => {
        const { chat, model } = action.meta.arg

        if (!state.runningChat[chat.id]) {
          state.runningChat[chat.id] = {}
        }

        if (!state.runningChat[chat.id][model.id]) {
          state.runningChat[chat.id][model.id] = {
            isSending: true,
            historyList: [],
          }
        } else {
          state.runningChat[chat.id][model.id].isSending = true
        }

      })
      // 向某个模型发送消息 - 成功
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { chat, model } = action.meta.arg
        state.runningChat[chat.id][model.id].isSending = false
        state.runningChat[chat.id][model.id].historyList.push(action.payload)
      })
      // 向某个模型发送消息 - 失败
      .addCase(sendMessage.rejected, (state, action) => {
        const { chat, model } = action.meta.arg
        state.runningChat[chat.id][model.id].isSending = false
        console.log(action.error);
      })
  },
})

export const {

} = chatModelSlice.actions


export default chatModelSlice.reducer