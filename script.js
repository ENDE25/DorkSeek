// Función principal de búsqueda
document.getElementById('searchButton').addEventListener('click', function() {
    let query = document.getElementById('searchBar').value;
    let site = document.getElementById('siteFilter').value;
    let intitle = document.getElementById('intitleFilter').value;
    let inurl = document.getElementById('inurlFilter').value;
    let filetype = document.getElementById('filetypeFilter').value;
    let intext = document.getElementById('intextFilter').value;
    let cache = document.getElementById('cacheFilter').value;
    let link = document.getElementById('linkFilter').value;
    let related = document.getElementById('relatedFilter').value;
    let allinurl = document.getElementById('allinurlFilter').value;
    let allintitle = document.getElementById('allintitleFilter').value;
    let allintext = document.getElementById('allintextFilter').value;
    let define = document.getElementById('defineFilter').value;
    let info = document.getElementById('infoFilter').value;
    let before = document.getElementById('beforeFilter').value;
    let after = document.getElementById('afterFilter').value;
    let siteExclude = document.getElementById('siteExcludeFilter').value;
    let exactMatch = document.getElementById('exactMatchFilter').value;

    // Construir la búsqueda usando los filtros de Google Dorks
    let searchQuery = query;

    if (site) {
        searchQuery += ` site:${site}`;
    }
    if (intitle) {
        searchQuery += ` intitle:${intitle}`;
    }
    if (inurl) {
        searchQuery += ` inurl:${inurl}`;
    }
    if (filetype) {
        searchQuery += ` filetype:${filetype}`;
    }
    if (intext) {
        searchQuery += ` intext:${intext}`;
    }
    if (cache) {
        searchQuery += ` cache:${cache}`;
    }
    if (link) {
        searchQuery += ` link:${link}`;
    }
    if (related) {
        searchQuery += ` related:${related}`;
    }
    if (allinurl) {
        searchQuery += ` allinurl:${allinurl}`;
    }
    if (allintitle) {
        searchQuery += ` allintitle:${allintitle}`;
    }
    if (allintext) {
        searchQuery += ` allintext:${allintext}`;
    }
    if (define) {
        searchQuery += ` define:${define}`;
    }
    if (info) {
        searchQuery += ` info:${info}`;
    }
    if (before) {
        searchQuery += ` before:${before}`;
    }
    if (after) {
        searchQuery += ` after:${after}`;
    }
    if (siteExclude) {
        searchQuery += ` -site:${siteExclude}`;
    }
    if (exactMatch) {
        searchQuery += ` "${exactMatch}"`;
    }
    if (document.getElementById('excludeAI').checked) {
        searchQuery += ' -site:chat.openai.com -chatgpt -openai -copilot -bard -ai -generated -inurl:ai -inurl:generated';
    }

    // Redirigir a Google con la búsqueda construida
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
});

// Manejo del campo personalizado para tipos de archivo
document.getElementById('filetypeFilter').addEventListener('change', function() {
    var customField = document.getElementById('filetypeCustom');
    if (this.value === 'custom') {
        customField.style.display = 'block';
    } else {
        customField.style.display = 'none';
    }
});

// Borrar filtros
const clearFiltersButton = document.getElementById('clearFiltersButton');
clearFiltersButton.addEventListener('click', clearFilters);

function clearFilters() {
    // Limpiamos los valores de los filtros
    const filters = document.querySelectorAll('.form-control');
    filters.forEach(filter => {
        filter.value = '';
    });

    // Limpiamos los contenedores de valores
    const valuesContainers = document.querySelectorAll('.values-container');
    valuesContainers.forEach(container => {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    });
}


//modo oscuro
let darkMode = false;

const toggleButton = document.getElementById('toggle_dark');const body = document.body;
const logo = document.querySelector('.logo');
const clearBtn = document.getElementById('clearFiltersButton');
const inputs = document.querySelectorAll('.form-control');
const excludeAI = document.getElementById('excludeAI');

const originalStyles = {
    backgroundColor: getComputedStyle(body).backgroundColor,
    color: getComputedStyle(body).color,
    logoSrc: logo.src,
    clearBtnBg: getComputedStyle(clearBtn).backgroundColor,
    clearBtnText: getComputedStyle(clearBtn).color,
    clearBtnBorder: getComputedStyle(clearBtn).borderColor,
    inputBg: getComputedStyle(inputs[0]).backgroundColor,
    inputText: getComputedStyle(inputs[0]).color,
    inputBorder: getComputedStyle(inputs[0]).borderColor,
    checkbox: getComputedStyle(excludeAI).borderColor
};

toggleButton.addEventListener('click', () => {
    darkMode = !darkMode;

    if (darkMode) {
        document.body.classList.add('dark-mode');
        logo.src = 'img/DorkSeek_Logo_dark.jpg';
        excludeAI.style.backgroundColor = "#0d1117";
        excludeAI.style.borderColor = "#3f4549"
        clearBtn.style.backgroundColor = "#2f3337";
        clearBtn.style.borderColor = "#2f3337"
    } else {
        document.body.classList.remove('dark-mode');
        logo.src = originalStyles.logoSrc;
        excludeAI.style.backgroundColor = "#ffffff";
        excludeAI.style.borderColor = "#bfbfbf"
        clearBtn.style.color = originalStyles.clearBtnText;
        clearBtn.style.borderColor = originalStyles.clearBtnBorder;
        clearBtn.style.backgroundColor = originalStyles.clearBtnBg;
    }
});


