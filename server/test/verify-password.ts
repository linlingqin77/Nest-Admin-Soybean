import * as bcrypt from 'bcryptjs';

const hash = '$2b$10$UrJrjy0kxyrTO1UvhRVsvex35mB1s1jzAraIA9xtzPmlLmRtZXEXS';

const passwords = ['admin123', 'admin', '123456', 'admin@123', 'nestadmin'];

async function verifyPasswords() {
  console.log('验证密码哈希:', hash);
  console.log('');
  
  for (const password of passwords) {
    const isMatch = await bcrypt.compare(password, hash);
    console.log(`密码 "${password}": ${isMatch ? '✓ 匹配' : '✗ 不匹配'}`);
  }
}

verifyPasswords();
