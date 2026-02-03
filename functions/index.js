/**
 * CONSTRUMETRIX - BACKEND PROXY (Firebase Functions)
 * This handles protected queries to IGAC and other official sources.
 */

const functions = require('firebase-functions');
const axios = require('axios');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// En un entorno real, estas URLs y posibles llaves estarían en config:
const IGAC_BASE_URL = "https://services2.arcgis.com/RVvWzU3lgJISqdke/arcgis/rest/services/Base_Catastral_Publica_IGAC_Septiembre/FeatureServer";

/**
 * PROXY CATASTRAL: Realiza la consulta, centraliza el manejo de errores y aplica caché (TTL 48h).
 */
exports.igacProxy = functions.https.onCall(async (data, context) => {
    // 1. SEGURIDAD: Solo usuarios autenticados pueden consultar
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'El acceso requiere autenticación profesional.');
    }

    const { cedula, layers = [17, 18] } = data;

    if (!cedula) {
        throw new functions.https.HttpsError('invalid-argument', 'Cédula catastral requerida.');
    }

    const cacheRef = db.collection('cache_igac').doc(cedula);
    const CACHE_TTL_HOURS = 48; // Logic: Enterprise tier may migrate to Redis/MemoryStore for <10ms latency.

    try {
        // 2. CHECK CACHE FIRST
        const cachedDoc = await cacheRef.get();
        if (cachedDoc.exists) {
            const cacheData = cachedDoc.data();
            const lastUpdate = new Date(cacheData.timestamp);
            const hoursSinceUpdate = (new Date() - lastUpdate) / (1000 * 60 * 60);

            if (hoursSinceUpdate < CACHE_TTL_HOURS) {
                console.log(`⚡ [CACHE HIT] Predio: ${cedula}`);
                return {
                    status: 'success',
                    timestamp: cacheData.timestamp,
                    data: cacheData.data,
                    source: 'firestore-cache'
                };
            }
        }

        console.log(`📡 [CACHE MISS] Consultando IGAC para Predio: ${cedula}`);

        // 2. QUERY CONSTRUCTORS
        const queries = layers.map(layerId => {
            const where = (layerId === 17)
                ? `NUMERO_PREDIAL_NACIONAL = '${cedula}' OR NUMERO_DEL_PREDIO = '${cedula}'`
                : `NUMERO_DEL_PREDIO = '${cedula}'`;

            return axios.get(`${IGAC_BASE_URL}/${layerId}/query`, {
                params: {
                    where: where,
                    outFields: '*',
                    f: 'json',
                    returnGeometry: false
                }
            });
        });

        // 3. EXECUTION
        const results = await Promise.all(queries);

        // 4. SMART MERGE
        const combinedData = {};
        results.forEach(res => {
            if (res.data && res.data.features && res.data.features.length > 0) {
                Object.assign(combinedData, res.data.features[0].attributes);
            }
        });

        // 5. UPDATE CACHE
        const timestamp = new Date().toISOString();
        if (Object.keys(combinedData).length > 0) {
            await cacheRef.set({
                timestamp,
                data: combinedData
            });
        }

        // 6. RESPONSE
        return {
            status: 'success',
            timestamp,
            data: combinedData,
            source: 'proxy-igac-v2'
        };

    } catch (error) {
        console.error('Proxy Error:', error.message);
        throw new functions.https.HttpsError('internal', 'Error al consultar la base de datos catastral externa.');
    }
});
