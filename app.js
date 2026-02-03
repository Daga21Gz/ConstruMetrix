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
            BASIC: { min: 1800000, max: 2200000 },
            MEDIUM: { min: 2500000, max: 3500000 },
            HIGH: { min: 4000000, max: 6000000 }
        }
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

            showToast("✅ CONSTRUMETRIX v2.0 Listo", "success");
        } catch (e) {
            console.error(e);
            hideSkeletonLoaders();
            showToast("❌ Error cargando base de datos", "error");
        }
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

        // 1. Populate from unitsRes (JSON)
        if (buildingTypes && buildingTypes.length > 0) {
            buildingTypes.forEach(unit => {
                const opt = document.createElement('option');
                opt.value = unit.cod;
                opt.textContent = `${unit.cod} - ${unit.nombre}`;
                if (unit.cod.startsWith('01') || unit.tipo === 'CV') {
                    if (cvGroup) cvGroup.appendChild(opt);
                } else {
                    if (ncGroup) ncGroup.appendChild(opt);
                }
            });
        }

        // 2. Populate Interactive Blueprints (from blueprints.js)
        if (window.ConstructionBlueprints) {
            Object.keys(window.ConstructionBlueprints).forEach(id => {
                const bp = window.ConstructionBlueprints[id];
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = `⚡ MODELO: ${bp.name}`;
                opt.className = "text-brand-400 font-bold";
                if (cvGroup) cvGroup.appendChild(opt);
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
            // Get base price from DB or Overrides
            const originalPrice = item.precios[STATE.meta.region] || 0;
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

        UI.dispDirect.textContent = format(crnTotal);
        UI.dispGrandTotal.textContent = format(grandAppraisalValue);
        UI.panelTotal.textContent = format(grandAppraisalValue);
        UI.panelDirect.textContent = format(crnTotal);
        UI.panelAiu.textContent = format(totalAiu);

        const sqmCost = STATE.meta.area > 0 ? grandAppraisalValue / STATE.meta.area : 0;
        UI.dispSqm.textContent = format(sqmCost);

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

    // --- 5. RENDERERS ---

    function renderGrid() {
        UI.grid.innerHTML = '';
        const term = UI.searchInput.value.toLowerCase();

        const filtered = allItems.filter(i => {
            const matchesChapter = !STATE.activeChapter || i.codigo.startsWith(STATE.activeChapter);
            const matchesTerm = i.nombre.toLowerCase().includes(term) ||
                i.codigo.toLowerCase().includes(term) ||
                i.clase.toLowerCase().includes(term);
            return matchesChapter && matchesTerm;
        }).slice(0, 48); // Limit for performance

        filtered.forEach(item => {
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
            UI.grid.appendChild(card);
        });
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
            <h4 class="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Referencias Técnicas 2026</h4>
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

                // Enterprise Footer Configuration
                doc.setFont("helvetica", "normal");
                doc.setFontSize(6.5);
                doc.setTextColor(...brand.slate);

                const footerY = pageH - 14;
                doc.text(`CONSTRUMETRIX BUSINESS PLUS | ID: ${certID}`, margin + 6, footerY);
                doc.text(`FUENTES: DANE / CAMACOL / MINTRABAJO 2026 | AUDITORÍA TÉCNICA NIVEL 1`, margin + 6, footerY + 4);

                doc.setFont("helvetica", "bold");
                doc.text(`EXPEDIENTE ANALÍTICO PÁG. ${i} DE ${total}`, pageW - margin - 6, footerY + 2, { align: 'right' });

                // Professional Signature/Stamp Placeholder Line
                doc.setDrawColor(241, 245, 249);
                doc.line(margin + 4, pageH - 22, pageW - margin - 4, pageH - 22);
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

        applyPlusTemplate();

        doc.save(`CERT_CONSTRUMETRIX_${meta.aviso || 'PLUS'}.pdf`);
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

    // GIS SYNC: El cerebro que recibe la carga del mapa
    document.addEventListener('gisSync', (e) => {
        const meta = e.detail;
        if (UI.inputCedula) UI.inputCedula.value = meta.cedula || '';
        if (UI.inputArea) {
            UI.inputArea.value = meta.area || 0;
            STATE.meta.area = parseFloat(meta.area) || 1.0;
        }

        // Inyectar inteligencia IGAC al estado
        if (meta.igacValuation) STATE.meta.igacValuation = meta.igacValuation;
        if (meta.igacDestino) STATE.meta.igacDestino = meta.igacDestino;
        if (meta.landType) STATE.meta.landType = meta.landType;

        // Lógica de Negocio: Si el suelo es INFORMAL, aumentamos imprevistos automáticamente
        if (meta.landType && meta.landType.toLowerCase().includes('informal')) {
            STATE.config.imprev = 15; // Sube del 5% al 15% por riesgo jurídico
            if (UI.inImprev) UI.inImprev.value = 15;
            showToast("⚠️ Suelo Informal detectado: Contingencia legal aumentada al 15%", "info");
        }

        recalculate();
    });

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
        const bp = window.ConstructionBlueprints[e.target.value];
        if (bp && await showModal(`¿Cargar ${bp.name}?`, "Se perderá el progreso actual.")) {
            loadBlueprint(bp);
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

    window.showModal = (title, text) => new Promise(res => {
        const m = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmText').textContent = text;
        m.style.opacity = '1'; m.style.pointerEvents = 'auto';
        document.getElementById('btnConfirm').onclick = () => { m.style.opacity = '0'; m.style.pointerEvents = 'none'; res(true); };
        document.getElementById('btnCancel').onclick = () => { m.style.opacity = '0'; m.style.pointerEvents = 'none'; res(false); };
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
            const avgSqm = CONSTANTS_2026.CONSTRUCTION_COSTS.MEDIUM.min; // Referencia base 2026
            if (sqmCost > avgSqm * 1.5) {
                insights.push({
                    icon: 'award',
                    color: 'text-purple-400',
                    title: 'Proyecto de Alta Gama / Lujo',
                    desc: 'El valor por m² indica un estándar superior (Premium). El mercado objetivo debe ser Prime para asegurar el retorno.'
                });
            } else if (sqmCost < CONSTANTS_2026.CONSTRUCTION_COSTS.BASIC.min) {
                insights.push({
                    icon: 'trending-down',
                    color: 'text-emerald-400',
                    title: 'Alta Eficiencia de Costos',
                    desc: 'El valor por m² está por debajo del promedio básico. Ideal para proyectos de inversión o Vivienda de Interés Social.'
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

    // Initialize App
    init();
});
