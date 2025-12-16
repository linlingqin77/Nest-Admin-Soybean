#!/usr/bin/env node
/**
 * RSA 密钥对生成脚本
 *
 * 功能：
 * 1. 生成 2048-bit RSA 密钥对
 * 2. 自动更新后端 .env 和 .env.example 的 CRYPTO_RSA_PUBLIC_KEY / CRYPTO_RSA_PRIVATE_KEY
 * 3. 自动更新前端 .env.dev / .env.test / .env.prod 的 VITE_APP_RSA_PUBLIC_KEY
 * 4. 移除前端配置中的 VITE_APP_RSA_PRIVATE_KEY（安全考虑）
 *
 * 使用方式：
 *   node scripts/generate-rsa-keys.cjs
 *   或
 *   pnpm generate:keys
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 项目根目录
const ROOT_DIR = path.resolve(__dirname, '../..');
const SERVER_DIR = path.resolve(ROOT_DIR, 'server');
const FRONTEND_DIR = path.resolve(ROOT_DIR, 'admin-naive-ui');

/**
 * 生成 2048-bit RSA 密钥对
 */
function generateRsaKeyPair() {
  console.log('🔐 正在生成 2048-bit RSA 密钥对...\n');

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // 将 PEM 格式公钥转换为 Base64 (去除头尾和换行，供前端 JSEncrypt 使用)
  const publicKeyBase64 = publicKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\n/g, '')
    .trim();

  // 私钥保持 PEM 格式（后端使用）
  const privateKeyPem = privateKey;

  console.log('✅ 密钥对生成成功！\n');
  console.log('📋 公钥 (Base64 - 供前端使用):');
  console.log(publicKeyBase64.substring(0, 60) + '...\n');
  console.log('📋 私钥 (PEM - 供后端使用):');
  console.log(privateKeyPem.substring(0, 60) + '...\n');

  return { publicKeyBase64, privateKeyPem };
}

/**
 * 更新环境变量文件中的指定配置项
 * @param {string} filePath - 文件路径
 * @param {Object} updates - 要更新的键值对 { key: value }
 * @param {string[]} removeKeys - 要移除的键
 */
function updateEnvFile(filePath, updates = {}, removeKeys = []) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在，跳过: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 更新配置项
  for (const [key, value] of Object.entries(updates)) {
    // 处理多行值（如 PEM 格式私钥）
    const escapedValue = value.includes('\n') ? `"${value}"` : value;

    // 匹配带注释的行或已有的配置行
    const regex = new RegExp(`^(#\\s*)?${key}=.*$`, 'gm');

    if (regex.test(content)) {
      // 替换已有配置
      content = content.replace(regex, `${key}=${escapedValue}`);
      modified = true;
    } else {
      // 配置不存在，添加到文件末尾
      content = content.trimEnd() + `\n${key}=${escapedValue}\n`;
      modified = true;
    }
  }

  // 移除指定的配置项
  for (const key of removeKeys) {
    const regex = new RegExp(`^#?\\s*${key}=.*$\\n?`, 'gm');
    if (regex.test(content)) {
      content = content.replace(regex, '');
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 已更新: ${path.relative(ROOT_DIR, filePath)}`);
    return true;
  }

  return false;
}

/**
 * 主函数
 */
function main() {
  console.log('═'.repeat(60));
  console.log('🔑 RSA 密钥对生成工具 - Nest Admin');
  console.log('═'.repeat(60) + '\n');

  // 生成密钥对
  const { publicKeyBase64, privateKeyPem } = generateRsaKeyPair();

  // 后端配置文件
  const serverEnvFiles = [
    path.join(SERVER_DIR, '.env'),
    path.join(SERVER_DIR, '.env.example'),
    path.join(SERVER_DIR, '.env.production'),
  ];

  // 前端配置文件
  const frontendEnvFiles = [
    path.join(FRONTEND_DIR, '.env.dev'),
    path.join(FRONTEND_DIR, '.env.test'),
    path.join(FRONTEND_DIR, '.env.prod'),
  ];

  console.log('📝 更新后端配置文件...\n');

  for (const envFile of serverEnvFiles) {
    updateEnvFile(envFile, {
      CRYPTO_ENABLED: 'true',
      CRYPTO_RSA_PUBLIC_KEY: publicKeyBase64,
      CRYPTO_RSA_PRIVATE_KEY: privateKeyPem,
    });
  }

  console.log('\n📝 更新前端配置文件...\n');

  for (const envFile of frontendEnvFiles) {
    updateEnvFile(
      envFile,
      {
        VITE_APP_RSA_PUBLIC_KEY: `'${publicKeyBase64}'`,
        VITE_APP_ENCRYPT: 'Y',
      },
      ['VITE_APP_RSA_PRIVATE_KEY'] // 移除前端私钥配置
    );
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 密钥更新完成！');
  console.log('═'.repeat(60));
  console.log('\n⚠️  重要提示：');
  console.log('   1. 请确保后端 .env 文件中的私钥不要提交到版本控制');
  console.log('   2. 生产环境建议使用环境变量或密钥管理服务');
  console.log('   3. 前后端需同时重启以使新密钥生效\n');
}

// 执行
main();
