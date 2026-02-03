/**
 * CONSTRUMETRIX - ADVANCED FEATURES MODULE
 * v2.0 - PWA + Excel Export + Templates
 */

// ==================== EXCEL EXPORT ====================
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

        // SHEET 1: Presupuesto Detallado
        const budgetData = [];

        // Header
        budgetData.push([
            'CONSTRUMETRIX - PRESUPUESTO DETALLADO',
            '',
            '',
            '',
            '',
            `Fecha: ${new Date().toLocaleDateString()}`
        ]);
        budgetData.push([]);

        // Metadata
        budgetData.push(['Región:', window.STATE.meta.region]);
        budgetData.push(['Área (m²):', window.STATE.meta.area]);
        budgetData.push(['Estrato:', window.STATE.meta.estrato]);
        budgetData.push(['Calidad:', window.STATE.meta.qualityMultiplier]);
        budgetData.push([]);

        // Table headers
        budgetData.push([
            'CÓDIGO',
            'DESCRIPCIÓN',
            'UNIDAD',
            'CANTIDAD',
            'PRECIO UNIT.',
            'TOTAL'
        ]);

        // Budget items
        const format = window.APP_UTILS ? window.APP_UTILS.format : (n) => `$${n.toLocaleString()}`;

        window.STATE.budget.forEach(item => {
            const originalPrice = item.precios[window.STATE.meta.region] || 0;
            const basePrice = window.STATE.editedPrices && window.STATE.editedPrices[item.codigo] !== undefined
                ? window.STATE.editedPrices[item.codigo]
                : originalPrice;

            // Apply Expert Multipliers (Consistency with app.js)
            const stateMult = (window.APP_UTILS && window.APP_UTILS.factors.state[window.STATE.meta.projectState]) || 1.0;
            const qualityMult = window.STATE.meta.qualityMultiplier || 1.0;
            const price = basePrice * stateMult * qualityMult;

            let qty = item.quantity;
            if (item.calcMode === 'volume') qty *= window.STATE.meta.area * window.STATE.meta.height;
            else if (item.calcMode === 'area') qty *= window.STATE.meta.area;

            const total = price * qty;

            budgetData.push([
                item.codigo,
                item.nombre,
                item.unidad,
                qty.toFixed(2),
                price,
                total
            ]);
        });

        budgetData.push([]);

        // Summary
        if (window.STATE.summary) {
            budgetData.push(['RESUMEN FINANCIERO']);
            budgetData.push(['Costos Directos:', '', '', '', '', window.STATE.summary.direct]);
            budgetData.push(['AIU (A+I+U):', '', '', '', '', window.STATE.summary.aiu]);
            budgetData.push(['CRN (Reposición Nuevo):', '', '', '', '', window.STATE.summary.crn]);
            budgetData.push(['Depreciación:', '', '', '', '', window.STATE.summary.depreciated]);
            budgetData.push(['Valor del Terreno:', '', '', '', '', window.STATE.summary.land]);
            budgetData.push(['AVALÚO COMERCIAL:', '', '', '', '', window.STATE.summary.market]);
        }

        const ws1 = XLSX.utils.aoa_to_sheet(budgetData);

        // Column widths
        ws1['!cols'] = [
            { width: 12 },
            { width: 50 },
            { width: 10 },
            { width: 12 },
            { width: 15 },
            { width: 15 }
        ];

        XLSX.utils.book_append_sheet(workbook, ws1, 'Presupuesto');

        // SHEET 2: Análisis por Capítulos
        const chapterData = [['CAPÍTULO', 'INVERSIÓN']];

        const chapterTotals = {};
        window.STATE.budget.forEach(item => {
            const ch = item.chapter || 'General';
            if (!chapterTotals[ch]) chapterTotals[ch] = 0;

            const originalPrice = item.precios[window.STATE.meta.region] || 0;
            const basePrice = window.STATE.editedPrices && window.STATE.editedPrices[item.codigo] !== undefined
                ? window.STATE.editedPrices[item.codigo]
                : originalPrice;

            // Apply Expert Multipliers
            const stateMult = (window.APP_UTILS && window.APP_UTILS.factors.state[window.STATE.meta.projectState]) || 1.0;
            const qualityMult = window.STATE.meta.qualityMultiplier || 1.0;
            const price = basePrice * stateMult * qualityMult;

            let qty = item.quantity;
            if (item.calcMode === 'volume') qty *= window.STATE.meta.area * window.STATE.meta.height;
            else if (item.calcMode === 'area') qty *= window.STATE.meta.area;

            chapterTotals[ch] += price * qty;
        });

        Object.entries(chapterTotals).forEach(([ch, total]) => {
            chapterData.push([ch, total]);
        });

        const ws2 = XLSX.utils.aoa_to_sheet(chapterData);
        ws2['!cols'] = [{ width: 30 }, { width: 15 }];
        XLSX.utils.book_append_sheet(workbook, ws2, 'Por Capítulos');

        // Export
        const fileName = `CONSTRUMETRIX_Presupuesto_${new Date().getTime()}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        showToast('✅ Excel exportado exitosamente', 'success');
    } catch (error) {
        console.error('Error al exportar Excel:', error);
        showToast('Error al exportar a Excel', 'error');
    }
}

// ==================== TEMPLATE MANAGEMENT ====================
function saveTemplate() {
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

    const templates = JSON.parse(localStorage.getItem('construmetrix_templates') || '[]');
    templates.push(template);
    localStorage.setItem('construmetrix_templates', JSON.stringify(templates));

    showToast(`✅ Plantilla "${templateName}" guardada`, 'success');
}

function openTemplateModal() {
    const modal = document.getElementById('templateModal');
    const templateList = document.getElementById('templateList');

    if (!modal || !templateList) return;

    const templates = JSON.parse(localStorage.getItem('construmetrix_templates') || '[]');

    if (templates.length === 0) {
        templateList.innerHTML = `
            <div class="text-center py-12">
                <i data-lucide="folder-x" class="w-16 h-16 text-gray-700 mx-auto mb-4"></i>
                <p class="text-gray-500 text-sm">No tienes plantillas guardadas aún</p>
                <p class="text-gray-600 text-xs mt-2">Usa el botón GUARDAR para crear una</p>
            </div>
        `;
    } else {
        templateList.innerHTML = templates.map((template, index) => `
            <div class="bg-dark-bg border border-dark-border rounded-xl p-4 hover:border-brand/40 transition-all group">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h4 class="font-bold text-white group-hover:text-brand transition-colors">${template.name}</h4>
                        <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span class="flex items-center gap-1">
                                <i data-lucide="calendar" class="w-3 h-3"></i>
                                ${new Date(template.date).toLocaleDateString()}
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="shopping-cart" class="w-3 h-3"></i>
                                ${template.budget.length} ítems
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
                        <button onclick="deleteTemplate(${index})" 
                            class="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors">
                            <i data-lucide="trash-2" class="w-3 h-3"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
}

function closeTemplateModal() {
    const modal = document.getElementById('templateModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function loadTemplate(index) {
    const templates = JSON.parse(localStorage.getItem('construmetrix_templates') || '[]');
    const template = templates[index];

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
