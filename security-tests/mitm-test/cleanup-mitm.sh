#!/bin/bash

##############################################################################
# CLEANUP MITM - Limpieza completa del entorno de pruebas
#
# Este script limpia TODOS los archivos y configuraciones del test MITM:
# - Restaura /etc/hosts
# - Detiene procesos en puertos 3000, 8443, 443
# - Elimina certificados temporales
# - Elimina logs y archivos de prueba
##############################################################################

echo "=========================================================================="
echo "CLEANUP MITM - Limpieza completa"
echo "=========================================================================="
echo ""

DOMAIN="myapp.local"
CLEANUP_COUNT=0

# [1] Detener procesos
echo "[1/5] Deteniendo procesos..."
echo ""

# Matar por nombre de proceso
pkill -f "node server.js" 2>/dev/null && echo "   ✓ server.js detenido" && CLEANUP_COUNT=$((CLEANUP_COUNT+1))
pkill -f "node mitm-proxy.js" 2>/dev/null && echo "   ✓ mitm-proxy.js detenido" && CLEANUP_COUNT=$((CLEANUP_COUNT+1))
pkill -f "node test-mitm.js" 2>/dev/null && echo "   ✓ test-mitm.js detenido" && CLEANUP_COUNT=$((CLEANUP_COUNT+1))

# Matar por puerto
for port in 3000 8443 443; do
    PIDS=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PIDS" ]; then
        echo "   Matando procesos en puerto $port: $PIDS"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        echo "   ✓ Puerto $port liberado"
        CLEANUP_COUNT=$((CLEANUP_COUNT+1))
    fi
done

if [ $CLEANUP_COUNT -eq 0 ]; then
    echo "   • No hay procesos activos"
fi

echo ""

# [2] Limpiar /etc/hosts
echo "[2/5] Limpiando /etc/hosts..."
echo ""

if grep -q "$DOMAIN" /etc/hosts 2>/dev/null; then
    echo "   Encontrada entrada: $DOMAIN"
    sudo sed -i '' "/$DOMAIN/d" /etc/hosts 2>/dev/null
    
    if grep -q "$DOMAIN" /etc/hosts 2>/dev/null; then
        echo "   ⚠️  No se pudo eliminar (requiere sudo)"
        echo "   Ejecuta: sudo sed -i '' '/$DOMAIN/d' /etc/hosts"
    else
        echo "   ✓ Entrada $DOMAIN eliminada"
        CLEANUP_COUNT=$((CLEANUP_COUNT+1))
    fi
else
    echo "   • /etc/hosts ya esta limpio"
fi

# Limpiar backups de hosts
BACKUPS=$(find /tmp -name "hosts.backup.*" 2>/dev/null)
if [ ! -z "$BACKUPS" ]; then
    echo "   Limpiando backups de /etc/hosts..."
    rm -f /tmp/hosts.backup.* 2>/dev/null
    echo "   ✓ Backups eliminados"
    CLEANUP_COUNT=$((CLEANUP_COUNT+1))
fi

echo ""

# [3] Eliminar certificados temporales
echo "[3/5] Eliminando certificados temporales..."
echo ""

CERT_FILES=(
    "mitm-cert.pem"
    "mitm-key.pem"
)

for cert in "${CERT_FILES[@]}"; do
    if [ -f "$cert" ]; then
        rm -f "$cert"
        echo "   ✓ $cert eliminado"
        CLEANUP_COUNT=$((CLEANUP_COUNT+1))
    fi
done

if [ $CLEANUP_COUNT -eq 0 ]; then
    echo "   • No hay certificados temporales"
fi

echo ""

# [4] Eliminar logs y archivos temporales
echo "[4/5] Eliminando logs y archivos temporales..."
echo ""

LOG_FILES=(
    "server.log"
    "mitm-proxy.log"
    "mitm-proxy-temp.js"
)

for log in "${LOG_FILES[@]}"; do
    if [ -f "$log" ]; then
        rm -f "$log"
        echo "   ✓ $log eliminado"
        CLEANUP_COUNT=$((CLEANUP_COUNT+1))
    fi
done

if [ $CLEANUP_COUNT -eq 0 ]; then
    echo "   • No hay logs temporales"
fi

echo ""

# [5] Verificar limpieza
echo "[5/5] Verificando limpieza..."
echo ""

VERIFICATION_OK=true

# Verificar puertos
for port in 3000 8443 443; do
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "   ⚠️  Puerto $port aun tiene procesos activos"
        VERIFICATION_OK=false
    fi
done

# Verificar /etc/hosts
if grep -q "$DOMAIN" /etc/hosts 2>/dev/null; then
    echo "   ⚠️  $DOMAIN aun esta en /etc/hosts"
    VERIFICATION_OK=false
fi

# Verificar certificados
for cert in "${CERT_FILES[@]}"; do
    if [ -f "$cert" ]; then
        echo "   ⚠️  $cert aun existe"
        VERIFICATION_OK=false
    fi
done

if [ "$VERIFICATION_OK" = true ]; then
    echo "   ✓ Verificacion completa: Todo limpio"
else
    echo "   ⚠️  Algunos elementos no se pudieron limpiar"
fi

echo ""
echo "=========================================================================="
echo "RESUMEN DE LIMPIEZA"
echo "=========================================================================="
echo ""
echo "Items limpiados: $CLEANUP_COUNT"
echo ""

if [ "$VERIFICATION_OK" = true ]; then
    echo "Estado: ✓ LIMPIEZA COMPLETA"
    echo ""
    echo "El sistema ha sido restaurado a su estado original."
    echo "Puedes ejecutar las pruebas nuevamente cuando quieras."
else
    echo "Estado: ⚠️  LIMPIEZA PARCIAL"
    echo ""
    echo "Algunas operaciones requieren permisos adicionales."
    echo "Revisa las advertencias arriba para completar manualmente."
fi

echo ""
echo "=========================================================================="
echo ""

exit 0
