# 🔒 Test de Ataque MITM

Valida que tu servidor HTTPS rechace certificados fraudulentos y bloquee ataques Man-in-the-Middle.

## 🚀 Uso Rápido

```bash
cd security-tests/mitm-test
node test-mitm.js
```

**Resultado esperado:** ✓ ATAQUE BLOQUEADO

---

## 🎯 ¿Cómo Funciona el Ataque?

El test simula un ataque MITM real en 3 pasos:

### 1️⃣ DNS Hijacking
```
Modifica /etc/hosts: myapp.local → 127.0.0.1
```
Simula que un atacante comprometió el DNS para redirigir el dominio legítimo al proxy falso.

### 2️⃣ Proxy Interceptor
```
Cliente → Proxy MITM (cert falso) → Servidor real
```
- El proxy levanta un servidor HTTPS con certificado fraudulento
- Desencripta el tráfico del cliente (TLS termination)
- Lee cookies, tokens, y todo el contenido en claro
- Reencripta y reenvía al servidor real
- Puede modificar respuestas sin que el cliente lo note

### 3️⃣ Validación del Cliente
```javascript
rejectUnauthorized: true  // Tu configuración actual
```
El cliente intenta conectarse y debe rechazar el certificado falso.

---

## ✅ ¿Qué Demuestra?

| Componente | Implementación | Equivalente Real |
|------------|----------------|------------------|
| **DNS Hijacking** | Modificación de `/etc/hosts` | Secuestro DNS / ARP spoofing |
| **Certificado falso** | `openssl` autofirmado con CN=myapp.local | Certificado de CA comprometida |
| **Intercepción TLS** | Proxy que termina TLS y reenvía | Proxy MITM en la red |

**Si el test muestra "ATAQUE BLOQUEADO":**
- ✓ Tu cliente rechazó el certificado fraudulento
- ✓ La validación de certificados está activa
- ✓ El canal seguro funciona correctamente

---

## � Archivos

- **`test-mitm.js`** - Test automatizado completo
- **`mitm-proxy.js`** - Proxy interceptor (TLS termination)
- **`cleanup-mitm.sh`** - Limpieza manual

---

## ⚠️ Qué Simula y Qué No

### ✅ Simula (Comportamiento Real)
- TLS termination (desencripta → lee → reencripta)
- Certificado fraudulento con dominio correcto
- Intercepción y modificación de tráfico
- Validación de certificados del cliente

### ❌ No Simula (Requiere Red Real)
- ARP spoofing en red local
- Intercepción de tráfico de otros dispositivos
- Compromiso de router o ISP

### 🔐 Conclusión Importante

Si tu simulación es bloqueada (el cliente rechaza el certificado falso), tu implementación **protege contra**:
- ARP spoofing
- Sniffing en LAN
- Secuestro DNS
- Manipulación de tráfico en routers o ISP

Todos estos escenarios implican la misma vulnerabilidad base: un atacante en medio **sin capacidad de romper TLS**. Si rechazas certificados inválidos, estás protegido contra todos ellos.

---

## 🧹 Limpieza

El test limpia automáticamente. Si necesitas limpieza manual:

```bash
./cleanup-mitm.sh
```

---

## 📝 Resultado

**✓ ATAQUE BLOQUEADO** = Tu configuración es segura  
**⚠️ ATAQUE EXITOSO** = Revisa validación de certificados

---

**Patrón:** Secure Channel  
**Branch:** Tunnel_Pattern
