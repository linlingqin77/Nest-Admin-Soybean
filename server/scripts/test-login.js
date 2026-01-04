const http = require('http');

function getCaptcha() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:8080/api/v1/captchaImage', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function login(userName, password, code, uuid) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ userName, password, code, uuid });
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/v1/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    const captchaRes = await getCaptcha();
    console.log('验证码状态:', captchaRes.data.captchaEnabled ? '已启用' : '已禁用');
    
    if (!captchaRes.data.captchaEnabled) {
      const loginRes = await login('admin', 'admin123', '', '');
      console.log('登录结果:', JSON.stringify(loginRes, null, 2));
    } else {
      console.log('验证码已启用，UUID:', captchaRes.data.uuid);
      const loginRes = await login('admin', 'admin123', '1234', captchaRes.data.uuid);
      console.log('登录结果(错误验证码):', JSON.stringify(loginRes, null, 2));
    }
  } catch (err) {
    console.error('错误:', err.message);
  }
}

main();
