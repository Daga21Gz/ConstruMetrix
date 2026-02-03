# Arquitectura de Backend Proxy y Seguridad - ConstruMetrix

Este documento detalla la estrategia de ingeniería para transicionar de un sitio estático a una arquitectura escalable y segura, abordando la "deuda técnica" de exposición de API externa.

## 1. El Problema (Client-Side Leakage)
Actualmente, las llamadas a los servicios de ArcGIS (IGAC) se realizan directamente desde el navegador. Esto expone:
- URLs internas del FeatureServer.
- Parámetros de consulta que podrían ser manipulados.
- Ausencia de control sobre el Rate Limiting y Caching.

## 2. Solución Propuesta: Backend Proxy Serverless
Implementar un microservicio (Firebase Functions o AWS Lambda) que actúe como "Middleman".

### Flujo de Datos:
`Frontend (ConstruMetrix)` -> `POST /api/igac/query` -> `Backend Proxy` -> `ArcGIS REST API` -> `Backend Proxy (Caching in Redis)` -> `Frontend`

### Beneficios:
- **Seguridad:** Las API Keys y credenciales residen en variables de entorno del servidor.
- **Caching Estratégico:** Almacenar consultas catastrales por 24-48h usando Redis para reducir latencia y costos de API.
- **Rate Limiting:** Prevenir ataques de denegación de servicio (DDoS) o scraping masivo.

## 3. Implementación Sugerida (Node.js + Firebase)

```javascript
const functions = require('firebase-functions');
const axios = require('axios');
const admin = require('firebase-admin');
admin.initializeApp();

exports.queryIGAC = functions.https.onCall(async (data, context) => {
    // Autenticación Requerida
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    
    const { layerId, where } = data;
    const IGAC_BASE_URL = "https://services2.arcgis.com/RVvWzU3lgJISqdke/arcgis/rest/services/Base_Catastral_Publica_IGAC_Septiembre/FeatureServer";
    
    try {
        const response = await axios.get(`${IGAC_BASE_URL}/${layerId}/query`, {
            params: {
                where: where,
                f: 'json',
                outFields: '*',
                // API_KEY: process.env.IGAC_SECRET_KEY // En el servidor
            }
        });
        return response.data;
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
```

## 4. Pipeline CI/CD Evolved
Actualizar `.github/workflows/deploy.yml` para incluir:
- **Linting:** `npm run lint` para validar consistencia de código.
- **Security Scan:** Integrar `Snyk` o `Trivy` para detectar vulnerabilidades en dependencias.
- **Integration Tests:** Pruebas automatizadas de flujo de avalúo con Jest/Puppeteer.

## 5. Próximos Pasos (Fase 2)
1. **Migración a Vercel/Firebase Hosting:** Para aprovechar Edge Functions.
2. **Integración de Sentry:** Monitoreo de errores en tiempo real.
3. **Database Escalable:** Usar Firestore para persistencia de modelos constructivos personalizados.
