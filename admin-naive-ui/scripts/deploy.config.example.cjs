/**
 * 部署配置文件模板
 * 复制此文件为 deploy.config.js 并填写你的服务器信息
 */

module.exports = {
  // 开发环境
  dev: {
    name: '开发环境',
    host: 'your-dev-server-ip', // 替换为你的开发服务器地址
    port: 22, // SSH 端口
    username: 'root', // SSH 用户名

    // 方式1: 使用密码（不推荐）
    password: '',

    // 方式2: 使用私钥（推荐）
    privateKey: '', // 例如: '/Users/username/.ssh/id_rsa'
    passphrase: '', // 私钥密码（如果有的话）

    distPath: 'dist', // 本地打包目录（相对路径）
    remotePath: '/var/www/html/admin', // 远程部署目录
    backupPath: '/var/www/backup/admin', // 远程备份目录
    isBackup: true, // 是否备份旧文件
  },

  // 测试环境
  test: {
    name: '测试环境',
    host: 'your-test-server-ip',
    port: 22,
    username: 'root',
    password: '',
    privateKey: '',
    passphrase: '',
    distPath: 'dist',
    remotePath: '/var/www/html/admin',
    backupPath: '/var/www/backup/admin',
    isBackup: true,
  },

  // 生产环境
  prod: {
    name: '生产环境',
    host: 'your-prod-server-ip',
    port: 22,
    username: 'root',
    password: '',
    privateKey: '',
    passphrase: '',
    distPath: 'dist',
    remotePath: '/var/www/html/admin',
    backupPath: '/var/www/backup/admin',
    isBackup: true,
  },
};
