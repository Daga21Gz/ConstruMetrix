/**
 * CONSTRUMETRIX - GIS API SERVICE (Proxy Ready)
 * Centralizes all external data calls to IGAC and other sources.
 * Prepared for transition to Firebase Functions / Backend Proxy.
 */

const GisApiService = {
    // Current state: DIRECT (Development)
    // Future state: PROXY (Production)
    // Current state: DIRECT (Development) - Use PROXY for production
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
                return result.data.data; // Retorna el objeto unificado
            }

            // Fallback to fetch if not using Firebase SDK for functions
            const response = await fetch(`${this.PROXY_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            const resData = await response.json();
            return resData.data;
        } catch (err) {
            console.error("Proxy Error", err);
            return null;
        }
    }
};

window.GisApiService = GisApiService;
