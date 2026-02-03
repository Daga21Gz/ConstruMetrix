/**
 * CONSTRUMETRIX - MASTER DATA GOVERNANCE
 * v4.0 - Repositorio de Fuentes Oficiales (Auditado 2026)
 */

const FUENTES_OFICIALES = {
    // ===== IGAC - INSTITUTO GEOGRÁFICO AGUSTÍN CODAZZI =====
    igac: {
        nombre: "Instituto Geográfico Agustín Codazzi (IGAC)",
        sigla: "IGAC",
        descripcion: "Autoridad máxima en catastro, cartografía y avalúos comerciales e institucionales en Colombia.",
        institucion_url: "https://www.igac.gov.co/",
        logo_icon: "map",
        color: "brand",

        recursos: {
            principal: {
                titulo: "Portal Principal IGAC",
                url: "https://www.igac.gov.co/",
                descripcion: "Sede electrónica para trámites catastrales y consulta de normativa nacional.",
                uso: "Consulta de base normativa y gestión predial",
                estado: "Operativo"
            },

            metodologias: {
                titulo: "Normativa de Avalúos (Resolución 1137 de 2024)",
                url: "https://igac.gov.co/normatividad/resolucion-1137-de-2024",
                descripcion: "Criterios técnicos para la determinación de valores comerciales en el territorio nacional.",
                uso: "Marco técnico para cálculos de reposición y mercado",
                estado: "Actualizado 2024"
            },

            avaluos_masivos: {
                titulo: "Metodología de Actualización Masiva (Res. 1912)",
                url: "https://igac.gov.co/normatividad/resolucion-1912-de-2024",
                descripcion: "Metodología para la actualización de valores catastrales rezagados en zonas rurales y urbanas.",
                uso: "Ajuste de índices de valoración local",
                estado: "Vigente"
            },

            observatorio: {
                titulo: "Observatorio Inmobiliario Catastral (OIC)",
                url: "https://oic.igac.gov.co/",
                descripcion: "Herramienta de monitoreo de la dinámica del mercado inmobiliario y transacciones reales.",
                uso: "Referencia de precios de cierre y ofertas",
                estado: "En Vivo"
            },

            visor_catastral: {
                titulo: "Visor Geográfico de Predios (Dicat)",
                url: "https://dicat.igac.gov.co/visor_p",
                descripcion: "Plataforma para la identificación espacial de linderos, áreas y números prediales.",
                uso: "Verificación de áreas y colindancias en campo",
                estado: "Operativo"
            }
        },
        actualizacion: "Mensual",
        confiabilidad: "100% Oficial"
    },

    // ===== DANE - DEPARTAMENTO ADMINISTRATIVO NACIONAL DE ESTADÍSTICA =====
    dane: {
        nombre: "Departamento Administrativo Nacional de Estadística (DANE)",
        sigla: "DANE",
        descripcion: "Entidad responsable de la planeación, recolección y análisis de la estadística nacional.",
        institucion_url: "https://www.dane.gov.co/",
        logo_icon: "bar-chart-3",
        color: "emerald",

        recursos: {
            icoced: {
                titulo: "ICOCED - Índice de Costos de Construcción",
                url: "https://www.dane.gov.co/index.php/estadisticas-por-tema/precios-y-costos/indice-de-costos-de-la-construccion-de-edificaciones-icoced",
                descripcion: "Seguimiento a la variación de precios de materiales, mano de obra y maquinaria.",
                uso: "Factor fundamental para cálculo de CRN (Reposición)",
                estado: "Mensual"
            },

            ivp: {
                titulo: "IVP - Índice de Valoración Predial",
                url: "https://www.dane.gov.co/index.php/estadisticas-por-tema/construccion/indice-de-valoracioon-predial",
                descripcion: "Estudio sobre la evolución del valor de los predios en las ciudades principales.",
                uso: "Análisis histórico de valorización territorial",
                estado: "Trimestral"
            },

            ipvn: {
                titulo: "IPVN - Índice de Precios de Vivienda Nueva",
                url: "https://www.dane.gov.co/index.php/estadisticas-por-tema/construccion/indice-de-precios-de-vivienda-nueva-ipvn",
                descripcion: "Medición de los precios de venta de bienes inmuebles residenciales recién construidos.",
                uso: "Referencia para el mercado de vivienda 2026",
                estado: "Actualizado"
            }
        },
        actualizacion: "Mensual",
        confiabilidad: "100% Oficial"
    },

    // ===== CAMACOL - SECTOR PRIVADO / GREMIAL =====
    camacol: {
        nombre: "Cámara Colombiana de la Construcción",
        sigla: "CAMACOL",
        descripcion: "Gremio que representa la cadena de valor de la edificación y el desarrollo urbano.",
        institucion_url: "https://camacol.co/",
        logo_icon: "building-2",
        color: "amber",

        recursos: {
            coordenada_urbana: {
                titulo: "Coordenada Urbana",
                url: "https://camacol.co/coordenada-urbana",
                descripcion: "Sistema georreferenciado de oferta privada de vivienda y proyectos en preventa.",
                uso: "Referencia de precios de mercado masivo",
                estado: "Premium"
            },
            macro_tendencias: {
                titulo: "Informes de Economía y Construcción",
                url: "https://camacol.co/informacion-economica",
                descripcion: "Análisis macroeconómico del sector constructor y proyecciones de inversión.",
                uso: "Contextualización del riesgo de mercado",
                estado: "Público"
            }
        },
        actualizacion: "Trimestral",
        confiabilidad: "Sectorial / Gremial"
    },

    // ===== MARCO LEGAL COMPLEMENTARIO =====
    legal: {
        nombre: "Marco Legal y Normativo",
        sigla: "LEGAL",
        descripcion: "Leyes y decretos que rigen la actividad valuatoria y catastral en la República de Colombia.",
        logo_icon: "gavel",
        color: "purple",

        recursos: {
            ley1673: {
                titulo: "Ley 1673 de 2013 (Avaluadores)",
                url: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53874",
                descripcion: "Ley que reglamenta la actividad del avaluador y crea el Registro Abierto de Avaluadores.",
                uso: "Cumplimiento de requisitos de idoneidad técnica",
                estado: "Vigente"
            },
            decreto148: {
                titulo: "Decreto 148 de 2020 (Catastro)",
                url: "https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos/30038827",
                descripcion: "Modernización del catastro hacia el enfoque multipropósito y valoración.",
                uso: "Integración de datos SIG y valor comercial",
                estado: "Ley de la República"
            },
            res620: {
                titulo: "Resolución 620 de 2008 (Técnica)",
                url: "https://www.igac.gov.co/sites/igac.gov.co/files/resolucion_620_de_2008.pdf",
                descripcion: "Manual de procedimientos técnicos para la ejecución de avalúos comerciales urbanos.",
                uso: "Base procedimental de esta plataforma",
                estado: "Histórico Vigente"
            }
        },
        confiabilidad: "Oficial / Jurídica"
    },

    metadata: {
        ultimo_audit: "2026-02-03",
        auditor: "Albert Daniel G. (ConstruMetrix AI)",
        version: "4.0.1"
    }
};

window.FUENTES_OFICIALES = FUENTES_OFICIALES;
