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
/**
 * Formate les coordonnées célestes (RA/Dec) pour l'affichage
 * @param {number} ra - Ascension droite en degrés
 * @param {number} dec - Déclinaison en degrés
 * @returns {string} Coordonnées formatées
 */
function formatCelestialCoordinates(ra, dec) {
    // Convertir RA de degrés en heures/minutes/secondes
    const raHours = ra / 15; // 360° = 24h, donc 1h = 15°
    const raH = Math.floor(raHours);
    const raM = Math.floor((raHours - raH) * 60);
    const raS = ((raHours - raH) * 60 - raM) * 60;
    
    // Formater la déclinaison en degrés/minutes/secondes
    const decSign = dec >= 0 ? '+' : '-';
    const decAbs = Math.abs(dec);
    const decD = Math.floor(decAbs);
    const decM = Math.floor((decAbs - decD) * 60);
    const decS = ((decAbs - decD) * 60 - decM) * 60;
    
    return `RA ${raH}h${raM.toString().padStart(2, '0')}m${raS.toFixed(1).padStart(4, '0')}s | Dec ${decSign}${decD}°${decM.toString().padStart(2, '0')}'${decS.toFixed(0).padStart(2, '0')}"`;
}

function showStarPopup(star, x, y) {
    const popup = document.getElementById('starPopup');
    const nameEl = document.getElementById('popupStarName');
    const constellationEl = document.getElementById('popupConstellation');
    const locationEl = document.getElementById('popupLocation');
    
    if (!popup || !nameEl || !constellationEl) return;
    
    nameEl.textContent = getStarDisplayName(star);
    constellationEl.textContent = getConstellationFullName(star.constellation);
    
    // Afficher les coordonnées célestes si disponibles
    if (locationEl && star.ra !== undefined && star.dec !== undefined) {
        locationEl.textContent = formatCelestialCoordinates(star.ra, star.dec);
    } else if (locationEl) {
        locationEl.textContent = 'Coordonnées non disponibles';
    }
    
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
    formatCelestialCoordinates,
    findStarAtPosition,
    showStarPopup,
    hideStarPopup
};

