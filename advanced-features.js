/**
 * CONSTRUMETRIX - ADVANCED FEATURES MODULE
 * v2.0 - PWA + Excel Export + Templates
 */

// ==================== EXCEL EXPORT ====================
// ==================== EXCEL & PDF EXPORT ====================

/** [MIGRATED] PDF Export logic is now handled in app.js for Business Plus branding **/
/** [MIGRATED] PDF Export logic is now handled in app.js for Business Plus branding **/
function exportToPDF() {
    return window.exportToPDF ? window.exportToPDF() : console.warn("Master PDF logic not found");
}

function exportToExcel() {
    if (!window.XLSX) {
        showToast('Error: Biblioteca XLSX no cargada', 'error');
        return;
    }

    if (!window.STATE || !window.STATE.budget || window.STATE.budget.length === 0) {
        showToast('No hay ítems en el presupuesto', 'error');
        return;
    }

    try {
        const workbook = XLSX.utils.book_new();
        const s = window.STATE;
        const meta = s.meta;
        const format = window.APP_UTILS ? window.APP_UTILS.format : (n) => `$${n.toLocaleString()}`;

        // SHEET 0: CARÁTULA DEL PROYECTO (Cover Sheet)
        const coverData = [
            ['CONSTRUMETRIX ENTERPRISE v2026', '', '', '', 'AUDITORÍA TÉCNICA NIVEL 1'],
            ['REPORTE MAESTRO DE VALORACIÓN COMERCIAL', '', '', 'REPORT ID:', `CTX-XLS-${Date.now().toString().slice(-6)}`],
            ['ESTÁNDAR DE INGENIERÍA IVS + IGAC + DANE', '', '', 'FECHA EXP:', new Date().toLocaleDateString()],
            [],
            ['1. IDENTIFICACIÓN DEL SUJETO'],
            ['MODELO DE REFERENCIA:', (meta.modelName || 'VIVIENDA URBANA').toUpperCase()],
            ['DESCRIPCIÓN:', meta.modelDesc || 'N/D'],
            ['ESPECIFICACIONES:', meta.modelSpecs || 'N/D'],
            [],
            ['2. LOCALIZACIÓN Y PROPIEDAD'],
            ['PROPIETARIO:', meta.owner || 'N/D'],
            ['CÉDULA CATASTRAL:', meta.cedula || 'N/D'],
            ['MATRÍCULA INMOBILIARIA:', meta.matricula || 'N/D'],
            ['CIUDAD / MUNICIPIO:', meta.city || 'N/D'],
            ['DEPARTAMENTO:', meta.dept || 'N/D'],
            ['REFERENCIA INTERNA:', `${meta.aviso || 'N/D'} / ${meta.tower || 'N/D'}`],
            [],
            ['3. ATRIBUTOS FÍSICOS'],
            ['ÁREA CONSTRUIDA:', `${meta.area} m²`],
            ['ALTURA ENTREPISO:', `${meta.height} m`],
            ['EDAD CRONOLÓGICA:', `${meta.age} años`],
            ['VIDA ÚTIL REMANENTE:', `${meta.usefulLife - (meta.age || 0)} años`],
            ['ESTADO DE CONSERVACIÓN:', meta.conservation.toUpperCase()],
            ['NIVEL DE ACABADOS:', (meta.qualityMultiplier * 100).toFixed(0) + '%'],
            [],
            ['4. CONSOLIDACIÓN FINANCIERA (VALORES EN COP)'],
            ['CATEGORÍA DE COSTO', 'VALOR BASE', 'INDICADOR'],
            ['COSTO DIRECTO DE OBRA:', s.summary.direct, '100%'],
            ['COSTOS INDIRECTOS (AIU):', s.summary.aiu, ((s.summary.aiu / s.summary.direct) * 100).toFixed(1) + '%'],
            ['VALOR REPOSICIÓN NUEVO (CRN):', s.summary.crn, ''],
            ['DEPRECIACIÓN FÍSICA ACUMULADA:', (s.summary.crn - s.summary.depreciated), ((((s.summary.crn - s.summary.depreciated) / s.summary.crn)) * 100).toFixed(1) + '%'],
            ['VALOR CONSTRUCCIÓN ACTUAL:', s.summary.depreciated, 'Neto'],
            ['VALOR SUELO / LOTE:', s.summary.land, 'Mercado'],
            ['BASE COMERCIAL ESTIMADA:', s.summary.market / (meta.marketMultiplier || 1), '1.0x'],
            ['FACTOR DE COMERCIALIZACIÓN:', meta.marketMultiplier || 1.0, `${((meta.marketMultiplier - 1) * 100).toFixed(1)}%`],
            [],
            ['VALOR FINAL DE MERCADO:', s.summary.market, 'CERTIFICADO'],
            ['COSTO UNITARIO POR M²:', s.summary.market / (meta.area || 1), '/m²']
        ];

        const wsCover = XLSX.utils.aoa_to_sheet(coverData);
        wsCover['!cols'] = [{ width: 35 }, { width: 30 }, { width: 10 }, { width: 15 }, { width: 20 }];

        // Basic Formatting (using internal structure if possible, but keeping it simple)
        XLSX.utils.book_append_sheet(workbook, wsCover, 'Caratula');

        // SHEET 1: PRESUPUESTO DETALLADO (APU)
        const budgetData = [
            ['ANEXO TÉCNICO: DESGLOSE DE ACTIVIDADES Y PRECIOS UNITARIOS'],
            ['CÓDIGO', 'ACTIVIDAD / ESPECIFICACIÓN', 'UNIDAD', 'CANTIDAD', 'V. UNITARIO', 'V. SUBTOTAL']
        ];

        s.budget.forEach(item => {
            const originalPrice = item.precios[meta.region] || 0;
            const basePrice = s.editedPrices && s.editedPrices[item.codigo] !== undefined
                ? s.editedPrices[item.codigo]
                : originalPrice;

            const stateMult = (window.APP_UTILS && window.APP_UTILS.factors.state[meta.projectState]) || 1.0;
            const qualityMult = meta.qualityMultiplier || 1.0;
            const price = basePrice * stateMult * qualityMult;

            let qty = item.quantity;
            if (item.calcMode === 'volume') qty *= meta.area * meta.height;
            else if (item.calcMode === 'area') qty *= meta.area;

            budgetData.push([
                item.codigo,
                item.nombre.toUpperCase(),
                item.unidad,
                qty,
                price,
                price * qty
            ]);
        });

        const wsBudget = XLSX.utils.aoa_to_sheet(budgetData);
        wsBudget['!cols'] = [{ width: 12 }, { width: 60 }, { width: 10 }, { width: 12 }, { width: 18 }, { width: 22 }];

        // Merge the title row
        wsBudget['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

        XLSX.utils.book_append_sheet(workbook, wsBudget, 'Presupuesto Detallado');

        // SHEET 2: TRAZABILIDAD Y LEGALIDAD
        const sourceData = [['ENTIDAD REGULADORA', 'RECURSO TÉCNICO', 'ENLACE OFICIAL', 'USO EN EL MODELO']];
        const sources = window.FUENTES_OFICIALES;
        if (sources) {
            Object.keys(sources).forEach(key => {
                if (key === 'metadata') return;
                const src = sources[key];
                Object.keys(src.recursos).forEach(rKey => {
                    const res = src.recursos[rKey];
                    sourceData.push([src.nombre, res.titulo, res.url, res.uso]);
                });
            });
        }
        const wsSources = XLSX.utils.aoa_to_sheet(sourceData);
        wsSources['!cols'] = [{ width: 25 }, { width: 35 }, { width: 50 }, { width: 50 }];
        XLSX.utils.book_append_sheet(workbook, wsSources, 'Marco Legal');

        // Export
        const fileName = `MASTER_REPORT_${meta.aviso || 'UNNAMED'}_${Date.now()}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        showToast('💎 Excel Enterprise Generado con Éxito', 'success');
    } catch (error) {
        console.error('Error al exportar Excel:', error);
        showToast('Error al exportar a Excel', 'error');
    }
}

// ==================== TEMPLATE MANAGEMENT ====================
async function saveTemplate() {
    if (!window.STATE || !window.STATE.budget || window.STATE.budget.length === 0) {
        showToast('No hay nada que guardar', 'error');
        return;
    }

    const templateName = prompt('Nombre de la plantilla:', `Presupuesto_${new Date().toLocaleDateString()}`);
    if (!templateName) return;

    const template = {
        name: templateName,
        date: new Date().toISOString(),
        budget: window.STATE.budget,
        meta: window.STATE.meta,
        editedPrices: window.STATE.editedPrices || {},
        summary: window.STATE.summary
    };

    // 1. CLOUD SAVE (If Logged In)
    let cloudSaved = false;
    if (window.firebase && firebase.auth().currentUser) {
        showToast('☁️ Guardando en la nube...', 'info');
        cloudSaved = await window.saveBudgetToCloud(template);
    }

    // 2. LOCAL SAVE (Always as backup/offline)
    const templates = JSON.parse(localStorage.getItem('construmetrix_templates') || '[]');
    templates.push(template);
    localStorage.setItem('construmetrix_templates', JSON.stringify(templates));

    if (cloudSaved) {
        showToast(`✅ Guardado en Nube y Local: "${templateName}"`, 'success');
    } else {
        showToast(`✅ Guardado Localmente: "${templateName}"`, 'success');
    }
}

// Global memory to hold merged templates for loading
let MERGED_TEMPLATES = [];

async function openTemplateModal() {
    const modal = document.getElementById('templateModal');
    const templateList = document.getElementById('templateList');

    if (!modal || !templateList) return;

    // 1. Load Local
    const localTemplates = JSON.parse(localStorage.getItem('construmetrix_templates') || '[]');
    let cloudTemplates = [];

    // 2. Load Cloud (If Logged In)
    if (window.firebase && firebase.auth().currentUser && window.getCloudBudgets) {
        templateList.innerHTML = '<div class="text-center py-8"><div class="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto"></div><p class="text-xs text-gray-500 mt-2">Sincronizando Nube...</p></div>';
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        cloudTemplates = await window.getCloudBudgets();
    }

    // 3. Merge Strategies (Simple concatenation for now)
    // Map to normalized structure
    const normalizedLocal = localTemplates.map(t => ({ ...t, source: 'local' }));
    const normalizedCloud = cloudTemplates.map(t => ({ ...t, source: 'cloud' }));

    MERGED_TEMPLATES = [...normalizedCloud, ...normalizedLocal];

    if (MERGED_TEMPLATES.length === 0) {
        templateList.innerHTML = `
            <div class="text-center py-12">
                <i data-lucide="folder-x" class="w-16 h-16 text-gray-700 mx-auto mb-4"></i>
                <p class="text-gray-500 text-sm">No tienes plantillas guardadas</p>
                <p class="text-gray-600 text-xs mt-2">Usa el botón GUARDAR para crear una</p>
            </div>
        `;
    } else {
        templateList.innerHTML = MERGED_TEMPLATES.map((template, index) => `
            <div class="bg-dark-bg border border-dark-border rounded-xl p-4 hover:border-brand/40 transition-all group relative overflow-hidden">
                ${template.source === 'cloud'
                ? '<div class="absolute top-0 right-0 bg-brand/20 text-brand text-[9px] px-2 py-0.5 rounded-bl-lg font-bold">NUBE ☁️</div>'
                : '<div class="absolute top-0 right-0 bg-gray-700/20 text-gray-400 text-[9px] px-2 py-0.5 rounded-bl-lg font-bold">LOCAL 💾</div>'}
                
                <div class="flex items-start justify-between mt-2">
                    <div class="flex-1">
                        <h4 class="font-bold text-white group-hover:text-brand transition-colors">${template.name}</h4>
                        <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span class="flex items-center gap-1">
                                <i data-lucide="calendar" class="w-3 h-3"></i>
                                ${new Date(template.date).toLocaleDateString()}
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="shopping-cart" class="w-3 h-3"></i>
                                ${template.budget ? template.budget.length : 0} ítems
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="dollar-sign" class="w-3 h-3"></i>
                                ${template.summary ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(template.summary.market) : 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="loadTemplate(${index})" 
                            class="px-3 py-1.5 bg-brand/10 text-brand rounded-lg text-xs font-bold hover:bg-brand/20 transition-colors">
                            Cargar
                        </button>
                        ${template.source === 'local' ? `
                        <button onclick="deleteTemplate(${index})" 
                            class="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors">
                            <i data-lucide="trash-2" class="w-3 h-3"></i>
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
}

function closeTemplateModal() {
    const modal = document.getElementById('templateModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function loadTemplate(index) {
    if (!MERGED_TEMPLATES || MERGED_TEMPLATES.length === 0) return;
    const template = MERGED_TEMPLATES[index];

    if (!template) {
        showToast('Plantilla no encontrada', 'error');
        return;
    }

    // Load template data into STATE
    window.STATE.budget = template.budget;
    window.STATE.meta = template.meta;
    window.STATE.editedPrices = template.editedPrices || {};
    window.STATE.summary = template.summary;

    // Update UI inputs
    if (window.STATE.meta) {
        const meta = window.STATE.meta;
        if (document.getElementById('baseArea')) document.getElementById('baseArea').value = meta.area;
        if (document.getElementById('baseHeight')) document.getElementById('baseHeight').value = meta.height;
        if (document.getElementById('regionSelect')) document.getElementById('regionSelect').value = meta.region;
        if (document.getElementById('estratoSelect')) document.getElementById('estratoSelect').value = meta.estrato;
        if (document.getElementById('conservationSelect')) document.getElementById('conservationSelect').value = meta.conservation;
        if (document.getElementById('statusSelect')) document.getElementById('statusSelect').value = meta.projectState;
        if (document.getElementById('marketFactor')) document.getElementById('marketFactor').value = meta.marketMultiplier;
        if (document.getElementById('qualitySlider')) document.getElementById('qualitySlider').value = meta.qualityMultiplier;
    }

    // Trigger recalculate
    if (window.recalculate) window.recalculate();

    closeTemplateModal();
    showToast(`✅ Plantilla "${template.name}" cargada`, 'success');
}

function deleteTemplate(index) {
    if (!confirm('¿Eliminar esta plantilla permanentemente?')) return;

    const templates = JSON.parse(localStorage.getItem('construmetrix_templates') || '[]');
    templates.splice(index, 1);
    localStorage.setItem('construmetrix_templates', JSON.stringify(templates));

    openTemplateModal(); // Refresh the list
    showToast('Plantilla eliminada', 'success');
}

// ==================== PWA INSTALL ====================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install banner after 5 seconds
    setTimeout(() => {
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) {
            banner.classList.remove('hidden');
        }
    }, 5000);
});

function installPWA() {
    if (!deferredPrompt) {
        showToast('La app ya está instalada o no está disponible', 'error');
        return;
    }

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            showToast('✅ ¡Gracias por instalar CONSTRUMETRIX!', 'success');
        }
        deferredPrompt = null;
        dismissPWAPrompt();
    });
}

function dismissPWAPrompt() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

// Check PWA status and update badge
window.addEventListener('load', () => {
    const badge = document.getElementById('pwaStatusBadge');
    if (!badge) return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        badge.classList.remove('hidden');
        badge.textContent = '✓ Instalada';
        badge.classList.remove('bg-brand/10', 'text-brand', 'border-brand/20');
        badge.classList.add('bg-emerald-500/10', 'text-emerald-400', 'border-emerald-500/20');
    }
    // Check if service worker is registered
    else if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
            badge.classList.remove('hidden');
        });
    }
});

// ==================== PERFORMANCE OPTIMIZATIONS ====================

// Lazy load images (future enhancement)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
}

// ========================================================
// 🚀 CONSTRUMETRIX v3.0 - ADVANCED ENTERPRISE FEATURES
// ========================================================

console.log('✨ CONSTRUMETRIX v3.0 - Advanced Features Loaded');
