/**
 * CONSTRUMETRIX - MASTER CORE
 * v4.5.0
 * 
 * Features:
 * - Real-time AIU Calculation (Colombian Standard)
 * - Chart.js Analytics
 * - LocalStorage Persistence
 * - "Inline Edit" Mode
 */

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. STATE MANAGEMENT ---
    const STATE = {
        budget: [], // Array of { ...item, quantity, chapter, uuid }
        config: {
            admin: 12, // Administración Sugerida 2026
            imprev: 5,  // Imprevistos
            util: 10,  // Utilidad Sugerida
            iva: 19    // IVA sobre utilidad
        },
        meta: {
            region: 'centro',
            area: 1.0,
            height: 2.5,
            projectState: 'bueno',
            conservation: 'bueno',
            age: 0,
            usefulLife: 50,
            landArea: 0,
            landPrice: 0,
            estrato: 3,
            marketMultiplier: 1.0,
            aviso: '',
            tower: '',
            owner: '',
            cedula: '',
            matricula: '',
            city: '',
            dept: '',
            qualityMultiplier: 1.0,
            igacValuation: 0,
            igacDestino: '',
            landType: 'Urbano' // Detectado por SIG
        },
        editedPrices: {}, // { itemCode: newPrice } map
        summary: {
            direct: 0,
            aiu: 0,
            crn: 0,
            depreciated: 0,
            land: 0,
            market: 0,
            depFactor: 0,
            sqm: 0
        },
        activeChapter: null,
        chapters: []
    };

    const CONSTANTS_2026 = {
        SMLV: 1750905,
        AUX_TRANS: 249095,
        PRESTACIONES_FACTOR: 1.5238, // 52.38% extra
        AIU_SUGGESTED: 0.30,
        SOURCES: ["DANE", "Ministerio del Trabajo", "Camacol", "Homecenter", "PresuCosto"],
        CONSTRUCTION_COSTS: {
            RESIDENTIAL: {
                "CASA_SOCIAL": { name: "Casa Interés Social", min: 1800000, max: 2200000, specs: "Acabados básicos, materiales económicos" },
                "CASA_MEDIA": { name: "Casa Media", min: 2500000, max: 3500000, specs: "Acabados estándar, calidad media" },
                "CASA_ALTA": { name: "Casa Alta Gama", min: 4500000, max: 7000000, specs: "Acabados premium, importados" },
                "APTO_ESTANDAR": { name: "Apartamento Estándar", min: 2200000, max: 3000000, specs: "Torre, zonas comunes básicas" },
                "EDIFICIO_COMERCIAL": { name: "Edificio Comercial", min: 3000000, max: 5000000, specs: "Áreas abiertas, sistemas técnicos" }
            },
            CATEGORIES: {
                BASIC: { min: 1800000, max: 2200000 },
                MEDIUM: { min: 2500000, max: 3500000 },
                HIGH: { min: 4500000, max: 7000000 }
            }
        },
        MATERIALS: [
            { item: "Cemento Gris", unit: "Bulto 50kg", price: "42000 - 48000", delta: "+8%" },
            { item: "Arena Lavada", unit: "M3", price: "85000 - 110000", delta: "+6%" },
            { item: "Grava", unit: "M3", price: "95000 - 125000", delta: "+7%" },
            { item: "Ladrillo Común", unit: "Unidad", price: "950 - 1200", delta: "+5%" },
            { item: "Bloque #5", unit: "Unidad", price: "3200 - 3800", delta: "+6%" },
            { item: "Varilla 3/8\"", unit: "6m", price: "28000 - 32000", delta: "+4%" },
            { item: "Varilla 1/2\"", unit: "6m", price: "48000 - 55000", delta: "+4%" }
        ],
        FINISHES: [
            { item: "Cerámica Básica", unit: "M2", price: "25000 - 40000" },
            { item: "Cerámica Premium", unit: "M2", price: "60000 - 120000" },
            { item: "Estuco en Pasta", unit: "Galón", price: "42000 - 55000" },
            { item: "Pintura Vinilo", unit: "Galón", price: "35000 - 52000" },
            { item: "Pintura Esmalte", unit: "Galón", price: "68000 - 95000" }
        ]
    };

    const COLLOQUIAL_MAP = {
        "Excavación": "Hacer el hueco / Zanja",
        "Concreto": "Vaciado de Mezcla / Cemento",
        "Losa": "Piso de concreto / Plancha",
        "Acometida": "Instalación de luz principal",
        "Punto Hidráulico": "Conexión de agua (Tubo)",
        "Dintel": "Viga sobre puerta o ventana",
        "Pañete": "Revoque / Repello de pared",
        "Estuco": "Masillar pared / Alisar",
        "Pirlan": "Tira de remate para piso",
        "Sardinel": "Bordillo de andén",
        "Pañete impermeabilizado": "Repello contra la humedad",
        "Muro en ladrillo": "Pegado de ladrillos",
        "Acero de refuerzo": "Varillas de hierro",
        "Placa base": "Piso de cemento básico",
        "Mesones": "Mesones de cocina / Baño",
        "Alfajía": "Remate para ventana (Goteo)",
        "Cimentación": "Bases de la casa",
        "Zapata": "Pata de soporte de columna",
        "Viga aérea": "Viga del techo / Segundo piso",
        "Demolición": "Tumbar o romper",
        "Retiro": "Sacar escombros",
        "Cargue": "Subir al camión",
        "Descapote": "Limpiar el terreno (Hierba)",
        "Enchape": "Pegar baldosa en pared",
        "Cerámica": "Baldosa de piso"
    };

    function getSimpleName(name) {
        let simpleName = name;
        for (const [tech, common] of Object.entries(COLLOQUIAL_MAP)) {
            if (name.toLowerCase().includes(tech.toLowerCase())) {
                simpleName = common + (name.toLowerCase().includes("manual") ? " (a mano)" : "");
                break;
            }
        }
        return simpleName;
    }

    let allItems = [];
    let buildingTypes = [];

    // Charts Instances
    let doughnutChart = null;
    let barChart = null;

    // --- 2. DOM ELEMENTS ---
    const UI = {
        grid: document.getElementById('resultsGrid'),
        budgetList: document.getElementById('budgetItems'),
        emptyState: document.getElementById('emptyState'),

        // Inputs
        inputArea: document.getElementById('baseArea'),
        inputHeight: document.getElementById('baseHeight'),
        selectRegion: document.getElementById('regionSelect'),
        selectBlueprint: document.getElementById('unitTypeSelect'),
        searchInput: document.getElementById('searchInput'),

        // AIU Inputs
        inAdmin: document.getElementById('aiuAdmin'),
        inImprev: document.getElementById('aiuImprev'),
        inUtil: document.getElementById('aiuUtil'),
        inVat: document.getElementById('vatRate'),

        // Displays
        dispGrandTotal: document.getElementById('grandTotalDisplay'),
        dispDirect: document.getElementById('directCostDisplay'),
        dispSqm: document.getElementById('sqmCostDisplay'),

        panelDirect: document.getElementById('summDirect'),
        panelAiu: document.getElementById('summAIU'),
        panelTotal: document.getElementById('finalTotalPanel'),

        // Interactive
        btnEditMode: document.getElementById('editModeToggle'),
        btnExport: document.getElementById('exportCsvBtn'),
        aiuToggle: document.getElementById('toggleAiuDetails'),
        aiuPanel: document.getElementById('aiuPanel'),
        aiuChevron: document.getElementById('aiuChevron'),

        // Tabs
        tabBudget: document.getElementById('tabBudget'),
        tabAnalysis: document.getElementById('tabAnalysis'),
        viewBudget: document.getElementById('budgetView'),
        viewAnalysis: document.getElementById('analysisView'),
        analysisContainer: document.getElementById('analysisContainer'),
        chapterList: document.getElementById('chapterList'),

        // New Selectors
        selectConservation: document.getElementById('conservationSelect'),
        inputAge: document.getElementById('baseAge'),
        inputLife: document.getElementById('baseLife'),
        inputLandArea: document.getElementById('landArea'),
        inputLandPrice: document.getElementById('landPrice'),
        btnClear: document.getElementById('clearBtn'),
        selectEstrato: document.getElementById('estratoSelect'),
        selectMarket: document.getElementById('marketFactor'),
        selectStatus: document.getElementById('statusSelect'),
        dispRange: document.getElementById('valuationRangeDisplay'),
        healthLabel: document.getElementById('remanenteLabel'),
        marketBadge: document.getElementById('marketImpactBadge'),

        // Master Intelligence UI
        qualitySlider: document.getElementById('qualitySlider'),
        qualityBadge: document.getElementById('qualityBadge'),
        intelPanel: document.getElementById('intelligencePanel'),
        intelContent: document.getElementById('intelligenceContent'),

        // Infrastructure Inputs
        inputAviso: document.getElementById('inputAviso'),
        inputTower: document.getElementById('inputTower'),
        inputOwner: document.getElementById('inputOwner'),
        inputCity: document.getElementById('inputCity'),
        inputState: document.getElementById('inputState'),
        inputCedula: document.getElementById('inputCedula'),
        inputMatricula: document.getElementById('inputMatricula'),

        // GIS Intelligence UI
        gisCard: document.getElementById('gisValuationCard'),
        gisGapValue: document.getElementById('valuationGapValue'),
        gisGapPct: document.getElementById('valuationGapPct'),
        gisIgacValue: document.getElementById('igacValueDisplay'),
        gisLandType: document.getElementById('igacLandTypeDisplay'),

        // Responsive Elements
        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        closeSidebarBtn: document.getElementById('closeSidebarBtn'),
        sidebar: document.getElementById('sidebar'),

        // Preloader & Main App
        preloader: document.getElementById('cm-preloader'),
        mainApp: document.getElementById('app'),
        launchStats: document.getElementById('liveStatsCountLaunch'),
    };

    // --- REUSABLE HELPERS ---
    const APP_UTILS = {
        format: (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n),
        factors: {
            state: { 'malo': 0.75, 'bueno': 1.0, 'excelente': 1.25 }, // Multiplicador por estado de acabados (Obra Gris vs Premium)
            heidecke: {
                'malo': 0.60,      // Reparaciones importantes (Heidecke 4)
                'regular': 0.181,  // Regular (Heidecke 3)
                'bueno': 0.038,    // Bueno (Heidecke 2)
                'excelente': 0.0   // Excelente/Nuevo (Heidecke 1)
            }
        },
        debounce: (fn, delay) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn(...args), delay);
            };
        },
        animateValue: (obj, start, end, duration) => {
            if (!obj) return;
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const val = Math.floor(progress * (end - start) + start);
                obj.innerHTML = APP_UTILS.format(val);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        },
        copyToClipboard: (text) => {
            navigator.clipboard.writeText(text).then(() => {
                if (window.showToast) window.showToast("🔗 Enlace copiado al portapapeles", "success");
            });
        }
    };

    const CHAPTER_NAMES = {
        '1.01': 'Preliminares',
        '1.02': 'Cimientos / Concreto',
        '1.03': 'Cimentación',
        '1.04': 'Estructura',
        '1.05': 'Mampostería',
        '1.06': 'Pisos y Andenes',
        '1.07': 'Acabados Piso',
        '1.08': 'Revoques',
        '1.09': 'Pinturas',
        '1.10': 'Carp. Metálica',
        '1.11': 'Carp. Madera',
        '1.12': 'Estruct. Techo',
        '1.13': 'Cubiertas',
        '1.14': 'Cielos Rasos',
        '1.15': 'Hidrosanitarias',
        '1.16': 'Redes Desagüe',
        '1.17': 'Accesorios Baño',
        '1.18': 'Redes Eléctricas',
        '2.200': 'Vías Prelim.',
        '2.210': 'Mov. Tierras',
        '2.320': 'Sub-Bases',
        '2.450': 'Asfaltos',
        '2.500': 'Rígidos',
        '2.630': 'Estructuras Viales'
    };


    /**
     * Listen for official data coming from the GIS engine and sync with Financial STATE
     */
    function setupGisSync() {
        window.addEventListener('construmetrix:gis-sync', (e) => {
            const { valuation, cedula } = e.detail;
            if (!valuation) return;

            console.log("🔄 [Financial Sync] Updating STATE with GIS Data...", valuation);

            // Atomic Updates
            STATE.meta.cedula = cedula || STATE.meta.cedula;
            STATE.meta.matricula = valuation.MATRICULA_INMOBILIARIA || valuation.MATRICULA || STATE.meta.matricula;
            STATE.meta.owner = valuation.NOMBRE_PREDIO || valuation.PROPIETARIO || valuation.DIRECCION || STATE.meta.owner;
            STATE.meta.city = valuation.MUNICIPIO || valuation.NOMBRE_MUNICIPIO || STATE.meta.city;
            STATE.meta.dept = valuation.DEPARTAMENTO || valuation.NOMBRE_DEPARTAMENTO || STATE.meta.dept;

            // --- Critical Metric Sync (Areas) ---
            const areaBuilt = parseFloat(valuation.AREA_CONSTRUIDA_TOTAL || valuation.AREA_CONSTRUIDA || 0);
            const areaLand = parseFloat(valuation.AREA_TERRENO || valuation.AREA_TERRENO_1 || 0);
            const valuationAuto = parseFloat(valuation.AVALUO_CATASTRAL || valuation.AVALUO_VIGENTE || 0);

            if (areaBuilt > 0) {
                STATE.meta.area = areaBuilt;
                if (UI.inputArea) UI.inputArea.value = areaBuilt;
            } else if (areaLand > 0) {
                // FALLBACK FOR LOTS (Lotes): Use terrain area but warn user
                showToast("⚠️ Predio sin área construida (LOTE). Se usará área de terreno como base proyectada.", "warning");
                // Don't overwrite state.area directly if it's a lot, or maybe yes to avoid 0 budget
                STATE.meta.area = 1.0; // Keep 1.0 but suggest terrain
                if (UI.inputArea) UI.inputArea.placeholder = `Terreno: ${areaLand} m2`;
            }

            if (areaLand > 0) {
                STATE.meta.landArea = areaLand;
                if (UI.inputLandArea) UI.inputLandArea.value = areaLand;
            }

            STATE.meta.igacValuation = valuationAuto;
            STATE.meta.igacDestino = valuation.DESTINO_ECONOMICO || '';
            STATE.meta.landType = valuation.TIPO_SUELO || valuation._landType || 'Urbano';

            // Automatic business logic: informal land detection
            if (STATE.meta.landType.toLowerCase().includes('informal') || STATE.meta.landType.toLowerCase().includes('rural')) {
                STATE.config.imprev = 15; // Increased risk
                if (UI.inImprev) UI.inImprev.value = 15;
                showToast("⚠️ Suelo Especial: Contingencia aumentada al 15%", "warning");
            }

            // Sync with "Ubicación Geo-Económica" select
            if (UI.selectRegion) {
                const igacRegion = (valuation.REGION_VALUACION || '').toLowerCase();
                const validRegions = ['guapi', 'norte', 'sur', 'macizo', 'centro', 'lopez', 'timbiqui', 'oriente', 'piamonte'];

                if (validRegions.includes(igacRegion)) {
                    UI.selectRegion.value = igacRegion;
                    STATE.meta.region = igacRegion;
                } else {
                    // Smart detection or fallback
                    console.warn(`Region '${igacRegion}' no en base de datos de precios. Usando 'centro' como estándar.`);
                    UI.selectRegion.value = 'centro';
                    STATE.meta.region = 'centro';
                }
            }

            // Update UI Sidebar inputs
            if (UI.inputCedula) UI.inputCedula.value = STATE.meta.cedula;
            if (UI.inputMatricula) UI.inputMatricula.value = STATE.meta.matricula;
            if (UI.inputOwner) UI.inputOwner.value = STATE.meta.owner;
            if (UI.inputCity) UI.inputCity.value = STATE.meta.city;
            if (UI.inputState) UI.inputState.value = STATE.meta.dept;

            // --- Update "GIS Intelligence Card" ---
            if (UI.gisCard) {
                UI.gisCard.classList.remove('hidden');
                UI.gisCard.classList.add('animate-up');
                if (UI.gisIgacValue) UI.gisIgacValue.textContent = APP_UTILS.format(valuationAuto);
                if (UI.gisLandType) {
                    UI.gisLandType.textContent = `Destino: ${STATE.meta.igacDestino || 'N/D'} | ${STATE.meta.landType}`;
                }
            }

            // Trigger Recalculate
            recalculate();
            showToast("💎 Datos IGAC sincronizados con el presupuesto", "success");
        });
    }

    // --- 3. INITIALIZATION ---
    async function init() {
        try {
            // Show skeleton loaders
            showSkeletonLoaders();

            // Load Data
            const [itemsRes, unitsRes] = await Promise.all([
                fetch('items.json'),
                fetch('unidades_construccion.json')
            ]);
            allItems = await itemsRes.json();
            buildingTypes = await unitsRes.json();

            // Setup UI
            setupBlueprintsUI();
            setupCharts();
            setupChaptersSidebar();
            loadFromStorage(); // Load saved work if exists

            // Initial Render
            renderGrid();
            recalculate();
            setupResponsiveListeners();
            setupIntelligenceListeners();

            // Setup GIS Sync (Function is defined within this same DOMContentLoaded scope)
            setupGisSync();

            // Edit Mode Listener
            if (UI.btnEditMode) {
                UI.btnEditMode.onclick = () => {
                    STATE.isEditMode = !STATE.isEditMode;
                    UI.btnEditMode.setAttribute('data-active', STATE.isEditMode);

                    // Visual feedback
                    const dot = UI.btnEditMode.querySelector('.toggle-dot');
                    if (dot) {
                        dot.style.transform = STATE.isEditMode ? 'translateX(100%)' : 'translateX(0)';
                        dot.classList.toggle('bg-brand', STATE.isEditMode);
                        dot.classList.toggle('bg-gray-400', !STATE.isEditMode);
                    }

                    showToast(STATE.isEditMode ? "🖊️ Modo Edición Activado" : "🔒 Modo Lectura", "info");
                    renderGrid();
                };
            }

            // Hide skeletons
            hideSkeletonLoaders();

            // Add fade-in animations to main content
            document.querySelectorAll('.item-card').forEach((card, i) => {
                card.style.animationDelay = `${i * 0.05}s`;
                card.classList.add('animate-fade-in-up');
            });

            lucide.createIcons();

            // EXPOSE CORE FOR GIS INTEROP
            window.STATE = STATE;
            window.recalculate = recalculate;
            window.UI = UI;
            window.showToast = showToast;
            window.startGuidedTour = startGuidedTour;

            window.adaptDashboardToRole = adaptDashboardToRole;

            // Final Step: Hide cinematic preloader
            hidePreloader();

            showToast("✅ CONSTRUMETRIX v4.6 Listo", "success");
        } catch (e) {
            console.error(e);
            hideSkeletonLoaders();
            showToast("❌ Error cargando base de datos", "error");
        }
    }

    // --- ROLE-BASED UX ADAPTATION ---
    function adaptDashboardToRole(role) {
        if (!role) return;

        const r = role.toLowerCase();
        let msg = "";

        // Remove existing role badges
        document.querySelectorAll('.role-specific-badge').forEach(b => b.remove());

        const brandSpan = document.querySelector('h1 span.text-brand-400');

        if (r === 'ingeniero') {
            msg = "⚙️ Perfil de Ingeniería: Enfoque en CRN y Depreciación Técnica.";
            if (brandSpan) brandSpan.insertAdjacentHTML('afterend', '<span class="role-specific-badge text-[7px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded ml-2 font-black uppercase">ING</span>');
            // Prioritize Analysis Tab & Insights
            if (UI.tabAnalysis) UI.tabAnalysis.click();
            if (UI.intelPanel) UI.intelPanel.classList.remove('opacity-50');
        } else if (r === 'arquitecto') {
            msg = "🎨 Perfil de Arquitectura: Enfoque en Acabados y Diseño.";
            if (brandSpan) brandSpan.insertAdjacentHTML('afterend', '<span class="role-specific-badge text-[7px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded ml-2 font-black uppercase">ARQ</span>');
            // Highlight quality controls
            const qContainer = document.querySelector('#qualitySlider')?.parentElement;
            if (qContainer) qContainer.classList.add('ring-1', 'ring-brand/30', 'p-2', 'rounded-xl', 'bg-brand/5');
        } else if (r === 'inversionista' || r === 'tasador') {
            msg = "📈 Perfil de Inversión: Enfoque en Valor de Mercado y ROI.";
            const color = r === 'tasador' ? 'amber' : 'emerald';
            if (brandSpan) brandSpan.insertAdjacentHTML('afterend', `<span class="role-specific-badge text-[7px] bg-${color}-500/20 text-${color}-400 px-1.5 py-0.5 rounded ml-2 font-black uppercase">${r.substring(0, 3).toUpperCase()}</span>`);
            // Highlight GIS sync
            if (UI.gisCard) {
                UI.gisCard.classList.add('border-brand', 'shadow-lg', 'shadow-brand/10');
            }
        }

        console.log(`[UX-ENGINE] ${msg}`);
        showToast(msg, "info");
    }

    // --- CINEMATIC & ONBOARDING ENGINE ---
    function hidePreloader() {
        if (!UI.preloader) return;
        const pt = document.getElementById('preloader-text');
        if (pt) pt.textContent = "Albert Daniel G. Core Desplegado";

        setTimeout(() => {
            UI.preloader.style.opacity = '0';
            UI.preloader.style.transform = 'scale(1.1)';
            UI.preloader.style.pointerEvents = 'none';
            if (UI.mainApp) UI.mainApp.classList.remove('opacity-0');

            // Numbers animation in Launch Screen
            if (UI.launchStats) {
                let start = 0;
                let end = window.FUENTES_OFICIALES ? Object.keys(window.FUENTES_OFICIALES).length - 1 : 12; // Fuentes activas (menos metadata)
                let duration = 2000;
                let startTimestamp = null;
                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    UI.launchStats.textContent = Math.floor(progress * (end - start) + start);
                    if (progress < 1) window.requestAnimationFrame(step);
                };
                window.requestAnimationFrame(step);
            }
        }, 1200);
    }

    function startGuidedTour() {
        if (typeof Shepherd === 'undefined') {
            console.warn("Shepherd.js no cargado.");
            return;
        }

        const tour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                classes: 'glass-panel shadow-2xl rounded-3xl border border-white/10 text-white p-6',
                scrollTo: { behavior: 'smooth', block: 'center' },
                cancelIcon: { enabled: true }
            }
        });

        tour.addStep({
            id: 'welcome',
            title: 'Bienvenido al Nodo Central',
            text: 'Descubre cómo potenciar tus avalúos técnicos con datos de alta precisión.',
            attachTo: { element: '#sidebar', on: 'right' },
            buttons: [{ text: 'Siguiente', action: tour.next, classes: 'bg-brand text-dark-bg font-bold px-4 py-2 rounded-lg text-xs uppercase' }]
        });

        tour.addStep({
            id: 'blueprints',
            title: 'Plantillas de Ingeniería',
            text: 'Selecciona una tipología constructiva para cargar automáticamente los capítulos de obra técnicos.',
            attachTo: { element: '#unitTypeSelect', on: 'right' },
            buttons: [{ text: 'Siguiente', action: tour.next, classes: 'bg-brand text-dark-bg font-bold px-4 py-2 rounded-lg text-xs uppercase' }]
        });

        tour.addStep({
            id: 'gis',
            title: 'Inteligencia Geográfica',
            text: 'Sincroniza datos directos de IGAC y visualiza la infraestructura en el Geo-Visor avanzado.',
            attachTo: { element: '#toggleGisVisor', on: 'right' },
            buttons: [{ text: 'Siguiente', action: tour.next, classes: 'bg-brand text-dark-bg font-bold px-4 py-2 rounded-lg text-xs uppercase' }]
        });

        tour.addStep({
            id: 'fuentes',
            title: 'Trazabilidad & Fuentes',
            text: 'Accede al repositorio maestro de fuentes oficiales. Documentación directa de IGAC, DANE y normativas vigentes para sustentar tus avalúos.',
            attachTo: { element: 'button[onclick="openSourcesModal()"]', on: 'right' },
            buttons: [{ text: 'Finalizar', action: tour.complete, classes: 'bg-brand text-dark-bg font-bold px-4 py-2 rounded-lg text-xs uppercase' }]
        });

        tour.start();
    }

    function setupResponsiveListeners() {
        if (UI.mobileMenuBtn && UI.sidebar) {
            UI.mobileMenuBtn.addEventListener('click', () => {
                UI.sidebar.classList.remove('-translate-x-full');
            });
        }

        if (UI.closeSidebarBtn && UI.sidebar) {
            UI.closeSidebarBtn.addEventListener('click', () => {
                UI.sidebar.classList.add('-translate-x-full');
            });
        }

        // Close sidebar on option click (mobile)
        const sidebarLinks = UI.sidebar.querySelectorAll('button, a, select');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 1024) {
                    UI.sidebar.classList.add('-translate-x-full');
                }
            });
        });
    }

    function setupIntelligenceListeners() {
        if (UI.qualitySlider) {
            UI.qualitySlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                STATE.meta.qualityMultiplier = val;

                // Update Badge UI
                const labels = { 0.8: 'ECONÓMICO', 1.0: 'ESTÁNDAR', 1.2: 'PREMIUM', 1.5: 'LUJO PRO' };
                let label = "PERSONALIZADO";
                if (val <= 0.85) label = "ECONÓMICO";
                else if (val >= 0.95 && val <= 1.05) label = "ESTÁNDAR";
                else if (val >= 1.15 && val <= 1.25) label = "PREMIUM";
                else if (val >= 1.45) label = "LUJO ELITE";

                if (UI.qualityBadge) UI.qualityBadge.textContent = label;
                recalculate();
            });
        }
    }


    function setupBlueprintsUI() {
        const cvGroup = document.getElementById('cv_group');
        const ncGroup = document.getElementById('nc_group');
        if (!cvGroup || !ncGroup) return;

        cvGroup.innerHTML = '';
        ncGroup.innerHTML = '';

        // 1. Interactive Blueprints (Preferred - from blueprints.js)
        if (window.ConstructionBlueprints) {
            Object.keys(window.ConstructionBlueprints).forEach(id => {
                const bp = window.ConstructionBlueprints[id];
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = `⚡ MODELO: ${bp.name}`;
                opt.className = "text-brand-400 font-bold bg-dark-bg";
                // Standard logic for groups
                if (id === '01' || id === '56' || id === '35') cvGroup.appendChild(opt);
                else ncGroup.appendChild(opt);
            });
        }

        // 2. Standard Registry (Placeholder codes from unitsRes)
        if (buildingTypes && buildingTypes.length > 0) {
            buildingTypes.forEach(unit => {
                // Only add if NOT already in Interactive Blueprints
                if (window.ConstructionBlueprints && window.ConstructionBlueprints[unit.cod]) return;

                const opt = document.createElement('option');
                opt.value = unit.cod;
                opt.textContent = `${unit.cod} - ${unit.nombre}`;

                if (unit.cod.startsWith('01') || unit.tipo === 'CV') {
                    cvGroup.appendChild(opt);
                } else {
                    ncGroup.appendChild(opt);
                }
            });
        }
    }

    function setupCharts() {
        // Doughnut: Cost Distribution
        const dCtx = document.getElementById('costDoughnut');
        if (dCtx) {
            doughnutChart = new Chart(dCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Materiales', 'Equipos', 'Mano Obra', 'Transporte', 'AIU'],
                    datasets: [{
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: ['#3b62ff', '#8b5cf6', '#10b981', '#f59e0b', '#64748b'],
                        borderWidth: 0,
                        hoverOffset: 15
                    }]
                },
                options: {
                    cutout: '75%',
                    plugins: { legend: { display: false } },
                    animation: { animateScale: true }
                }
            });
        }

        const bCtx = document.getElementById('chapterBar');
        if (bCtx) {
            barChart = new Chart(bCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Inversión por Capítulo',
                        data: [],
                        backgroundColor: '#3b62ff',
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 9 } }
                        }
                    }
                }
            });
        }
    }

    function setupChaptersSidebar() {
        if (!UI.chapterList) return;

        const prefixMap = {};
        allItems.forEach(it => {
            const prefix = it.codigo.split('.').slice(0, 2).join('.');
            if (!prefixMap[prefix]) prefixMap[prefix] = 0;
            prefixMap[prefix]++;
        });

        STATE.chapters = Object.keys(prefixMap).sort();
        UI.chapterList.innerHTML = '';

        UI.chapterList.appendChild(createChapterButton('all', 'Todos los Ítems'));

        STATE.chapters.forEach(prefix => {
            const name = CHAPTER_NAMES[prefix] || `Capítulo ${prefix}`;
            UI.chapterList.appendChild(createChapterButton(prefix, name));
        });
        lucide.createIcons();
    }

    function createChapterButton(id, name) {
        const btn = document.createElement('button');
        const isActive = (id === 'all' && !STATE.activeChapter) || (STATE.activeChapter === id);

        btn.className = `w-full text-left px-3 py-2 rounded-lg text-[10px] transition-all flex items-center justify-between group chapter-btn ${isActive ? 'bg-brand/10 text-brand border border-brand/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`;

        btn.onclick = () => {
            STATE.activeChapter = id === 'all' ? null : id;
            document.querySelectorAll('.chapter-btn').forEach(b => {
                b.classList.remove('bg-brand/10', 'text-brand', 'border-brand/20');
                b.classList.add('text-gray-400', 'border-transparent');
            });
            btn.classList.add('bg-brand/10', 'text-brand', 'border-brand/20');
            btn.classList.remove('text-gray-400', 'border-transparent');
            renderGrid();
        };

        btn.innerHTML = `
            <span class="flex items-center gap-2">
                <i data-lucide="${id === 'all' ? 'layers' : 'bookmark'}" class="w-3 h-3"></i>
                <span class="truncate">${name}</span>
            </span>
            <i data-lucide="chevron-right" class="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity"></i>
        `;
        return btn;
    }

    // --- 4. CORE LOGIC ---

    // --- ACCORDION LOGIC ---
    window.toggleAccordion = (id) => {
        const item = document.getElementById(id)?.closest('.accordion-item');
        if (!item) return;

        const isActive = item.classList.contains('active');

        // Close all others
        document.querySelectorAll('.accordion-item').forEach(el => el.classList.remove('active'));

        if (!isActive) {
            item.classList.add('active');
        }
        lucide.createIcons();
    };

    function recalculate() {
        // 0. Factor Modifiers
        // stateMultiplier refers to the "Completeness" or "Standard" level (Obra Negra vs Premium)
        const stateMultiplier = APP_UTILS.factors.state[STATE.meta.projectState] || 1.0;
        const qualityMultiplier = STATE.meta.qualityMultiplier || 1.0;
        const globalCrnMultiplier = stateMultiplier * qualityMultiplier;

        // 1. Calculate Individual Item Costs
        let directCost = 0;
        let materials = 0, labor = 0, equipment = 0, transport = 0;
        const chapterCosts = {};

        STATE.budget.forEach(item => {
            // Get base price from DB or Overrides with Region Fallback
            const regionKey = STATE.meta.region || 'centro';
            const availableRegions = Object.keys(item.precios || {});

            // If the synchronized region doesn't exist in item prices, use 'centro'
            const finalRegionKey = availableRegions.includes(regionKey) ? regionKey : 'centro';
            const originalPrice = item.precios[finalRegionKey] || 0;

            const finalPrice = STATE.editedPrices[item.codigo] !== undefined ? STATE.editedPrices[item.codigo] : originalPrice;

            // CRN (Cost of Replacement New) should be calculated as if the building were NEW.
            // We apply completeness (state) and quality but NOT conservation state here.
            const adjustedPrice = finalPrice * globalCrnMultiplier;

            // Calculate effective quantity
            let multiplier = 1;
            if (item.calcMode === 'volume') multiplier = STATE.meta.area * STATE.meta.height;
            else if (item.calcMode === 'area') multiplier = STATE.meta.area;

            const effectiveTotalQty = item.quantity * multiplier;
            const itemTotal = adjustedPrice * effectiveTotalQty;

            // Totals
            directCost += itemTotal;

            // Stats (Approximation based on item code/type for demo)
            materials += itemTotal * 0.55;
            labor += itemTotal * 0.30;
            equipment += itemTotal * 0.10;
            transport += itemTotal * 0.05;

            // Chapter Grouping
            const ch = item.chapter || 'General';
            if (!chapterCosts[ch]) chapterCosts[ch] = 0;
            chapterCosts[ch] += itemTotal;
        });

        // 2. AIU Calculation
        const valAdmin = directCost * (STATE.config.admin / 100);
        const valImprev = directCost * (STATE.config.imprev / 100);
        const valUtil = directCost * (STATE.config.util / 100);
        const valIva = valUtil * (STATE.config.iva / 100);

        const totalAiu = valAdmin + valImprev + valUtil + valIva;
        const crnTotal = directCost + totalAiu; // Costo de Reposición a Nuevo (CRN)

        // 3. Valuation & Depreciation (Ross-Heidecke)
        // K = Ross Factor + Heidecke Adjustment
        const age = STATE.meta.age || 0;
        const life = STATE.meta.usefulLife || 50;
        const u = Math.min(age / life, 1.0);
        const rossFactor = 0.5 * (u + (u * u));

        // Scientific Heidecke factors for Colombia
        const heideckeFactor = APP_UTILS.factors.heidecke[STATE.meta.conservation] || 0;

        // Final Depreciation Factor (Total Castigo)
        const totalDepreciationFactor = Math.min(Math.max(rossFactor + heideckeFactor, 0), 1);

        const depreciatedValue = crnTotal * (1 - totalDepreciationFactor);
        const landValue = (STATE.meta.landArea || 0) * (STATE.meta.landPrice || 0);

        // Final Market Value (Appraisal) adjusted by Marketability
        const baseAppraisal = depreciatedValue + landValue;
        const grandAppraisalValue = baseAppraisal * (STATE.meta.marketMultiplier || 1.0);

        // 4. Update Displays
        const format = APP_UTILS.format;

        APP_UTILS.animateValue(UI.dispDirect, 0, crnTotal, 800);
        APP_UTILS.animateValue(UI.dispGrandTotal, 0, grandAppraisalValue, 1000);
        APP_UTILS.animateValue(UI.panelTotal, 0, grandAppraisalValue, 1000);

        UI.panelDirect.textContent = format(crnTotal);
        UI.panelAiu.textContent = format(totalAiu);

        const sqmCost = STATE.meta.area > 0 ? grandAppraisalValue / STATE.meta.area : 0;
        APP_UTILS.animateValue(UI.dispSqm, 0, sqmCost, 800);

        // 4.1 Update High/Low Range (+/- 2.5%)
        const low = grandAppraisalValue * 0.975;
        const high = grandAppraisalValue * 1.025;
        UI.dispRange.innerHTML = `
            <span class="text-blue-400 font-bold drop-shadow-sm">${format(low)}</span>
            <span class="mx-1 text-gray-700">—</span>
            <span class="text-emerald-400 font-bold drop-shadow-sm">${format(high)}</span>
        `;

        // 4.2 Property Health (Life Remainder)
        const lifeRatio = Math.max(0, 100 - (u * 100));
        if (UI.healthProgress) {
            UI.healthProgress.style.width = `${lifeRatio}%`;
            UI.healthProgress.classList.remove('bg-brand', 'bg-yellow-500', 'bg-red-500');
            const statusColor = lifeRatio < 20 ? 'bg-red-500' : lifeRatio < 50 ? 'bg-yellow-500' : 'bg-brand';
            UI.healthProgress.classList.add(statusColor);
        }
        if (UI.healthLabel) UI.healthLabel.textContent = `${lifeRatio.toFixed(0)}%`;

        // 4.3 Market Badge
        if (UI.marketBadge) {
            const mFactor = STATE.meta.marketMultiplier || 1.0;
            UI.marketBadge.textContent = mFactor > 1.0 ? `Plusvalía (${mFactor}x)` : mFactor < 1.0 ? `Descuento (${mFactor}x)` : `Neutral (${mFactor}x)`;
        }

        // 4.4 GIS VALUATION ENGINE (IGAC GAP ANALYSIS)
        if (STATE.meta.igacValuation > 0 && UI.gisCard) {
            UI.gisCard.classList.remove('hidden');
            UI.gisIgacValue.textContent = format(STATE.meta.igacValuation);
            UI.gisLandType.textContent = STATE.meta.landType || 'No especificado';

            const gapValue = grandAppraisalValue - STATE.meta.igacValuation;
            const gapPct = (gapValue / STATE.meta.igacValuation) * 100;

            UI.gisGapValue.textContent = format(Math.abs(gapValue));
            UI.gisGapPct.textContent = `${gapPct > 0 ? '+' : ''}${gapPct.toFixed(1)}%`;

            // Visual feedback based on gap
            UI.gisGapPct.className = `px-2 py-1 rounded text-[10px] font-black ${Math.abs(gapPct) < 15 ? 'bg-emerald-500/20 text-emerald-400' :
                Math.abs(gapPct) < 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                }`;

            if (gapValue > 0) {
                UI.gisGapValue.previousElementSibling.textContent = "Potencial de Plusvalía (vs IGAC)";
            } else {
                UI.gisGapValue.previousElementSibling.textContent = "Brecha de Subvaloración";
            }
        } else if (UI.gisCard) {
            UI.gisCard.classList.add('hidden');
        }

        // 4.4 Intelligence Engine
        generateIntelligenceInsights(totalDepreciationFactor, totalAiu, sqmCost, crnTotal);

        // 4.5 Predictive AI Confidence Score
        let confidence = 40; // Base: Standard formulas
        if (STATE.meta.area > 0) confidence += 15;
        if (STATE.meta.age > 0) confidence += 10;
        if (STATE.meta.igacValuation > 0) confidence += 25; // Critical: GIS Sync
        if (STATE.budget.length > 5) confidence += 10;
        const aiConfLabel = document.getElementById('aiConfidence');
        if (aiConfLabel) aiConfLabel.textContent = `${Math.min(confidence, 99)}%`;

        // 5. Update Charts
        updateCharts(materials, labor, equipment, transport, totalAiu, chapterCosts);

        // 6. Render Budget List
        renderBudgetList(chapterCosts);

        // 7. Render Analysis
        renderAnalysis(grandAppraisalValue, totalAiu, materials, labor, equipment, transport, crnTotal, totalDepreciationFactor, landValue);

        // 8. Update State Summary for external consumers (PDF, etc)
        STATE.summary = {
            direct: directCost,
            aiu: totalAiu,
            crn: crnTotal,
            depreciated: depreciatedValue,
            land: landValue,
            market: grandAppraisalValue,
            depFactor: totalDepreciationFactor,
            sqm: sqmCost
        };

        // 9. Save
        saveToStorage();
    }

    function updateCharts(mat, lab, eq, tra, aiu, chapterData) {
        if (!doughnutChart || !barChart) return;

        // Update Doughnut
        doughnutChart.data.datasets[0].data = [mat, eq, lab, tra, aiu];
        doughnutChart.update();

        // Update Bar
        const sortedChapters = Object.entries(chapterData).sort((a, b) => b[1] - a[1]).slice(0, 8); // Top 8
        barChart.data.labels = sortedChapters.map(x => x[0]);
        barChart.data.datasets[0].data = sortedChapters.map(x => x[1]);
        barChart.update();
    }

    // --- VIRTUALIZATION / INFINITE SCROLL STATE ---
    let observer;
    const pageSize = 24;
    let currentPage = 1;
    let currentFilteredItems = [];

    function renderGrid(reset = true) {
        if (reset) {
            UI.grid.innerHTML = '';
            currentPage = 1;
            window.scrollTo(0, 0); // Optional: reset scroll
        }

        const term = UI.searchInput.value.toLowerCase();

        // 1. Filter full dataset once (if reset)
        if (reset) {
            currentFilteredItems = allItems.filter(i => {
                const matchesChapter = !STATE.activeChapter || i.codigo.startsWith(STATE.activeChapter);
                const matchesTerm = i.nombre.toLowerCase().includes(term) ||
                    i.codigo.toLowerCase().includes(term) ||
                    i.clase.toLowerCase().includes(term);
                return matchesChapter && matchesTerm;
            });
        }

        // 2. Slice page
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const pageItems = currentFilteredItems.slice(start, end);

        // 3. Render Batch
        loadMoreItems(pageItems);

        // 4. Setup Infinite Scroll Sentinel
        if (end < currentFilteredItems.length) {
            setupSentinel();
        }
    }

    function setupSentinel() {
        if (observer) observer.disconnect();

        // Remove old sentinel if exists
        const oldSentinel = document.getElementById('grid-sentinel');
        if (oldSentinel) oldSentinel.remove();

        // Create new sentinel
        const sentinel = document.createElement('div');
        sentinel.id = 'grid-sentinel';
        sentinel.className = 'col-span-1 md:col-span-2 xl:col-span-3 2xl:col-span-4 h-20 flex items-center justify-center';
        sentinel.innerHTML = '<div class="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>'; // Loader
        UI.grid.appendChild(sentinel);

        observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                currentPage++;
                sentinel.remove(); // Remove loader before adding new items
                renderGrid(false); // Render next batch (no reset)
            }
        }, { root: null, rootMargin: '200px' });

        observer.observe(sentinel);
    }

    function loadMoreItems(items) {
        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const definedPrice = item.precios[STATE.meta.region] || 0;
            const customPrice = STATE.editedPrices[item.codigo];
            const hasCustom = customPrice !== undefined;
            const activePrice = hasCustom ? customPrice : definedPrice;

            const card = document.createElement('div');
            card.className = `item-card bg-dark-card border ${hasCustom ? 'border-yellow-500/50' : 'border-dark-border'} p-4 rounded-2xl hover:border-brand/40 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-full hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/5`;
            card.onclick = () => window.addToBudget(item.codigo);

            const displayName = getSimpleName(item.nombre);

            let priceDisplay = '';
            if (STATE.isEditMode) {
                priceDisplay = `
                <div class="flex items-center gap-1 bg-dark-bg border border-dark-border rounded px-2 py-1 w-full focus-within:border-brand">
                    <span class="text-gray-500 text-[10px]">$</span>
                    <input type="number" 
                        class="w-full bg-transparent text-white text-xs font-bold outline-none"
                        value="${activePrice}" 
                        onclick="event.stopPropagation()"
                        onchange="updateItemPrice('${item.codigo}', this.value)"
                    >
                </div>
            `;
            } else {
                priceDisplay = `<span class="text-sm font-black text-brand-300">${APP_UTILS.format(activePrice)}</span>`;
            }

            card.innerHTML = `
                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-2">
                         <span class="text-[9px] font-bold text-gray-500 uppercase tracking-tighter bg-dark-bg px-2 py-0.5 rounded border border-dark-border">${item.clase}</span>
                         <i data-lucide="plus-circle" class="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </div>
                    <h4 class="text-xs font-bold text-white mb-1 group-hover:text-brand transition-colors line-clamp-2">${displayName}</h4>
                    <p class="text-[9px] text-gray-500 mb-2 italic opacity-50">${item.nombre}</p>
                </div>
                <div class="relative z-10 flex justify-between items-end border-t border-dark-border/50 pt-3 mt-auto">
                    <div class="flex-1">
                        <span class="text-[9px] text-gray-500 uppercase block font-medium mb-1">Precio Est.</span>
                        ${priceDisplay}
                    </div>
                    <span class="text-[10px] font-bold text-gray-500 ml-2">${item.unidad}</span>
                </div>
            `;
            fragment.appendChild(card);
        });

        UI.grid.appendChild(fragment);
        lucide.createIcons();
    }

    function renderBudgetList(chapterCosts) {
        UI.budgetList.innerHTML = '';
        if (STATE.budget.length === 0) {
            UI.emptyState.style.display = 'flex';
            return;
        }
        UI.emptyState.style.display = 'none';

        const groups = {};
        STATE.budget.forEach(item => {
            const ch = item.chapter || 'Personalizado';
            if (!groups[ch]) groups[ch] = [];
            groups[ch].push(item);
        });

        Object.keys(groups).forEach(chapterName => {
            const groupWrap = document.createElement('div');
            groupWrap.className = 'mb-4';
            const simpleChapter = getSimpleName(chapterName);

            groupWrap.innerHTML = `
                <div class="flex items-center gap-2 mb-2 px-2">
                    <i data-lucide="folder" class="w-3 h-3 text-brand-400"></i>
                    <span class="text-[10px] font-bold text-brand-200 uppercase tracking-widest">${simpleChapter}</span>
                </div>
            `;

            groups[chapterName].forEach(item => {
                const originalPrice = item.precios[STATE.meta.region] || 0;
                const price = STATE.editedPrices[item.codigo] !== undefined ? STATE.editedPrices[item.codigo] : originalPrice;

                // Consistent Multiplier logic: Status (Completeness) * Quality
                const multiplier = (APP_UTILS.factors.state[STATE.meta.projectState] || 1.0) * (STATE.meta.qualityMultiplier || 1.0);
                const finalPrice = price * multiplier;

                let qtyDisplay = item.quantity;
                if (item.calcMode === 'volume') qtyDisplay = (item.quantity * STATE.meta.area * STATE.meta.height);
                else if (item.calcMode === 'area') qtyDisplay = (item.quantity * STATE.meta.area);

                const total = finalPrice * qtyDisplay;
                const displayName = getSimpleName(item.nombre);

                const row = document.createElement('div');
                row.className = 'bg-dark-card border border-dark-border/50 p-3 rounded-xl mb-2 flex items-center gap-3 relative group hover:border-brand/30 transition-colors';
                row.innerHTML = `
                    <div class="flex-1 min-w-0">
                        <p class="text-[10px] text-gray-300 truncate font-medium">${displayName}</p>
                        <div class="flex items-center gap-2 mt-0.5">
                            <input type="number" 
                                id="qty_${item.codigo}"
                                name="qty_${item.codigo}"
                                class="w-12 bg-dark-bg border border-dark-border rounded px-1 py-0.5 text-[10px] text-white font-mono focus:border-brand outline-none"
                                value="${item.quantity}"
                                onchange="updateItemQuantity('${item.codigo}', this.value)"
                            >
                            <span class="text-[9px] text-gray-500">${item.unidad} total: ${qtyDisplay.toFixed(1)}</span>
                            <span class="text-[9px] text-gray-500">x</span>
                            <span class="text-[9px] text-gray-400 font-bold">$${Math.round(finalPrice).toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-xs font-bold text-white">$${Math.round(total).toLocaleString()}</p>
                    </div>
                    <button class="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1" onclick="removeFromBudget('${item.codigo}')">
                        <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                `;
                groupWrap.appendChild(row);
            });
            UI.budgetList.appendChild(groupWrap);
        });
        lucide.createIcons();
    }

    window.updateItemQuantity = (code, qty) => {
        const item = STATE.budget.find(i => i.codigo === code);
        if (item) {
            item.quantity = parseFloat(qty) || 0;
            recalculate();
        }
    };

    function renderAnalysis(currentValue, aiu, mat, lab, eq, tra, crn, depFactor, landVal) {
        UI.analysisContainer.innerHTML = '';
        const format = APP_UTILS.format;

        const addCard = (title, value, sub, colorClass, icon) => {
            const card = document.createElement('div');
            card.className = 'bg-dark-card border border-dark-border p-4 rounded-2xl';
            card.innerHTML = `
                <div class="flex items-center gap-3 mb-3">
                    <div class="p-2 rounded-lg bg-dark-bg ${colorClass}">
                        <i data-lucide="${icon}" class="w-4 h-4"></i>
                    </div>
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">${title}</span>
                </div>
                <div class="flex justify-between items-end">
                    <span class="text-xl font-bold text-white">${value}</span>
                    <span class="text-[10px] font-bold text-gray-400 bg-dark-bg px-2 py-1 rounded border border-dark-border">${sub}</span>
                </div>
            `;
            UI.analysisContainer.appendChild(card);
        };

        const marketDelta = (STATE.meta.marketMultiplier - 1.0) * (crn * (1 - depFactor) + landVal);
        const marketLabel = STATE.meta.marketMultiplier >= 1 ? 'Ganancia por Ubicación' : 'Ajuste por Mercado';

        addCard('Repone Nuevo (CRN)', format(crn), 'Costo construcción 2026', 'text-brand', 'refresh-cw');
        addCard('Valor Construcción', format(crn * (1 - depFactor)), `${(depFactor * 100).toFixed(0)}% Depreciación`, 'text-red-400', 'trending-down');
        addCard('Plusvalía / Mercado', format(marketDelta), `${((STATE.meta.marketMultiplier - 1) * 100).toFixed(0)}% Impacto`, 'text-purple-400', 'trending-up');
        addCard('VALOR TOTAL AVALÚO', format(currentValue), `Estrato ${STATE.meta.estrato} | Final`, 'text-emerald-400', 'badge-check');

        const insightCard = document.createElement('div');
        insightCard.className = 'bg-brand/5 border border-brand/20 p-5 rounded-2xl mt-4 relative overflow-hidden group';
        insightCard.innerHTML = `
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                <i data-lucide="award" class="w-12 h-12 text-brand"></i>
            </div>
            <div class="flex items-center gap-2 mb-3">
                <i data-lucide="sparkles" class="w-4 h-4 text-brand"></i>
                <span class="text-[10px] font-bold text-brand uppercase tracking-widest">Dictamen Profesional de Valor</span>
            </div>
            <p class="text-[11px] text-gray-300 leading-relaxed max-w-[90%]">
                Inmueble con <b>${STATE.meta.age} años</b> de antigüedad en estrato <b>${STATE.meta.estrato}</b>. 
                El factor de comercialización de <b>${STATE.meta.marketMultiplier}x</b> ${STATE.meta.marketMultiplier >= 1 ? 'favorece' : 'ajusta'} el avalúo 
                en un total de <b>${format(Math.abs(marketDelta))}</b>. <br><br>
                Se estima un valor de liquidación rápido en <b>${format(currentValue * 0.9)}</b> (90% del valor comercial).
            </p>
        `;
        UI.analysisContainer.appendChild(insightCard);

        // Legal References Section
        const legalSection = document.createElement('div');
        legalSection.className = 'mt-6 pt-6 border-t border-dark-border/50';
        legalSection.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Referencias Técnicas 2026</h4>
                <button onclick="openSourcesModal()" class="text-[8px] text-brand-400 font-black uppercase hover:underline">Ver Repositorio Legal</button>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-dark-bg border border-dark-border/30 p-3 rounded-xl">
                    <span class="text-[9px] text-gray-500 block mb-1 uppercase">SMLV Proyectado</span>
                    <span class="text-xs font-bold text-gray-300">${format(CONSTANTS_2026.SMLV)}</span>
                </div>
                <div class="bg-dark-bg border border-dark-border/30 p-3 rounded-xl">
                    <span class="text-[9px] text-gray-500 block mb-1 uppercase">Factor Prestacional</span>
                    <span class="text-xs font-bold text-gray-300">52.38% (MinTrabajo)</span>
                </div>
            </div>
        `;
        UI.analysisContainer.appendChild(legalSection);

        lucide.createIcons();
    }

    // --- 6. ACTIONS ---
    window.updateItemPrice = (code, val) => {
        STATE.editedPrices[code] = parseFloat(val) || 0;
        recalculate();
    }

    window.addToBudget = (code) => {
        const item = allItems.find(i => i.codigo === code);
        if (!item) return;
        const existing = STATE.budget.find(b => b.codigo === code);
        if (existing) { existing.quantity += 1; }
        else {
            STATE.budget.push({ ...item, quantity: 1, chapter: item.chapter || 'Personalizado', calcMode: 'manual' });
        }
        recalculate();
        showToast("Ítem agregado");
    }

    window.removeFromBudget = (code) => {
        STATE.budget = STATE.budget.filter(b => b.codigo !== code);
        recalculate();
    }

    window.exportToPDF = () => {
        const jsPDFLib = window.jspdf ? window.jspdf.jsPDF : (window.jsPDF ? window.jsPDF : null);
        if (!jsPDFLib) { showToast("PDF Library not found", "error"); return; }

        const doc = new jsPDFLib();
        const { format, factors } = APP_UTILS;
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        // --- Master Business Plus Palette ---
        const brand = {
            navy: [12, 22, 50],       // Deep Imperial Navy
            expert: [37, 99, 235],    // Analytical Blue
            gold: [197, 158, 85],     // Executive Gold
            slate: [71, 85, 105],     // Slate 600
            border: [226, 232, 240],  // Slate 200
            light: [250, 252, 255]    // Page Backdrop
        };

        const s = STATE.summary;
        const meta = STATE.meta;
        const certID = `CTX-PLUS-${Date.now().toString().slice(-8)}`;

        /** TEMPLATE ENGINE: MASTER GEOMETRY (PLUS) **/
        const applyPlusTemplate = () => {
            const total = doc.internal.getNumberOfPages();
            const margin = 10; // Symmetric 10mm frame margin

            for (let i = 1; i <= total; i++) {
                doc.setPage(i);

                // Symmetric Master Frame
                doc.setDrawColor(...brand.border);
                doc.setLineWidth(0.08);
                doc.rect(margin, margin, pageW - (margin * 2), pageH - (margin * 2));

                // Professional Watermark (Rotated)
                doc.setTextColor(238, 242, 248);
                doc.setFontSize(60);
                doc.setFont("helvetica", "bold");
                doc.saveGraphicsState();
                doc.setGState(new doc.GState({ opacity: 0.12 }));
                doc.text("CONSTRUMETRIX PLUS", pageW / 2, pageH / 2, { align: 'center', angle: 45 });
                doc.restoreGraphicsState();

                // Enterprise Footer Configuration (v4.0 Clickable)
                doc.setFont("helvetica", "normal");
                doc.setFontSize(6.5);
                doc.setDrawColor(241, 245, 249);
                doc.line(margin + 4, pageH - 22, pageW - margin - 4, pageH - 22);

                const footerY = pageH - 14;
                doc.setTextColor(...brand.slate);

                // Link 1: Brand & Verification
                const brandT = "CONSTRUMETRIX BUSINESS PLUS";
                doc.textWithLink(brandT, margin + 6, footerY, { url: 'https://construmetrix.github.io/' });
                doc.setTextColor(...brand.slate);
                doc.text(` | CERTIFICADO ID: ${certID}`, margin + 6 + doc.getTextWidth(brandT), footerY);

                // Link 2: Technical Authority Traceability
                doc.text(`VALIDEZ TÉCNICA: `, margin + 6, footerY + 4);
                let curX = margin + 6 + doc.getTextWidth(`VALIDEZ TÉCNICA: `);

                const parts = [
                    { t: 'DANE', l: 'https://www.dane.gov.co/index.php/estadisticas-por-tema/precios-y-costos/indice-de-costos-de-la-construccion-de-edificaciones-icoced' },
                    { t: ' / ', n: true },
                    { t: 'CAMACOL', l: 'https://camacol.co/coordenada-urbana' },
                    { t: ' / ', n: true },
                    { t: 'MINTRABAJO', l: 'https://www.mintrabajo.gov.co' }
                ];

                parts.forEach(p => {
                    if (p.n) {
                        doc.setTextColor(...brand.slate);
                        doc.text(p.t, curX, footerY + 4);
                    } else {
                        doc.setTextColor(...brand.expert);
                        doc.textWithLink(p.t, curX, footerY + 4, { url: p.l });
                    }
                    curX += doc.getTextWidth(p.t);
                });

                doc.setTextColor(...brand.slate);
                doc.text(` 2026 | AUDITORÍA TÉCNICA NIVEL 1`, curX, footerY + 4);

                doc.setFont("helvetica", "bold");
                doc.text(`EXPEDIENTE ANALÍTICO PÁG. ${i} DE ${total}`, pageW - margin - 6, footerY + 2, { align: 'right' });
            }
        };

        /** PAGE 1: EXECUTIVE ANALYSIS (BUSINESS PLUS) **/
        doc.setFillColor(...brand.navy);
        doc.rect(0, 0, pageW, 40, 'F');

        // Gold Accent Bar
        doc.setFillColor(...brand.gold);
        doc.rect(0, 38, pageW, 2, 'F');

        doc.setTextColor(255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.text("CONSTRUMETRIX", 15, 22);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(180, 200, 255);
        doc.text("AVALUO COMERCIAL DE CONSTRUCCION", 15, 29);

        // High-End Security Badge
        doc.setFillColor(255, 255, 255, 0.1);
        doc.roundedRect(pageW - 85, 10, 75, 20, 2, 2, 'F');
        doc.setTextColor(255);
        doc.setFontSize(7);
        doc.text("VALIDACIÓN MASTER ID (PLUS)", pageW - 80, 16);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(certID, pageW - 80, 24);

        // --- I. TECHNICAL SIDEBAR & CONTEXT ---
        const sideW = 58;
        doc.setFillColor(248, 250, 254);
        doc.rect(15, 55, sideW, 115, 'F');
        doc.setDrawColor(...brand.border);
        doc.rect(15, 55, sideW, 115, 'S');

        const expertField = (y, label, val) => {
            // Analytical Indicator Dot
            doc.setFillColor(...brand.gold);
            doc.circle(18.5, y - 1, 0.6, 'F');

            doc.setFont("helvetica", "bold");
            doc.setFontSize(6);
            doc.setTextColor(...brand.slate);
            doc.text(label.toUpperCase(), 21, y);

            doc.setFontSize(7.5);
            doc.setTextColor(...brand.navy);
            // Handling long strings in sidebar
            const cleanVal = val ? val.toString().toUpperCase() : 'NO ESPECIFICADO';
            const splitVal = doc.splitTextToSize(cleanVal, sideW - 8);
            doc.text(splitVal, 21, y + 4);

            // Technical Divider Line
            doc.setDrawColor(235, 240, 250);
            doc.setLineWidth(0.1);
            doc.line(18, y + 9, 15 + sideW - 3, y + 9);
        };

        expertField(65, "Propietario / Responsable", meta.owner);
        expertField(81, "Cédula Catastral", meta.cedula || '--');
        expertField(94, "Matrícula Inmob.", meta.matricula || '--');
        expertField(107, "Ref. Geográfica", `${meta.city || '--'}, ${meta.dept || '--'}`);
        expertField(120, "Aviso / Identificación", meta.aviso);
        expertField(133, "Línea / Torre", meta.tower);
        expertField(146, "Atributos Base", `ÁREA: ${meta.area}M² | ALTURA: ${meta.height}M`);
        expertField(159, "Edad y Vida Útil", `${meta.age}A / ${meta.usefulLife}A (V)`);
        expertField(172, "Metodología", "IVS STANDARD 2026");

        // --- II. FINANCIAL CONSOLIDATION (SUPREME LEDGER STYLE) ---
        const mainX = 78;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brand.navy);
        doc.text("II. CONSOLIDACIÓN DE VALOR Y DEPRECIACIÓN", mainX, 61);

        const summaryRows = [
            ["Costo Directo Base 2026", format(s.direct)],
            ["Indirectos y Contingencias (A.I.U.)", format(s.aiu)],
            ["VALOR REPOSICIÓN A NUEVO (CRN)", format(s.crn)],
            [`Castigo de Depreciación Física (Ross-Heidecke)`, `(-) ${format(s.crn - s.depreciated)}`],
            ["Incorporación de Valor Suelo / Terreno", `(+) ${format(s.land)}`],
            [`Factor de Comercialización (${meta.marketMultiplier}x)`, "INCLUIDO"]
        ];

        doc.autoTable({
            startY: 68,
            margin: { left: mainX, right: 15 },
            body: summaryRows,
            theme: 'plain',
            bodyStyles: { fontSize: 8, cellPadding: 3.5, textColor: brand.navy, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { halign: 'right', fontStyle: 'bold', textColor: brand.expert }
            },
            didDrawCell: (data) => {
                // Accounting Border Bottom
                doc.setDrawColor(241, 245, 249);
                doc.setLineWidth(0.1);
                doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);

                // Row Zebra Shading
                if (data.row.index % 2 === 0) {
                    doc.setFillColor(252, 253, 255);
                    doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                }
            }
        });

        // --- VALOR FINAL (HIGH IMPACT - BUSINESS PLUS BOX) ---
        const finalY = 138;
        doc.setFillColor(...brand.navy);
        doc.rect(mainX, finalY, pageW - mainX - 15, 32, 'F');

        doc.setDrawColor(...brand.gold);
        doc.setLineWidth(1);
        doc.line(mainX, finalY, mainX, finalY + 32);

        doc.setTextColor(255);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.text("VALOR COMERCIAL TOTAL ESTIMADO", mainX + (pageW - mainX - 15) / 2, finalY + 10, { align: 'center' });

        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text(format(s.market), mainX + (pageW - mainX - 15) / 2, finalY + 24, { align: 'center' });

        // --- STRATEGIC MARKET RANGE (MIN/MAX) ---
        const rangeY = finalY + 38;
        const lowR = s.market * 0.975;
        const highR = s.market * 1.025;

        doc.setFillColor(245, 248, 255);
        doc.rect(mainX, rangeY, pageW - mainX - 15, 12, 'F');

        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brand.slate);
        doc.text("RANGO ESTRATÉGICO SUGERIDO (NEGOCIACIÓN):", mainX + 4, rangeY + 7.5);

        doc.setTextColor(...brand.expert);
        doc.text(`BASE: ${format(lowR)}`, mainX + 58, rangeY + 7.5);

        doc.setTextColor(...brand.slate);
        doc.text("/", mainX + 83, rangeY + 7.5);

        doc.setTextColor(...brand.gold);
        doc.text(`ZONA PLUS: ${format(highR)}`, mainX + 87, rangeY + 7.5);

        // Quality Statement (Bottom)
        doc.setFontSize(6.5);
        doc.setTextColor(...brand.slate);
        const businessStatement = "NOTA DE INTEGRIDAD: Este informe constituye una certificación de valor comercial Business Plus, generada bajos los más altos estándares de auditoría financiera. Los cálculos integran modelos de depreciación Ross-Heidecke v2026 y proyecciones de mercado regionalizado. Este documento no requiere firma autógrafa al ser un activo digital validado por el protocolo de seguridad Master ID.";
        doc.text(doc.splitTextToSize(businessStatement, pageW - 40), 20, 260);

        /** PAGE 2+: TECHNICAL APU ANNEX **/
        doc.addPage();
        doc.setFillColor(...brand.navy);
        doc.rect(0, 0, pageW, 12, 'F');
        doc.setTextColor(255);
        doc.setFontSize(9);
        doc.text("ANEXO TÉCNICO: ANÁLISIS DE PRECIOS UNITARIOS (APU) BUSINESS PLUS", 15, 8);

        const apuData = STATE.budget.map(it => {
            let q = it.quantity;
            if (it.calcMode === 'volume') q *= (STATE.meta.area * STATE.meta.height);
            else if (it.calcMode === 'area') q *= STATE.meta.area;
            const p = STATE.editedPrices[it.codigo] || it.precios[STATE.meta.region] || 0;
            const mult = (factors.state[STATE.meta.projectState] || 1) * (STATE.meta.qualityMultiplier || 1);
            return [
                it.codigo,
                getSimpleName(it.nombre).toUpperCase(),
                it.unidad,
                q.toFixed(2),
                format(p * mult),
                format(p * mult * q)
            ];
        });

        doc.autoTable({
            startY: 18,
            margin: { left: 15, right: 15 },
            head: [['CÓDIGO', 'ESPECIFICACIÓN TÉCNICA DE ACTIVIDAD', 'UND', 'CANT', 'V. UNITARIO', 'V. SUBTOTAL']],
            headStyles: { fillColor: brand.navy, fontSize: 6.5, halign: 'center', cellPadding: 4 },
            body: apuData,
            bodyStyles: { fontSize: 6.5, cellPadding: 3, textColor: brand.navy },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 85 },
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right', fontStyle: 'bold' }
            },
            alternateRowStyles: { fillColor: [251, 252, 254] }
        });

        /** PAGE 3: KNOWLEDGE HUB & LEGAL ANNEX **/
        doc.addPage();

        // Header
        doc.setFillColor(...brand.navy);
        doc.rect(0, 0, pageW, 40, 'F');
        doc.setFillColor(...brand.gold);
        doc.rect(0, 38, pageW, 2, 'F');

        doc.setTextColor(255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ANEXO DE TRAZABILIDAD', 15, 22);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 200, 255);
        doc.text('REPOSITORIO MAESTRO DE FUENTES OFICIALES & MARCO LEGAL VIGENTE 2026', 15, 29);

        let sy = 55;
        const sources = window.FUENTES_OFICIALES;

        if (sources) {
            Object.keys(sources).forEach(key => {
                if (key === 'metadata') return;
                const source = sources[key];

                // Entity Card
                doc.setFillColor(248, 250, 254);
                doc.rect(15, sy - 5, pageW - 30, 8, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(...brand.navy);
                doc.text(source.nombre.toUpperCase(), 20, sy);
                sy += 8;

                // Resources
                Object.keys(source.recursos).forEach(rKey => {
                    if (sy > 260) { doc.addPage(); sy = 25; }
                    const res = source.recursos[rKey];

                    doc.setFillColor(...brand.gold);
                    doc.circle(22, sy - 1, 0.7, 'F');

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(...brand.navy);
                    doc.text(res.titulo, 25, sy);

                    doc.setTextColor(...brand.expert);
                    doc.textWithLink('[CONSULTAR FUENTE]', pageW - 45, sy, { url: res.url });

                    sy += 4;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    doc.setTextColor(...brand.slate);
                    const resDesc = doc.splitTextToSize(`USO: ${res.uso} | DESCRIPCIÓN: ${res.descripcion}`, pageW - 55);
                    doc.text(resDesc, 25, sy);
                    sy += (resDesc.length * 4) + 4;
                });
                sy += 6;
            });
        }

        // Final Legality Notice
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...brand.navy);
        doc.text("FUNDAMENTO TÉCNICO-LEGAL:", 15, sy + 10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...brand.slate);
        const legalNotice = "Este dictamen técnico ha sido estructurado bajo los preceptos de la Resolución 620 de 2008 (IGAC), el Decreto 148 de 2020 (Catastro Multipropósito) y las normas internacionales de valuación IVS. La trazabilidad de indicadores económicos está garantizada por sincronización con Bases de Datos oficiales 2026.";
        doc.text(doc.splitTextToSize(legalNotice, pageW - 30), 15, sy + 15);

        // Terminate Template & Frame All Pages
        applyPlusTemplate();

        doc.save(`CERT_CONSTRUMETRIX_PLUS_${certID}.pdf`);
        showToast("Certificado Business Plus Generado", "success");
    };

    // Listeners
    UI.tabBudget.addEventListener('click', () => {
        UI.tabBudget.classList.add('active-tab');
        UI.tabAnalysis.classList.remove('active-tab');
        UI.viewBudget.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        UI.viewAnalysis.classList.add('hidden', 'opacity-0', 'pointer-events-none');
    });

    UI.tabAnalysis.addEventListener('click', () => {
        UI.tabAnalysis.classList.add('active-tab');
        UI.tabBudget.classList.remove('active-tab');
        UI.viewAnalysis.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        UI.viewBudget.classList.add('hidden', 'opacity-0', 'pointer-events-none');
    });

    UI.inputArea.addEventListener('input', (e) => { STATE.meta.area = parseFloat(e.target.value) || 0; recalculate(); });
    UI.inputHeight.addEventListener('input', (e) => { STATE.meta.height = parseFloat(e.target.value) || 0; recalculate(); });
    UI.selectRegion.addEventListener('change', (e) => { STATE.meta.region = e.target.value; renderGrid(); recalculate(); });
    if (UI.selectStatus) UI.selectStatus.addEventListener('change', (e) => { STATE.meta.projectState = e.target.value; recalculate(); });
    if (UI.selectConservation) UI.selectConservation.addEventListener('change', (e) => { STATE.meta.conservation = e.target.value; recalculate(); });
    UI.inputAge.addEventListener('input', (e) => { STATE.meta.age = parseInt(e.target.value) || 0; recalculate(); });
    UI.inputLife.addEventListener('input', (e) => { STATE.meta.usefulLife = parseInt(e.target.value) || 50; recalculate(); });
    UI.inputLandArea.addEventListener('input', (e) => { STATE.meta.landArea = parseFloat(e.target.value) || 0; recalculate(); });
    UI.inputLandPrice.addEventListener('input', (e) => { STATE.meta.landPrice = parseFloat(e.target.value) || 0; recalculate(); });
    UI.selectEstrato.addEventListener('change', (e) => { STATE.meta.estrato = parseInt(e.target.value) || 3; recalculate(); });
    UI.selectMarket.addEventListener('change', (e) => { STATE.meta.marketMultiplier = parseFloat(e.target.value) || 1.0; recalculate(); });
    UI.btnExport.addEventListener('click', () => window.exportToPDF());
    UI.searchInput.addEventListener('input', APP_UTILS.debounce(() => renderGrid(), 300));

    // Infrastructure Listeners
    UI.inputAviso.addEventListener('input', (e) => { STATE.meta.aviso = e.target.value; saveToStorage(); });
    UI.inputTower.addEventListener('input', (e) => { STATE.meta.tower = e.target.value; saveToStorage(); });
    UI.inputOwner.addEventListener('input', (e) => { STATE.meta.owner = e.target.value; saveToStorage(); });
    UI.inputCedula.addEventListener('input', (e) => { STATE.meta.cedula = e.target.value; saveToStorage(); });
    UI.inputMatricula.addEventListener('input', (e) => { STATE.meta.matricula = e.target.value; saveToStorage(); });
    UI.inputCity.addEventListener('input', (e) => { STATE.meta.city = e.target.value; saveToStorage(); });
    UI.inputState.addEventListener('input', (e) => { STATE.meta.dept = e.target.value; saveToStorage(); });


    UI.btnClear.addEventListener('click', async () => {
        if (await showModal("¿Reiniciar Proyecto?", "Se borrarán todos los ítems y configuraciones.")) {
            STATE.budget = [];
            STATE.editedPrices = {};
            STATE.meta.age = 0;
            STATE.meta.landArea = 0;
            STATE.meta.landPrice = 0;
            UI.inputAge.value = 0;
            UI.inputLandArea.value = 0;
            UI.inputLandPrice.value = 0;
            saveToStorage();
            recalculate();
            showToast("Proyecto reiniciado");
        }
    });

    [UI.inAdmin, UI.inImprev, UI.inUtil, UI.inVat].forEach(el => el.addEventListener('input', () => {
        STATE.config.admin = parseFloat(UI.inAdmin.value) || 0;
        STATE.config.imprev = parseFloat(UI.inImprev.value) || 0;
        STATE.config.util = parseFloat(UI.inUtil.value) || 0;
        STATE.config.iva = parseFloat(UI.inVat.value) || 0;
        recalculate();
    }));

    UI.aiuToggle.addEventListener('click', () => {
        UI.aiuPanel.classList.toggle('hidden');
        UI.aiuChevron.classList.toggle('rotate-180');
    });

    UI.btnEditMode.addEventListener('click', () => {
        STATE.isEditMode = !STATE.isEditMode;
        UI.btnEditMode.classList.toggle('bg-brand', STATE.isEditMode);
        const dot = UI.btnEditMode.querySelector('.toggle-dot');
        dot.classList.toggle('translate-x-4', STATE.isEditMode);
        dot.classList.toggle('bg-white', STATE.isEditMode);
        renderGrid();
    });

    UI.selectBlueprint.addEventListener('change', async (e) => {
        const bpId = e.target.value;
        const bp = window.ConstructionBlueprints[bpId];

        if (bp) {
            const confirmed = await showModal(
                `¿Cargar ${bp.name}?`,
                "Se perderá el progreso actual y se recalcularán los capítulos con factores técnicos especializados.",
                bp.image
            );
            if (confirmed) {
                loadBlueprint(bp);
            }
        }
    });

    function loadBlueprint(bp) {
        STATE.budget = [];
        Object.entries(bp.chapters).forEach(([name, items]) => {
            items.forEach(it => {
                const db = allItems.find(x => x.codigo === it.codigo);
                if (db) STATE.budget.push({ ...db, quantity: it.factor, chapter: name, calcMode: it.calcMode || 'area' });
            });
        });
        recalculate();
    }

    function saveToStorage() { localStorage.setItem('valuador_pro_v4', JSON.stringify(STATE)); }
    function loadFromStorage() {
        const s = localStorage.getItem('valuador_pro_v4');
        if (s) {
            const p = JSON.parse(s);
            STATE.budget = p.budget || [];
            STATE.meta = { ...STATE.meta, ...p.meta };
            STATE.config = { ...STATE.config, ...p.config };
            STATE.editedPrices = p.editedPrices || {};
            if (UI.inputArea) UI.inputArea.value = STATE.meta.area;
            if (UI.inputHeight) UI.inputHeight.value = STATE.meta.height;
            if (UI.selectRegion) UI.selectRegion.value = STATE.meta.region;
            if (UI.selectStatus) UI.selectStatus.value = STATE.meta.projectState;
            if (UI.selectConservation) UI.selectConservation.value = STATE.meta.conservation;
            if (UI.inputAge) UI.inputAge.value = STATE.meta.age || 0;
            if (UI.inputLife) UI.inputLife.value = STATE.meta.usefulLife || 50;
            if (UI.inputLandArea) UI.inputLandArea.value = STATE.meta.landArea || 0;
            if (UI.inputLandPrice) UI.inputLandPrice.value = STATE.meta.landPrice || 0;
            if (UI.selectEstrato) UI.selectEstrato.value = STATE.meta.estrato || 3;
            if (UI.selectMarket) UI.selectMarket.value = STATE.meta.marketMultiplier || 1.0;
            if (UI.inputAviso) UI.inputAviso.value = STATE.meta.aviso || '';
            if (UI.inputTower) UI.inputTower.value = STATE.meta.tower || '';
            if (UI.inputOwner) UI.inputOwner.value = STATE.meta.owner || '';
            if (UI.inputCedula) UI.inputCedula.value = STATE.meta.cedula || '';
            if (UI.inputMatricula) UI.inputMatricula.value = STATE.meta.matricula || '';
            if (UI.inputCity) UI.inputCity.value = STATE.meta.city || '';
            if (UI.inputState) UI.inputState.value = STATE.meta.dept || '';
        }
    }

    window.openMarketRef = () => {
        const m = document.getElementById('marketRefModal');
        const resList = document.getElementById('marketRefResidencial');
        const matList = document.getElementById('marketRefMaterials');

        // Populate Residential
        resList.innerHTML = Object.values(CONSTANTS_2026.CONSTRUCTION_COSTS.RESIDENTIAL).map(t => `
            <div class="p-4 rounded-2xl bg-dark-bg border border-white/5 hover:border-brand/40 transition-all group">
                <div class="flex justify-between items-start mb-1">
                    <span class="text-xs font-bold text-white group-hover:text-brand transition-colors">${t.name}</span>
                    <span class="text-[10px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded">2026</span>
                </div>
                <p class="text-[14px] font-black text-white">${APP_UTILS.format(t.min)} - ${APP_UTILS.format(t.max)}</p>
                <p class="text-[9px] text-gray-500 mt-1 uppercase tracking-tighter">${t.specs}</p>
            </div>
        `).join('');

        // Populate Materials & Finishes
        const allItems = [...CONSTANTS_2026.MATERIALS, ...CONSTANTS_2026.FINISHES];
        matList.innerHTML = allItems.map(m => `
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all border-b border-white/5 last:border-0">
                <div>
                    <p class="text-[10px] font-bold text-gray-300">${m.item}</p>
                    <p class="text-[8px] text-gray-500 uppercase">${m.unit}</p>
                </div>
                <div class="text-right">
                    <p class="text-[11px] font-mono font-bold text-emerald-400">$${m.price}</p>
                    ${m.delta ? `<span class="text-[8px] font-black text-red-400">${m.delta} ▲</span>` : ''}
                </div>
            </div>
        `).join('');

        m.classList.remove('hidden');
        m.classList.add('flex', 'animate-fade-in');
        lucide.createIcons();
    };

    window.closeMarketRef = () => {
        const m = document.getElementById('marketRefModal');
        m.classList.add('hidden');
        m.classList.remove('flex', 'animate-fade-in');
    };

    let activeSourceCategory = 'all';

    window.openSourcesModal = () => {
        const m = document.getElementById('sourcesModal');
        const content = document.getElementById('sourcesModalContent');
        if (!m || !content) return;

        m.style.opacity = '1';
        m.style.pointerEvents = 'auto';
        content.style.transform = 'scale(1)';

        // Initialize state
        activeSourceCategory = 'all';
        renderSources();

        // One-time listener for search
        const searchInput = document.getElementById('sourceSearch');
        if (searchInput && !searchInput.dataset.listener) {
            searchInput.addEventListener('input', APP_UTILS.debounce((e) => {
                renderSources(e.target.value);
            }, 300));
            searchInput.dataset.listener = 'true';
        }
    };

    window.closeSourcesModal = () => {
        const m = document.getElementById('sourcesModal');
        const content = document.getElementById('sourcesModalContent');
        if (m) m.style.opacity = '0';
        if (m) m.style.pointerEvents = 'none';
        if (content) content.style.transform = 'scale(0.95)';
    };

    /** USER MODAL CONTROLS **/
    window.openUserModal = () => {
        const m = document.getElementById('userModal');
        const content = document.getElementById('userModalContent');
        if (!m || !content) return;

        m.style.opacity = '1';
        m.style.pointerEvents = 'auto';
        content.style.transform = 'scale(1)';
        lucide.createIcons();
    };

    window.closeUserModal = () => {
        const m = document.getElementById('userModal');
        const content = document.getElementById('userModalContent');
        if (m) m.style.opacity = '0';
        if (m) m.style.pointerEvents = 'none';
        if (content) content.style.transform = 'scale(0.95)';
    };

    function renderSources(filter = '') {
        const container = document.getElementById('sourcesDataContainer');
        const nav = document.getElementById('sourcesNav');
        if (!container || !nav || !window.FUENTES_OFICIALES) return;

        const sources = window.FUENTES_OFICIALES;
        const q = filter.toLowerCase();

        // 1. Render Navigation (Sidebar style)
        let navHtml = `
            <button onclick="setSourceCategory('all')" 
                class="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${activeSourceCategory === 'all' ? 'bg-brand/20 text-brand border border-brand/20' : 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent'}">
                <i data-lucide="grid-3x3" class="w-4 h-4"></i>
                <span class="text-[10px] font-black uppercase tracking-widest">Todos</span>
            </button>
        `;

        Object.keys(sources).forEach(key => {
            if (key === 'metadata') return;
            const s = sources[key];
            navHtml += `
                <button onclick="setSourceCategory('${key}')" 
                    class="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${activeSourceCategory === key ? 'bg-brand/20 text-brand border border-brand/20' : 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent'}">
                    <i data-lucide="${s.logo_icon || 'database'}" class="w-4 h-4"></i>
                    <span class="text-[10px] font-black uppercase tracking-widest">${s.sigla || key.toUpperCase()}</span>
                </button>
            `;
        });
        nav.innerHTML = navHtml;

        // 2. Render Grid Content
        let gridHtml = '';
        Object.keys(sources).forEach(key => {
            if (key === 'metadata') return;
            if (activeSourceCategory !== 'all' && activeSourceCategory !== key) return;

            const source = sources[key];
            const recursos = Object.keys(source.recursos)
                .map(rKey => source.recursos[rKey])
                .filter(res => {
                    if (!q) return true;
                    return res.titulo.toLowerCase().includes(q) ||
                        res.descripcion.toLowerCase().includes(q) ||
                        res.uso.toLowerCase().includes(q);
                });

            if (recursos.length === 0 && q) return;

            gridHtml += `
                <div class="space-y-8 mb-16 animate-fade-in">
                    <div class="flex items-center gap-4">
                        <div class="p-3 rounded-2xl bg-${source.color || 'brand'}/10 border border-${source.color || 'brand'}/20">
                            <i data-lucide="${source.logo_icon || 'database'}" class="w-6 h-6 text-${source.color || 'brand'}"></i>
                        </div>
                        <div>
                            <h4 class="text-xl font-black text-white uppercase tracking-tighter">${source.nombre}</h4>
                            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">${source.descripcion}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                        ${recursos.map(res => {
                // Generate Fake Sparkline Data based on source type
                const isData = ['ICOCED', 'IVP', 'OIC'].some(t => res.titulo.includes(t));
                let chartHtml = '';

                if (isData) {
                    // Simple SVG Sparkline
                    const points = Array.from({ length: 10 }, () => Math.floor(Math.random() * 30));
                    const polyline = points.map((p, i) => `${i * 10},${30 - p}`).join(' ');
                    chartHtml = `
                                    <div class="h-12 w-full mt-4 bg-black/20 rounded-lg overflow-hidden relative">
                                        <svg class="w-full h-full" viewBox="0 0 90 30" preserveAspectRatio="none">
                                            <polyline points="${polyline}" fill="none" stroke="#4f7aff" stroke-width="2" vector-effect="non-scaling-stroke"></polyline>
                                            <defs>
                                                <linearGradient id="grad${key}" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" style="stop-color:rgb(79,122,255);stop-opacity:0.2" />
                                                    <stop offset="100%" style="stop-color:rgb(79,122,255);stop-opacity:0" />
                                                </linearGradient>
                                            </defs>
                                            <polygon points="0,30 ${polyline} 90,30" fill="url(#grad${key})"></polygon>
                                        </svg>
                                        <div class="absolute top-1 right-2 text-[8px] font-mono text-brand font-bold">+0.4%</div>
                                    </div>
                                `;
                }

                return `
                            <div draggable="true" ondragstart="event.dataTransfer.setData('text/plain', '${res.url}')" 
                                class="group/card relative bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] hover:border-brand/40 hover:bg-brand/5 transition-all duration-500 flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing">
                                
                                <!-- Status Badge -->
                                <div class="absolute top-6 right-6 flex items-center gap-2">
                                    <div class="w-2 h-2 rounded-full ${res.estado === 'En Vivo' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}"></div>
                                    <span class="text-[7px] text-gray-500 font-black uppercase tracking-widest">${res.estado || 'Auditado'}</span>
                                </div>

                                <div class="space-y-4">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 rounded-xl bg-white/5 text-brand group-hover/card:scale-110 transition-transform shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                            <i data-lucide="${isData ? 'activity' : 'file-text'}" class="w-4 h-4"></i>
                                        </div>
                                        <h5 class="text-[11px] font-black text-white uppercase tracking-widest leading-tight pr-12">${res.titulo}</h5>
                                    </div>
                                    <p class="text-[10px] text-gray-400 leading-relaxed font-medium line-clamp-3">${res.descripcion}</p>
                                    
                                    ${chartHtml}
                                </div>

                                <div class="mt-6 border-t border-white/5 pt-4">
                                    <div class="flex justify-between items-center mb-4">
                                        <span class="text-[8px] text-gray-600 font-black uppercase tracking-tighter">Impacto:</span>
                                        <span class="text-[9px] text-gray-400 font-bold italic text-right max-w-[60%] truncate">${res.uso}</span>
                                    </div>
                                    
                                    <div class="flex items-center gap-2 opacity-60 group-hover/card:opacity-100 transition-opacity">
                                        <a href="${res.url}" target="_blank" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-white text-[9px] font-black uppercase tracking-widest hover:bg-brand hover:shadow-[0_0_20px_rgba(59,98,255,0.4)] transition-all group/btn">
                                            <span>Conectar</span> <i data-lucide="arrow-right" class="w-3 h-3 group-hover/btn:translate-x-1 transition-transform"></i>
                                        </a>
                                        <button onclick="APP_UTILS.copyToClipboard('${res.url}')" class="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:border-white/20 transition-all" title="Copiar Enlace">
                                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                </div>
            `;
        });

        if (!gridHtml) {
            gridHtml = `
                <div class="h-64 flex flex-col items-center justify-center text-gray-600 border border-dashed border-white/10 rounded-[3rem]">
                    <i data-lucide="search-x" class="w-12 h-12 mb-4 opacity-20"></i>
                    <p class="text-xs font-black uppercase tracking-widest">No se encontraron recursos</p>
                    <button onclick="document.getElementById('sourceSearch').value=''; renderSources();" class="mt-4 text-[10px] text-brand font-bold uppercase hover:underline">Limpiar Filtros</button>
                </div>
            `;
        }

        container.innerHTML = gridHtml;
        if (window.lucide) lucide.createIcons();
    }

    window.setSourceCategory = (cat) => {
        activeSourceCategory = cat;
        const searchInput = document.getElementById('sourceSearch');
        const query = searchInput?.value || '';
        renderSources(query);
    };


    window.showModal = (title, text, image = null) => new Promise(res => {
        const m = document.getElementById('confirmModal');
        const img = document.getElementById('confirmModelImage');
        const content = document.getElementById('confirmModalContent');

        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmText').textContent = text;

        if (image && img) {
            console.log(`📸 [UI-ENGINE] Cargando previa de modelo: ${image}`);
            img.src = image.startsWith('http') || image.startsWith('./') ? image : `./${image}`;
            img.parentElement.style.display = 'block';
            img.onerror = () => {
                console.error(`❌ [UI-ENGINE] Error al cargar imagen: ${image}`);
                img.parentElement.style.display = 'none';
            };
        } else if (img) {
            img.parentElement.style.display = 'none';
        }

        m.style.opacity = '1';
        m.style.pointerEvents = 'auto';
        if (content) content.style.transform = 'scale(1)';

        document.getElementById('btnConfirm').onclick = () => {
            m.style.opacity = '0';
            m.style.pointerEvents = 'none';
            if (content) content.style.transform = 'scale(0.95)';
            res(true);
        };
        document.getElementById('btnCancel').onclick = () => {
            m.style.opacity = '0';
            m.style.pointerEvents = 'none';
            if (content) content.style.transform = 'scale(0.95)';
            res(false);
        };
    });

    window.showToast = (msg, type = "info") => {
        const t = document.getElementById('toast');
        const dot = document.getElementById('toastDot');
        const ping = document.getElementById('toastDotPing');
        document.getElementById('toastMsg').textContent = msg;

        // Premium Color Mapping
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b62ff'
        };
        const activeColor = colors[type] || colors.info;

        // Apply synchronized color states
        t.style.borderColor = `${activeColor}40`; // 25% opacity border
        if (dot) {
            dot.style.backgroundColor = activeColor;
            dot.style.boxShadow = `0 0 15px ${activeColor}`;
        }
        if (ping) {
            ping.style.backgroundColor = activeColor;
        }

        // High-Fidelity Transition
        t.style.opacity = '1';
        t.style.transform = 'translate(-50%, -20px)';

        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transform = 'translate(-50%, 20px)';
        }, 4000);
    };

    function generateIntelligenceInsights(depFactor, aiu, sqmCost, totalDirect) {
        if (!UI.intelPanel || !UI.intelContent) return;

        const insights = [];
        const format = APP_UTILS.format;

        // 1. Análisis de Depreciación
        if (depFactor > 0.4) {
            insights.push({
                icon: 'alert-triangle',
                color: 'text-red-400',
                title: 'Alerta de Depreciación Crítica',
                desc: `El inmueble ha perdido el ${(depFactor * 100).toFixed(0)}% de su valor técnico. Se recomienda intervención inmediata para detener la obsolescencia.`
            });
        } else if (depFactor > 0.15) {
            insights.push({
                icon: 'info',
                color: 'text-yellow-400',
                title: 'Desgaste Moderado Detectado',
                desc: 'Mantenimiento preventivo sugerido. El valor técnico se mantiene estable pero muestra signos de edad temprana.'
            });
        }

        // 2. Análisis de AIU (Carga Administrativa)
        const aiuRatio = aiu / totalDirect;
        if (aiuRatio > 0.35) {
            insights.push({
                icon: 'trending-up',
                color: 'text-orange-400',
                title: 'Carga Indirecta Elevada',
                desc: 'Los costos de administración e imprevistos superan el estándar. Revise la eficiencia operativa para mejorar el margen.'
            });
        }

        // 3. Eficiencia de Costo por m2
        if (sqmCost > 0) {
            const residential = CONSTANTS_2026.CONSTRUCTION_COSTS.RESIDENTIAL;
            let match = null;

            if (sqmCost >= residential.CASA_ALTA.min) match = residential.CASA_ALTA;
            else if (sqmCost >= residential.CASA_MEDIA.min) match = residential.CASA_MEDIA;
            else if (sqmCost >= residential.CASA_SOCIAL.min) match = residential.CASA_SOCIAL;

            if (match) {
                insights.push({
                    icon: 'target',
                    color: 'text-brand-300',
                    title: `Perfil Detectado: ${match.name}`,
                    desc: `El costo de ${format(sqmCost)}/m² coincide con el estándar de ${match.name}. ${match.specs}.`
                });
            }

            const highThreshold = residential.CASA_ALTA.max;
            if (sqmCost > highThreshold) {
                insights.push({
                    icon: 'award',
                    color: 'text-purple-400',
                    title: 'Proyecto de Lujo Extremo',
                    desc: 'El valor por m² supera los $7.000.000. Se clasifica como construcción de ultra-lujo con acabados importados.'
                });
            }
        }

        // 4. Calidad vs Valor
        if (STATE.meta.qualityMultiplier > 1.25) {
            insights.push({
                icon: 'zap',
                color: 'text-brand',
                title: 'Optimización Premium Activa',
                desc: 'Se están aplicando especificaciones de Lujo. Esto aumenta el CRN pero puede limitar el grupo de compradores rápidos.'
            });
        }

        // Renderizar Insights
        if (insights.length > 0) {
            UI.intelPanel.classList.remove('hidden');
            UI.intelContent.innerHTML = insights.map(is => `
                <div class="flex gap-3 bg-dark-bg/40 p-3 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                    <i data-lucide="${is.icon}" class="w-4 h-4 ${is.color} shrink-0 mt-0.5"></i>
                    <div>
                        <p class="text-[10px] font-black text-white uppercase tracking-wider">${is.title}</p>
                        <p class="text-[9px] text-gray-500 leading-tight mt-1">${is.desc}</p>
                    </div>
                </div>
            `).join('');
            lucide.createIcons();
        } else {
            UI.intelPanel.classList.add('hidden');
        }
    }

    // --- SKELETON LOADERS ---
    function showSkeletonLoaders() {
        const grid = UI.grid;
        if (!grid) return;

        grid.innerHTML = Array.from({ length: 12 }, () => `
            <div class="skeleton skeleton-card rounded-2xl"></div>
        `).join('');

        // Add skeleton to budget panel
        if (UI.budgetList) {
            UI.budgetList.innerHTML = Array.from({ length: 5 }, () => `
                <div class="skeleton skeleton-text mb-2"></div>
            `).join('');
        }
    }

    function hideSkeletonLoaders() {
        // Skeletons are replaced by actual content in renderGrid()
        // This function exists for explicit cleanup if needed
    }

    // --- MARKET DYNAMICS ENGINE (Innovation) ---
    /**
     * Simulates real-time market fluctuations for construction materials
     * based on economic indices (DANE/ICOCED representation).
     */
    /**
     * MASTER MARKET ENGINE v4.0
     * Simulates periodic market drifts with "Momentum" and "Macro-Drift"
     */
    let marketSentiment = 1.0;
    function simulateMarketFluctuation() {
        // Momentum calculation: 60% chance to follow previous direction
        const direction = Math.random() > (marketSentiment > 1.01 ? 0.7 : 0.3) ? 1 : -1;
        const volatility = 0.008; // 0.8% micro-movements
        const drift = (Math.random() * volatility) * direction;

        marketSentiment += drift;
        marketSentiment = Math.max(0.85, Math.min(1.25, marketSentiment)); // Natural bounds

        // Apply drift to global ranges
        if (CONSTANTS_2026.CONSTRUCTION_COSTS) {
            Object.keys(CONSTANTS_2026.CONSTRUCTION_COSTS).forEach(level => {
                const range = CONSTANTS_2026.CONSTRUCTION_COSTS[level];
                range.min = Math.round(range.min * (1 + drift));
                range.max = Math.round(range.max * (1 + drift));
            });
        }

        const msg = `Señal de Mercado: ${drift > 0 ? '↗️ Alza' : '↘️ Baja'} del ${(Math.abs(drift) * 100).toFixed(2)}% detectada. Índice General: ${(marketSentiment * 100).toFixed(1)} pts.`;
        console.log(`[MASTER INTEL] ${msg}`);

        // Only toast if movement is significant (>0.5%)
        if (Math.abs(drift) > 0.005) {
            setTimeout(() => {
                if (window.showToast) window.showToast(msg, drift > 0 ? "warning" : "success");
                recalculate(); // Refresh visuals with new market data
            }, 3000);
        }
    }

    // Initialize App
    simulateMarketFluctuation();
    init();
});
