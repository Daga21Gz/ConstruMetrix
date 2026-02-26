/**
 * PRO-BLUEPRINT ENGINE - v4.0 (Aesthetics 2026 Edition)
 * Modelos de construcción optimizados para valores de mercado 2026.
 */
const ConstructionBlueprints = {
    // VIS - Casa Interés Social
    "01S": {
        name: "Casa Interés Social",
        description: "Vivienda de interés social diseñada con optimización de costos y materiales certificados de alta durabilidad.",
        specs: "Estructura en muros de carga, acabados básicos funcionales, ventanería económica.",
        image: "asset/vivienda_social_3d.png",
        chapters: {
            "Preliminares": [
                { codigo: "1.01.0361", factor: 1.0, calcMode: "area" }, // Localización
                { codigo: "1.01.0364", factor: 0.12, calcMode: "volume" } // Excavación
            ],
            "Estructura Básica": [
                { codigo: "1.02.0375", factor: 0.04, calcMode: "volume" }, // Ciclópeo
                { codigo: "1.03.0376", factor: 1.0, calcMode: "area" },   // Placa Base
                { codigo: "1.04.0382", factor: 6.0, calcMode: "volume" }  // Acero 37k
            ],
            "Envolventes & Cubierta": [
                { codigo: "1.05.0356", factor: 1.0, calcMode: "volume" }, // Muro Ladrillo
                { codigo: "1.13.0434", factor: 1.1, calcMode: "area" }   // Teja Ondulada (Económica)
            ],
            "Acabados Económicos": [
                { codigo: "1.08.0404", factor: 2.0, calcMode: "volume" }, // Pañete 1:4
                { codigo: "1.09.0418", factor: 2.0, calcMode: "volume" }, // Pintura Vinilo
                { codigo: "1.07.0397", factor: 1.0, calcMode: "area" }   // Tableta Gres
            ],
            "Instalaciones": [
                { codigo: "1.15.0494", factor: 0.012, calcMode: "area" }, // Sanitarios Eco
                { codigo: "1.18.0555", factor: 0.06, calcMode: "area" }   // Puntos Eléctricos
            ]
        }
    },
    // MEDIA - Casa Media
    "01": {
        name: "Casa Media",
        description: "Vivienda urbana estándar con diseño arquitectónico equilibrado y acabados de calidad comercial.",
        specs: "Estructura porticada, muros en ladrillo limpio, acabados estándar, pisos cerámicos.",
        image: "asset/vivienda_urbana_3d.png",
        chapters: {
            "Preliminares": [
                { codigo: "1.01.0361", factor: 1.0, calcMode: "area" },
                { codigo: "1.01.0364", factor: 0.15, calcMode: "volume" }
            ],
            "Estructura Estándar": [
                { codigo: "1.02.0375", factor: 0.05, calcMode: "volume" },
                { codigo: "1.03.0376", factor: 1.0, calcMode: "area" },
                { codigo: "1.04.0384", factor: 0.04, calcMode: "volume" }, // Columnas
                { codigo: "1.04.0382", factor: 7.5, calcMode: "volume" }  // Acero
            ],
            "Mampostería & Techo": [
                { codigo: "1.05.0355", factor: 1.2, calcMode: "volume" }, // Ladrillo Limpio 2 caras
                { codigo: "1.13.0130", factor: 1.15, calcMode: "area" }  // Teja Colonial
            ],
            "Acabados Calidad Media": [
                { codigo: "1.08.0403", factor: 2.2, calcMode: "volume" }, // Pañete 1:3
                { codigo: "1.07.0393", factor: 1.0, calcMode: "area" },   // Cerámica 45x45
                { codigo: "1.09.0418", factor: 2.2, calcMode: "volume" }, // Pintura
                { codigo: "1.14.0139", factor: 0.8, calcMode: "area" }   // Cielo Raso Panel Yeso
            ],
            "Instalaciones": [
                { codigo: "1.15.0491", factor: 0.015, calcMode: "area" }, // Lavamanos + Grifería
                { codigo: "1.18.0555", factor: 0.08, calcMode: "area" }   // Tomas Dobles
            ]
        }
    },
    // ALTA - Casa Alta Gama
    "01A": {
        name: "Casa Alta Gama",
        description: "Residencial de lujo con especificaciones técnicas superiores y acabados arquitectónicos de alta gama.",
        specs: "Estructura reforzada, materiales importados, sistemas de iluminación avanzada, carpintería maciza.",
        image: "asset/vivienda_premium_3d.png",
        chapters: {
            "Preliminares Pro": [
                { codigo: "1.01.0361", factor: 1.0, calcMode: "area" },
                { codigo: "1.01.0362", factor: 1.0, calcMode: "area" } // Descapote Máquina
            ],
            "Estructura Reforzada": [
                { codigo: "1.04.0384", factor: 0.12, calcMode: "volume" }, // Columnas robustas
                { codigo: "1.04.0386", factor: 0.08, calcMode: "volume" }, // Vigas Aéreas
                { codigo: "1.04.0383", factor: 18.0, calcMode: "volume" } // Acero 60k (Alta densidad)
            ],
            "Envolventes Premium": [
                { codigo: "1.05.0355", factor: 1.4, calcMode: "volume" },
                { codigo: "1.13.0432", factor: 1.2, calcMode: "area" }   // Teja de Barro Natural
            ],
            "Acabados de Lujo": [
                { codigo: "1.07.0054", factor: 1.0, calcMode: "area" },   // Piso Granito Pulido
                { codigo: "1.09.0419", factor: 1.2, calcMode: "volume" }, // Graniplast Fachada
                { codigo: "1.11.0111", factor: 0.04, calcMode: "area" }  // Puertas Madera Maciza
            ],
            "Sistemas Especiales": [
                { codigo: "1.15.0495", factor: 0.02, calcMode: "area" },  // Sanitario Institucional/Lujo
                { codigo: "1.18.0559", factor: 0.1, calcMode: "area" }    // Voz y Datos Certificado
            ]
        }
    },
    // APT - Apartamento Estándar
    "35": {
        name: "Apartamento Estándar",
        description: "Unidad residencial en propiedad horizontal con optimización de áreas y servicios compartidos.",
        specs: "Losa maciza, divisiones en drywall/panel yeso, ventanería institucional, áreas comunes básicas.",
        image: "asset/edificio_residencial_3d.png", // Mantengo imagen de edificio
        chapters: {
            "Cimentación & Estructura": [
                { codigo: "1.03.0381", factor: 0.15, calcMode: "volume" }, // Zapatas
                { codigo: "1.04.0387", factor: 1.0, calcMode: "area" },   // Losa Maciza (Entrepiso)
                { codigo: "1.04.0383", factor: 14.0, calcMode: "volume" } // Acero 60k
            ],
            "Divisiones & Fachada": [
                { codigo: "1.05.0271", factor: 1.5, calcMode: "area" },   // Muro Panel Yeso (Drywall)
                { codigo: "1.10.0103", factor: 0.2, calcMode: "area" }    // Ventanería Aluminio
            ],
            "Acabados Torres": [
                { codigo: "1.07.0393", factor: 1.0, calcMode: "area" },   // Cerámica
                { codigo: "1.14.0139", factor: 0.9, calcMode: "area" },   // Cielo Raso
                { codigo: "1.09.0418", factor: 3.0, calcMode: "volume" }  // Pintura (Más m2 por m2 de planta)
            ],
            "Instalaciones": [
                { codigo: "1.15.0477", factor: 0.12, calcMode: "area" },  // Puntos Hidráulicos
                { codigo: "1.18.0555", factor: 0.1, calcMode: "area" }    // Puntos Eléctricos
            ]
        }
    },
    // COM - Edificio Comercial
    "34": {
        name: "Edificio Comercial",
        description: "Infraestructura corporativa diseñada para alta rotación, áreas abiertas y flexibilidad espacial.",
        specs: "Losa aligerada, sistemas técnicos industriales, fachadas flotantes, acabados de alto tráfico.",
        image: "asset/bodega_industrial_3d.png", // Placeholder comercial
        chapters: {
            "Estructura Grandes Luces": [
                { codigo: "1.04.0384", factor: 0.2, calcMode: "volume" },
                { codigo: "1.04.0388", factor: 1.0, calcMode: "area" },   // Losa Aligerada (Casetón)
                { codigo: "1.04.0383", factor: 16.0, calcMode: "volume" }
            ],
            "Sistemas Técnicos": [
                { codigo: "1.18.0559", factor: 0.15, calcMode: "area" },  // Voz y Datos (Alta densidad)
                { codigo: "1.15.0495", factor: 0.02, calcMode: "area" },  // Sanitarios Fluxómetro
                { codigo: "1.18.0552", factor: 0.02, calcMode: "area" }   // Salidas Bifásicas
            ],
            "Envolventes Comerciales": [
                { codigo: "1.10.0616", factor: 0.05, calcMode: "area" },  // Puertas Metálicas
                { codigo: "1.10.0620", factor: 0.5, calcMode: "area" }    // Película Seguridad Vidrios
            ],
            "Acabados Alto Tráfico": [
                { codigo: "1.17.0564", factor: 1.0, calcMode: "area" },   // Cerámica Alto Tráfico
                { codigo: "1.09.0417", factor: 2.0, calcMode: "volume" }  // Estuco Plástico
            ]
        }
    }
};

window.ConstructionBlueprints = ConstructionBlueprints;
