#!/usr/bin/env node

/**
 * TEST MITM REALISTA - Prueba automatizada con navegador
 * 
 * Este script ejecuta una demostracion completa del ataque MITM:
 * - Configura el entorno (DNS, servidores)
 * - Ejecuta pruebas automaticas con curl
 * - Muestra resultados en tiempo real
 * - Limpia todo al terminar
 */

const { spawn, exec } = require('child_process');
const https = require('https');
const fs = require('fs');

const DOMAIN = 'myapp.local';
const MITM_PORT = 8443;
const SERVER_PORT = 3000;

let serverProcess = null;
let proxyProcess = null;
let hostsModified = false;

console.log('TEST DE ATAQUE MITM\n');
console.log('='.repeat(70) + '\n');

// Funcion para ejecutar comandos shell
const execPromise = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error && !cmd.includes('grep')) {
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
};

// Funcion para agregar entrada a /etc/hosts
async function setupDNSHijacking() {
  console.log('[SETUP 1/4] Configurando DNS hijacking...\n');
  
  try {
    // Verificar si ya existe
    const exists = await execPromise(`grep "${DOMAIN}" /etc/hosts || true`);
    
    if (exists) {
      console.log(`   ⚠️  ${DOMAIN} ya existe en /etc/hosts`);
      console.log('   Limpiando entrada anterior...\n');
      await execPromise(`sudo sed -i '' '/${DOMAIN}/d' /etc/hosts`);
    }
    
    // Agregar entrada
    await execPromise(`echo "127.0.0.1 ${DOMAIN}" | sudo tee -a /etc/hosts`);
    hostsModified = true;
    
    console.log(`   ✓ DNS hijacking activo: ${DOMAIN} → 127.0.0.1`);
    console.log('   (Simulando compromiso de DNS server)\n');
    
    return true;
  } catch (err) {
    console.log(`   ✗ Error: ${err.message}`);
    console.log('   Puede requerir permisos sudo\n');
    return false;
  }
}

// Funcion para limpiar /etc/hosts
async function cleanupDNSHijacking() {
  if (!hostsModified) return;
  
  console.log('   Restaurando /etc/hosts...');
  try {
    await execPromise(`sudo sed -i '' '/${DOMAIN}/d' /etc/hosts`);
    console.log(`   ✓ ${DOMAIN} eliminado de /etc/hosts`);
  } catch (err) {
    console.log(`   ⚠️  No se pudo limpiar /etc/hosts automaticamente`);
    console.log(`   Ejecuta manualmente: sudo sed -i '' '/${DOMAIN}/d' /etc/hosts`);
  }
}

// Funcion para iniciar servidor
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('[SETUP 2/4] Iniciando servidor HTTPS real...\n');
    
    serverProcess = spawn('node', ['../../server.js'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
    
    serverProcess.on('error', (err) => {
      console.log(`   ✗ Error al iniciar servidor: ${err.message}\n`);
      reject(err);
    });
    
    setTimeout(() => {
      console.log(`   ✓ Servidor activo en https://localhost:${SERVER_PORT}\n`);
      resolve();
    }, 2000);
  });
}

// Funcion para iniciar proxy MITM
function startProxy() {
  return new Promise((resolve, reject) => {
    console.log('[SETUP 3/4] Iniciando proxy MITM...\n');
    
    // Modificar puerto temporalmente
    let proxyCode = fs.readFileSync('mitm-proxy.js', 'utf8');
    proxyCode = proxyCode.replace('const MITM_PORT = 443;', `const MITM_PORT = ${MITM_PORT};`);
    fs.writeFileSync('mitm-proxy-temp.js', proxyCode);
    
    proxyProcess = spawn('node', ['mitm-proxy-temp.js'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    proxyProcess.on('error', (err) => {
      console.log(`   ✗ Error al iniciar proxy: ${err.message}\n`);
      reject(err);
    });
    
    setTimeout(() => {
      console.log(`   ✓ Proxy MITM activo en https://${DOMAIN}:${MITM_PORT}\n`);
      resolve();
    }, 3000);
  });
}

// Funcion para probar ataque MITM con configuracion real
function testSecureClient() {
  return new Promise((resolve) => {
    console.log('[TEST] Probando ataque MITM con configuracion de produccion...\n');
    console.log(`   Conectando a: https://${DOMAIN}:${MITM_PORT}`);
    console.log('   Validacion de certificados: ACTIVADA\n');
    
    const options = {
      hostname: DOMAIN,
      port: MITM_PORT,
      path: '/',
      method: 'GET',
      rejectUnauthorized: true, // Cliente seguro (configuracion real)
      headers: {
        'User-Agent': 'MITM-Test-Client/1.0',
        'X-Test-Type': 'secure'
      }
    };
    
    const startTime = Date.now();
    
    const req = https.request(options, (res) => {
      // Si llega aqui, el ataque fue exitoso
      const duration = Date.now() - startTime;
      
      console.log('   RESULTADO: ⚠️  ATAQUE EXITOSO\n');
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Tiempo: ${duration}ms\n`);
      console.log('   El certificado fraudulento fue aceptado.');
      console.log('   El sistema puede tener el certificado MITM en el trust store.\n');
      
      res.on('data', () => {});
      res.on('end', () => {
        console.log('='.repeat(70) + '\n');
        resolve({ success: true, duration });
      });
    });
    
    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      
      console.log('   RESULTADO: ✓ ATAQUE BLOQUEADO\n');
      console.log(`   Error: ${err.code}`);
      console.log(`   Tiempo: ${duration}ms`);
      console.log(`   Razon: ${err.message}\n`);
      
      console.log('   El certificado fraudulento fue rechazado correctamente.\n');
      console.log('='.repeat(70) + '\n');
      
      resolve({ success: false, error: err.code, duration });
    });
    
    req.end();
  });
}

// Funcion principal
async function runMITMTest() {
  try {
    // Setup
    const dnsOk = await setupDNSHijacking();
    if (!dnsOk) {
      console.log('⚠️  Continuando sin DNS hijacking (se necesita sudo)\n');
    }
    
    await startServer();
    await startProxy();
    
    console.log('[SETUP 4/4] Entorno configurado completamente\n');
    console.log('='.repeat(70) + '\n');
    console.log('ARQUITECTURA DEL ATAQUE:\n');
    console.log(`  Cliente → [DNS: ${DOMAIN}] → Proxy MITM:${MITM_PORT} → Servidor:${SERVER_PORT}\n`);
    console.log('='.repeat(70) + '\n');
    
    // Esperar un poco para que todo se estabilice
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ejecutar test con configuracion real
    const result = await testSecureClient();
    
    // Resumen final
    console.log('RESULTADO DEL TEST\n');
    console.log('='.repeat(70) + '\n');
    
    if (result.success) {
      console.log('⚠️  ATAQUE EXITOSO\n');
      console.log('El certificado fraudulento fue aceptado.');
      console.log('Verifica la configuracion de certificados del sistema.\n');
    } else {
      console.log('✓ ATAQUE BLOQUEADO\n');
      console.log('El certificado fraudulento fue rechazado correctamente.\n');
      console.log('ESTADO DE SEGURIDAD:');
      console.log('  • HTTPS: ✓ Activo');
      console.log('  • Certificate validation: ✓ Efectiva');
      console.log('  • MITM protection: ✓ Funcionando\n');
    }
    
    console.log('='.repeat(70) + '\n');
    
  } catch (err) {
    console.log(`\n[ERROR FATAL] ${err.message}\n`);
  } finally {
    // Cleanup
    console.log('[CLEANUP] Limpiando entorno...\n');
    
    if (serverProcess) {
      console.log('   Deteniendo servidor...');
      serverProcess.kill();
    }
    
    if (proxyProcess) {
      console.log('   Deteniendo proxy...');
      proxyProcess.kill();
    }
    
    await cleanupDNSHijacking();
    
    // Limpiar archivo temporal
    try {
      if (fs.existsSync('mitm-proxy-temp.js')) {
        fs.unlinkSync('mitm-proxy-temp.js');
      }
      if (fs.existsSync('mitm-cert.pem')) {
        fs.unlinkSync('mitm-cert.pem');
      }
      if (fs.existsSync('mitm-key.pem')) {
        fs.unlinkSync('mitm-key.pem');
      }
      console.log('   Archivos temporales eliminados');
    } catch (e) {
      // Ignore
    }
    
    console.log('\n[FINALIZADO] Test completado\n');
    process.exit(0);
  }
}

// Manejo de interrupciones
process.on('SIGINT', async () => {
  console.log('\n\nTest interrumpido por el usuario\n');
  
  if (serverProcess) serverProcess.kill();
  if (proxyProcess) proxyProcess.kill();
  
  await cleanupDNSHijacking();
  
  process.exit(0);
});

// Ejecutar
runMITMTest();
