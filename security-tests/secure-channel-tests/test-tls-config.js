

const https = require('https');
const tls = require('tls');

const SERVER_PORT = 3000;

console.log('Verificando configuración TLS...\n');

// Test de version TLS
const socket = tls.connect({
  host: 'localhost',
  port: SERVER_PORT,
  rejectUnauthorized: false
}, () => {
  const protocol = socket.getProtocol();
  const cipher = socket.getCipher();
  
  console.log(`Protocolo: ${protocol}`);
  console.log(`Cifrado: ${cipher.name}`);
  console.log(`Bits: ${cipher.bits}\n`);
  
  const isTLS12orHigher = protocol === 'TLSv1.2' || protocol === 'TLSv1.3';
  const isStrongCipher = cipher.name.includes('AES') && cipher.name.includes('GCM');
  
  if (isTLS12orHigher) {
    console.log('✓ Versión TLS segura');
  } else {
    console.log('✗ Versión TLS obsoleta');
  }
  
  if (isStrongCipher) {
    console.log('✓ Cifrado fuerte (AEAD)');
  } else {
    console.log('⚠️  Cifrado debería ser AEAD');
  }
  
  console.log('');
  
  if (isTLS12orHigher && isStrongCipher) {
    console.log('RESULTADO: ✓ Configuración TLS correcta\n');
    process.exit(0);
  } else {
    console.log('RESULTADO: ✗ Configuración requiere mejoras\n');
    process.exit(1);
  }
  
  socket.end();
});

socket.on('error', (err) => {
  console.log(`✗ Error: ${err.code || err.message}`);
  console.log('Verifica que el servidor esté corriendo en https://localhost:3000\n');
  process.exit(1);
});

socket.setTimeout(5000);
socket.on('timeout', () => {
  console.log('✗ Timeout: El servidor no responde\n');
  socket.destroy();
  process.exit(1);
});
