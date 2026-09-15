// Tipos de archivo cuya extensión "canónica" no cubre variantes habituales
// (Google no agrupa doc/docx, xls/xlsx, etc. bajo una sola filetype:).
const FILETYPE_GROUPS = {
    doc: ['doc', 'docx'],
    xls: ['xls', 'xlsx'],
    ppt: ['ppt', 'pptx'],
    html: ['html', 'htm'],
    jpg: ['jpg', 'jpeg'],
    tiff: ['tiff', 'tif'],
    xsl: ['xsl', 'xslt'],
    yml: ['yml', 'yaml']
};

// Entrecomilla un valor si contiene espacios, para que operadores como
// intitle:/inurl:/intext:/site: acoten toda la frase y no solo la primera palabra.
function quoteIfMultiWord(value) {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const alreadyQuoted = trimmed.startsWith('"') && trimmed.endsWith('"');
    if (/\s/.test(trimmed) && !alreadyQuoted) {
        return `"${trimmed}"`;
    }
    return trimmed;
}

function splitList(value) {
    return value.split(',').map(v => v.trim()).filter(Boolean);
}

// Construye "operador:valor" para uno o varios valores separados por comas,
// uniendo varios con OR entre paréntesis (ej. site:a.com, b.com -> (site:a.com OR site:b.com)).
// Solo tiene sentido para atributos de un único valor por página (site:, filetype:):
// una página no puede estar a la vez en dos dominios ni ser de dos tipos de
// archivo distintos, así que "quiero cualquiera de estos" solo puede ser OR.
function buildOrClause(operator, rawValue) {
    const values = splitList(rawValue).map(quoteIfMultiWord).filter(Boolean);
    if (values.length === 0) return '';
    if (values.length === 1) return `${operator}:${values[0]}`;
    return '(' + values.map(v => `${operator}:${v}`).join(' OR ') + ')';
}

// Construye "operador:valor" repetido para uno o varios valores, unidos con
// espacios: en Google eso es AND implícito (ej. inurl:admin inurl:login exige
// ambos). Es el patrón real que usan los dorks para "quiero todos estos" en
// campos de contenido que sí pueden coexistir (intitle:, inurl:, intext:, define:).
function buildAndClause(operator, rawValue) {
    const values = splitList(rawValue).map(quoteIfMultiWord).filter(Boolean);
    if (values.length === 0) return '';
    return values.map(v => `${operator}:${v}`).join(' ');
}

// Construye exclusiones "-operador:valor" (o "-valor") para uno o varios valores,
// encadenadas con AND implícito (cada término se excluye por separado).
function buildExcludeClause(rawValue, operator) {
    const values = splitList(rawValue).map(quoteIfMultiWord).filter(Boolean);
    if (values.length === 0) return '';
    const prefix = operator ? `-${operator}:` : '-';
    return values.map(v => `${prefix}${v}`).join(' ');
}

// Uno o varios tipos de archivo, cada uno expandido si tiene variantes
// habituales (doc -> doc/docx), todo aplanado en un único grupo OR.
function buildFiletypeClause(rawValue) {
    const values = splitList(rawValue);
    if (values.length === 0) return '';
    const extensions = [];
    values.forEach(value => {
        const group = FILETYPE_GROUPS[value.toLowerCase()];
        if (group) {
            extensions.push(...group);
        } else {
            extensions.push(value);
        }
    });
    const clauses = extensions.map(ext => `filetype:${quoteIfMultiWord(ext)}`);
    if (clauses.length === 1) return clauses[0];
    return '(' + clauses.join(' OR ') + ')';
}

// Coincidencia exacta: una o varias frases entrecomilladas de forma
// independiente y unidas con espacio ("frase1" "frase2"), que en Google es
// AND implícito: exige que aparezcan TODAS, no basta con una.
function buildExactMatchClause(rawValue) {
    const values = splitList(rawValue);
    if (values.length === 0) return '';
    return values.map(v => `"${v}"`).join(' ');
}

// Campo de etiquetas: envuelve un input oculto (el que lee la búsqueda) con
// una caja donde cada término confirmado con Intro se muestra como una
// etiqueta eliminable, y el texto sin confirmar se sigue escribiendo en un
// input interno. El input oculto se mantiene siempre sincronizado con
// "etiquetas + texto sin confirmar", unidos por coma (OR) o espacio (AND,
// para allinurl/allintitle/allintext) según data-joiner.
const tagInputResetters = [];

function initTagInputs() {
    document.querySelectorAll('.tag-input').forEach(wrapper => {
        const hidden = document.getElementById(wrapper.dataset.for);
        const chipsContainer = wrapper.querySelector('.tag-input-chips');
        const entry = wrapper.querySelector('.tag-input-entry');
        const joiner = wrapper.dataset.joiner === 'space' ? ' ' : ', ';
        if (!hidden || !chipsContainer || !entry) return;

        let chips = [];

        function sync() {
            const provisional = entry.value.trim();
            const all = provisional ? chips.concat([provisional]) : chips;
            hidden.value = all.join(joiner);
        }

        function render() {
            chipsContainer.innerHTML = '';
            chips.forEach((text, idx) => {
                const chip = document.createElement('span');
                chip.className = 'tag-chip';

                const label = document.createElement('span');
                label.textContent = text;
                chip.appendChild(label);

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'tag-chip-remove';
                removeBtn.textContent = '×';
                removeBtn.setAttribute('aria-label', `Eliminar "${text}"`);
                removeBtn.addEventListener('click', () => {
                    chips.splice(idx, 1);
                    render();
                    sync();
                    entry.focus();
                });
                chip.appendChild(removeBtn);

                chipsContainer.appendChild(chip);
            });
        }

        entry.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                const value = entry.value.trim();
                if (!value) return;
                chips.push(value);
                entry.value = '';
                render();
                sync();
            } else if (event.key === 'Backspace' && entry.value === '' && chips.length > 0) {
                chips.pop();
                render();
                sync();
            }
        });

        entry.addEventListener('input', sync);

        tagInputResetters.push(() => {
            chips = [];
            entry.value = '';
            render();
            sync();
        });

        sync();
    });
}

initTagInputs();

// Rango de fechas (after: / before:): los campos de fecha #afterFilter/#beforeFilter
// (editables a mano) y el slider de doble tirador son complementarios y se
// mantienen sincronizados en ambos sentidos.
const MS_PER_DAY = 86400000;
const DATE_RANGE_MIN = new Date(2000, 0, 1);
const DATE_RANGE_MAX = new Date();
DATE_RANGE_MAX.setHours(0, 0, 0, 0);
const DATE_RANGE_TOTAL_DAYS = Math.round((DATE_RANGE_MAX - DATE_RANGE_MIN) / MS_PER_DAY);

const afterRange = document.getElementById('afterRange');
const beforeRange = document.getElementById('beforeRange');
const dateRangeFill = document.getElementById('dateRangeFill');
const afterFilterInput = document.getElementById('afterFilter');
const beforeFilterInput = document.getElementById('beforeFilter');

function dateToDayIndex(isoDateStr) {
    const parsed = new Date(isoDateStr + 'T00:00:00');
    return Math.round((parsed - DATE_RANGE_MIN) / MS_PER_DAY);
}

function dayIndexToISODate(dayIndex) {
    return new Date(DATE_RANGE_MIN.getTime() + dayIndex * MS_PER_DAY).toISOString().split('T')[0];
}

function clampDayIndex(value) {
    return Math.min(Math.max(value, 0), DATE_RANGE_TOTAL_DAYS);
}

function updateDateRangeFill() {
    const afterVal = parseInt(afterRange.value, 10);
    const beforeVal = parseInt(beforeRange.value, 10);
    const afterPercent = (afterVal / DATE_RANGE_TOTAL_DAYS) * 100;
    const beforePercent = (beforeVal / DATE_RANGE_TOTAL_DAYS) * 100;
    dateRangeFill.style.left = afterPercent + '%';
    dateRangeFill.style.width = Math.max(0, beforePercent - afterPercent) + '%';
}

// El usuario ha escrito/elegido una fecha a mano: mueve el tirador correspondiente.
function syncSlidersFromDateInputs() {
    const afterIdx = afterFilterInput.value ? clampDayIndex(dateToDayIndex(afterFilterInput.value)) : 0;
    const beforeIdx = beforeFilterInput.value ? clampDayIndex(dateToDayIndex(beforeFilterInput.value)) : DATE_RANGE_TOTAL_DAYS;
    afterRange.value = String(afterIdx);
    beforeRange.value = String(beforeIdx);
    updateDateRangeFill();
}

// El usuario ha arrastrado un tirador: escribe la fecha resultante en su campo.
function syncDateInputsFromSliders(movedHandle) {
    let afterVal = parseInt(afterRange.value, 10);
    let beforeVal = parseInt(beforeRange.value, 10);

    if (afterVal > beforeVal) {
        if (movedHandle === beforeRange) {
            afterVal = beforeVal;
            afterRange.value = String(afterVal);
        } else {
            beforeVal = afterVal;
            beforeRange.value = String(beforeVal);
        }
    }

    afterFilterInput.value = afterVal > 0 ? dayIndexToISODate(afterVal) : '';
    beforeFilterInput.value = beforeVal < DATE_RANGE_TOTAL_DAYS ? dayIndexToISODate(beforeVal) : '';
    updateDateRangeFill();
}

function initDateRange() {
    afterRange.min = '0';
    afterRange.max = String(DATE_RANGE_TOTAL_DAYS);
    beforeRange.min = '0';
    beforeRange.max = String(DATE_RANGE_TOTAL_DAYS);
    syncSlidersFromDateInputs();
}

afterRange.addEventListener('input', () => syncDateInputsFromSliders(afterRange));
beforeRange.addEventListener('input', () => syncDateInputsFromSliders(beforeRange));
afterFilterInput.addEventListener('input', syncSlidersFromDateInputs);
beforeFilterInput.addEventListener('input', syncSlidersFromDateInputs);
initDateRange();

// Función principal de búsqueda
document.getElementById('searchButton').addEventListener('click', function() {
    let query = document.getElementById('searchBar').value.trim();
    let site = document.getElementById('siteFilter').value;
    let intitle = document.getElementById('intitleFilter').value;
    let inurl = document.getElementById('inurlFilter').value;
    let filetype = document.getElementById('filetypeFilter').value;
    let intext = document.getElementById('intextFilter').value;
    let allinurl = document.getElementById('allinurlFilter').value;
    let allintitle = document.getElementById('allintitleFilter').value;
    let allintext = document.getElementById('allintextFilter').value;
    let define = document.getElementById('defineFilter').value;
    let before = document.getElementById('beforeFilter').value;
    let after = document.getElementById('afterFilter').value;
    let siteExclude = document.getElementById('siteExcludeFilter').value;
    let excludeTerm = document.getElementById('excludeTermFilter').value;
    let exactMatch = document.getElementById('exactMatchFilter').value;

    // Aviso si se mezcla algún allin* con otros operadores en la misma consulta:
    // Google no garantiza resultados fiables en ese caso.
    const usesAllIn = Boolean(allinurl || allintitle || allintext);
    const usesOtherOperator = Boolean(
        site || intitle || inurl || filetype || intext || define ||
        before || after || siteExclude || excludeTerm || exactMatch
    );
    const warningBox = document.getElementById('dorkWarning');
    if (warningBox) {
        warningBox.hidden = !(usesAllIn && usesOtherOperator);
    }

    // Construir la búsqueda usando los filtros de Google Dorks
    const clauses = [query];

    const siteClause = buildOrClause('site', site);
    if (siteClause) clauses.push(siteClause);

    const intitleClause = buildAndClause('intitle', intitle);
    if (intitleClause) clauses.push(intitleClause);

    const inurlClause = buildAndClause('inurl', inurl);
    if (inurlClause) clauses.push(inurlClause);

    const filetypeClause = buildFiletypeClause(filetype);
    if (filetypeClause) clauses.push(filetypeClause);

    const intextClause = buildAndClause('intext', intext);
    if (intextClause) clauses.push(intextClause);

    if (allinurl.trim()) clauses.push(`allinurl:${allinurl.trim()}`);
    if (allintitle.trim()) clauses.push(`allintitle:${allintitle.trim()}`);
    if (allintext.trim()) clauses.push(`allintext:${allintext.trim()}`);

    const defineClause = buildAndClause('define', define);
    if (defineClause) clauses.push(defineClause);

    if (before) clauses.push(`before:${before}`);
    if (after) clauses.push(`after:${after}`);

    const siteExcludeClause = buildExcludeClause(siteExclude, 'site');
    if (siteExcludeClause) clauses.push(siteExcludeClause);

    const excludeTermClause = buildExcludeClause(excludeTerm, '');
    if (excludeTermClause) clauses.push(excludeTermClause);

    const exactMatchClause = buildExactMatchClause(exactMatch);
    if (exactMatchClause) clauses.push(exactMatchClause);

    if (document.getElementById('excludeAI').checked) {
        clauses.push('-site:chat.openai.com -chatgpt -openai -copilot -bard -ai -generated -inurl:ai -inurl:generated');
    }
    // Añadir filtro Google Drive / Docs indexados si está marcado
    const driveCheckbox = document.getElementById('driveIndexado');
    if (driveCheckbox && driveCheckbox.checked) {
        clauses.push('(site:drive.google.com OR site:docs.google.com) -sign');
    }

    const searchQuery = clauses.filter(Boolean).join(' ').trim();

    // Parámetros de URL no documentados (ingeniería inversa) que complementan los dorks
    const urlParams = [];
    const classicWebCheckbox = document.getElementById('classicWeb');
    if (classicWebCheckbox && classicWebCheckbox.checked) {
        urlParams.push('udm=14');
    }
    const literalModeCheckbox = document.getElementById('literalMode');
    if (literalModeCheckbox && literalModeCheckbox.checked) {
        urlParams.push('tbs=li:1');
    }

    // Redirigir a Google con la búsqueda construida
    let url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    if (urlParams.length > 0) {
        url += `&${urlParams.join('&')}`;
    }
    window.open(url, '_blank');
});

// El buscador principal es texto libre, no un campo de etiquetas: Intro
// siempre lanza la búsqueda desde ahí, esté el foco donde esté en el resto.
document.getElementById('searchBar').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('searchButton').click();
    }
});

// En el resto de campos, Intro añade una etiqueta (ver initTagInputs) en vez
// de buscar. Intro solo lanza la búsqueda cuando no hay ningún campo
// seleccionado (el foco no está en ningún input/botón/casilla).
document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const active = document.activeElement;
    const nothingSelected = !active || active === document.body || active === document.documentElement;
    if (nothingSelected) {
        event.preventDefault();
        document.getElementById('searchButton').click();
    }
});

// Borrar filtros
const clearFiltersButton = document.getElementById('clearFiltersButton');
clearFiltersButton.addEventListener('click', clearFilters);

function clearFilters() {
    // Limpiamos los valores de los filtros de texto/fecha
    const filters = document.querySelectorAll('.form-control');
    filters.forEach(filter => {
        filter.value = '';
    });

    // Limpiamos las etiquetas confirmadas y el texto sin confirmar de cada
    // campo de etiquetas (site, intitle, filetype, coincidencia exacta...).
    tagInputResetters.forEach(reset => reset());

    // Limpiamos las casillas, salvo el interruptor de apariencia (modo oscuro)
    const checkboxes = document.querySelectorAll('.form-check-input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.id !== 'toggle_dark') {
            checkbox.checked = false;
        }
    });

    const warningBox = document.getElementById('dorkWarning');
    if (warningBox) {
        warningBox.hidden = true;
    }

    initDateRange();
}


//modo oscuro
const toggleButton = document.getElementById('toggle_dark');
const logo = document.querySelector('.logo');
const originalLogoSrc = logo.src;

toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    logo.src = document.body.classList.contains('dark-mode')
        ? 'img/DorkSeek_Logo_dark.jpg'
        : originalLogoSrc;
});


// Idioma de la interfaz (ES / EN)
const I18N = {
    pageHeading: { es: 'Buscador Google Dorks', en: 'Google Dorks Search Tool' },
    clearFiltersButton: { es: 'Borrar Filtros', en: 'Clear Filters' },
    searchButton: { es: 'Buscar en Google', en: 'Search on Google' },
    searchBar: {
        es: { placeholder: 'Introduce tu búsqueda' },
        en: { placeholder: 'Enter your search' }
    },
    filetypeFilterEntry: {
        es: { label: 'Tipo de archivo (filetype:)', placeholder: "Ej: 'pdf' + Intro", title: 'Busca uno o varios tipos de archivo en los resultados (filetype:pdf OR filetype:doc).\n\nEscribe un valor y pulsa Intro para añadirlo como etiqueta; puedes añadir varios.\n\nPara tipos con varias extensiones habituales (doc/docx, xls/xlsx, ppt/pptx, html/htm, jpg/jpeg, tiff/tif, xsl/xslt) cada etiqueta se expande automáticamente (filetype:doc OR filetype:docx), ya que Google no agrupa esas extensiones.' },
        en: { label: 'File type (filetype:)', placeholder: "E.g. 'pdf' + Enter", title: "Searches for one or more file types in the results (filetype:pdf OR filetype:doc).\n\nType a value and press Enter to add it as a tag; you can add several.\n\nFor types with common extension variants (doc/docx, xls/xlsx, ppt/pptx, html/htm, jpg/jpeg, tiff/tif, xsl/xslt) each tag expands automatically (filetype:doc OR filetype:docx), since Google doesn't group those extensions." }
    },
    exactMatchFilterEntry: {
        es: { label: 'Coincidencia exacta ("")', placeholder: "Ej: 'texto exacto' + Intro", title: 'Busca páginas que contengan el texto exacto de cada etiqueta.\n\nEscribe una frase y pulsa Intro para añadirla; con varias etiquetas se exige que aparezcan TODAS ("frase 1" "frase 2"), no basta con una.' },
        en: { label: 'Exact match ("")', placeholder: "E.g. 'exact text' + Enter", title: 'Searches for pages containing the exact text of each tag.\n\nType a phrase and press Enter to add it; with several tags ALL of them are required ("phrase 1" "phrase 2"), not just one.' }
    },
    siteFilterEntry: {
        es: { label: 'Dominio (site:)', placeholder: 'Ej: example.com + Intro', title: 'Limita los resultados a uno o varios dominios (site:a.com OR site:b.com).\n\nEscribe un dominio y pulsa Intro para añadirlo como etiqueta; puedes añadir varios.' },
        en: { label: 'Domain (site:)', placeholder: 'E.g. example.com + Enter', title: 'Limits results to one or more domains (site:a.com OR site:b.com).\n\nType a domain and press Enter to add it as a tag; you can add several.' }
    },
    intitleFilterEntry: {
        es: { label: 'Título contiene (intitle:)', placeholder: 'Ej: index of + Intro', title: 'Busca páginas donde el título contenga cada etiqueta.\n\nSi una etiqueta tiene varias palabras se entrecomilla automáticamente (intitle:"index of") para que Google la trate como una frase. Con varias etiquetas se exige que aparezcan TODAS (intitle:"a" intitle:"b"), no basta con una.' },
        en: { label: 'Title contains (intitle:)', placeholder: 'E.g. index of + Enter', title: 'Searches for pages where the title contains each tag.\n\nMulti-word tags are auto-quoted (intitle:"index of") so Google treats them as a phrase. With several tags ALL of them are required (intitle:"a" intitle:"b"), not just one.' }
    },
    inurlFilterEntry: {
        es: { label: 'URL contiene (inurl:)', placeholder: 'Ej: admin panel + Intro', title: 'Busca páginas donde la URL contenga cada etiqueta.\n\nSi una etiqueta tiene varias palabras se entrecomilla automáticamente (inurl:"admin panel"). Con varias etiquetas se exige que aparezcan TODAS (inurl:"a" inurl:"b"), no basta con una.' },
        en: { label: 'URL contains (inurl:)', placeholder: 'E.g. admin panel + Enter', title: 'Searches for pages where the URL contains each tag.\n\nMulti-word tags are auto-quoted (inurl:"admin panel"). With several tags ALL of them are required (inurl:"a" inurl:"b"), not just one.' }
    },
    intextFilterEntry: {
        es: { label: 'Texto (intext:)', placeholder: 'Ej: texto en el cuerpo + Intro', title: 'Busca páginas que contengan cada etiqueta en el cuerpo.\n\nLas etiquetas con varias palabras se entrecomillan automáticamente. Con varias etiquetas se exige que aparezcan TODAS, no basta con una.' },
        en: { label: 'Text (intext:)', placeholder: 'E.g. text in body + Enter', title: 'Searches for pages containing each tag in the body.\n\nMulti-word tags are auto-quoted. With several tags ALL of them are required, not just one.' }
    },
    allinurlFilterEntry: {
        es: { label: 'Todo en URL (allinurl:)', placeholder: 'Ej: texto + Intro', title: 'Busca páginas donde la URL contenga TODAS las etiquetas (allinurl: exige que aparezcan todas, no es OR).\n\nNo lo combines con otros operadores en la misma búsqueda: Google no garantiza resultados fiables cuando allin* se mezcla con filtros como site: o intitle:.' },
        en: { label: 'All in URL (allinurl:)', placeholder: 'E.g. text + Enter', title: "Searches for pages where the URL contains ALL the tags (allinurl: requires every one, it's not OR).\n\nDon't combine it with other operators in the same search: Google's results are unreliable when allin* is mixed with filters like site: or intitle:." }
    },
    allintitleFilterEntry: {
        es: { label: 'Todo en título (allintitle:)', placeholder: 'Ej: texto + Intro', title: 'Busca páginas cuyo título contenga TODAS las etiquetas (allintitle: exige que aparezcan todas, no es OR).\n\nNo lo combines con otros operadores en la misma búsqueda: Google no garantiza resultados fiables cuando allin* se mezcla con filtros como site: o intitle:.' },
        en: { label: 'All in title (allintitle:)', placeholder: 'E.g. text + Enter', title: "Searches for pages whose title contains ALL the tags (allintitle: requires every one, it's not OR).\n\nDon't combine it with other operators in the same search: Google's results are unreliable when allin* is mixed with filters like site: or intitle:." }
    },
    allintextFilterEntry: {
        es: { label: 'Todo en texto (allintext:)', placeholder: 'Ej: texto + Intro', title: 'Busca páginas cuyo cuerpo contenga TODAS las etiquetas (allintext: exige que aparezcan todas, no es OR).\n\nNo lo combines con otros operadores en la misma búsqueda: Google no garantiza resultados fiables cuando allin* se mezcla con filtros como site: o intitle:.' },
        en: { label: 'All in text (allintext:)', placeholder: 'E.g. text + Enter', title: "Searches for pages whose body contains ALL the tags (allintext: requires every one, it's not OR).\n\nDon't combine it with other operators in the same search: Google's results are unreliable when allin* is mixed with filters like site: or intitle:." }
    },
    defineFilterEntry: {
        es: { label: 'Definir (define:)', placeholder: 'Ej: ejemplo + Intro', title: 'Busca definiciones de términos directamente en Google. No documentado por Google; sin utilidad real en OSINT.\n\nCon varias etiquetas se exige que aparezcan TODAS.' },
        en: { label: 'Define (define:)', placeholder: 'E.g. example + Enter', title: "Searches for term definitions directly in Google. Undocumented by Google; no real OSINT use.\n\nWith several tags ALL of them are required." }
    },
    siteExcludeFilterEntry: {
        es: { label: 'Excluir dominio (-site:)', placeholder: 'Ej: example.com + Intro', title: 'Excluye resultados de uno o varios dominios.\n\nEscribe un dominio y pulsa Intro para añadirlo como etiqueta; puedes añadir varios.' },
        en: { label: 'Exclude domain (-site:)', placeholder: 'E.g. example.com + Enter', title: 'Excludes results from one or more domains.\n\nType a domain and press Enter to add it as a tag; you can add several.' }
    },
    excludeTermFilterEntry: {
        es: { label: 'Excluir término (-)', placeholder: 'Ej: forum + Intro', title: 'Excluye páginas que contengan cada etiqueta.\n\nEscribe un término y pulsa Intro para añadirlo; puedes añadir varios.' },
        en: { label: 'Exclude term (-)', placeholder: 'E.g. forum + Enter', title: 'Excludes pages containing each tag.\n\nType a term and press Enter to add it; you can add several.' }
    },
    afterFilter: {
        es: { label: 'Después (after:)', title: 'Limita los resultados a páginas publicadas después de esta fecha.\n\nOperador en beta desde 2019: puede dar resultados inconsistentes porque depende de metadatos de fecha que muchos sitios no gestionan bien.' },
        en: { label: 'After (after:)', title: 'Limits results to pages published after this date.\n\nOfficially in beta since 2019: results can be inconsistent since many sites handle date metadata poorly.' }
    },
    beforeFilter: {
        es: { label: 'Antes (before:)', title: 'Limita los resultados a páginas publicadas antes de esta fecha.\n\nOperador en beta desde 2019: puede dar resultados inconsistentes porque depende de metadatos de fecha que muchos sitios no gestionan bien.' },
        en: { label: 'Before (before:)', title: 'Limits results to pages published before this date.\n\nOfficially in beta since 2019: results can be inconsistent since many sites handle date metadata poorly.' }
    },
    excludeAI: {
        es: { text: 'Excluir términos típicos de IA (heurístico)', title: "Filtro heurístico: excluye páginas cuyo dominio o texto contiene términos típicos de IA (chatgpt, copilot, bard, etc).\n\nAdvertencia: no detecta contenido generado por IA de verdad, solo esas palabras clave, y puede ocultar resultados relevantes que simplemente las mencionen. Para quitar la capa de IA de Google (AI Overviews), usa 'Vista Web clásica'." },
        en: { text: 'Exclude typical AI terms (heuristic)', title: "Heuristic filter: excludes pages whose domain or text contains typical AI-related terms (chatgpt, copilot, bard, etc).\n\nWarning: it does not detect real AI-generated content, only those keywords, and can hide relevant results that simply mention them. To remove Google's own AI layer (AI Overviews), use 'Classic Web view'." }
    },
    classicWeb: {
        es: { text: 'Vista Web clásica (sin AI Overviews)', title: "Añade el parámetro udm=14 a la URL de Google, que muestra la pestaña 'Web' clásica sin AI Overviews ni resúmenes generados por IA.\n\nParámetro no documentado, obtenido por ingeniería inversa: puede dejar de funcionar sin aviso." },
        en: { text: 'Classic Web view (no AI Overviews)', title: "Adds the udm=14 parameter to the Google URL, showing the classic 'Web' tab without AI Overviews or AI-generated summaries.\n\nUndocumented, reverse-engineered parameter: it may stop working without notice." }
    },
    literalMode: {
        es: { text: 'Modo literal (sin sinónimos)', title: 'Añade el parámetro tbs=li:1 a la URL de Google, que desactiva sinónimos y corrección ortográfica automática (búsqueda literal).\n\nParámetro no documentado, obtenido por ingeniería inversa: puede dejar de funcionar sin aviso.' },
        en: { text: 'Literal mode (no synonyms)', title: 'Adds the tbs=li:1 parameter to the Google URL, which disables synonym expansion and automatic spell correction (literal search).\n\nUndocumented, reverse-engineered parameter: it may stop working without notice.' }
    },
    driveIndexado: {
        es: { text: 'Buscar en Google Drive / Docs', title: 'Busca documentos y carpetas indexados en Google Drive (drive.google.com) y Google Docs/Sheets/Slides compartidos (docs.google.com), excluyendo páginas de inicio de sesión.' },
        en: { text: 'Search Google Drive / Docs', title: 'Searches for indexed documents and folders on Google Drive (drive.google.com) and shared Google Docs/Sheets/Slides (docs.google.com), excluding sign-in pages.' }
    },
    dorkWarning: {
        es: 'Estás combinando un operador <code>allin*</code> (allintitle/allinurl/allintext) con otros filtros en la misma búsqueda. Google no garantiza resultados fiables en ese caso; considera usarlo solo, sin otros operadores.',
        en: "You're combining an <code>allin*</code> operator (allintitle/allinurl/allintext) with other filters in the same search. Google's results aren't reliable in that case; consider using it alone, without other operators."
    }
};

function applyLanguage(lang) {
    document.documentElement.lang = lang;

    Object.entries(I18N).forEach(([id, dict]) => {
        const strings = dict[lang];
        const el = document.getElementById(id);
        if (!strings || !el) return;

        if (typeof strings === 'string') {
            el.innerHTML = strings;
            return;
        }

        if (strings.text !== undefined) {
            const label = document.querySelector(`label[for="${id}"]`);
            const span = label && label.querySelector('[data-i18n-text]');
            if (span) span.textContent = strings.text;
        } else if (strings.label !== undefined) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) label.textContent = strings.label;
        } else if (strings.directText !== undefined) {
            el.textContent = strings.directText;
        }

        if (strings.placeholder !== undefined) el.placeholder = strings.placeholder;
        if (strings.title !== undefined) el.title = strings.title;
    });

    document.querySelectorAll('.lang-option').forEach(button => {
        const isActive = button.dataset.lang === lang;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

document.querySelectorAll('.lang-option').forEach(button => {
    button.addEventListener('click', () => applyLanguage(button.dataset.lang));
});
applyLanguage('es');
