const https = require('https');

const SERVER_PORT = 3000;

console.log('Verificando headers de seguridad...\n');

const req = https.request({
  hostname: 'localhost',
  port: SERVER_PORT,
  method: 'GET',
  path: '/',
  rejectUnauthorized: false
}, (res) => {
  const headers = res.headers;
  
  const hsts = headers['strict-transport-security'];
  const contentType = headers['x-content-type-options'];
  const frameOptions = headers['x-frame-options'];
  
  console.log('Headers encontrados:\n');
  
  let passCount = 0;
  
  if (hsts) {
    console.log(`✓ HSTS: ${hsts}`);
    passCount++;
  } else {
    console.log('✗ HSTS: No configurado');
  }
  
  if (contentType) {
    console.log(`✓ X-Content-Type-Options: ${contentType}`);
    passCount++;
  } else {
    console.log('✗ X-Content-Type-Options: No configurado');
  }
  
  if (frameOptions) {
    console.log(`✓ X-Frame-Options: ${frameOptions}`);
    passCount++;
  } else {
    console.log('✗ X-Frame-Options: No configurado');
  }
  
  console.log('');
  
  if (hsts) {
    console.log(`RESULTADO: ✓ HSTS configurado (protección anti-downgrade activa)\n`);
    process.exit(0);
  } else {
    console.log(`RESULTADO: ✗ HSTS no configurado\n`);
    process.exit(1);
  }
  
  res.resume();
});

req.on('error', (err) => {
  console.log(`✗ Error: ${err.code || err.message}`);
  console.log('Verifica que el servidor esté corriendo en https://localhost:3000\n');
  process.exit(1);
});

req.setTimeout(5000);
req.on('timeout', () => {
  console.log('✗ Timeout: El servidor no responde\n');
  req.destroy();
  process.exit(1);
});

req.end();
