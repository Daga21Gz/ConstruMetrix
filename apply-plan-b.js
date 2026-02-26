const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// Replace Inputs
const blockRegex = /<label(?: class="block")?>\s*<span(?:[^>]*)>([^<]+)<\/span>\s*<input([^>]*)id="([^"]+)"([^>]*)class="([^"]*?)(?: py-2\.5)?(?: px-3)?([^"]*)"([^>]*)>\s*<\/label>/g;

content = content.replace(blockRegex, (match, labelText, attr1, id, attr2, classPrev, classNext, attr3) => {
    let cleanedAttrs = (attr1 + attr2 + attr3).replace(/\s*placeholder="[^"]*"/, '');
    let floatingInputClass = `${classPrev} ${classNext} peer w-full bg-dark-card border border-dark-border rounded-xl px-3 pb-2 pt-6 text-xs text-white outline-none focus:border-brand transition-all`.replace(/\s+/g, ' ').trim();
    floatingInputClass = [...new Set(floatingInputClass.split(' '))].join(' ');

    let floatingLabelClass = `absolute text-[10px] uppercase font-bold tracking-wider text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-3 peer-focus:text-brand peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none`;

    return `<div class="relative w-full">
    <input id="${id}"${cleanedAttrs} class="${floatingInputClass}" placeholder=" " />
    <label for="${id}" class="${floatingLabelClass}">${labelText.trim()}</label>
</div>`;
});

// Update landArea and landPrice that didn't have outer labels
content = content.replace(/<input type="number" id="landArea"([^>]*)>/g, `<div class="relative w-full">
    <input type="number" id="landArea"$1 class="w-full bg-dark-card border border-dark-border rounded-xl px-3 pb-2 pt-6 text-xs text-white font-mono outline-none focus:border-brand peer transition-all" placeholder=" ">
    <label for="landArea" class="absolute text-[10px] font-bold tracking-wider text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-3 peer-focus:text-brand peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none uppercase">Área Lote m²</label>
</div>`);

content = content.replace(/<input type="number" id="landPrice"([^>]*)>/g, `<div class="relative w-full">
    <input type="number" id="landPrice"$1 class="w-full bg-dark-card border border-dark-border rounded-xl px-3 pb-2 pt-6 text-xs text-white font-mono outline-none focus:border-brand peer transition-all" placeholder=" ">
    <label for="landPrice" class="absolute text-[10px] font-bold tracking-wider text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-3 peer-focus:text-brand peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none uppercase">$ x m² Lote</label>
</div>`);

// Modifying Selects
const selectRegex = /<label class="block">\s*<span(?:[^>]*)>([^<]+)<\/span>\s*<select([^>]*)id="([^"]+)"([^>]*)class="([^"]*?)(?: py-2\.5)?(?: px-3)?([^"]*)"([^>]*)>([\s\S]*?)<\/select>\s*<\/label>/g;

content = content.replace(selectRegex, (match, labelText, attr1, id, attr2, classPrev, classNext, attr3, options) => {
    let selectClass = `${classPrev} ${classNext} w-full bg-dark-card border border-dark-border rounded-xl px-3 pb-2 pt-6 text-xs text-white outline-none focus:border-brand transition-all cursor-pointer appearance-none`.replace(/\s+/g, ' ').trim();
    selectClass = [...new Set(selectClass.split(' '))].join(' ');

    // Static floating label for select
    let floatingLabelClass = `absolute text-[9px] uppercase font-bold tracking-widest text-gray-500 top-2 z-10 start-3 pointer-events-none group-focus-within:text-brand transition-colors`;

    return `<div class="relative w-full group">
    <label for="${id}" class="${floatingLabelClass}">${labelText.trim()}</label>
    <select id="${id}"${attr1}${attr2}${attr3} class="${selectClass}">
        ${options.trim()}
    </select>
    <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
        <i data-lucide="chevron-down" class="w-4 h-4 text-gray-500 group-focus-within:text-brand transition-colors"></i>
    </div>
</div>`;
});


fs.writeFileSync('index.html', content);
