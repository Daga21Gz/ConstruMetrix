/**
 * CONSTRUMETRIX v3.0 - MASTER GIS VISOR ENGINE
 * Valuation Intelligence Mode - High Resilience Query Engine
 */

(function () {
    console.log("🚀 MASTER GIS ENGINE v3.0: Valuation Intelligence Mode.");

    const GIS_STATE = {
        map: null,
        activePredio: null,
        layers: {
            land: {}, // Capas de terreno (6, 7, 13, 14)
            registry: {}, // Consultores de registros (17, 18)
            towers: null,
            lines: null,
            servidumbre: null,
            satellite: null
        },
        urls: {
            urban: "https://services2.arcgis.com/RVvWzU3lgJISqdke/arcgis/rest/services/Base_Catastral_Publica_IGAC_Septiembre/FeatureServer/7",
            urbanInformal: "https://services2.arcgis.com/RVvWzU3lgJISqdke/arcgis/rest/services/Base_Catastral_Publica_IGAC_Septiembre/FeatureServer/6",
            rural: "https://services2.arcgis.com/RVvWzU3lgJISqdke/arcgis/rest/services/Base_Catastral_Publica_IGAC_Septiembre/FeatureServer/14",
            ruralInformal: "https://services2.arcgis.com/RVvWzU3lgJISqdke/arcgis/rest/services/Base_Catastral_Publica_IGAC_Septiembre/FeatureServer/13",
            registry1: "https://services2.arcgis.com/RVvWzU3lgJISqdke/arcgis/rest/services/Base_Catastral_Publica_IGAC_Septiembre/FeatureServer/17",
            registry2: "https://services2.arcgis.com/RVvWzU3lgJISqdke/arcgis/rest/services/Base_Catastral_Publica_IGAC_Septiembre/FeatureServer/18"
        },
        projections: {
            // Ajuste fino para CTM12 (Magna Sirgas Origen Nacional) para corregir desfases
            magna: "+proj=tmerc +lat_0=4.0 +lon_0=-73.0 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
        },
        cache: { lines: null, towers: null, servidumbre: null }
    };

    const GIS_TABLE = {
        activeLayer: null,
        data: [],
        filteredData: [],
        currentPage: 1,
        rowsPerPage: 50,
        sortField: null,
        sortAsc: true
    };

    const UI_GIS = {
        overlay: document.getElementById('gisVisorOverlay'),
        mapContainer: document.getElementById('mainMap'),
        toggleBtn: document.getElementById('toggleGisVisor'),
        closeBtn: document.getElementById('closeGisVisor'),
        infoPanel: document.getElementById('gisSelectionInfo'),
        dispCedula: document.getElementById('gisCedula'),
        dispArea: document.getElementById('gisArea'),
        dispAddress: document.getElementById('gisAddress'),
        dispBuiltArea: document.getElementById('gisBuiltArea'),
        dispLocation: document.getElementById('gisLocation'),
        dispZones: document.getElementById('gisZones'),
        dispHabitaciones: document.getElementById('gisHabitaciones'),
        dispBanos: document.getElementById('gisBanos'),
        dispPisos: document.getElementById('gisPisos'),
        syncBtn: document.getElementById('gisSyncBtn'),
        statusList: document.getElementById('gisStatusList')
    };

    // --- 2. INITIALIZATION ---

    function initGis() {
        if (GIS_STATE.map) {
            setTimeout(() => GIS_STATE.map.invalidateSize(), 300);
            return;
        }

        try {
            GIS_STATE.map = L.map('mainMap', {
                center: [4.6, -74.0],
                zoom: 12,
                zoomControl: false,
                attributionControl: false,
                renderer: L.canvas() // Restauramos motor Canvas para velocidad
            });

            GIS_STATE.basemap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19
            }).addTo(GIS_STATE.map);

            // --- CAPAS JERÁRQUICAS (Z-INDEX) ---
            // Creamos panes específicos para controlar el orden exacto (v4.0)
            const igacPane = GIS_STATE.map.createPane('igacPane');
            igacPane.style.zIndex = 400; // Base: Catastro

            const linesPane = GIS_STATE.map.createPane('linesPane');
            linesPane.style.zIndex = 640; // Medio: Líneas

            const servPane = GIS_STATE.map.createPane('servidumbrePane');
            servPane.style.zIndex = 500; // Bajo-Medio: Servidumbres

            const towersPane = GIS_STATE.map.createPane('towersPane');
            towersPane.style.zIndex = 650; // Top: Torres

            // Permitir clicks (auto) para que funcione el raycast
            linesPane.style.pointerEvents = towersPane.style.pointerEvents = servPane.style.pointerEvents = 'auto';

            // --- CADASTRAL LAYERS INITIALIZATION ---
            setupCadastralLayers();

            loadLocalLayers();

        } catch (error) {
            console.error("🚨 GIS Engine Failure:", error);
        }
    }

    function setupCadastralLayers() {
        const standardStyle = (color) => ({
            color: color, weight: 1.5, fillOpacity: 0.15, fillColor: color
        });

        // Capas de Terreno (Visuales)
        const layersConfig = [
            { id: 'urban', url: GIS_STATE.urls.urban, color: '#4f7aff', name: 'Urbano Formal' },
            { id: 'urbanInf', url: GIS_STATE.urls.urbanInformal, color: '#f43f5e', name: 'Urbano Informal' },
            { id: 'rural', url: GIS_STATE.urls.rural, color: '#10b981', name: 'Rural Formal' },
            { id: 'ruralInf', url: GIS_STATE.urls.ruralInformal, color: '#f59e0b', name: 'Rural Informal' }
        ];

        layersConfig.forEach(cfg => {
            GIS_STATE.layers.land[cfg.id] = L.esri.featureLayer({
                url: cfg.url,
                pane: 'igacPane', // Vinculamos al pane de jerarquía
                simplifyFactor: 0.5,
                precision: 5,
                minZoom: 15,
                style: standardStyle(cfg.color)
            }).addTo(GIS_STATE.map);

            // Listener de Click Unificado
            GIS_STATE.layers.land[cfg.id].on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                handlePredioSelection(e.layer.feature.properties, e.layer, cfg.name);
            });
        });

        updateGisStatus("🛰️ Capas de Inteligencia IGAC Listas (Z15+)");
    }

    async function handlePredioSelection(props, layer, typeName) {
        GIS_STATE.activePredio = props;

        // Reset Styles
        Object.values(GIS_STATE.layers.land).forEach(lyr => lyr.setStyle({ fillOpacity: 0.15, weight: 1.5 }));

        // Highlight
        layer.setStyle({ color: '#ffffff', weight: 4, fillOpacity: 0.5 });

        // Save current type in active predio
        GIS_STATE.activePredio._landType = typeName;

        // Normalización de ID (quitar espacios o puntos)
        const cedula = (props.CODIGO || props.NUMERO_CATASTRAL || props.PREDIO_CODIGO || '').toString().trim();

        // Búsqueda profunda de ÁREA en las propiedades geométricas (fallback)
        const areaGeom = props.AREA_TERRENO || props.SHAPE_Area || props.Shape__Area || props.area || 0;

        // UI Update Básico (Inmediato con lo que venga del mapa)
        UI_GIS.dispCedula.textContent = cedula || 'SIN ID';
        UI_GIS.dispArea.textContent = parseFloat(areaGeom).toLocaleString() + ' m²';
        UI_GIS.dispAddress.textContent = props.DIRECCION || props.NOMBRE_PREDIO || '--';
        UI_GIS.dispBuiltArea.textContent = parseFloat(props.AREA_CONSTRUIDA || 0).toLocaleString() + ' m²';
        UI_GIS.dispLocation.textContent = `${props.MUNICIPIO || '--'} / ${props.DEPARTAMENTO || '--'}`;
        UI_GIS.dispZones.textContent = (props.ZONA_FISICA_1 || '--') + ' / ' + (props.ZONA_ECONOMICA_1 || '--');

        // --- ENRIQUECIMIENTO ASÍNCRONO ---
        if (cedula && cedula !== '--') {
            fetchValuationData(cedula);
        }

        UI_GIS.infoPanel.classList.remove('hidden');
        UI_GIS.infoPanel.classList.add('animate-up');
    }

    async function fetchValuationData(cedula) {
        if (!cedula) return;

        updateGisStatus("🔍 Consultando registros de avalúo...", "info");

        // Helper para convertir la tarea de Esri en Promesa con soporte de múltiples campos ID
        const queryRegistry = (url, id) => {
            return new Promise((resolve) => {
                const layerId = url.split('/').pop();

                // Construcción de cláusula WHERE específica por capa para evitar error 400 (campo no existe)
                let whereClause = "";

                if (layerId === "17") {
                    // REGISTRO_1 tiene ambos campos
                    whereClause = `NUMERO_PREDIAL_NACIONAL = '${id}' OR NUMERO_DEL_PREDIO = '${id}'`;
                } else if (layerId === "18") {
                    // REGISTRO_2 suele NO tener NUMERO_PREDIAL_NACIONAL
                    whereClause = `NUMERO_DEL_PREDIO = '${id}'`;
                } else {
                    // Fallback para otras capas
                    whereClause = `NUMERO_DEL_PREDIO = '${id}' OR CODIGO = '${id}'`;
                }

                // Fallback adicional por longitud del ID (si es muy largo, es nacional)
                if (id.length > 22 && layerId === "17") {
                    const idShort = id.substring(0, 22);
                    whereClause += ` OR NUMERO_PREDIAL_NACIONAL LIKE '${idShort}%'`;
                }

                console.log(`📡 Consultando IGAC (${layerId}):`, whereClause);

                L.esri.query({ url: url })
                    .where(whereClause)
                    .run((error, featureCollection) => {
                        if (error) {
                            console.warn(`⚠️ Error en capa ${layerId}:`, error);
                            resolve(null);
                        } else if (!featureCollection || !featureCollection.features.length) {
                            resolve(null);
                        } else {
                            resolve(featureCollection.features[0].properties);
                        }
                    });
            });
        };

        try {
            // Ejecutamos consultas en paralelo
            const [reg1, reg2] = await Promise.all([
                queryRegistry(GIS_STATE.urls.registry1, cedula),
                queryRegistry(GIS_STATE.urls.registry2, cedula)
            ]);

            // UNIÓN INTELIGENTE DE DATOS (Expert GIS Merge)
            // Combinamos ambos registros sin sobreescribir con valores nulos
            const valData = { ...(reg1 || {}), ...(reg2 || {}) };

            if (reg1 || reg2) {
                console.log("💎 Datos Oficiales Integrados (R1+R2):", valData);

                updateGisStatus("💎 Registros R1 y R2 sincronizados.", "success");
                GIS_STATE.activePredio._valuation = valData;

                // --- MAPEO DE CAMPOS EXPERTO ---

                // 1. Dirección y Nombre
                const finalAddr = valData.DIRECCION || valData.DIRECCION_PREDIO || valData.NOMBRE_PREDIO || GIS_STATE.activePredio.DIRECCION;
                if (finalAddr) UI_GIS.dispAddress.textContent = finalAddr;

                // 2. Áreas (Preferencia a Registro 1 que suele ser el más actualizado en áreas totales)
                const builtArea = valData.AREA_CONSTRUIDA_TOTAL || valData.AREA_CONSTRUIDA || valData.AREA_CONSTRUIDA_1;
                if (builtArea) UI_GIS.dispBuiltArea.textContent = parseFloat(builtArea).toLocaleString() + ' m²';

                if (valData.AREA_TERRENO || valData.AREA_TERRENO_1) {
                    const tArea = valData.AREA_TERRENO || valData.AREA_TERRENO_1;
                    UI_GIS.dispArea.textContent = parseFloat(tArea).toLocaleString() + ' m²';
                }

                // 3. Ubicación Política
                const mun = valData.MUNICIPIO || valData.NOMBRE_MUNICIPIO || GIS_STATE.activePredio.MUNICIPIO;
                const dept = valData.DEPARTAMENTO || valData.NOMBRE_DEPARTAMENTO || GIS_STATE.activePredio.DEPARTAMENTO;
                if (mun) UI_GIS.dispLocation.textContent = `${mun} / ${dept || '--'}`;

                // 4. Zonificación
                const zFis = valData.ZONA_FISICA_1 || valData.ZONA_FISICA;
                const zEco = valData.ZONA_ECONOMICA_1 || valData.ZONA_ECONOMICA;
                if (zFis) UI_GIS.dispZones.textContent = `${zFis} / ${zEco || '--'}`;

                // 5. Detalles Técnicos (Hab, Baños, Pisos) - Exclusivos de R2
                UI_GIS.dispHabitaciones.textContent = valData.HABITACIONES_1 || valData.HABITACIONES || '0';
                UI_GIS.dispBanos.textContent = valData.BANOS_1 || valData.BANOS || '0';
                UI_GIS.dispPisos.textContent = valData.PISOS_1 || valData.PISOS || '1';

                // Actualizar contexto de valuación (Avalúo Catastral)
                renderValuationHUD(valData);
            } else {
                updateGisStatus("ℹ️ Sin registros en bases R1/R2 para este ID.", "info");
                const v = document.getElementById('gisValuationContext');
                if (v) v.innerHTML = '';
            }
        } catch (err) {
            console.error("🚨 Error crítico en fetchValuationData:", err);
            updateGisStatus("Error al consultar registros.", "error");
        }
    }

    function renderValuationHUD(valData) {
        const extraInfo = `
            <div class="mt-4 p-4 rounded-xl bg-brand/10 border border-brand/30 animate-up">
                <p class="text-[9px] font-black text-brand uppercase mb-2">Contexto de Valoración IGAC</p>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <p class="text-[8px] text-gray-500 uppercase">Avalúo Actual</p>
                        <p class="text-xs font-bold text-white">$${(valData.AVALUO_CATASTRAL || 0).toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-[8px] text-gray-500 uppercase">Destino</p>
                        <p class="text-xs font-bold text-white truncate">${valData.DESTINO_ECONOMICO || 'Habitacional'}</p>
                    </div>
                </div>
                <div class="mt-2 text-[10px] text-gray-400 font-medium">
                    <span class="text-brand">⚡</span> Datos Oficiales Sincronizados
                </div>
            </div>
        `;

        const valuationContainer = document.getElementById('gisValuationContext');
        if (valuationContainer) {
            valuationContainer.innerHTML = extraInfo;
        } else {
            const div = document.createElement('div');
            div.id = 'gisValuationContext';
            div.innerHTML = extraInfo;
            if (UI_GIS.infoPanel) UI_GIS.infoPanel.appendChild(div);
        }
    }

    async function loadLocalLayers() {
        if (GIS_STATE.cache.lines && GIS_STATE.cache.servidumbre) { renderLocalLayers(); return; }
        try {
            updateGisStatus("📥 Descargando infraestructura y servidumbres...", "info");
            const [linesRes, towersRes, servRes] = await Promise.all([
                fetch('lines.geojson'),
                fetch('towers.geojson'),
                fetch('Servidumbre.geojson')
            ]);
            const linesData = await linesRes.json();
            const towersData = await towersRes.json();
            const servData = await servRes.json();

            updateGisStatus("⚙️ Procesando coordenadas Magna-Sirgas...", "info");

            // Transformación Asíncrona
            GIS_STATE.cache.lines = await transformGeoJSONAsync(linesData, "Líneas");
            GIS_STATE.cache.towers = await transformGeoJSONAsync(towersData, "Torres");
            GIS_STATE.cache.servidumbre = await transformGeoJSONAsync(servData, "Servidumbres");

            renderLocalLayers();
            updateGisStatus("✅ Sistema Geo-Referenciado Optimizado.", "success");
        } catch (e) {
            console.error("Local Layer Error:", e);
            updateGisStatus("⚠️ Error cargando infraestructura local.", "error");
        }
    }

    // Motor de transformación asíncrona por lotes
    async function transformGeoJSONAsync(data, label) {
        if (!window.proj4) return data;
        const source = GIS_STATE.projections.magna;
        const dest = 'EPSG:4326';
        const features = data.features;
        const batchSize = 2000;
        let processed = 0;

        return new Promise((resolve) => {
            function processBatch() {
                const limit = Math.min(processed + batchSize, features.length);
                for (let i = processed; i < limit; i++) {
                    const f = features[i];
                    if (!f.geometry || !f.geometry.coordinates) continue;

                    try {
                        const coords = f.geometry.coordinates;

                        // AUTO-DETECT: Si las coordenadas parecen Lat/Lng (menores a 180), saltar proyección
                        let sampleCoord = null;
                        if (f.geometry.type === 'Point') sampleCoord = coords;
                        else if (f.geometry.type === 'LineString') sampleCoord = coords[0];
                        else if (f.geometry.type === 'MultiPolygon') sampleCoord = coords[0][0][0];
                        else if (f.geometry.type === 'Polygon') sampleCoord = coords[0][0];

                        if (sampleCoord && Math.abs(sampleCoord[0]) <= 180 && Math.abs(sampleCoord[1]) <= 90) {
                            // Ya está en WGS84, no proyectar
                            continue;
                        }

                        if (f.geometry.type === 'Point') {
                            // Soportamos XY y XYZ filtrando para Proj4
                            const p = proj4(source, dest, [coords[0], coords[1]]);
                            f.geometry.coordinates = [p[0], p[1]];
                        } else if (f.geometry.type === 'LineString') {
                            f.geometry.coordinates = coords.map(pt => {
                                const p = proj4(source, dest, [pt[0], pt[1]]);
                                return [p[0], p[1]];
                            });
                        } else if (f.geometry.type === 'Polygon') {
                            f.geometry.coordinates = coords.map(ring => ring.map(pt => {
                                const p = proj4(source, dest, [pt[0], pt[1]]);
                                return [p[0], p[1]];
                            }));
                        } else if (f.geometry.type === 'MultiPolygon') {
                            f.geometry.coordinates = coords.map(poly => poly.map(ring => ring.map(pt => {
                                const p = proj4(source, dest, [pt[0], pt[1]]);
                                return [p[0], p[1]];
                            })));
                        } else if (f.geometry.type === 'MultiLineString') {
                            f.geometry.coordinates = coords.map(line => line.map(pt => {
                                const p = proj4(source, dest, [pt[0], pt[1]]);
                                return [p[0], p[1]];
                            }));
                        }
                    } catch (e) { }
                }

                processed = limit;
                if (processed < features.length) {
                    setTimeout(processBatch, 0);
                } else {
                    updateGisStatus(`✔ ${label} procesadas: ${features.length}`, "success");
                    resolve(data);
                }
            }
            processBatch();
        });
    }

    function renderLocalLayers() {
        if (!GIS_STATE.map) return;

        // Cleanup previous layers if any
        if (GIS_STATE.layers.lines) GIS_STATE.map.removeLayer(GIS_STATE.layers.lines);
        if (GIS_STATE.layers.towers) GIS_STATE.map.removeLayer(GIS_STATE.layers.towers);
        if (GIS_STATE.layers.servidumbre) GIS_STATE.map.removeLayer(GIS_STATE.layers.servidumbre);

        // --- CAPA DE SERVIDUMBRE (v4.1) ---
        GIS_STATE.layers.servidumbre = L.geoJSON(GIS_STATE.cache.servidumbre, {
            pane: 'servidumbrePane',
            style: {
                color: '#10b981',
                weight: 1,
                fillOpacity: 0.25,
                fillColor: '#10b981',
                className: 'gis-servidumbre-path'
            },
            onEachFeature: (f, l) => {
                if (f.properties) {
                    l.bindTooltip(`<b>Servidumbre:</b> ${f.properties.Nombre_Lar || f.properties.ID_Linea || 'N/A'}<br>Ancho: ${f.properties.AnchoSer || '--'}m`, { sticky: true, className: 'gis-tooltip' });
                }
            }
        });

        // --- OPTIVIZACION DE VISIBILIDAD DE INFRAESTRUCTURA ---
        GIS_STATE.layers.lines = L.geoJSON(GIS_STATE.cache.lines, {
            pane: 'linesPane',
            style: { color: '#00e5ff', weight: 4, opacity: 0.85, className: 'gis-line-glow' },
            onEachFeature: (f, l) => {
                if (f.properties && f.properties.ID_Linea) {
                    l.bindTooltip(`<span class="label-prefix">INFRA:</span> ${f.properties.ID_Linea}`, {
                        permanent: true,
                        sticky: false,
                        direction: 'center',
                        className: 'gis-label-infra',
                        offset: [0, 0]
                    });
                }
            }
        });

        GIS_STATE.layers.towers = L.geoJSON(GIS_STATE.cache.towers, {
            pane: 'towersPane',
            pointToLayer: (f, ll) => L.circleMarker(ll, {
                radius: 4, fillColor: '#ffc107', color: '#000', weight: 1, fillOpacity: 0.9
            }),
            onEachFeature: (f, l) => {
                // Ya no bindeamos tooltips permanentes aquí para 19k puntos
                // Se hará dinámicamente según el viewport para máxima fluidez
            }
        });

        // Motor de Etiquetas Dinámicas (LOD + Viewport)
        const updateDynamicLabels = () => {
            const z = GIS_STATE.map.getZoom();
            const bounds = GIS_STATE.map.getBounds();

            // Torres: Solo procesamos etiquetas si estamos muy cerca (Z17+)
            if (z >= 17) {
                GIS_STATE.layers.towers.eachLayer(l => {
                    const latlng = l.getLatLng();
                    if (bounds.contains(latlng)) {
                        if (!l.getTooltip()) {
                            l.bindTooltip(l.feature.properties.Torre_No.replace('Torre ', 'T-'), {
                                permanent: true, direction: 'top', className: 'gis-label-expert', offset: [0, -8]
                            });
                        }
                    } else if (l.getTooltip()) {
                        l.unbindTooltip();
                    }
                });
            } else {
                // Limpieza masiva si nos alejamos
                GIS_STATE.layers.towers.eachLayer(l => { if (l.getTooltip()) l.unbindTooltip(); });
            }
        };

        GIS_STATE.map.on('moveend zoomend', updateDynamicLabels);

        // Infraestructura permanente
        GIS_STATE.map.addLayer(GIS_STATE.layers.servidumbre);
        GIS_STATE.map.addLayer(GIS_STATE.layers.lines);
        GIS_STATE.map.addLayer(GIS_STATE.layers.towers);

        // Disparo inicial del motor de visibilidad
        updateDynamicLabels();

        if (GIS_STATE.layers.lines.getBounds().isValid()) {
            GIS_STATE.map.fitBounds(GIS_STATE.layers.lines.getBounds(), { padding: [50, 50] });
        }

        updateGisStatus("🚀 Motor de rendimiento activo (Z15 Detectado)", "success");
    }

    // --- LÓGICA DE JERARQUÍA DE CAPAS (v4.0) ---
    window.changeLayerOrder = function (type, direction) {
        if (!GIS_STATE.map) return;

        const tag = document.getElementById('layerPriorityTag');

        if (type === 'infra') {
            if (direction === 'up') {
                GIS_STATE.map.getPane('linesPane').style.zIndex = 640;
                GIS_STATE.map.getPane('towersPane').style.zIndex = 650;
                GIS_STATE.map.getPane('servidumbrePane').style.zIndex = 630;
                GIS_STATE.map.getPane('igacPane').style.zIndex = 400;
                if (tag) tag.textContent = "INFRA FIRST";
                updateGisStatus("🔼 Infraestructura movida al frente.", "info");
            } else {
                GIS_STATE.map.getPane('linesPane').style.zIndex = 300;
                GIS_STATE.map.getPane('towersPane').style.zIndex = 310;
                GIS_STATE.map.getPane('servidumbrePane').style.zIndex = 290;
                GIS_STATE.map.getPane('igacPane').style.zIndex = 600;
                if (tag) tag.textContent = "IGAC FIRST";
                updateGisStatus("🔽 Infraestructura movida al fondo.", "info");
            }
        } else if (type === 'igac') {
            if (direction === 'up') {
                GIS_STATE.map.getPane('igacPane').style.zIndex = 700;
                GIS_STATE.map.getPane('linesPane').style.zIndex = 640;
                GIS_STATE.map.getPane('towersPane').style.zIndex = 650;
                GIS_STATE.map.getPane('servidumbrePane').style.zIndex = 630;
                if (tag) tag.textContent = "IGAC FIRST";
                updateGisStatus("🔼 Capas IGAC movidas al frente.", "info");
            } else {
                GIS_STATE.map.getPane('igacPane').style.zIndex = 400;
                GIS_STATE.map.getPane('servidumbrePane').style.zIndex = 500;
                if (tag) tag.textContent = "INFRA FIRST";
                updateGisStatus("🔽 Capas IGAC movidas al fondo.", "info");
            }
        }

        // Forzar refresco de renderizado
        GIS_STATE.map.invalidateSize();
    };

    function updateGisStatus(text, type = 'info') {
        if (!UI_GIS.statusList) return;
        const item = document.createElement('div');
        item.className = `p-3 rounded-xl bg-white/5 border-l-4 ${type === 'success' ? 'border-l-emerald-500' : type === 'error' ? 'border-l-red-500' : 'border-l-brand'} animate-up text-[10px] text-gray-300 font-bold mb-2 transition-all`;
        item.innerHTML = text;
        UI_GIS.statusList.prepend(item);
        if (UI_GIS.statusList.children.length > 4) UI_GIS.statusList.lastChild.remove();
    }

    // --- INITIAL BOOTSTRAP ---
    if (UI_GIS.toggleBtn) {
        UI_GIS.toggleBtn.onclick = (e) => { e.preventDefault(); UI_GIS.overlay.classList.remove('hidden'); setTimeout(() => { UI_GIS.overlay.classList.add('opacity-100'); initGis(); if (window.lucide) window.lucide.createIcons(); }, 50); };
    }

    if (UI_GIS.closeBtn) UI_GIS.closeBtn.addEventListener('click', () => { UI_GIS.overlay.classList.remove('opacity-100'); setTimeout(() => UI_GIS.overlay.classList.add('hidden'), 700); });

    UI_GIS.syncBtn.onclick = () => {
        if (!GIS_STATE.activePredio || !window.STATE) return;
        const p = GIS_STATE.activePredio;
        window.STATE.meta.cedula = p.CODIGO || p.NUMERO_CATASTRAL || '--';
        window.STATE.meta.area = parseFloat(p.AREA_TERRENO || p.SHAPE_Area || 0).toFixed(2);

        // Metadata enriquecida para app.js
        const syncData = {
            cedula: window.STATE.meta.cedula,
            area: window.STATE.meta.area,
            landType: p._landType || 'Urbano',
            igacValuation: p._valuation ? (p._valuation.AVALUO_CATASTRAL || 0) : 0,
            igacDestino: p._valuation ? (p._valuation.DESTINO_ECONOMICO || '') : ''
        };

        // Si hay datos de valuación, los inyectamos como notas al proyecto
        if (p._valuation) {
            window.STATE.meta.aviso = `Avalúo IGAC: $${(p._valuation.AVALUO_CATASTRAL || 0).toLocaleString()} | Destino: ${p._valuation.DESTINO_ECONOMICO || '--'}`;
        }

        if (window.showToast) window.showToast("⚡ Inteligencia de Valoración Inyectada", "success");
        document.dispatchEvent(new CustomEvent('gisSync', { detail: syncData }));
        if (typeof window.recalculate === 'function') window.recalculate();

        UI_GIS.overlay.classList.remove('opacity-100');
        setTimeout(() => UI_GIS.overlay.classList.add('hidden'), 700);
    };


    // --- ATTRIBUTE TABLE ENGINE (v5.0) ---
    window.openAttributeTable = function (layerKey) {
        // Feature: Auto-select 'lines' if no layer specified (UX improvement)
        if (!layerKey) layerKey = 'lines';

        if (!GIS_STATE.cache[layerKey]) {
            // Si la capa 'lines' no está lista, intentar cargar datos básicos o mostrar aviso
            if (layerKey === 'lines' && !GIS_STATE.cache.lines) {
                updateGisStatus("⏳ Esperando datos del servidor...", "info");
                return;
            }
            updateGisStatus("⚠️ Capa no cargada o sin datos.", "error");
            return;
        }

        const rawData = GIS_STATE.cache[layerKey].features;
        GIS_TABLE.activeLayer = layerKey;
        GIS_TABLE.data = rawData.map((f, idx) => ({ ...f.properties, _gid: idx, _geometry: f.geometry })); // Enriquecer con índice estable
        GIS_TABLE.filteredData = [...GIS_TABLE.data];
        GIS_TABLE.currentPage = 1;

        renderTableUI();
    };

    function renderTableUI() {
        const container = document.getElementById('gisAttributeTablePanel');
        if (!container) return;

        container.classList.remove('hidden');
        container.classList.add('flex'); // Activar flex para layout

        // Render Headers
        const tableHead = document.getElementById('gisTableHead');
        const tableBody = document.getElementById('gisTableBody');
        const layerTitle = document.getElementById('gisTableTitle');
        const countBadge = document.getElementById('gisTableCount');
        const filterInput = document.getElementById('gisTableFilter');

        if (layerTitle) layerTitle.textContent = GIS_TABLE.activeLayer.toUpperCase();
        if (countBadge) countBadge.textContent = `${GIS_TABLE.filteredData.length} Registros`;

        // Bind Filter Input
        if (filterInput) {
            // Smart Filter: Clear on focus if empty, bind real-time
            filterInput.value = '';
            filterInput.oninput = (e) => {
                const val = e.target.value;
                // Debounce slightly for performance on huge datasets
                if (window._filterTimeout) clearTimeout(window._filterTimeout);
                window._filterTimeout = setTimeout(() => filterGisTable(val), 300);
            };
            filterInput.focus();
        }

        // Add CSV Export Button if not exists
        const headerActions = document.getElementById('gisHeaderActions'); // Ensure this ID exists in HTML or create dynamically
        if (!document.getElementById('btnExportGisCsv') && layerTitle) {
            const btn = document.createElement('button');
            btn.id = 'btnExportGisCsv';
            btn.className = "p-1.5 rounded hover:bg-white/10 text-brand-400 hover:text-white transition-colors ml-2";
            btn.innerHTML = '<i data-lucide="download" class="w-4 h-4"></i>';
            btn.title = "Exportar Vista a CSV";
            btn.onclick = exportGisTableToCSV;
            layerTitle.parentNode.appendChild(btn);
            if (window.lucide) lucide.createIcons();
        }

        if (GIS_TABLE.data.length === 0) return;

        // Auto-detect columns (ignoring geometry and internal props)
        const keys = Object.keys(GIS_TABLE.data[0]).filter(k => k !== '_gid' && k !== '_geometry' && k !== 'geometry');

        tableHead.innerHTML = `
            <tr>
                <th class="p-3 text-left font-bold text-brand uppercase text-xs tracking-wider sticky top-0 bg-dark-800 z-10 w-10 border-b border-brand/20">
                    <i data-lucide="hash" class="w-3 h-3"></i>
                </th>
                ${keys.map(k => `
                    <th class="p-3 text-left font-bold text-gray-300 uppercase text-xs tracking-wider sticky top-0 bg-dark-800 z-10 cursor-pointer hover:text-white hover:bg-white/5 border-b border-brand/20 transition-colors group" onclick="sortGisTable('${k}')">
                        <div class="flex items-center gap-2">
                            ${k}
                            <i data-lucide="arrow-up-down" class="w-3 h-3 opacity-30 group-hover:opacity-100"></i>
                        </div>
                    </th>
                `).join('')}
                <th class="p-3 text-right font-bold text-gray-300 uppercase text-xs tracking-wider sticky top-0 right-0 bg-dark-800 z-50 border-l border-white/10 border-b border-brand/20 shadow-[-5px_0_10px_rgba(0,0,0,0.5)]">ACCION</th>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();

        renderTableRows(tableBody, keys);
    }

    function renderTableRows(tbody, keys) {
        tbody.innerHTML = '';

        const start = (GIS_TABLE.currentPage - 1) * GIS_TABLE.rowsPerPage;
        const end = start + GIS_TABLE.rowsPerPage;
        const pageData = GIS_TABLE.filteredData.slice(start, end);

        pageData.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-800 hover:bg-white/5 transition-colors group";
            tr.innerHTML = `
                <td class="p-2 text-[10px] text-gray-500 font-mono border-b border-white/5">${row._gid}</td>
                ${keys.map(k => `<td class="p-2 text-[10px] text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] border-b border-white/5" title="${row[k]}">${row[k] || '--'}</td>`).join('')}
                <td class="p-2 text-right border-b border-white/5 border-l border-white/10 sticky right-0 bg-[#0a0c10] z-[50] shadow-[-5px_0_10px_rgba(0,0,0,0.5)]">
                    <button type="button" class="action-zoom-btn" style="background-color: #2563eb !important; color: #ffffff !important; padding: 6px 14px; border-radius: 6px; font-weight: 900; font-size: 11px; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.3); display: inline-flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;" data-gid="${row._gid}">
                        🔍 VER
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add event listeners manually to avoid inline onclick issues
        document.querySelectorAll('.action-zoom-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const gid = parseInt(btn.getAttribute('data-gid'));
                zoomToGisFeature(gid);
            };
        });

        updatePaginationInfo();
    }

    window.filterGisTable = function (query) {
        query = query.toLowerCase();
        if (!query) {
            GIS_TABLE.filteredData = [...GIS_TABLE.data];
        } else {
            GIS_TABLE.filteredData = GIS_TABLE.data.filter(row => {
                return Object.values(row).some(val => String(val).toLowerCase().includes(query));
            });
        }
        GIS_TABLE.currentPage = 1;

        // Re-render body only
        const tableBody = document.getElementById('gisTableBody');
        const countBadge = document.getElementById('gisTableCount');
        if (countBadge) countBadge.textContent = `${GIS_TABLE.filteredData.length} Registros`;

        if (GIS_TABLE.data.length > 0) {
            const keys = Object.keys(GIS_TABLE.data[0]).filter(k => k !== '_gid' && k !== '_geometry' && k !== 'geometry');
            renderTableRows(tableBody, keys);
        }

        // --- AUTO ZOOM TO RESULTS (Smart FlyTo) ---
        if (query.length > 2 && GIS_TABLE.filteredData.length > 0) {
            try {
                const features = GIS_TABLE.filteredData
                    .filter(d => d._geometry)
                    .map(d => ({ type: "Feature", geometry: d._geometry, properties: {} }));

                if (features.length > 0) {
                    const tempLayer = L.geoJSON({ type: "FeatureCollection", features: features });
                    const bounds = tempLayer.getBounds();

                    if (bounds && bounds.isValid()) {
                        GIS_STATE.map.flyToBounds(bounds, {
                            padding: [100, 100],
                            maxZoom: 18,
                            duration: 1.5,
                            easeLinearity: 0.25
                        });
                    }
                }
            } catch (err) {
                console.warn("Auto-zoom error:", err);
            }
        } else if (GIS_TABLE.filteredData.length === 0 && query.length > 0) {
            updateGisStatus("⚠️ No se encontraron coincidencias", "error");
        }
    };

    // Export Helper
    window.exportGisTableToCSV = function () {
        if (!GIS_TABLE.filteredData.length) {
            showToast("No hay datos para exportar", "error");
            return;
        }

        // Extract headers from first row (excluding internal fields)
        const sample = GIS_TABLE.filteredData[0];
        const headers = Object.keys(sample).filter(k => k !== '_gid' && k !== '_geometry' && k !== 'geometry');

        // Build CSV Content
        let csvContent = headers.join(",") + "\n";

        GIS_TABLE.filteredData.forEach(row => {
            const rowData = headers.map(header => {
                const val = row[header] ? String(row[header]).replace(/,/g, " ").replace(/"/g, '""') : "--";
                return `"${val}"`;
            });
            csvContent += rowData.join(",") + "\n";
        });

        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `gis_export_${GIS_TABLE.activeLayer}_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast("📊 Datos Exportados a CSV", "success");
    };

    window.zoomToGisFeature = function (gid) {
        // Encontrar feature original en cache usando el GID (que es el índice original)
        const activeCache = GIS_STATE.cache[GIS_TABLE.activeLayer];
        if (!activeCache) return;

        const feature = activeCache.features[gid];
        if (!feature) return;

        const layerGroup = GIS_STATE.layers[GIS_TABLE.activeLayer];
        if (!layerGroup) return;

        // Leaflet GeoJSON añade capas internas, hay que encontrar la que corresponde o crear un shape temporal para hacer zoom
        // Manera facil: crear capa temporal solo para bounds
        const tempLayer = L.geoJSON(feature);
        const bounds = tempLayer.getBounds();

        GIS_STATE.map.fitBounds(bounds, { maxZoom: 18, padding: [100, 100], animate: true });

        // Efecto visual (Flash)
        const flash = L.geoJSON(feature, {
            style: { color: '#ffffff', weight: 5, opacity: 0.8, fillOpacity: 0.5, fillColor: '#ffffff' },
            pointToLayer: (f, ll) => L.circleMarker(ll, { radius: 10, color: '#fff', fillColor: '#fff' })
        }).addTo(GIS_STATE.map);

        setTimeout(() => flash.remove(), 1500);
        updateGisStatus(`🔎 Zoom a elemento ${gid} `, "success");
    };

    window.closeAttributeTable = function () {
        const p = document.getElementById('gisAttributeTablePanel');
        if (p) {
            p.classList.remove('flex');
            p.classList.add('hidden');
        }
    };

    // --- MAP STYLE SWITCHER ---
    window.setMapStyle = function (style) {
        if (!GIS_STATE.map) return;

        const satBtn = document.getElementById('btnSatView');
        const darkBtn = document.getElementById('btnDarkView');

        // Helper to update button styles
        const setActive = (btn, active) => {
            if (!btn) return;
            if (active) {
                // Style Active
                btn.className = "px-4 py-2 rounded-xl bg-brand/20 border border-brand/50 text-brand text-[9px] font-black uppercase tracking-widest hover:bg-brand/30 transition-all";
            } else {
                // Style Inactive
                btn.className = "px-4 py-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white border border-transparent hover:border-white/10 text-[9px] font-black uppercase tracking-widest transition-all";
            }
        };

        if (style === 'satellite') {
            // Switch to Satellite
            GIS_STATE.basemap.remove();
            GIS_STATE.basemap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri',
                maxZoom: 19
            }).addTo(GIS_STATE.map);

            setActive(satBtn, true);
            setActive(darkBtn, false);
            updateGisStatus("🌍 Vista Satelital Activada", "success");

        } else {
            // Switch to Dark / Technical
            GIS_STATE.basemap.remove();
            GIS_STATE.basemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CartoDB',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(GIS_STATE.map);

            setActive(satBtn, false);
            setActive(darkBtn, true);
            updateGisStatus("🌑 Mapa Técnico Activado", "info");
        }
    };

    function updatePaginationInfo() {
        // Simple logic for footer if needed
    }

})();
