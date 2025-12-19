/**
 * Module de gestion du menu de filtres
 * Permet de mettre en surbrillance les étoiles selon différents critères
 */

/**
 * État actuel du filtre
 * @type {Object}
 */
const FilterState = {
    activeFilter: null,
    highlightedStarIds: new Set(),
    selectedConstellation: null
};

/**
 * Récupère les 50 étoiles les plus proches (distance la plus faible)
 * @param {Array<Object>} stars - Liste des étoiles
 * @returns {Set<string>} IDs des étoiles sélectionnées
 */
function getTop50Nearest(stars) {
    const starsWithDistance = stars.filter(s => s.distance && s.distance > 0);
    starsWithDistance.sort((a, b) => a.distance - b.distance);
    return new Set(starsWithDistance.slice(0, 50).map(s => String(s.id)));
}

/**
 * Récupère les 50 étoiles les plus brillantes (magnitude la plus basse)
 * @param {Array<Object>} stars - Liste des étoiles
 * @returns {Set<string>} IDs des étoiles sélectionnées
 */
function getTop50Brightest(stars) {
    const sorted = [...stars].sort((a, b) => a.mag - b.mag);
    return new Set(sorted.slice(0, 50).map(s => String(s.id)));
}

/**
 * Récupère les 50 étoiles les plus chaudes (index de couleur le plus bas = plus bleu = plus chaud)
 * @param {Array<Object>} stars - Liste des étoiles
 * @returns {Set<string>} IDs des étoiles sélectionnées
 */
function getTop50Hottest(stars) {
    const starsWithCI = stars.filter(s => s.ci !== null && !isNaN(s.ci));
    starsWithCI.sort((a, b) => a.ci - b.ci);
    return new Set(starsWithCI.slice(0, 50).map(s => String(s.id)));
}

/**
 * Récupère les 50 étoiles les plus grosses (estimé par magnitude absolue)
 * La taille est estimée à partir de la magnitude apparente et de la distance
 * @param {Array<Object>} stars - Liste des étoiles
 * @returns {Set<string>} IDs des étoiles sélectionnées
 */
function getTop50Largest(stars) {
    const starsWithData = stars.filter(s => s.distance && s.distance > 0);
    
    const starsWithAbsMag = starsWithData.map(s => {
        const absMag = s.mag - 5 * Math.log10(s.distance) + 5;
        return { ...s, absMag };
    });
    
    starsWithAbsMag.sort((a, b) => a.absMag - b.absMag);
    return new Set(starsWithAbsMag.slice(0, 50).map(s => String(s.id)));
}

/**
 * Récupère les étoiles d'une constellation spécifique
 * @param {Array<Object>} stars - Liste des étoiles
 * @param {string} constellationAbbr - Abréviation de la constellation
 * @returns {Set<string>} IDs des étoiles sélectionnées
 */
function getStarsByConstellation(stars, constellationAbbr) {
    const filtered = stars.filter(s => 
        s.constellation && s.constellation.trim() === constellationAbbr
    );
    return new Set(filtered.map(s => String(s.id)));
}

/**
 * Récupère la liste des constellations disponibles
 * @param {Array<Object>} stars - Liste des étoiles
 * @returns {Array<Object>} Liste des constellations avec leur abréviation et nom complet
 */
function getAvailableConstellations(stars) {
    const constellations = new Map();
    
    for (const star of stars) {
        if (star.constellation && star.constellation.trim()) {
            const abbr = star.constellation.trim();
            if (!constellations.has(abbr)) {
                const fullName = window.StarHover ? 
                    window.StarHover.getConstellationFullName(abbr) : abbr;
                constellations.set(abbr, fullName);
            }
        }
    }
    
    const sorted = Array.from(constellations.entries())
        .map(([abbr, name]) => ({ abbr, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    
    return sorted;
}

/**
 * Applique le filtre et met à jour l'affichage
 * @param {string} filterType - Type de filtre à appliquer
 * @param {string} [constellationAbbr] - Abréviation de la constellation (pour le filtre constellation)
 */
function applyFilter(filterType, constellationAbbr = null) {
    if (!window.povView || !window.povView.allStars) {
        console.warn('POVView non initialisée');
        return;
    }
    
    const stars = window.povView.allStars;
    
    if (FilterState.activeFilter === filterType && 
        (filterType !== 'constellation' || FilterState.selectedConstellation === constellationAbbr)) {
        clearFilter();
        return;
    }
    
    FilterState.activeFilter = filterType;
    FilterState.selectedConstellation = constellationAbbr;
    
    switch(filterType) {
        case 'nearby':
            FilterState.highlightedStarIds = getTop50Nearest(stars);
            break;
        case 'brightest':
            FilterState.highlightedStarIds = getTop50Brightest(stars);
            break;
        case 'hottest':
            FilterState.highlightedStarIds = getTop50Hottest(stars);
            break;
        case 'largest':
            FilterState.highlightedStarIds = getTop50Largest(stars);
            break;
        case 'constellation':
            if (constellationAbbr) {
                FilterState.highlightedStarIds = getStarsByConstellation(stars, constellationAbbr);
            }
            break;
    }
    
    updateFilterUI();
    
    if (window.povView) {
        window.povView.setFilteredStars(FilterState.highlightedStarIds);
    }
}

/**
 * Efface le filtre actif
 */
function clearFilter() {
    FilterState.activeFilter = null;
    FilterState.highlightedStarIds = new Set();
    FilterState.selectedConstellation = null;
    
    updateFilterUI();
    
    if (window.povView) {
        window.povView.clearFilteredStars();
    }
}

/**
 * Met à jour l'interface utilisateur des filtres
 */
function updateFilterUI() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const isActive = btn.dataset.filter === FilterState.activeFilter;
        btn.classList.toggle('active', isActive);
    });
    
    const constellationSelect = document.getElementById('constellationSelect');
    if (constellationSelect) {
        if (FilterState.activeFilter === 'constellation' && FilterState.selectedConstellation) {
            constellationSelect.value = FilterState.selectedConstellation;
        } else if (FilterState.activeFilter !== 'constellation') {
            constellationSelect.value = '';
        }
    }
}

/**
 * Initialise le sélecteur de constellations
 */
function initConstellationSelect() {
    const select = document.getElementById('constellationSelect');
    if (!select) return;
    
    const checkAndPopulate = () => {
        if (window.povView && window.povView.allStars && window.povView.allStars.length > 0) {
            const constellations = getAvailableConstellations(window.povView.allStars);
            
            select.innerHTML = '<option value="">-- Choisir une constellation --</option>';
            
            for (const con of constellations) {
                const option = document.createElement('option');
                option.value = con.abbr;
                option.textContent = con.name;
                select.appendChild(option);
            }
            
            select.addEventListener('change', (e) => {
                const abbr = e.target.value;
                if (abbr) {
                    applyFilter('constellation', abbr);
                } else {
                    if (FilterState.activeFilter === 'constellation') {
                        clearFilter();
                    }
                }
            });
        } else {
            setTimeout(checkAndPopulate, 500);
        }
    };
    
    checkAndPopulate();
}

/**
 * Initialise les écouteurs d'événements pour les boutons de filtre
 */
function initFilterMenu() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.filter;
            
            if (type === 'constellation') {
                const select = document.getElementById('constellationSelect');
                if (select && select.value) {
                    applyFilter('constellation', select.value);
                } else {
                    if (select) {
                        select.focus();
                    }
                }
            } else {
                applyFilter(type);
            }
        });
    });
    
    initConstellationSelect();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFilterMenu);
} else {
    initFilterMenu();
}

/**
 * Export du module de filtres
 */
window.StarFilter = {
    applyFilter,
    clearFilter,
    getState: () => ({ ...FilterState }),
    getAvailableConstellations
};

