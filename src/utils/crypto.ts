/**
 * 加密工具模块
 * 使用 Web Crypto API 实现 AES-256-GCM 加密/解密
 */

/**
 * 将 hex 字符串转换为 Uint8Array
 * @param hex - hex 编码的字符串
 * @returns Uint8Array
 */
const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

/**
 * 将 Uint8Array 转换为 Base64 字符串
 * @param bytes - Uint8Array
 * @returns Base64 编码的字符串
 */
const bytesToBase64 = (bytes: Uint8Array): string => {
  const binString = Array.from(bytes, (byte) =>
    String.fromCharCode(byte)
  ).join("");
  return btoa(binString);
};

/**
 * 将 Base64 字符串转换为 Uint8Array
 * @param base64 - Base64 编码的字符串
 * @returns Uint8Array
 */
const base64ToBytes = (base64: string): Uint8Array => {
  const binString = atob(base64);
  return Uint8Array.from(binString, (char) => char.charCodeAt(0));
};

/**
 * 加密字段
 * 使用 AES-256-GCM 算法加密明文数据
 * 加密格式：enc:base64(ciphertext + auth_tag + nonce)
 * @param plaintext - 要加密的明文
 * @param masterKey - 主密钥（hex 编码的 256-bit 密钥）
 * @returns 加密后的字符串（带有 "enc:" 前缀）
 */
export const encryptField = async (
  plaintext: string,
  masterKey: string
): Promise<string> => {
  try {
    // 将 hex 密钥转换为 Uint8Array
    const keyData = hexToBytes(masterKey);

    // 导入密钥
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData.buffer as ArrayBuffer,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    // 生成随机 nonce（12 bytes）
    const nonce = crypto.getRandomValues(new Uint8Array(12));

    // 将明文转换为 Uint8Array
    const encoder = new TextEncoder();
    const plaintextData = encoder.encode(plaintext);

    // 加密数据
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: nonce,
      },
      cryptoKey,
      plaintextData.buffer as ArrayBuffer
    );

    // 将密文转换为 Uint8Array
    const ciphertextBytes = new Uint8Array(ciphertext);

    // 将密文和 nonce 合并
    const combined = new Uint8Array(ciphertextBytes.length + nonce.length);
    combined.set(ciphertextBytes);
    combined.set(nonce, ciphertextBytes.length);

    // 转换为 Base64
    const base64 = bytesToBase64(combined);

    // 添加 "enc:" 前缀
    return `enc:${base64}`;
  } catch (error) {
    console.error("加密失败:", error);
    throw new Error("加密敏感数据失败，请检查主密钥是否有效", { cause: error });
  }
};

/**
 * 解密字段
 * 使用 AES-256-GCM 算法解密密文数据
 * @param ciphertext - 加密后的字符串（带有 "enc:" 前缀）
 * @param masterKey - 主密钥（hex 编码的 256-bit 密钥）
 * @returns 解密后的明文
 */
export const decryptField = async (
  ciphertext: string,
  masterKey: string
): Promise<string> => {
  try {
    // 检查前缀
    if (!ciphertext.startsWith("enc:")) {
      throw new Error("无效的加密数据格式：缺少 enc: 前缀");
    }

    // 去除前缀
    const base64 = ciphertext.slice(4);

    // 解码 Base64
    const combined = base64ToBytes(base64);

    // 分离密文和 nonce
    // nonce 是最后 12 个字节
    const nonceLength = 12;
    const ciphertextLength = combined.length - nonceLength;

    if (ciphertextLength <= 0) {
      throw new Error("无效的加密数据格式：数据长度不足");
    }

    const ciphertextBytes = combined.slice(0, ciphertextLength);
    const nonce = combined.slice(ciphertextLength);

    // 将 hex 密钥转换为 Uint8Array
    const keyData = hexToBytes(masterKey);

    // 导入密钥
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData.buffer as ArrayBuffer,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    // 解密数据
    const plaintextData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: nonce,
      },
      cryptoKey,
      ciphertextBytes.buffer as ArrayBuffer
    );

    // 将结果转换为字符串
    const decoder = new TextDecoder();
    return decoder.decode(plaintextData);
  } catch (error) {
    console.error("解密失败:", error);
    throw new Error(
      "解密敏感数据失败，可能是主密钥已更改或数据已损坏，需要重新配置 API 密钥",
      { cause: error }
    );
  }
};

/**
 * 检查字符串是否已加密（带有 enc: 前缀）
 * @param value - 要检查的字符串
 * @returns 如果已加密返回 true，否则返回 false
 */
export const isEncrypted = (value: string): boolean => {
  return value.startsWith("enc:");
};
