/**
 * Module de gestion du survol et de l'affichage des informations sur les étoiles
 */

/**
 * Obtient le nom d'affichage d'une étoile avec fallback
 * @param {Object} star - Objet étoile
 * @returns {string} Nom d'affichage de l'étoile
 */
function getStarDisplayName(star) {
    if (star.name && star.name.trim()) {
        return star.name.trim();
    }
    
    if (star.bayer && star.bayer.trim() && star.constellation) {
        return `${star.bayer.trim()} ${star.constellation}`;
    }
    
    if (star.hip && star.hip.trim()) {
        return `HIP ${star.hip.trim()}`;
    }
    
    if (star.hd && star.hd.trim()) {
        return `HD ${star.hd.trim()}`;
    }
    
    return `Étoile #${star.id}`;
}

/**
 * Obtient le nom complet de la constellation à partir de son abréviation
 * @param {string} conAbbr - Abréviation de la constellation
 * @returns {string} Nom complet de la constellation
 */
function getConstellationFullName(conAbbr) {
    const constellationNames = {
        'And': 'Andromède', 'Ant': 'Machine pneumatique', 'Aps': 'Oiseau de paradis',
        'Aqr': 'Verseau', 'Aql': 'Aigle', 'Ara': 'Autel', 'Ari': 'Bélier',
        'Aur': 'Cocher', 'Boo': 'Bouvier', 'Cae': 'Burin', 'Cam': 'Girafe',
        'Cnc': 'Cancer', 'CVn': 'Chiens de chasse', 'CMa': 'Grand Chien',
        'CMi': 'Petit Chien', 'Cap': 'Capricorne', 'Car': 'Carène', 'Cas': 'Cassiopée',
        'Cen': 'Centaure', 'Cep': 'Céphée', 'Cet': 'Baleine', 'Cha': 'Caméléon',
        'Cir': 'Compas', 'Col': 'Colombe', 'Com': 'Chevelure de Bérénice',
        'CrA': 'Couronne australe', 'CrB': 'Couronne boréale', 'Crv': 'Corbeau',
        'Crt': 'Coupe', 'Cru': 'Croix du Sud', 'Cyg': 'Cygne', 'Del': 'Dauphin',
        'Dor': 'Dorade', 'Dra': 'Dragon', 'Equ': 'Petit Cheval', 'Eri': 'Éridan',
        'For': 'Fourneau', 'Gem': 'Gémeaux', 'Gru': 'Grue', 'Her': 'Hercule',
        'Hor': 'Horloge', 'Hya': 'Hydre', 'Hyi': 'Hydre mâle', 'Ind': 'Indien',
        'Lac': 'Lézard', 'Leo': 'Lion', 'LMi': 'Petit Lion', 'Lep': 'Lièvre',
        'Lib': 'Balance', 'Lup': 'Loup', 'Lyn': 'Lynx', 'Lyr': 'Lyre',
        'Men': 'Table', 'Mic': 'Microscope', 'Mon': 'Licorne', 'Mus': 'Mouche',
        'Nor': 'Règle', 'Oct': 'Octant', 'Oph': 'Ophiuchus', 'Ori': 'Orion',
        'Pav': 'Paon', 'Peg': 'Pégase', 'Per': 'Persée', 'Phe': 'Phénix',
        'Pic': 'Peintre', 'Psc': 'Poissons', 'PsA': 'Poisson austral', 'Pup': 'Poupe',
        'Pyx': 'Boussole', 'Ret': 'Réticule', 'Sge': 'Flèche', 'Sgr': 'Sagittaire',
        'Sco': 'Scorpion', 'Scl': 'Sculpteur', 'Sct': 'Écu de Sobieski',
        'Ser': 'Serpent', 'Sex': 'Sextant', 'Tau': 'Taureau', 'Tel': 'Télescope',
        'Tri': 'Triangle', 'TrA': 'Triangle austral', 'Tuc': 'Toucan',
        'UMa': 'Grande Ourse', 'UMi': 'Petite Ourse', 'Vel': 'Voiles',
        'Vir': 'Vierge', 'Vol': 'Poisson volant', 'Vul': 'Petit Renard'
    };
    
    if (!conAbbr || !conAbbr.trim()) {
        return 'Inconnue';
    }
    
    const abbr = conAbbr.trim();
    return constellationNames[abbr] || abbr;
}

/**
 * Trouve l'étoile la plus proche d'un point donné
 * @param {number} x - Coordonnée X en pixels
 * @param {number} y - Coordonnée Y en pixels
 * @param {Array<Object>} projectedStars - Liste des étoiles projetées avec positions
 * @param {number} [threshold=15] - Distance maximale en pixels
 * @returns {Object|null} Étoile trouvée ou null
 */
function findStarAtPosition(x, y, projectedStars, threshold = 15) {
    let closestStar = null;
    let closestDistance = threshold;
    
    for (const projected of projectedStars) {
        const dx = projected.x - x;
        const dy = projected.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const detectionRadius = Math.max(projected.size * 2, 10);
        
        if (distance < detectionRadius && distance < closestDistance) {
            closestDistance = distance;
            closestStar = projected.star;
        }
    }
    
    return closestStar;
}

/**
 * Affiche le popup d'information pour une étoile
 * @param {Object} star - Étoile à afficher
 * @param {number} x - Coordonnée X en pixels
 * @param {number} y - Coordonnée Y en pixels
 */
function showStarPopup(star, x, y) {
    const popup = document.getElementById('starPopup');
    const nameEl = document.getElementById('popupStarName');
    const constellationEl = document.getElementById('popupConstellation');
    
    if (!popup || !nameEl || !constellationEl) return;
    
    nameEl.textContent = getStarDisplayName(star);
    constellationEl.textContent = getConstellationFullName(star.constellation);
    
    const offsetX = 15;
    const offsetY = -10;
    
    let posX = x + offsetX;
    let posY = y + offsetY;
    
    popup.classList.remove('hidden');
    const rect = popup.getBoundingClientRect();
    
    if (posX + rect.width > window.innerWidth - 10) {
        posX = x - rect.width - offsetX;
    }
    if (posY < 10) {
        posY = y + 20;
    }
    if (posY + rect.height > window.innerHeight - 10) {
        posY = window.innerHeight - rect.height - 10;
    }
    
    popup.style.left = `${posX}px`;
    popup.style.top = `${posY}px`;
}

/**
 * Cache le popup d'information
 */
function hideStarPopup() {
    const popup = document.getElementById('starPopup');
    if (popup) {
        popup.classList.add('hidden');
    }
}

window.StarHover = {
    getStarDisplayName,
    getConstellationFullName,
    findStarAtPosition,
    showStarPopup,
    hideStarPopup
};

