# 🚀 QUICK START GUIDE - ConstruMetrix

## Desarrollo Local

### 1. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Abre: http://localhost:5505

### 2. Probar Firebase Functions Localmente
```bash
npm run emulate
```
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- UI Emulator: http://localhost:4000

---

## Testing

### PWA Audit (Desktop)
```bash
npm run test:pwa
```

### PWA Audit (Mobile)
```bash
npm run test:mobile
```

---

## Deployment

### Opción 1: Deploy Completo
```bash
npm run deploy:all
```

### Opción 2: Solo Functions
```bash
npm run deploy:functions
```

### Opción 3: Solo Hosting
```bash
npm run deploy:hosting
```

---

## Monitoreo

### Ver Logs de Functions
```bash
npm run logs
```

### Firestore Console
```bash
firebase open firestore
```

### Firebase Console
https://console.firebase.google.com

---

## Comandos Útiles

### Limpiar Cache del Service Worker
```javascript
// En DevTools Console
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))
```

### Forzar Actualización PWA
```javascript
// En DevTools Console
caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
location.reload(true)
```

### Test Offline
1. Abrir DevTools (F12)
2. Network Tab → Throttling → Offline
3. Recargar página

---

## Estructura del Proyecto

```
ConstruMetrix/
├── index.html              # App principal
├── app.js                  # Motor financiero
├── geo-visor.js           # Motor GIS
├── gis-api-service.js     # Proxy IGAC
├── firebase-service.js    # Auth & DB
├── advanced-features.js   # Export PDF/Excel
├── monitoring.js          # Sentry
├── sw.js                  # Service Worker
├── manifest.json          # PWA Config
├── functions/             # Firebase Functions
│   ├── index.js          # igacProxy
│   └── package.json
├── items.json            # Base de datos APU
├── unidades_construccion.json
├── towers.geojson        # Capas GIS
├── lines.geojson
└── Servidumbre.geojson
```

---

## Troubleshooting

### Error: "Firebase not initialized"
```bash
firebase login
firebase init
```

### Error: "Service Worker not updating"
1. Incrementar versión en `sw.js` (CACHE_NAME)
2. Hard refresh (Ctrl + Shift + R)

### Error: "Functions deployment failed"
```bash
cd functions
npm install
cd ..
firebase deploy --only functions --debug
```

### GeoJSON no carga
- Verificar que los archivos estén en la raíz
- Revisar permisos de lectura
- Comprobar tamaño (towers.geojson ~15MB)

---

## Performance Tips

1. **Lazy Load GeoJSON**: Solo cargar capas visibles
2. **Debounce Filters**: 300ms delay en búsquedas
3. **Virtual Scrolling**: Renderizar solo 50 filas a la vez
4. **Cache Strategy**: Stale-while-revalidate para assets
5. **CDN**: Usar unpkg/jsdelivr para librerías

---

## Security Checklist

- [ ] Firebase Auth configurado
- [ ] Firestore Rules actualizadas
- [ ] CSP headers configurados
- [ ] HTTPS habilitado
- [ ] Sentry DSN configurado
- [ ] API Keys en variables de entorno

---

## Next Steps

1. ✅ Configurar Firebase Project
2. ✅ Deploy Functions
3. ✅ Deploy Hosting
4. ⏳ Configurar dominio custom
5. ⏳ Habilitar Analytics
6. ⏳ Setup CI/CD con GitHub Actions

---

**¿Necesitas ayuda?** Revisa `IMPLEMENTATION_SUMMARY.md` para detalles técnicos completos.
