import JSEncrypt from 'jsencrypt';
// 密钥对生成 http://web.chacuo.net/netrsakeypair

const publicKey = import.meta.env.VITE_APP_RSA_PUBLIC_KEY;

/**
 * RSA 加密
 * 使用公钥加密数据（用于加密 AES 密钥发送给后端）
 *
 * @param txt 待加密的明文
 * @returns 加密后的 Base64 字符串
 */
export const encrypt = (txt: string) => {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKey!); // 设置公钥
  return encryptor.encrypt(txt); // 对数据进行加密
};
