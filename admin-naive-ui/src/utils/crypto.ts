import CryptoJS from 'crypto-js';

/**
 * 随机生成32位的字符串
 *
 * @returns {string}
 */
const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

/**
 * 生成随机16字节IV
 *
 * @returns {CryptoJS.lib.WordArray}
 */
const generateIv = () => {
  return CryptoJS.lib.WordArray.random(16);
};

/**
 * 随机生成aes 密钥
 *
 * @returns {CryptoJS.lib.WordArray}
 */
export const generateAesKey = () => {
  return CryptoJS.enc.Utf8.parse(generateRandomString());
};

/**
 * 加密base64
 *
 * @returns {string}
 */
export const encryptBase64 = (str: CryptoJS.lib.WordArray) => {
  return CryptoJS.enc.Base64.stringify(str);
};

/** 解密base64 */
export const decryptBase64 = (str: string) => {
  return CryptoJS.enc.Base64.parse(str);
};

/**
 * 使用密钥对数据进行加密 (CBC模式)
 * 生成随机IV，将IV拼接到密文头部
 *
 * @param message 待加密的消息
 * @param aesKey AES密钥
 * @returns {string} Base64编码的 IV(16字节) + 密文
 */
export const encryptWithAes = (message: string, aesKey: CryptoJS.lib.WordArray) => {
  // 生成随机IV
  const iv = generateIv();

  // 使用CBC模式加密
  const encrypted = CryptoJS.AES.encrypt(message, aesKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // 将IV和密文拼接: IV(16字节) + 密文
  const ivAndCiphertext = iv.concat(encrypted.ciphertext);

  // 返回Base64编码
  return CryptoJS.enc.Base64.stringify(ivAndCiphertext);
};

/**
 * 使用密钥对数据进行解密 (CBC模式)
 * 从密文头部提取IV后解密
 *
 * @param message Base64编码的 IV(16字节) + 密文
 * @param aesKey AES密钥
 * @returns {string} 解密后的明文
 */
export const decryptWithAes = (message: string, aesKey: CryptoJS.lib.WordArray) => {
  // Base64解码
  const ivAndCiphertext = CryptoJS.enc.Base64.parse(message);

  // 提取IV (前16字节 = 4个words)
  const iv = CryptoJS.lib.WordArray.create(ivAndCiphertext.words.slice(0, 4), 16);

  // 提取密文 (剩余部分)
  const ciphertext = CryptoJS.lib.WordArray.create(ivAndCiphertext.words.slice(4), ivAndCiphertext.sigBytes - 16);

  // 构造CipherParams对象
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext,
  });

  // 使用CBC模式解密
  const decrypted = CryptoJS.AES.decrypt(cipherParams, aesKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
};
