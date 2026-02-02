/**
 * CONSTRUMETRIX v2.0 - FUENTES OFICIALES COLOMBIANAS
 * Actualizado: Febrero 2026
 * 
 * Fuentes de datos gubernamentales y sectoriales para avalúos,
 * costos de construcción y análisis del mercado inmobiliario.
 */

window.FUENTES_OFICIALES = {

    // ===== IGAC - INSTITUTO GEOGRÁFICO AGUSTÍN CODAZZI =====
    igac: {
        nombre: "Instituto Geográfico Agustín Codazzi (IGAC)",
        descripcion: "Entidad oficial encargada del catastro nacional y avalúos",

        recursos: {
            principal: {
                titulo: "IGAC - Catastro & Avalúos",
                url: "https://www.igac.gov.co/",
                descripcion: "Portal principal con información catastral y avalúos de predios",
                uso: "Consulta de valores catastrales y estimaciones comerciales oficiales"
            },

            avaluos: {
                titulo: "Subdirección de Avalúos",
                url: "https://www.igac.gov.co/el-igac/areas-estrategicas/direccion-de-gestion-catastral/subdireccion-de-avaluos",
                descripcion: "Métodos técnicos oficiales para avalúos comerciales",
                uso: "Entender cómo se calculan los valores de inmuebles"
            },

            observatorio: {
                titulo: "Observatorio Inmobiliario Catastral (OIC)",
                url: "https://www.igac.gov.co/el-igac/areas-estrategicas/direccion-de-investigacion-prospectiva/observatorio-inmobiliario-catastral",
                descripcion: "Estadísticas de transacciones y dinámicas del mercado",
                uso: "Análisis de tendencias, comparar transacciones y precios reales"
            },

            transacciones: {
                titulo: "Registro de Transacciones Inmobiliarias",
                url: "https://www.datos.gov.co/Vivienda-Ciudad-y-Territorio/Registro-de-transacciones-inmobiliarias-en-Colombi/7y2j-43cv",
                descripcion: "Dataset con millones de transacciones registradas",
                uso: "Análisis estadístico y comparativo de precios históricos",
                formato: "CSV / JSON / API REST"
            }
        },

        actualizacion: "Mensual",
        confiabilidad: "Oficial - 100%"
    },

    // ===== DANE - DEPARTAMENTO ADMINISTRATIVO NACIONAL DE ESTADÍSTICA =====
    dane: {
        nombre: "Departamento Administrativo Nacional de Estadística (DANE)",
        descripcion: "Entidad oficial de estadísticas nacionales",

        recursos: {
            icoced: {
                titulo: "Índice de Costos de la Construcción de Edificaciones (ICOCED)",
                url: "https://www.dane.gov.co/index.php/estadisticas-por-tema/precios-y-costos/indice-de-costos-de-la-construccion-de-edificaciones-icoced",
                descripcion: "Estadísticas de costos de construcción actualizadas",
                uso: "Estimaciones confiables de costo por m² de construcción",
                periodicidad: "Mensual",
                ciudades: "Principales ciudades de Colombia"
            },

            ivp: {
                titulo: "Índice de Valoración Predial (IVP)",
                url: "https://www.dane.gov.co/index.php/en/estadisticas-por-tema-2/construccion/indice-de-valoracioon-predial",
                descripcion: "Variación del valor predial en 22 ciudades",
                uso: "Medir cómo cambia el valor de mercado con el tiempo",
                periodicidad: "Trimestral",
                cobertura: "22 ciudades principales"
            },

            normativa1170: {
                titulo: "Decreto 1170 de 2015",
                url: "https://www.dane.gov.co/index.php/acerca-del-dane/informacion-institucional/normatividad/decreto-1170-del-2015",
                descripcion: "Definiciones legales de avalúos y valor comercial",
                uso: "Marco legal para valoraciones inmobiliarias"
            }
        },

        actualizacion: "Mensual (ICOCED) / Trimestral (IVP)",
        confiabilidad: "Oficial - 100%"
    },

    // ===== NORMATIVA Y DECRETOS =====
    normativa: {
        nombre: "Marco Legal Colombiano - Avalúos y Construcción",
        descripcion: "Decretos y normativas oficiales",

        recursos: {
            decreto148: {
                titulo: "Decreto 148 de 2020",
                url: "https://actualicese.com/archivo/decreto-148-de-04-02-2020/",
                descripcion: "Métodos de valoración oficial para avalúos",
                uso: "Criterios técnicos y métodos legales de valoración",
                vigencia: "Actual"
            },

            decreto1170: {
                titulo: "Decreto 1170 de 2015",
                url: "https://www.dane.gov.co/index.php/acerca-del-dane/informacion-institucional/normatividad/decreto-1170-del-2015",
                descripcion: "Definiciones de valor comercial y catastral",
                uso: "Conceptos legales fundamentales"
            }
        },

        confiabilidad: "Legal - Oficial"
    },

    // ===== CAMACOL - SECTOR PRIVADO =====
    camacol: {
        nombre: "Cámara Colombiana de la Construcción (CAMACOL)",
        descripcion: "Gremio del sector constructor",

        recursos: {
            principal: {
                titulo: "Información Económica CAMACOL",
                url: "https://camacol.co/informacion-economica",
                descripcion: "Informes, análisis y tendencias del mercado constructor",
                uso: "Estimaciones sectoriales, costos y tendencias de mercado",
                acceso: "Público (reportes) / Asociados (datos detallados)"
            }
        },

        actualizacion: "Mensual / Trimestral",
        confiabilidad: "Sectorial - Alta (no oficial)"
    },

    // ===== METADATA =====
    metadata: {
        version: "2.0",
        ultimaActualizacion: "2026-02-01",
        responsable: "CONSTRUMETRIX Team",
        fuentes: 4,
        recursos: 11,
        notas: [
            "Todas las fuentes son de acceso público",
            "IGAC y DANE son las fuentes oficiales del gobierno",
            "CAMACOL complementa con análisis sectorial privado",
            "Se recomienda contrastar múltiples fuentes para mayor precisión"
        ]
    }
};

/**
 * URLs DE APIS Y DATOS ABIERTOS
 */
window.API_ENDPOINTS = {
    igac_transacciones: "https://www.datos.gov.co/resource/7y2j-43cv.json",
    igac_catastro: "https://www.igac.gov.co/api/v1/",  // Ejemplo - verificar documentación real
    dane_estadisticas: "https://www.dane.gov.co/api/",  // Ejemplo - verificar documentación real
};

/**
 * CONSTANTES DE CÁLCULO SEGÚN ESTÁNDARES IGAC/DANE
 */
window.ESTANDARES_OFICIALES = {
    // AIU según decreto 1082 de 2015 y práctica IGAC
    aiu: {
        administracion: 0.15,    // 15%
        imprevistos: 0.05,       // 5%
        utilidad: 0.10,          // 10%
        total: 0.30              // 30% (suma de los anteriores)
    },

    // Depreciación según método IGAC (Ross-Heidecke modificado)
    depreciacion: {
        metodo: "Ross-Heidecke",
        factorVidaUtil: {
            excelente: 1.00,
            bueno: 0.95,
            regular: 0.80,
            malo: 0.60,
            muymalo: 0.40
        }
    },

    // Valores de terreno según zona (ejemplo - actualizar con datos locales)
    valorTerreno: {
        estrato1: 150000,   // COP por m²
        estrato2: 250000,
        estrato3: 400000,
        estrato4: 650000,
        estrato5: 950000,
        estrato6: 1500000
    }
};

/**
 * HELPER PARA LOGGING Y TRAZABILIDAD
 */
function logFuenteOficial(fuente, recurso) {
    console.log(`📊 Fuente oficial: ${fuente} - ${recurso} %cCONSULTADO`,
        'color: #f7fc00; font-weight: bold;');
}

// Exportar para uso global
if (window) {
    window.logFuenteOficial = logFuenteOficial;
}

console.log('%c📚 FUENTES OFICIALES CARGADAS', 'color: #f7fc00; font-size: 14px; font-weight: bold;');
console.log('IGAC, DANE, Normativa Legal, CAMACOL');
console.log('Total de recursos: ' + window.FUENTES_OFICIALES.metadata.recursos);
