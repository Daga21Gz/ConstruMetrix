/**
 * CONSTRUMETRIX - ADVANCED FEATURES MODULE
 * v2.0 - PWA + Excel Export + Templates
 */

// ==================== EXCEL EXPORT ====================
// ==================== EXCEL & PDF EXPORT ====================

function exportToPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        showToast('Biblioteca PDF no cargada. Intenta recargar.', 'error');
        return;
    }

    if (!window.STATE || !window.STATE.budget || window.STATE.budget.length === 0) {
        showToast('No hay datos para reportar', 'error');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // --- HEADER ---
        doc.setFillColor(79, 70, 229); // Brand Indigo
        doc.rect(0, 0, pageWidth, 25, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('CONSTRUMETRIX | REPORTE EJECUTIVO', 15, 16);

        // Date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date().toLocaleDateString(), pageWidth - 15, 16, { align: 'right' });

        // --- METADATA ---
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);

        let y = 35;
        doc.text(`Proyecto / Predio: ${window.STATE.meta.cedula || 'Sin Referencia'}`, 15, y);
        doc.text(`Región: ${window.STATE.meta.region.toUpperCase()}`, 15, y + 6);
        doc.text(`Área: ${window.STATE.meta.area} m²`, 15, y + 12);

        doc.text(`Estrato: ${window.STATE.meta.estrato}`, 120, y);
        doc.text(`Calidad: ${window.STATE.meta.qualityMultiplier.toFixed(1)}x`, 120, y + 6);
        doc.text(`Valor m²: ${window.APP_UTILS.format(window.STATE.summary.sqm)}`, 120, y + 12);

        // --- TABLE ---
        const columns = ["Item", "Descripción", "Unidad", "Cant", "Unitario", "Total"];
        const rows = window.STATE.budget.map(item => {
            const originalPrice = item.precios[window.STATE.meta.region] || 0;
            const basePrice = window.STATE.editedPrices && window.STATE.editedPrices[item.codigo] !== undefined
                ? window.STATE.editedPrices[item.codigo]
                : originalPrice;

            // Apply consistency logic
            const stateMult = (window.APP_UTILS && window.APP_UTILS.factors.state[window.STATE.meta.projectState]) || 1.0;
            const qualityMult = window.STATE.meta.qualityMultiplier || 1.0;
            const price = basePrice * stateMult * qualityMult;

            let qty = item.quantity;
            if (item.calcMode === 'volume') qty *= window.STATE.meta.area * window.STATE.meta.height;
            else if (item.calcMode === 'area') qty *= window.STATE.meta.area;

            return [
                item.codigo,
                item.nombre,
                item.unidad,
                qty.toFixed(2),
                '$' + Math.round(price).toLocaleString(),
                '$' + Math.round(price * qty).toLocaleString()
            ];
        });

        doc.autoTable({
            startY: 60,
            head: [columns],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [63, 63, 70], textColor: 255, fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 60 }
        });

        // --- SUMMARY ---
        let finalY = doc.lastAutoTable.finalY + 10;

        // Prevent page overflow
        if (finalY > 250) {
            doc.addPage();
            finalY = 20;
        }

        doc.setFillColor(240, 240, 255);
        doc.rect(120, finalY, pageWidth - 135, 40, 'F');
        doc.setDrawColor(200, 200, 255);
        doc.rect(120, finalY, pageWidth - 135, 40, 'S');

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text("RESUMEN FINANCIERO", 125, finalY + 8);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text("Costos Directos:", 125, finalY + 16);
        doc.text("AIU + Indirectos:", 125, finalY + 22);
        doc.text("Valor Reposición Nuevo:", 125, finalY + 28);

        doc.setFont('helvetica', 'bold');
        doc.text("AVALÚO COMERCIAL:", 125, finalY + 36);

        // Values
        const s = window.STATE.summary;
        const fmt = window.APP_UTILS.format;

        doc.text(fmt(s.direct), 190, finalY + 16, { align: 'right' });
        doc.text(fmt(s.aiu), 190, finalY + 22, { align: 'right' });
        doc.text(fmt(s.crn), 190, finalY + 28, { align: 'right' });

        doc.setTextColor(79, 70, 229);
        doc.setFontSize(11);
        doc.text(fmt(s.market), 190, finalY + 36, { align: 'right' });

        // Save
        doc.save(`Presupuesto_ConstruMetrix_${new Date().getTime()}.pdf`);
        showToast('📄 PDF Generado Exitosamente', 'success');

    } catch (err) {
        console.error("PDF Fail", err);
        showToast('Error generando PDF', 'error');
    }
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
