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
    console.error('获取聊天列表失败', error);
    throw new Error('从本地获取聊天列表失败')
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
    console.error('保存聊天列表失败', error);
    throw new Error('向本地保存聊天列表失败')
  }
}