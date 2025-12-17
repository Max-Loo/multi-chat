import { Chat } from "@/types/chat";
import { getRecord, getVault, insertRecord } from ".";


const enum VaultKeyEnum {
  chatList = 'chatList'
}

const VAULT_NAME = 'chatVault.hold'


// 从保险库中获取聊天列表数据
export const loadChatList = async(): Promise<Chat[]> => {
  try {
    const {
      client,
    } = await getVault(VAULT_NAME)
    const store = client.getStore()
    const chatListStr = await getRecord(store, VaultKeyEnum.chatList)

    const chatList: Chat[] = chatListStr ? JSON.parse(chatListStr) : []

    return chatList
  } catch (error) {
    console.error('Failed to get chat list', error);
    throw new Error('Failed to load chat list from local storage')
  }
}

// 向保险库中保存聊天列表数据
export const saveChatList = async (chatList: Chat[]): Promise<void> => {
  try {
    const {
      stronghold,
      client,
    } = await getVault(VAULT_NAME)

    const store = client.getStore()
    await insertRecord(store, VaultKeyEnum.chatList, JSON.stringify(chatList))

    await stronghold.save()
  } catch (error) {
    console.error('Failed to save chat list', error);
    throw new Error('Failed to save chat list to local storage')
  }
}