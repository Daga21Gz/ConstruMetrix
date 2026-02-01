/**
 * PRO-BLUEPRINT ENGINE - v3.0 (Volume-Aware)
 * Cada blueprint define factores por m2 o por m3 (volumen)
 */
const ConstructionBlueprints = {
    // 01 - Viviendas hasta 3 pisos
    "01": {
        name: "Viviendas hasta 3 pisos",
        chapters: {
            "Preliminares": [
                { codigo: "1.01.0361", factor: 1.0, calcMode: "area" }, // Localización m2 (solo área)
                { codigo: "1.01.0364", factor: 0.15, calcMode: "volume" }  // Excavación m3
            ],
            "Estructura": [
                { codigo: "1.02.0375", factor: 0.05, calcMode: "volume" }, // Ciclópeo m3
                { codigo: "1.03.0376", factor: 0.35, calcMode: "volume" },  // Placa flotante m2
                { codigo: "1.04.0382", factor: 5.0, calcMode: "volume" }, // Acero refuerzo kg
                { codigo: "1.04.0384", factor: 0.03, calcMode: "volume" }  // Columnas m3
            ],
            "Mampostería": [
                { codigo: "1.05.0354", factor: 0.8, calcMode: "volume" }   // Muro ladrillo m2
            ],
            "Acabados": [
                { codigo: "1.08.0281", factor: 2.0, calcMode: "volume" }   // Repello muros m2
            ],
            "Hidrosanitarios": [
                { codigo: "1.15.0494", factor: 0.02, calcMode: "area" }  // Sanitario
            ]
        }
    },
    // 05 - Cocheras – Marraneras – Porquerizas
    "05": {
        name: "Marraneras / Cocheras",
        chapters: {
            "Preliminares": [
                { codigo: "1.01.0364", factor: 0.15, calcMode: "volume" }
            ],
            "Bases y Concretos": [
                { codigo: "1.02.0375", factor: 0.08, calcMode: "volume" }
            ],
            "Muros Divisorios": [
                { codigo: "1.05.0356", factor: 0.6, calcMode: "volume" }
            ],
            "Pisos Técnicos": [
                { codigo: "1.06.0575", factor: 1.0, calcMode: "area" }
            ],
            "Cubierta": [
                { codigo: "1.13.0133", factor: 0.12, calcMode: "area" }
            ]
        }
    },
    // 06 - Bodegas
    "06": {
        name: "Bodegas / Industrias",
        chapters: {
            "Excavaciones": [
                { codigo: "1.01.0363", factor: 0.5, calcMode: "volume" }
            ],
            "Pisos Industriales": [
                { codigo: "1.03.0376", factor: 1.0, calcMode: "area" }
            ],
            "Muros": [
                { codigo: "1.05.0356", factor: 0.5, calcMode: "volume" }
            ],
            "Refuerzos": [
                { codigo: "1.04.0383", factor: 4.0, calcMode: "volume" }
            ]
        }
    },
    // 03 - Galpones – Gallineros
    "03": {
        name: "Galpones / Gallineros",
        chapters: {
            "Preliminares": [
                { codigo: "1.01.0364", factor: 0.1, calcMode: "volume" }
            ],
            "Pisos": [
                { codigo: "1.06.0575", factor: 1.0, calcMode: "area" }
            ],
            "Estructura": [
                { codigo: "1.05.0356", factor: 0.3, calcMode: "volume" }
            ]
        }
    },
    // 10 - Tanques
    "10": {
        name: "Tanques de Almacenamiento",
        chapters: {
            "Excavación": [
                { codigo: "1.01.0363", factor: 1.2, calcMode: "area" }
            ],
            "Concretos": [
                { codigo: "1.04.0044", factor: 1.0, calcMode: "area" }
            ],
            "Refuerzo": [
                { codigo: "1.04.0382", factor: 25.0, calcMode: "area" }
            ]
        }
    }
};

window.ConstructionBlueprints = ConstructionBlueprints;
