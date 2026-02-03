/**
 * CONSTRUMETRIX - GIS API SERVICE (Proxy Ready)
 * Centralizes all external data calls to IGAC and other sources.
 * Prepared for transition to Firebase Functions / Backend Proxy.
 */

const GisApiService = {
    // Current state: DIRECT (Development)
    // Future state: PROXY (Production)
    // Current state: DIRECT (Development) - Optimal for local IGAC queries
    MODE: 'DIRECT',
    PROXY_URL: '/api/igac-proxy',

    /**
     * Consults cadastral records (R1/R2)
     * @param {string} cedula - Cadastral ID
     */
    async fetchValuationData(cedula) {
        console.log(`📡 [GisApiService] Querying data for: ${cedula}`);

        if (this.MODE === 'PROXY') {
            return this._fetchViaProxy('valuation', { cedula });
        } else {
            return this._fetchDirectIGAC(cedula);
        }
    },

    /**
     * Direct call to Esri (Legacy/Development Mode)
     */
    async _fetchDirectIGAC(cedula) {
        const urls = {
            registry1: "https://services2.arcgis.com/RVvWzU3lgJISqdke/arcgis/rest/services/Base_Catastral_Publica_IGAC_Septiembre/FeatureServer/17",
            registry2: "https://services2.arcgis.com/RVvWzU3lgJISqdke/arcgis/rest/services/Base_Catastral_Publica_IGAC_Septiembre/FeatureServer/18"
        };

        const queryRegistry = (url, id) => {
            return new Promise((resolve) => {
                const layerId = url.split('/').pop();
                let whereClause = (layerId === "17")
                    ? `NUMERO_PREDIAL_NACIONAL = '${id}' OR NUMERO_DEL_PREDIO = '${id}'`
                    : `NUMERO_DEL_PREDIO = '${id}'`;

                L.esri.query({ url: url })
                    .where(whereClause)
                    .run((error, featureCollection) => {
                        if (error || !featureCollection || !featureCollection.features.length) {
                            resolve(null);
                        } else {
                            resolve(featureCollection.features[0].properties);
                        }
                    });
            });
        };

        try {
            const [reg1, reg2] = await Promise.all([
                queryRegistry(urls.registry1, cedula),
                queryRegistry(urls.registry2, cedula)
            ]);
            return { ...(reg1 || {}), ...(reg2 || {}) };
        } catch (err) {
            console.error("Error in Direct IGAC Query", err);
            return null;
        }
    },

    /**
     * Future implementation for Backend Proxy
     */
    async _fetchViaProxy(endpoint, params) {
        try {
            // Integration with Firebase Cloud Functions
            if (window.firebase && firebase.functions) {
                const igacProxy = firebase.functions().httpsCallable('igacProxy');
                const result = await igacProxy(params);
                if (result.data && result.data.data) {
                    return result.data.data;
                }
            }

            // If we reach here, proxy is not active or failed
            console.warn("⚠️ Proxy no disponible, activando modo bypass directo...");
            return this._fetchDirectIGAC(params.cedula);

        } catch (err) {
            console.warn("⚠️ Proxy Error (Bypass Activated):", err.message);
            // DIRECT FALLBACK: Ensures the app works even without Cloud Functions deployed
            return this._fetchDirectIGAC(params.cedula);
        }
    }
};

window.GisApiService = GisApiService;
