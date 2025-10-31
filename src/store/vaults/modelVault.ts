import { Client, Stronghold } from '@tauri-apps/plugin-stronghold';
import type { Store } from '@tauri-apps/plugin-stronghold';
import { appDataDir } from '@tauri-apps/api/path';
import { getLocalPassword } from '../storage/secretKeyStorage';
import { isNull } from 'es-toolkit';
import { Model } from '@/types/model';

interface Vault {
  stronghold: Stronghold;
  client: Client;
}

const enum VaultKeyEnum {
  models= 'models',
}

// 全局的实例
let stronghold: Stronghold | null = null
let client: Client | null = null

// 默认的客户名称，当前只支持单个客户
const defaultClientName = 'default'

// 初始化全局实例
const initVault = async (): Promise<Vault> => {

  const vaultPath = `${await appDataDir()}/modelVault.hold`
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

// 获取保险库实例（保证为单例模式）
const getVault = async (): Promise<Vault> => {
  if (isNull(stronghold) || isNull(client)) {
    const {
      stronghold: newStronghold,
      client: newClient,
    } = await initVault()

    stronghold = newStronghold
    client = newClient
  }

  return {
    stronghold,
    client,
  }
}

// 在 store 中插入一条记录
const insertRecord = async (store: Store, key: string, value: string) => {
  const data = Array.from(new TextEncoder().encode(value));
  await store.insert(key, data);
}

// 在 store 中读取一条记录
const getRecord = async (store: Store, key: string): Promise<string> => {
  const data = await store.get(key);
  if (isNull(data)) {
    return ''
  }
  return new TextDecoder().decode(new Uint8Array(data));
}

// 从保险库中获取模型列表数据
export const loadModels = async (): Promise<Model[]> => {
  try {
    const {
      // stronghold,
      client,
    } = await getVault()
    const store: Store = client.getStore()
    const modelsStr = await getRecord(store, VaultKeyEnum.models)

    const models: Model[] = modelsStr ? JSON.parse(modelsStr) : []

  return models
  } catch (error) {
    console.error('获取模型列表失败', error);
    throw new Error('从本地获取模型列表失败')
  }
}

// 向保险库中保存模型列表数据
export const saveModels = async (models: Model[]): Promise<void> => {
  try {
    const {
      stronghold,
      client,
    } = await getVault()

    const store: Store = client.getStore()
    await insertRecord(store, VaultKeyEnum.models, JSON.stringify(models))

    await stronghold.save()
  } catch (error) {
    console.error('保存模型列表失败', error);
    throw new Error('向本地保存模型列表失败')
  }
}