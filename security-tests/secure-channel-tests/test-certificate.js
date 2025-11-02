const tls = require('tls');
const fs = require('fs');
const path = require('path');

const SERVER_PORT = 3000;
const CERT_PATH = path.resolve(__dirname, '../../localhost.pem');

console.log('Verificando certificado SSL...\n');

// Leer certificado del disco
let diskCert;
try {
  diskCert = fs.readFileSync(CERT_PATH, 'utf8');
} catch (err) {
  console.log(`✗ Error leyendo certificado: ${err.message}\n`);
  process.exit(1);
}

// Conectar y obtener certificado del servidor
const socket = tls.connect({
  host: 'localhost',
  port: SERVER_PORT,
  rejectUnauthorized: false
}, () => {
  const serverCert = socket.getPeerCertificate();
  
  if (!serverCert || Object.keys(serverCert).length === 0) {
    console.log('✗ No se pudo obtener certificado del servidor\n');
    socket.destroy();
    process.exit(1);
  }
  
  console.log('Certificado del servidor:\n');
  console.log(`  Subject: ${serverCert.subject.CN}`);
  console.log(`  Issuer: ${serverCert.issuer.CN}`);
  console.log(`  Válido desde: ${serverCert.valid_from}`);
  console.log(`  Válido hasta: ${serverCert.valid_to}`);
  console.log(`  Algoritmo: ${serverCert.sigalg || 'N/A'}`);
  console.log(`  Bits: ${serverCert.bits || 'N/A'}`);
  console.log('');
  
  // Verificar fecha de expiración
  const now = new Date();
  const validTo = new Date(serverCert.valid_to);
  const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining < 0) {
    console.log(`✗ Certificado EXPIRADO hace ${Math.abs(daysRemaining)} días\n`);
    socket.destroy();
    process.exit(1);
  } else if (daysRemaining < 30) {
    console.log(`⚠ Certificado expira en ${daysRemaining} días (renovar pronto)\n`);
  } else {
    console.log(`✓ Certificado válido por ${daysRemaining} días\n`);
  }
  
  console.log(`RESULTADO: ✓ Certificado válido y funcional\n`);
  
  socket.destroy();
  process.exit(0);
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
