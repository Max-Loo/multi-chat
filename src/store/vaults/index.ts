import { Store, Client, Stronghold } from '@tauri-apps/plugin-stronghold';
import { appDataDir } from '@tauri-apps/api/path';
import { getLocalPassword } from '../storage/secretKeyStorage';
import { isNull, isUndefined } from 'es-toolkit';


interface VaultProps {
  stronghold: Stronghold;
  client: Client;
}


// 全局的实例
const strongholdMap: Map<string, Stronghold> = new Map()
const clientMap: Map<string, Client> = new Map()


// 默认的客户名称，当前只支持单个客户
const defaultClientName = 'default'


// 初始化全局实例
const initVault = async (vaultName: string): Promise<VaultProps> => {

  const vaultPath = `${await appDataDir()}/${vaultName}`
  const vaultPassword = await getLocalPassword()
  const stronghold = await Stronghold.load(vaultPath, vaultPassword)
  let client: Client
  try {
    client = await stronghold.loadClient(defaultClientName)
  } catch {
    client = await stronghold.createClient(defaultClientName)
  }
  return {
    stronghold,
    client,
  }
}


/**
 * @description 获取保险库实例（保证为单例模式）
 * @param vaultName 保险库的名称——文件名
 * @returns
 */
export const getVault = async (vaultName: string): Promise<VaultProps> => {
  let stronghold = strongholdMap.get(vaultName)
  let client = clientMap.get(vaultName)

  if (isUndefined(stronghold) || isUndefined(client)) {
    const {
      stronghold: newStronghold,
      client: newClient,
    } = await initVault(vaultName)

    stronghold = newStronghold
    client = newClient
  }

  return {
    stronghold,
    client,
  }
}

// 在 store 中插入一条记录
export const insertRecord = async (store: Store, key: string, value: string) => {
  const data = Array.from(new TextEncoder().encode(value));
  await store.insert(key, data);
}

// 在 store 中读取一条记录
export const getRecord = async (store: Store, key: string): Promise<string> => {
  const data = await store.get(key);
  if (isNull(data)) {
    return ''
  }
  return new TextDecoder().decode(new Uint8Array(data));
}