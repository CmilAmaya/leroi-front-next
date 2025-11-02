#!/bin/bash

##############################################################################
# Script para ejecutar tests del patrón Secure Channel
# Inicia el servidor y ejecuta los tests automáticamente
##############################################################################

set -e

SERVER_PORT=3000
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "======================================================================"
echo "TESTS DEL PATRON SECURE CHANNEL"
echo "======================================================================"
echo ""

# Función para limpiar al salir
cleanup() {
    echo ""
    echo "[CLEANUP] Deteniendo servidor..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
    fi
    lsof -ti:$SERVER_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
    echo "Limpieza completada"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Paso 1: Verificar que no hay servidor corriendo
echo "[1/4] Verificando puerto $SERVER_PORT..."
if lsof -ti:$SERVER_PORT > /dev/null 2>&1; then
    echo "   ⚠️  Puerto $SERVER_PORT ocupado. Limpiando..."
    lsof -ti:$SERVER_PORT | xargs kill -9 2>/dev/null || true
    sleep 1
fi
echo "   ✓ Puerto libre"
echo ""

# Paso 2: Iniciar servidor
echo "[2/4] Iniciando servidor HTTPS..."
cd "$PROJECT_ROOT"
node server.js > /tmp/server-test.log 2>&1 &
SERVER_PID=$!
echo "   Servidor iniciado (PID: $SERVER_PID)"

# Esperar a que el servidor esté listo
echo "   Esperando a que el servidor responda..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -k -s https://localhost:$SERVER_PORT > /dev/null 2>&1; then
        echo "   ✓ Servidor listo en https://localhost:$SERVER_PORT"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    sleep 1
    echo -n "."
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo ""
    echo "   ✗ Error: Servidor no respondió después de $MAX_ATTEMPTS segundos"
    echo "   Ver logs: tail /tmp/server-test.log"
    exit 1
fi

echo ""
echo ""

# Paso 3: Ejecutar tests
echo "[3/4] Ejecutando tests del patrón..."
echo ""

cd "$PROJECT_ROOT/security-tests/secure-channel-tests"

# Test 1: TLS Config
echo "----------------------------------------------------------------------"
echo "[TEST 1/3] Configuración TLS"
echo "----------------------------------------------------------------------"
node test-tls-config.js
echo ""

# Test 2: Security Headers
echo "----------------------------------------------------------------------"
echo "[TEST 2/3] Headers de Seguridad"
echo "----------------------------------------------------------------------"
node test-security-headers.js
echo ""

# Test 3: Certificados
echo "----------------------------------------------------------------------"
echo "[TEST 3/3] Certificados"
echo "----------------------------------------------------------------------"
node test-certificate.js
echo ""

# Paso 4: Resumen
echo "======================================================================"
echo "TESTS COMPLETADOS"
echo "======================================================================"
echo ""
echo "✓ Todos los tests ejecutados correctamente"
echo ""

# Cleanup se ejecuta automáticamente por el trap
