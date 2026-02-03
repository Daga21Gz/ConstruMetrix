# 🎯 DEPLOYMENT CHECKLIST - ConstruMetrix

## Pre-Deployment

### 1. Code Quality

- [ ] Todos los archivos JS sin errores de sintaxis
- [ ] Console logs de desarrollo eliminados/comentados
- [ ] Variables de entorno configuradas
- [ ] Service Worker version incrementada

### 2. Firebase Configuration

- [ ] Proyecto Firebase creado
- [ ] Firebase CLI instalado (`firebase --version`)
- [ ] Autenticado (`firebase login`)
- [ ] Proyecto inicializado (`firebase init`)

### 3. Dependencies

- [ ] `npm install` ejecutado en `/functions`
- [ ] Todas las dependencias actualizadas
- [ ] No hay vulnerabilidades críticas

### 4. Testing

- [ ] App funciona en localhost
- [ ] PWA funciona offline
- [ ] Firebase Functions probadas localmente
- [ ] GIS layers cargan correctamente

---

## Deployment Steps

### Step 1: Preparar Entorno

```bash
# Verificar que estás en el directorio correcto
cd c:\Users\Sheyl\Documents\DANI\GITHUB\ConstruMetrix

# Verificar Firebase CLI
firebase --version

# Login si es necesario
firebase login
```

### Step 2: Configurar Firebase Project

```bash
# Si no has inicializado
firebase init

# Seleccionar:
# - Hosting
# - Functions
# - Firestore (opcional)

# Configuración recomendada:
# - Public directory: . (punto)
# - Single-page app: Yes
# - GitHub deploys: No (por ahora)
```

### Step 3: Deploy Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

**Verificar:**

- [ ] Function `igacProxy` desplegada
- [ ] No hay errores en logs
- [ ] Endpoint accesible

### Step 4: Deploy Hosting

```bash
firebase deploy --only hosting
```

**Verificar:**

- [ ] URL de hosting activa
- [ ] Assets cargando correctamente
- [ ] Service Worker registrado

### Step 5: Configurar Firestore Rules

```bash
firebase deploy --only firestore:rules
```

**Rules recomendadas:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cache IGAC
    match /cache_igac/{document} {
      allow read, write: if request.auth != null;
    }
  
    // User data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  
    // Budgets
    match /budgets/{budgetId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Post-Deployment

### 1. Verificación Funcional

- [ ] Abrir URL de hosting
- [ ] Login con Google funciona
- [ ] Consulta IGAC funciona
- [ ] Cálculos financieros correctos
- [ ] Exportar PDF funciona
- [ ] GIS layers visibles

### 2. Performance Testing

```bash
# Lighthouse audit
lighthouse https://YOUR-PROJECT.web.app --view

# Objetivos:
# - Performance: >90
# - Accessibility: >95
# - Best Practices: >90
# - SEO: >90
# - PWA: 100
```

### 3. Monitoring Setup

- [ ] Sentry DSN configurado
- [ ] Firebase Analytics habilitado
- [ ] Error tracking activo
- [ ] Performance monitoring activo

### 4. Security

- [ ] CSP headers correctos
- [ ] HTTPS habilitado (automático en Firebase)
- [ ] API keys protegidas
- [ ] Firestore rules restrictivas

---

## Rollback Plan

Si algo sale mal:

```bash
# Ver deployments anteriores
firebase hosting:channel:list

# Rollback a versión anterior
firebase hosting:rollback

# Ver logs de functions
firebase functions:log --only igacProxy
```

---

## Custom Domain (Opcional)

### 1. Agregar Dominio

```bash
firebase hosting:channel:deploy production
```

### 2. Configurar DNS

En tu proveedor de dominio, agregar:

```
Type: A
Name: @
Value: [IP de Firebase]

Type: TXT
Name: @
Value: [Verification code]
```

### 3. Verificar

```bash
firebase hosting:channel:list
```

---

## Maintenance

### Weekly

- [ ] Revisar logs de errores
- [ ] Verificar uso de Functions
- [ ] Limpiar cache antiguo en Firestore

### Monthly

- [ ] Actualizar dependencias
- [ ] Revisar métricas de performance
- [ ] Backup de datos importantes

### Quarterly

- [ ] Audit de seguridad
- [ ] Optimización de costos
- [ ] Actualización de documentación

---

## Cost Monitoring

### Firebase Pricing (Spark Plan - Free)

- Hosting: 10GB storage, 360MB/day transfer
- Functions: 125K invocations/month, 40K GB-seconds
- Firestore: 1GB storage, 50K reads, 20K writes/day

### Upgrade to Blaze (Pay-as-you-go)

Recomendado cuando:

- > 1000 usuarios activos/día
  >
- > 100K consultas IGAC/mes
  >
- Necesitas más de 125K function calls/mes

---

## Support

### Firebase Console

https://console.firebase.google.com

### Documentation

- Firebase: https://firebase.google.com/docs
- Leaflet: https://leafletjs.com
- Sentry: https://docs.sentry.io

### Emergency Contacts

- Firebase Support: https://firebase.google.com/support
- GitHub Issues: [Your repo]/issues

---

## Success Criteria

✅ **Deployment Successful When:**

1. URL pública accesible
2. Login funciona
3. IGAC proxy responde <3s
4. PWA instala correctamente
5. Offline mode funcional
6. No errores en Sentry
7. Lighthouse score >90

---

**Last Updated:** 2026-02-03
**Version:** 4.5.0
**Deployed By:** [Your Name]
