/**
 * PRO-BLUEPRINT ENGINE - v3.0 (Volume-Aware)
 * Cada blueprint define factores por m2 o por m3 (volumen)
 */
const ConstructionBlueprints = {
    // 01 - Viviendas hasta 3 pisos (PRO Version)
    "01": {
        name: "Vivienda Urbana (1-3 Pisos)",
        image: "asset/vivienda_urbana_3d.png",
        chapters: {
            "Preliminares": [
                { codigo: "1.01.0361", factor: 1.0, calcMode: "area" }, // Localización
                { codigo: "1.01.0364", factor: 0.15, calcMode: "volume" }  // Excavación
            ],
            "Estructura": [
                { codigo: "1.02.0375", factor: 0.05, calcMode: "volume" }, // Ciclópeo
                { codigo: "1.03.0376", factor: 1.0, calcMode: "area" },   // Placa Base
                { codigo: "1.04.0382", factor: 6.5, calcMode: "volume" },  // Acero 37k
                { codigo: "1.04.0384", factor: 0.04, calcMode: "volume" }  // Columnas
            ],
            "Envolventes": [
                { codigo: "1.05.0356", factor: 1.2, calcMode: "volume" },  // Muro Ladrillo
                { codigo: "1.13.0130", factor: 1.1, calcMode: "area" }    // Cubierta (+10% traslapo)
            ],
            "Acabados": [
                { codigo: "1.08.0403", factor: 2.2, calcMode: "volume" },  // Revoque
                { codigo: "1.09.0418", factor: 2.2, calcMode: "volume" },  // Pintura Vinilo
                { codigo: "1.07.0393", factor: 1.0, calcMode: "area" }    // Cerámica
            ],
            "Instalaciones": [
                { codigo: "1.15.0494", factor: 0.015, calcMode: "area" }, // Sanitarios
                { codigo: "1.18.0555", factor: 0.08, calcMode: "area" }   // Puntos Eléctricos
            ]
        }
    },
    // 35 - Apartamentos más de 4 Pisos (Master Version)
    "35": {
        name: "Edificio Residencial (4+ Pisos)",
        image: "asset/edificio_residencial_3d.png",
        chapters: {
            "Cimentación Pesada": [
                { codigo: "1.03.0381", factor: 0.12, calcMode: "volume" }, // Zapatas
                { codigo: "1.04.0382", factor: 12.0, calcMode: "volume" }  // Acero Refuerzo
            ],
            "Estructura Elevada": [
                { codigo: "1.04.0384", factor: 0.15, calcMode: "volume" }, // Columnas
                { codigo: "1.04.0387", factor: 1.0, calcMode: "area" }     // Losa Maciza
            ],
            "Sistemas Técnicos": [
                { codigo: "1.15.0477", factor: 0.12, calcMode: "area" },   // Puntos Hidráulicos
                { codigo: "1.18.0559", factor: 0.05, calcMode: "area" }    // Voz y Datos
            ],
            "Acabados Plus": [
                { codigo: "1.14.0139", factor: 0.9, calcMode: "area" },    // Cielo Raso Drywall
                { codigo: "1.07.0393", factor: 1.0, calcMode: "area" },    // Piso Cerámica
                { codigo: "1.10.0103", factor: 0.15, calcMode: "area" }    // Ventanería Aluminio
            ]
        }
    },
    // 02 - Territorial Infrastructure (Master Engineering)
    "02": {
        name: "Infraestructura Vial y Territorial",
        image: "asset/infraestructura_vial_3d.png",
        chapters: {
            "Movimiento Tierras": [
                { codigo: "2.210.0345", factor: 0.6, calcMode: "area" },   // Excavación Explanación
                { codigo: "2.220.0348", factor: 0.4, calcMode: "area" }    // Terraplén
            ],
            "Pavimentos": [
                { codigo: "2.320.0357", factor: 0.2, calcMode: "area" },   // Sub-base C (e=0.20)
                { codigo: "2.330.0054", factor: 0.15, calcMode: "area" },  // Base A (e=0.15)
                { codigo: "2.450.0107", factor: 0.08, calcMode: "area" }   // Asfalto MDC-19 (e=0.08)
            ],
            "Urbanismo": [
                { codigo: "1.06.0581", factor: 0.2, calcMode: "area" },    // Andenes
                { codigo: "1.06.0582", factor: 0.4, calcMode: "area" }     // Sardineles
            ]
        }
    },
    // 06 - Bodegas Industriales
    "06": {
        name: "Bodega / Planta Industrial",
        image: "asset/bodega_industrial_3d.png",
        chapters: {
            "Grandes Luces": [
                { codigo: "1.03.0381", factor: 0.08, calcMode: "volume" }, // Zapatas
                { codigo: "1.04.0384", factor: 0.1, calcMode: "volume" }   // Columnas
            ],
            "Pisos Industriales": [
                { codigo: "1.06.0580", factor: 1.0, calcMode: "area" }     // Placa Base Reforzada
            ],
            "Cerramientos": [
                { codigo: "1.05.0356", factor: 0.8, calcMode: "volume" },  // Muros Ladrillo
                { codigo: "1.13.0133", factor: 1.1, calcMode: "area" }     // Teja Termoacústica
            ]
        }
    },
    // 10 - Tanques
    "10": {
        name: "Sistema de Almacenamiento (Agua)",
        image: "asset/tanque_agua_3d.png",
        chapters: {
            "Foso": [{ codigo: "1.01.0363", factor: 1.5, calcMode: "area" }],
            "Concreto Imper": [{ codigo: "1.04.0044", factor: 1.0, calcMode: "area" }],
            "Refuerzo": [{ codigo: "1.04.0382", factor: 35.0, calcMode: "area" }]
        }
    }
};

window.ConstructionBlueprints = ConstructionBlueprints;
