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
function buildOrClause(operator, rawValue) {
    const values = splitList(rawValue).map(quoteIfMultiWord).filter(Boolean);
    if (values.length === 0) return '';
    if (values.length === 1) return `${operator}:${values[0]}`;
    return '(' + values.map(v => `${operator}:${v}`).join(' OR ') + ')';
}

// Construye exclusiones "-operador:valor" (o "-valor") para uno o varios valores,
// encadenadas con AND implícito (cada término se excluye por separado).
function buildExcludeClause(rawValue, operator) {
    const values = splitList(rawValue).map(quoteIfMultiWord).filter(Boolean);
    if (values.length === 0) return '';
    const prefix = operator ? `-${operator}:` : '-';
    return values.map(v => `${prefix}${v}`).join(' ');
}

function buildFiletypeClause(rawValue) {
    const value = rawValue.trim();
    if (!value) return '';
    const group = FILETYPE_GROUPS[value.toLowerCase()];
    if (group) {
        return '(' + group.map(ext => `filetype:${ext}`).join(' OR ') + ')';
    }
    return `filetype:${quoteIfMultiWord(value)}`;
}

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

    const intitleClause = buildOrClause('intitle', intitle);
    if (intitleClause) clauses.push(intitleClause);

    const inurlClause = buildOrClause('inurl', inurl);
    if (inurlClause) clauses.push(inurlClause);

    const filetypeClause = buildFiletypeClause(filetype);
    if (filetypeClause) clauses.push(filetypeClause);

    const intextClause = buildOrClause('intext', intext);
    if (intextClause) clauses.push(intextClause);

    if (allinurl.trim()) clauses.push(`allinurl:${allinurl.trim()}`);
    if (allintitle.trim()) clauses.push(`allintitle:${allintitle.trim()}`);
    if (allintext.trim()) clauses.push(`allintext:${allintext.trim()}`);

    const defineClause = buildOrClause('define', define);
    if (defineClause) clauses.push(defineClause);

    if (before) clauses.push(`before:${before}`);
    if (after) clauses.push(`after:${after}`);

    const siteExcludeClause = buildExcludeClause(siteExclude, 'site');
    if (siteExcludeClause) clauses.push(siteExcludeClause);

    const excludeTermClause = buildExcludeClause(excludeTerm, '');
    if (excludeTermClause) clauses.push(excludeTermClause);

    if (exactMatch.trim()) clauses.push(`"${exactMatch.trim()}"`);

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

// Borrar filtros
const clearFiltersButton = document.getElementById('clearFiltersButton');
clearFiltersButton.addEventListener('click', clearFilters);

function clearFilters() {
    // Limpiamos los valores de los filtros de texto/fecha
    const filters = document.querySelectorAll('.form-control');
    filters.forEach(filter => {
        filter.value = '';
    });

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
    filetypeFilter: {
        es: { label: 'Tipo de archivo (filetype:)', placeholder: "Ej: 'pdf'", title: 'Busca un tipo específico de archivo en los resultados.\n\nPara tipos con varias extensiones habituales (doc/docx, xls/xlsx, ppt/pptx, html/htm, jpg/jpeg, tiff/tif, xsl/xslt) se genera automáticamente (filetype:doc OR filetype:docx), ya que Google no agrupa esas extensiones.' },
        en: { label: 'File type (filetype:)', placeholder: "E.g. 'pdf'", title: "Searches for a specific file type in the results.\n\nFor types with common extension variants (doc/docx, xls/xlsx, ppt/pptx, html/htm, jpg/jpeg, tiff/tif, xsl/xslt) it automatically builds (filetype:doc OR filetype:docx), since Google doesn't group those extensions." }
    },
    exactMatchFilter: {
        es: { label: 'Coincidencia exacta ("")', placeholder: "Ej: 'texto exacto'", title: 'Busca páginas que contengan el texto exacto dentro de las comillas.\n\nPara introducir varios términos, estos se deben separar con " ".   (ej. username" "password" "login)' },
        en: { label: 'Exact match ("")', placeholder: "E.g. 'exact text'", title: 'Searches for pages containing the exact text inside the quotes.\n\nTo enter several terms, separate them with " ".   (e.g. username" "password" "login)' }
    },
    siteFilter: {
        es: { label: 'Dominio (site:)', placeholder: 'Ej: example.com', title: 'Limita los resultados a uno o varios dominios (site:a.com OR site:b.com).\n\nSepara varios dominios con comas: a.com, b.com' },
        en: { label: 'Domain (site:)', placeholder: 'E.g. example.com', title: 'Limits results to one or more domains (site:a.com OR site:b.com).\n\nSeparate several domains with commas: a.com, b.com' }
    },
    intitleFilter: {
        es: { label: 'Título contiene (intitle:)', placeholder: 'Ej: index of', title: 'Busca páginas donde el título contenga el texto indicado.\n\nSi escribes varias palabras se entrecomillan automáticamente (intitle:"index of") para que Google las trate como una frase, no como una palabra suelta más el resto de términos.' },
        en: { label: 'Title contains (intitle:)', placeholder: 'E.g. index of', title: 'Searches for pages where the title contains the given text.\n\nMulti-word values are auto-quoted (intitle:"index of") so Google treats them as a phrase, instead of scoping only the first word and leaving the rest as plain terms.' }
    },
    inurlFilter: {
        es: { label: 'URL contiene (inurl:)', placeholder: 'Ej: admin panel', title: 'Busca páginas donde la URL contenga el texto indicado.\n\nSi escribes varias palabras se entrecomillan automáticamente (inurl:"admin panel").' },
        en: { label: 'URL contains (inurl:)', placeholder: 'E.g. admin panel', title: 'Searches for pages where the URL contains the given text.\n\nMulti-word values are auto-quoted (inurl:"admin panel").' }
    },
    intextFilter: {
        es: { label: 'Texto (intext:)', placeholder: 'Ej: texto en el cuerpo', title: 'Busca páginas que contengan ese texto en el cuerpo.\n\nSi escribes varias palabras se entrecomillan automáticamente para buscarlas como frase.' },
        en: { label: 'Text (intext:)', placeholder: 'E.g. text in body', title: 'Searches for pages containing that text in the body.\n\nMulti-word values are auto-quoted to search them as a phrase.' }
    },
    allinurlFilter: {
        es: { label: 'Todo en URL (allinurl:)', placeholder: "Ej: 'texto en URL'", title: 'Busca páginas donde la URL contenga todas las palabras especificadas.\n\nNo lo combines con otros operadores en la misma búsqueda: Google no garantiza resultados fiables cuando allin* se mezcla con filtros como site: o intitle:.' },
        en: { label: 'All in URL (allinurl:)', placeholder: "E.g. 'text in URL'", title: "Searches for pages where the URL contains all the specified words.\n\nDon't combine it with other operators in the same search: Google's results are unreliable when allin* is mixed with filters like site: or intitle:." }
    },
    allintitleFilter: {
        es: { label: 'Todo en título (allintitle:)', placeholder: "Ej: 'texto del título'", title: 'Busca páginas cuyo título contenga todas las palabras especificadas.\n\nNo lo combines con otros operadores en la misma búsqueda: Google no garantiza resultados fiables cuando allin* se mezcla con filtros como site: o intitle:.' },
        en: { label: 'All in title (allintitle:)', placeholder: "E.g. 'title text'", title: "Searches for pages whose title contains all the specified words.\n\nDon't combine it with other operators in the same search: Google's results are unreliable when allin* is mixed with filters like site: or intitle:." }
    },
    allintextFilter: {
        es: { label: 'Todo en texto (allintext:)', placeholder: "Ej: 'texto en el cuerpo'", title: 'Busca páginas cuyo cuerpo contenga todas las palabras especificadas.\n\nNo lo combines con otros operadores en la misma búsqueda: Google no garantiza resultados fiables cuando allin* se mezcla con filtros como site: o intitle:.' },
        en: { label: 'All in text (allintext:)', placeholder: "E.g. 'body text'", title: "Searches for pages whose body contains all the specified words.\n\nDon't combine it with other operators in the same search: Google's results are unreliable when allin* is mixed with filters like site: or intitle:." }
    },
    defineFilter: {
        es: { label: 'Definir (define:)', placeholder: 'Ej: ejemplo', title: 'Busca definiciones de términos directamente en Google. No documentado por Google; sin utilidad real en OSINT.' },
        en: { label: 'Define (define:)', placeholder: 'E.g. example', title: "Searches for term definitions directly in Google. Undocumented by Google; no real OSINT use." }
    },
    siteExcludeFilter: {
        es: { label: 'Excluir dominio (-site:)', placeholder: 'Ej: example.com', title: 'Excluye resultados de uno o varios dominios.\n\nSepara varios dominios con comas: a.com, b.com' },
        en: { label: 'Exclude domain (-site:)', placeholder: 'E.g. example.com', title: 'Excludes results from one or more domains.\n\nSeparate several domains with commas: a.com, b.com' }
    },
    excludeTermFilter: {
        es: { label: 'Excluir término (-)', placeholder: 'Ej: forum, login', title: 'Excluye páginas que contengan estos términos.\n\nSepara varios términos con comas: forum, login' },
        en: { label: 'Exclude term (-)', placeholder: 'E.g. forum, login', title: 'Excludes pages containing these terms.\n\nSeparate several terms with commas: forum, login' }
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
