import CryptoJS from 'crypto-js';
import { platform, version } from '@tauri-apps/plugin-os';
import { appDataDir } from '@tauri-apps/api/path';
import { settingStore } from '.';

const enum LocalStorageKeyEnum {
  salt ='salt',
  password = 'password',
};



/**
 * @description 生成随机盐值
 * @returns {string} salt - 盐值
 */
const generateSalt = (): string => {
  return CryptoJS.lib.WordArray.random(128 / 8).toString()
}

/**
 * @description 基于硬件信息和用户输入生成安全的派生密码
 * @param {string} salt - 随机盐值
 * @returns {string} password - 最终的派生密码
 */
const generateHardwareBasedPassword = (salt: string): string => {
  try {
    // 手机基础的信息
    const baseInfo = JSON.stringify({
    platform: platform(),
    version: version(),
    dataDir: appDataDir(),
  })
    // 使用 PBKDF2 进行密钥派生
    const derivedKey = CryptoJS.PBKDF2(baseInfo, salt, {
      keySize: 256 / 32,
      iterations: 10000,
      hasher: CryptoJS.algo.SHA256,
    })

    // 将派生密钥转换为十六进制字符串
    const finalPassword = derivedKey.toString(CryptoJS.enc.Hex);

    return finalPassword
  } catch (error) {
    console.error('生成派生密钥的时候失败', error);
    throw new Error('无法生成派生密钥')
  }
}

// 从本地存储加载密钥
const loadPassword = async (): Promise<string | undefined> => {
  try {
    return settingStore.get<string>(LocalStorageKeyEnum.password)
  } catch (error) {
    console.error('加载本地密钥失败', error)
    throw new Error('加载本地密钥失败')
  }
}

// 保存本地密钥，理论上只会在第一次生成的时候执行一次
const savePassword = async (password: string): Promise<void> => {
  return settingStore.setAndSave(LocalStorageKeyEnum.password, password, '保存本地密钥失败')
}

// 将盐值保存在本地
const saveSalt = async (salt: string): Promise<void> => {
  return settingStore.setAndSave(LocalStorageKeyEnum.salt, salt, '保存本地盐值失败')
}


// 带有初次加载拦截的加载密钥
export const getLocalPassword = async (): Promise<string> => {
  let password = await loadPassword()

  // 如果发现没有密钥，就生成并保存（往往发生在第一次应用启动）
  if (!password) {
    // 生成随机盐值
    const salt = generateSalt()
    // 生成派生密码
    password = generateHardwareBasedPassword(salt)
    // 保存盐值
    saveSalt(salt)
    // 保存密码
    savePassword(password)
  }

  return password
}