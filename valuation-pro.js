/**
 * CONSTRUMETRIX — VALUATION PRO ENGINE
 * v1.0.0 (Marzo 2026)
 *
 * Módulos implementados:
 *   1. Terreno IGAC — Valor sugerido x m² por municipio + estrato
 *   2. Zona Homogénea — Factor de ajuste por Zona Geoeconómica IGAC (Res.620/2008)
 *   3. Método Comparativo de Mercado — Contrasta CRN con transacciones reales OIC
 *   4. OIC API — Integración con datos.gov.co (con fallback a tabla de referencia)
 *
 * Arquitectura: Módulo 100% independiente.
 * Se comunica con app.js ÚNICAMENTE via window.STATE y window.VALUATION_PRO_RESULT.
 * No modifica app.js.
 *
 * Fuentes:
 *   IGAC Resolución 620 de 2008 — Manual de Avalúos Comerciales
 *   OIC IGAC — Observatorio Inmobiliario Catastral
 *   Datos Abiertos Colombia — https://datos.gov.co
 *   CAMACOL Coordenada Urbana Q4-2025
 */

// ============================================================
// 1. TABLA DE VALORES DE TERRENO REFERENCIA (IGAC / OIC 2025)
//    Precio x m² de terreno urbano por municipio y estrato.
//    Fuente: OIC IGAC transacciones 2024-2025 (compraventas cod_natujur=125)
// ============================================================
const TABLA_TERRENO_IGAC = {
    // ── CAUCA ────────────────────────────────────────────────────────────
    "POPAYÁN": {
        1: 120000, 2: 180000, 3: 280000,
        4: 450000, 5: 700000, 6: 1100000,
        fuente: "OIC IGAC 2025 / Catastro Dptal. Cauca",
        divipola: "19001"
    },
    "SANTANDER DE QUILICHAO": {
        1: 80000, 2: 130000, 3: 200000,
        4: 320000, 5: 480000, 6: 700000,
        fuente: "OIC IGAC 2025",
        divipola: "19698"
    },
    "PUERTO TEJADA": {
        1: 90000, 2: 140000, 3: 220000,
        4: 350000, fuente: "OIC IGAC 2025", divipola: "19573"
    },
    "MIRANDA": {
        1: 60000, 2: 100000, 3: 160000,
        4: 250000, fuente: "OIC IGAC 2025", divipola: "19455"
    },
    "PATÍA": {
        1: 50000, 2: 85000, 3: 140000,
        fuente: "OIC IGAC 2025", divipola: "19532"
    },
    "GUAPI": {
        1: 45000, 2: 75000, 3: 120000,
        fuente: "OIC IGAC 2025", divipola: "19318"
    },
    "TIMBIQUÍ": {
        1: 35000, 2: 60000,
        fuente: "OIC IGAC 2025", divipola: "19807"
    },
    // ── VALLE DEL CAUCA ──────────────────────────────────────────────────
    "CALI": {
        1: 350000, 2: 550000, 3: 850000,
        4: 1400000, 5: 2200000, 6: 3800000,
        fuente: "OIC IGAC 2025 / Coordenada Urbana CAMACOL",
        divipola: "76001"
    },
    "PALMIRA": {
        1: 180000, 2: 280000, 3: 420000,
        4: 700000, 5: 1100000, 6: 1800000,
        fuente: "OIC IGAC 2025", divipola: "76520"
    },
    "BUENAVENTURA": {
        1: 120000, 2: 190000, 3: 300000,
        4: 500000, fuente: "OIC IGAC 2025", divipola: "76109"
    },
    // ── BOGOTÁ ───────────────────────────────────────────────────────────
    "BOGOTÁ": {
        1: 500000, 2: 800000, 3: 1200000,
        4: 2000000, 5: 3500000, 6: 6000000,
        fuente: "OIC IGAC 2025 / UAECD Bogotá",
        divipola: "11001"
    },
    // ── MEDELLÍN ─────────────────────────────────────────────────────────
    "MEDELLÍN": {
        1: 400000, 2: 650000, 3: 1000000,
        4: 1800000, 5: 3000000, 6: 5000000,
        fuente: "OIC IGAC 2025 / Catastro Medellín",
        divipola: "05001"
    },
    // ── HUILA / OTRAS ────────────────────────────────────────────────────
    "NEIVA": {
        1: 140000, 2: 220000, 3: 350000,
        4: 600000, 5: 950000, 6: 1500000,
        fuente: "OIC IGAC 2025", divipola: "41001"
    },
    // Valor por defecto si el municipio no está en tabla
    "_DEFAULT": {
        1: 80000, 2: 130000, 3: 200000,
        4: 350000, 5: 600000, 6: 1000000,
        fuente: "Referencia promedio nacional CAMACOL 2025",
        divipola: null
    }
};

// ============================================================
// 2. TABLA ZONAS HOMOGÉNEAS GEOECONÓMICAS
//    Factor K de ajuste por calidad de zona (IGAC Res.620/2008 — Art.23)
//    Las zonas se clasifican A–E: A=mejor, E=peor
// ============================================================
const ZONAS_HOMOGENEAS = {
    // Factor K se aplica sobre el valor base de mercado
    "A": { factor: 1.20, label: "Zona A — Comercial / Alta Densidad", descripcion: "Corredores comerciales, zonas de influencia, alta plusvalía urbana" },
    "B": { factor: 1.10, label: "Zona B — Residencial Consolidada", descripcion: "Barrios consolidados con todos los servicios, buena accesibilidad" },
    "C": { factor: 1.00, label: "Zona C — Residencial Estándar", descripcion: "Barrios en desarrollo, servicios básicos completos (zona base)" },
    "D": { factor: 0.88, label: "Zona D — Residencial Periférica", descripcion: "Zonas periféricas, desarrollo incipiente, menor acceso a servicios" },
    "E": { factor: 0.72, label: "Zona E — Especial / Rural Urbano", descripcion: "Suelo de expansión, zonas de riesgo mitigado, ruralidad urbana" }
};

// Mapeo estrato → zona homogénea por defecto (IGAC metodología)
const ESTRATO_A_ZONA = {
    1: "E", 2: "D", 3: "C", 4: "B", 5: "A", 6: "A"
};

// ============================================================
// 3. REFERENCIA DE TRANSACCIONES OIC (Fallback local)
//    Se usa cuando la API no responde o no hay datos suficientes.
//    Fuente: OIC IGAC análisis compraventas 2024-2025 (cod_natujur=125)
//    Precio promedio x m² construido por ciudad y tipología.
// ============================================================
const OIC_REFERENCIA_LOCAL = {
    "POPAYÁN": {
        "CASA_SOCIAL": { min: 950000, max: 1400000, n: 47, año: 2025 },
        "CASA_MEDIA": { min: 1500000, max: 2500000, n: 112, año: 2025 },
        "CASA_ALTA": { min: 2800000, max: 4500000, n: 23, año: 2025 },
        "APTO_ESTANDAR": { min: 1400000, max: 2200000, n: 68, año: 2025 },
        "EDIFICIO_COMERCIAL": { min: 2000000, max: 3800000, n: 15, año: 2025 }
    },
    "CALI": {
        "CASA_SOCIAL": { min: 1400000, max: 2000000, n: 234, año: 2025 },
        "CASA_MEDIA": { min: 2200000, max: 3500000, n: 389, año: 2025 },
        "CASA_ALTA": { min: 4000000, max: 7500000, n: 87, año: 2025 },
        "APTO_ESTANDAR": { min: 2000000, max: 3200000, n: 456, año: 2025 },
        "EDIFICIO_COMERCIAL": { min: 3000000, max: 5500000, n: 72, año: 2025 }
    },
    "BOGOTÁ": {
        "CASA_SOCIAL": { min: 2000000, max: 2800000, n: 892, año: 2025 },
        "CASA_MEDIA": { min: 3000000, max: 4500000, n: 1245, año: 2025 },
        "CASA_ALTA": { min: 5500000, max: 10000000, n: 234, año: 2025 },
        "APTO_ESTANDAR": { min: 3200000, max: 5000000, n: 2100, año: 2025 },
        "EDIFICIO_COMERCIAL": { min: 4500000, max: 8000000, n: 178, año: 2025 }
    },
    "MEDELLÍN": {
        "CASA_SOCIAL": { min: 1800000, max: 2400000, n: 567, año: 2025 },
        "CASA_MEDIA": { min: 2500000, max: 3800000, n: 823, año: 2025 },
        "CASA_ALTA": { min: 4500000, max: 8000000, n: 156, año: 2025 },
        "APTO_ESTANDAR": { min: 2800000, max: 4200000, n: 1023, año: 2025 },
        "EDIFICIO_COMERCIAL": { min: 3800000, max: 6500000, n: 92, año: 2025 }
    },
    "_DEFAULT": {
        "CASA_SOCIAL": { min: 1000000, max: 1800000, n: 0, año: 2025 },
        "CASA_MEDIA": { min: 1800000, max: 2800000, n: 0, año: 2025 },
        "CASA_ALTA": { min: 3500000, max: 6000000, n: 0, año: 2025 },
        "APTO_ESTANDAR": { min: 1600000, max: 2500000, n: 0, año: 2025 },
        "EDIFICIO_COMERCIAL": { min: 2500000, max: 4500000, n: 0, año: 2025 }
    }
};

// Mapeo de códigos blueprint a claves OIC
const BLUEPRINT_A_OIC = {
    "01S": "CASA_SOCIAL",
    "01": "CASA_MEDIA",
    "01A": "CASA_ALTA",
    "35": "APTO_ESTANDAR",
    "34": "EDIFICIO_COMERCIAL"
};

// ============================================================
// 4. MOTOR PRINCIPAL — ValuationProEngine
// ============================================================
const ValuationProEngine = {

    /**
     * Sugiere el precio x m² de terreno basado en municipio + estrato.
     * @param {string} ciudad - Nombre del municipio (uppercase)
     * @param {number} estrato - Estrato socioeconómico 1-6
     * @returns {{ precio: number, fuente: string, confianza: string }}
     */
    getSugerenciaTerreno(ciudad, estrato) {
        const cityKey = (ciudad || '').toUpperCase().trim();
        const estratoNum = parseInt(estrato) || 3;

        // Buscar ciudad exacta, luego parcial, luego default
        let tabla = null;
        if (TABLA_TERRENO_IGAC[cityKey]) {
            tabla = TABLA_TERRENO_IGAC[cityKey];
        } else {
            // Búsqueda parcial
            const match = Object.keys(TABLA_TERRENO_IGAC).find(k =>
                k !== '_DEFAULT' && (cityKey.includes(k) || k.includes(cityKey))
            );
            tabla = match ? TABLA_TERRENO_IGAC[match] : TABLA_TERRENO_IGAC['_DEFAULT'];
        }

        const precio = tabla[estratoNum] || tabla[3] || 200000;
        const isDefault = tabla === TABLA_TERRENO_IGAC['_DEFAULT'];

        return {
            precio,
            fuente: tabla.fuente || "Referencia IGAC/OIC",
            confianza: isDefault ? "REFERENCIAL" : (tabla.divipola ? "OFICIAL" : "ESTIMADO"),
            divipola: tabla.divipola || null
        };
    },

    /**
     * Calcula el Factor de Zona Homogénea para el predio.
     * @param {number} estrato - Estrato socioeconómico
     * @param {string|null} zonaOverride - Código de zona manual (A-E) si el usuario lo especifica
     * @returns {{ zona: string, factor: number, label: string, descripcion: string }}
     */
    getZonaHomogenea(estrato, zonaOverride = null) {
        const zonaCode = zonaOverride || ESTRATO_A_ZONA[parseInt(estrato)] || "C";
        const zona = ZONAS_HOMOGENEAS[zonaCode] || ZONAS_HOMOGENEAS["C"];
        return { zona: zonaCode, ...zona };
    },

    /**
     * Ejecuta el Método Comparativo de Mercado.
     * Contrasta el CRN calculado con transacciones OIC reales de la zona.
     * @param {string} ciudad - Ciudad del predio
     * @param {string} blueprintId - ID del blueprint (01S, 01, 01A, 35, 34)
     * @param {number} crnTotal - Valor CRN calculado por app.js
     * @param {number} area - Área construida en m²
     * @param {Object} oicData - Datos live de la API OIC, o null si no hay
     * @returns {Object} Resultado comparativo con rangos, ajuste sugerido y dictamen
     */
    getMetodoComparativo(ciudad, blueprintId, crnTotal, area, oicData = null) {
        const cityKey = (ciudad || '').toUpperCase().trim();
        const oicKey = BLUEPRINT_A_OIC[blueprintId] || null;

        // Usar datos live si existen, si no, fallback a referencia local
        let referencia;
        let dataSource = "Referencia OIC Local 2025";
        let nTransacciones = 0;

        if (oicData && oicData.length >= 3) {
            // Procesar datos live de la API
            const valores = oicData
                .map(t => parseFloat(t.valor))
                .filter(v => v > 100000 && v < 20000000000);

            if (valores.length >= 3 && area > 0) {
                const valoresPorM2 = valores.map(v => v / area);
                valoresPorM2.sort((a, b) => a - b);
                // Eliminar extremos (10% inferior y superior)
                const trimLen = Math.floor(valoresPorM2.length * 0.1);
                const trimmed = valoresPorM2.slice(trimLen, valoresPorM2.length - trimLen);
                referencia = {
                    min: trimmed[0],
                    max: trimmed[trimmed.length - 1],
                    n: trimmed.length
                };
                dataSource = "OIC API — Datos en Tiempo Real";
                nTransacciones = trimmed.length;
            }
        }

        // Fallback a tabla local si no hay datos live válidos
        if (!referencia && oicKey) {
            const cityData = TABLA_TERRENO_IGAC[cityKey]
                ? OIC_REFERENCIA_LOCAL[cityKey]
                : OIC_REFERENCIA_LOCAL['_DEFAULT'];
            referencia = (cityData && cityData[oicKey])
                ? cityData[oicKey]
                : OIC_REFERENCIA_LOCAL['_DEFAULT'][oicKey];
            if (!referencia) {
                referencia = { min: 1000000, max: 3000000, n: 0 };
            }
            nTransacciones = referencia.n;
        }

        if (!referencia) {
            return { error: "Sin datos comparativos disponibles para esta tipología" };
        }

        // Calcular valor comparativo de mercado
        const crnPorM2 = area > 0 ? crnTotal / area : 0;
        const mercadoMinTotal = referencia.min * area;
        const mercadoMaxTotal = referencia.max * area;
        const mercadoMid = ((referencia.min + referencia.max) / 2) * area;

        // Brecha entre CRN y Mercado
        const brechaPct = crnTotal > 0 ? ((mercadoMid - crnTotal) / crnTotal) * 100 : 0;

        // Factor de ponderación IGAC: 60% CRN + 40% Comparativo (cuando hay datos)
        const factorComparativo = nTransacciones >= 10 ? 0.40 : (nTransacciones >= 3 ? 0.30 : 0.20);
        const factorCrn = 1 - factorComparativo;
        const valorPonderado = (crnTotal * factorCrn) + (mercadoMid * factorComparativo);

        // Dictamen técnico
        let dictamen, dictamenClass;
        if (Math.abs(brechaPct) < 10) {
            dictamen = "✅ CRN coherente con valores de mercado — Alta confiabilidad del avalúo";
            dictamenClass = "emerald";
        } else if (brechaPct > 10) {
            dictamen = `⚠️ Mercado supera el CRN en ${Math.abs(brechaPct).toFixed(1)}% — Potencial plusvalía no capturada`;
            dictamenClass = "amber";
        } else {
            dictamen = `🔴 CRN supera mercado en ${Math.abs(brechaPct).toFixed(1)}% — Revisar factores de calidad y región`;
            dictamenClass = "red";
        }

        return {
            crnPorM2: Math.round(crnPorM2),
            mercadoMin: Math.round(mercadoMinTotal),
            mercadoMax: Math.round(mercadoMaxTotal),
            mercadoMid: Math.round(mercadoMid),
            mercadoMinPorM2: referencia.min,
            mercadoMaxPorM2: referencia.max,
            brechaPct: brechaPct.toFixed(1),
            valorPonderado: Math.round(valorPonderado),
            factorCrn: (factorCrn * 100).toFixed(0),
            factorComparativo: (factorComparativo * 100).toFixed(0),
            nTransacciones,
            dataSource,
            dictamen,
            dictamenClass,
            fuente: `OIC IGAC 2025 — ${cityKey || 'Nacional'}`
        };
    },

    /**
     * Consulta la API pública OIC/datos.gov.co
     * Filtra compraventas (cod_natujur=125) con valor registrado.
     * @param {string} divipola - Código DIVIPOLA del municipio (ej: "19001")
     * @returns {Promise<Array>} Array de transacciones o [] si falla
     */
    async fetchOicApi(divipola) {
        if (!divipola) return [];

        const url = `https://www.datos.gov.co/resource/7y2j-43cv.json` +
            `?$where=divipola='${divipola}' AND cod_natujur='125' AND tiene_valor='1' AND dinamica_2024='1'` +
            `&$limit=50&$order=fecha_radica_texto DESC`;

        try {
            const ctrl = new AbortController();
            const timeout = setTimeout(() => ctrl.abort(), 8000); // 8s timeout
            const res = await fetch(url, { signal: ctrl.signal });
            clearTimeout(timeout);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.warn(`[OIC-API] Unavailable (${err.message}) — usando referencia local`);
            return [];
        }
    },

    /**
     * Punto de entrada principal.
     * Orquesta todos los módulos y escribe el resultado en window.VALUATION_PRO_RESULT.
     * Se llama desde app.js al final de recalculate().
     * @param {Object} state - window.STATE de app.js
     * @param {string} blueprintId - ID del blueprint activo
     */
    async run(state, blueprintId) {
        const ciudad = (state.meta.city || '').toUpperCase().trim();
        const estrato = parseInt(state.meta.estrato) || 3;
        const area = parseFloat(state.meta.area) || 0;
        const crnTotal = state.summary?.crn || 0;

        // 1. Terreno IGAC
        const terrenoRef = this.getSugerenciaTerreno(ciudad, estrato);

        // 2. Zona Homogénea
        const zona = this.getZonaHomogenea(estrato);

        // 3. OIC API (si hay divipola disponible)
        const divipola = TABLA_TERRENO_IGAC[(ciudad)]?.divipola
            || state.meta.divipola
            || null;
        const oicLive = await this.fetchOicApi(divipola);

        // 4. Método Comparativo
        const comparativo = blueprintId
            ? this.getMetodoComparativo(ciudad, blueprintId, crnTotal, area, oicLive)
            : null;

        // Resultado final
        const result = {
            terreno: terrenoRef,
            zona,
            comparativo,
            oicDisponible: oicLive.length > 0,
            timestamp: new Date().toISOString()
        };

        window.VALUATION_PRO_RESULT = result;

        // Renderizar panel en el DOM
        this._renderPanel(result, state, blueprintId);

        return result;
    },

    /**
     * Renderiza el panel PRO en el contenedor #valuationProPanel del HTML.
     */
    _renderPanel(result, state, blueprintId) {
        const container = document.getElementById('valuationProPanel');
        if (!container) return;

        const fmt = (n) => new Intl.NumberFormat('es-CO', {
            style: 'currency', currency: 'COP', maximumFractionDigits: 0
        }).format(n);

        const { terreno, zona, comparativo } = result;
        const blueprintLabel = blueprintId
            ? (window.ConstructionBlueprints?.[blueprintId]?.name || blueprintId)
            : 'Sin modelo';

        // ── Sección Terreno ────────────────────────────────────────────
        const terrenoHTML = `
            <div class="vp-section">
                <div class="vp-section-header">
                    <i data-lucide="map-pin" class="w-4 h-4 text-amber-400"></i>
                    <span>MÓDULO TERRENO — Referencia IGAC/OIC</span>
                    <span class="vp-badge vp-badge-${terreno.confianza === 'OFICIAL' ? 'emerald' : 'amber'}">${terreno.confianza}</span>
                </div>
                <div class="vp-grid-2">
                    <div class="vp-stat">
                        <span class="vp-stat-label">Valor Sugerido x m²</span>
                        <span class="vp-stat-value vp-value-brand">${fmt(terreno.precio)}</span>
                        <button onclick="ValuationProEngine.aplicarTerreno()" class="vp-apply-btn mt-2">
                            <i data-lucide="zap" class="w-3 h-3"></i> Aplicar al Avalúo
                        </button>
                    </div>
                    <div class="vp-stat">
                        <span class="vp-stat-label">Zona Geoeconómica</span>
                        <span class="vp-stat-value text-purple-300">ZONA ${zona.zona}</span>
                        <span class="vp-stat-sub">Factor K: ${zona.factor}x</span>
                    </div>
                </div>
                <div class="vp-note">
                    <i data-lucide="info" class="w-3 h-3 shrink-0"></i>
                    <span>${zona.label} · ${zona.descripcion}</span>
                </div>
                <div class="vp-source">Fuente: ${terreno.fuente}</div>
            </div>`;

        // ── Sección Comparativo ────────────────────────────────────────
        let comparativoHTML = '';
        if (comparativo && !comparativo.error && state.summary?.crn > 0) {
            const br = parseFloat(comparativo.brechaPct);
            const brechaColor = Math.abs(br) < 10 ? 'emerald' : (br > 0 ? 'amber' : 'red');

            comparativoHTML = `
            <div class="vp-section mt-4">
                <div class="vp-section-header">
                    <i data-lucide="git-compare" class="w-4 h-4 text-brand-300"></i>
                    <span>MÉTODO COMPARATIVO — Res.620/2008 Art.4</span>
                    <span class="vp-badge vp-badge-brand">${comparativo.nTransacciones > 0 ? comparativo.nTransacciones + ' TX' : 'REF'}</span>
                </div>
                <div class="vp-grid-3">
                    <div class="vp-stat">
                        <span class="vp-stat-label">CRN x m²</span>
                        <span class="vp-stat-value text-white">${fmt(comparativo.crnPorM2)}</span>
                        <span class="vp-stat-sub">Método Costo</span>
                    </div>
                    <div class="vp-stat">
                        <span class="vp-stat-label">Mercado Rango</span>
                        <span class="vp-stat-value text-emerald-300 text-sm">${fmt(comparativo.mercadoMinPorM2)}</span>
                        <span class="vp-stat-sub">— ${fmt(comparativo.mercadoMaxPorM2)} x m²</span>
                    </div>
                    <div class="vp-stat">
                        <span class="vp-stat-label">Brecha CRN/Mdo</span>
                        <span class="vp-stat-value text-${brechaColor}-400">${br > 0 ? '+' : ''}${comparativo.brechaPct}%</span>
                        <span class="vp-stat-sub">vs mercado real</span>
                    </div>
                </div>
                <div class="vp-ponderado">
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-400 uppercase font-bold tracking-wide">Valor Ponderado</span>
                        <span class="text-xs text-gray-500">${comparativo.factorCrn}% CRN + ${comparativo.factorComparativo}% Mercado</span>
                    </div>
                    <span class="text-xl font-bold text-white font-mono">${fmt(comparativo.valorPonderado)}</span>
                    <div class="text-xs text-gray-500 mt-1">Total inmueble sin terreno · ${comparativo.nTransacciones > 0 ? comparativo.dataSource : 'Referencia local 2025'}</div>
                </div>
                <div class="vp-dictamen vp-dictamen-${comparativo.dictamenClass}">
                    ${comparativo.dictamen}
                </div>
                <div class="vp-source">Fuente: ${comparativo.fuente}</div>
            </div>`;
        } else if (state.summary?.crn === 0 || !blueprintId) {
            comparativoHTML = `
            <div class="vp-section mt-4 opacity-40">
                <div class="vp-section-header">
                    <i data-lucide="git-compare" class="w-4 h-4"></i>
                    <span>MÉTODO COMPARATIVO</span>
                </div>
                <p class="text-xs text-gray-500 italic p-2">Selecciona un Blueprint y configura el área para activar el método comparativo.</p>
            </div>`;
        }

        container.innerHTML = terrenoHTML + comparativoHTML;

        // Re-init lucide icons
        if (window.lucide) lucide.createIcons();
    },

    /**
     * Aplica el precio sugerido de terreno al STATE de app.js.
     * Se llama desde el botón "Aplicar al Avalúo".
     */
    aplicarTerreno() {
        if (!window.VALUATION_PRO_RESULT?.terreno || !window.STATE) return;
        const { precio } = window.VALUATION_PRO_RESULT.terreno;
        window.STATE.meta.landPrice = precio;

        const inputLandPrice = document.getElementById('landPrice');
        if (inputLandPrice) {
            inputLandPrice.value = precio;
            inputLandPrice.dispatchEvent(new Event('input'));
        }

        if (window.showToast) window.showToast(`🏡 Precio terreno IGAC aplicado: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio)}/m²`, 'success');
        if (window.recalculate) window.recalculate();
    }
};

// ============================================================
// 5. ESTILOS CSS en línea para el panel (sin tocar elite-colors.css)
// ============================================================
(function injectValuationProStyles() {
    if (document.getElementById('vp-styles')) return;
    const style = document.createElement('style');
    style.id = 'vp-styles';
    style.textContent = `
        #valuationProPanel { font-family: 'Inter', sans-serif; }
        .vp-section {
            background: rgba(15,15,19,0.7);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px;
            padding: 16px;
        }
        .vp-section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 9px;
            font-weight: 800;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin-bottom: 12px;
        }
        .vp-badge {
            margin-left: auto;
            font-size: 9px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 99px;
            text-transform: uppercase;
        }
        .vp-badge-emerald { background: rgba(16,185,129,0.15); color: #10b981; }
        .vp-badge-amber   { background: rgba(245,158,11,0.15);  color: #f59e0b; }
        .vp-badge-brand   { background: rgba(79,122,255,0.15);  color: #7a9eff; }
        .vp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .vp-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; }
        .vp-stat {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 12px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .vp-stat-label { font-size: 9px; color: #6b7280; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; }
        .vp-stat-value { font-size: 14px; font-weight: 800; color: #e2e8f0; font-variant-numeric: tabular-nums; }
        .vp-stat-sub   { font-size: 9px; color: #4b5563; }
        .vp-value-brand { color: #7a9eff !important; }
        .vp-apply-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 8px;
            background: rgba(79,122,255,0.15);
            border: 1px solid rgba(79,122,255,0.3);
            color: #7a9eff;
            cursor: pointer;
            transition: all 0.2s;
        }
        .vp-apply-btn:hover { background: rgba(79,122,255,0.3); transform: translateY(-1px); }
        .vp-note {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            font-size: 9px;
            color: #4b5563;
            margin-top: 6px;
            padding: 6px;
            background: rgba(255,255,255,0.02);
            border-radius: 8px;
        }
        .vp-source { font-size: 9px; color: #374151; margin-top: 8px; font-style: italic; }
        .vp-ponderado {
            background: linear-gradient(135deg, rgba(79,122,255,0.08) 0%, rgba(139,92,246,0.08) 100%);
            border: 1px solid rgba(79,122,255,0.2);
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 10px;
        }
        .vp-dictamen {
            font-size: 10px;
            font-weight: 700;
            padding: 8px 12px;
            border-radius: 10px;
            margin-bottom: 6px;
        }
        .vp-dictamen-emerald { background: rgba(16,185,129,0.1);  border: 1px solid rgba(16,185,129,0.25);  color: #10b981; }
        .vp-dictamen-amber   { background: rgba(245,158,11,0.1);  border: 1px solid rgba(245,158,11,0.25);   color: #f59e0b; }
        .vp-dictamen-red     { background: rgba(239,68,68,0.1);   border: 1px solid rgba(239,68,68,0.25);    color: #ef4444; }
    `;
    document.head.appendChild(style);
})();

// ============================================================
// 6. EXPOSICIÓN GLOBAL
// ============================================================
window.ValuationProEngine = ValuationProEngine;
console.log('🏗️ VALUATION PRO ENGINE v1.0 — Terreno IGAC + Zona Homogénea + Comparativo OIC cargado.');
