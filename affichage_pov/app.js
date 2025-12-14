const APP_CONFIG = {
    csvPath: '../shared/hygdata_v40.csv',
    magnitudeLimit: 6,
    csvSeparator: ';',
    updateInterval: null
};

let allStars = [];
let visibleStars = [];
let constellations = [];
let canvasController = null;
let currentDate = null;
let projectedStars = []; // Stockage des étoiles projetées avec leurs positions écran
let highlightedConstellation = null; // Constellation actuellement mise en évidence

async function loadStarData() {
    updateLoadingMessage('Chargement du fichier de données...');
    
    try {
        const response = await fetch(APP_CONFIG.csvPath);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const csvText = await response.text();
        updateLoadingMessage('Analyse des données stellaires...');
        
        const stars = parseCSV(csvText);
        console.log(`📊 ${stars.length} étoiles chargées depuis le CSV`);
        
        return stars;
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        throw new Error(`Impossible de charger les données: ${error.message}`);
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
        throw new Error('Le fichier CSV est vide ou invalide');
    }
    
    const headers = lines[0].split(APP_CONFIG.csvSeparator).map(h => h.trim().toLowerCase());
    
    const columnIndices = {
        id: headers.indexOf('id'),
        proper: headers.indexOf('proper'),
        ra: headers.indexOf('ra'),
        dec: headers.indexOf('dec'),
        mag: headers.indexOf('mag'),
        ci: headers.indexOf('ci'),
        con: headers.indexOf('con'),
        dist: headers.indexOf('dist'),
        spect: headers.indexOf('spect'),
        bayer: headers.indexOf('bayer'),
        hip: headers.indexOf('hip'),
        hd: headers.indexOf('hd')
    };
    
    if (columnIndices.ra === -1 || columnIndices.dec === -1 || columnIndices.mag === -1) {
        throw new Error('Colonnes essentielles manquantes dans le CSV (ra, dec, mag)');
    }
    
    const stars = [];
    let skippedCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(APP_CONFIG.csvSeparator);
        
        const ra = parseFloat(values[columnIndices.ra]);
        const dec = parseFloat(values[columnIndices.dec]);
        const mag = parseFloat(values[columnIndices.mag]);
        
        if (isNaN(ra) || isNaN(dec) || isNaN(mag)) {
            skippedCount++;
            continue;
        }
        
        if (mag >= APP_CONFIG.magnitudeLimit) {
            continue;
        }
        
        const star = {
            id: values[columnIndices.id] || i.toString(),
            name: values[columnIndices.proper] || null,
            ra: ra,
            dec: dec,
            mag: mag,
            ci: parseFloat(values[columnIndices.ci]) || 0,
            constellation: values[columnIndices.con] || null,
            distance: parseFloat(values[columnIndices.dist]) || null,
            spectralType: values[columnIndices.spect] || null,
            bayer: values[columnIndices.bayer] || null,
            hip: values[columnIndices.hip] || null,
            hd: values[columnIndices.hd] || null
        };
        
        stars.push(star);
    }
    
    console.log(`⚠️ ${skippedCount} lignes ignorées (données invalides)`);
    console.log(`✨ ${stars.length} étoiles avec magnitude < ${APP_CONFIG.magnitudeLimit}`);
    
    return stars;
}

function updateVisibleStars() {
    currentDate = new Date();
    
    updateDateTimeDisplay();
    
    visibleStars = calculateVisibleStars(allStars, currentDate);
    
    constellations = Constellations.prepareConstellationsForRendering(visibleStars);
    console.log(`🌌 ${constellations.length} constellations visibles`);
    
    visibleStars.sort((a, b) => b.mag - a.mag);
    
    console.log(`👁️ ${visibleStars.length} étoiles visibles au-dessus de l'horizon`);
    
    updateStarCount();
}

function renderSkyMap() {
    if (!canvasController || !canvasController.camera) return;
    
    canvasController.clearCanvas();
    
    canvasController.drawConstellationLines(constellations, highlightedConstellation);
    
    const camera = canvasController.camera;
    let renderedCount = 0;
    projectedStars = []; // Réinitialiser les projections
    
    const starsWithConstellation = new Set();
    for (const constellation of constellations) {
        for (const star of constellation.stars) {
            const key = `${star.ra.toFixed(4)}_${star.dec.toFixed(4)}_${star.mag.toFixed(2)}`;
            starsWithConstellation.add(key);
        }
    }
    
    for (const star of visibleStars) {
        const projection = camera.project(star.azimut, star.altitude);
        
        if (!projection || !projection.visible) {
            continue;
        }
        
        if (!canvasController.isPointVisible(projection.x, projection.y)) {
            continue;
        }
        
        const baseSize = calculateStarSize(star.mag, camera.getZoomLevel());
        
        const color = getStarColor(star.ci);
        
        const starKey = `${star.ra.toFixed(4)}_${star.dec.toFixed(4)}_${star.mag.toFixed(2)}`;
        const hasConstellation = starsWithConstellation.has(starKey);
        
        // Vérifier si cette étoile fait partie de la constellation mise en évidence
        const isHighlighted = highlightedConstellation && 
                              star.constellation && 
                              star.constellation.trim() === highlightedConstellation;
        
        canvasController.drawStar(
            projection.x, 
            projection.y, 
            baseSize, 
            color, 
            star.mag,
            projection.distanceFromCenter,
            star.altitude,
            hasConstellation,
            isHighlighted
        );
        
        // Stocker la projection pour la détection de survol
        projectedStars.push({
            star: star,
            x: projection.x,
            y: projection.y,
            size: baseSize
        });
        
        renderedCount++;
    }
    
    updateRenderedStarCount(renderedCount);
}

function updateDateTimeDisplay() {
    const datetimeElement = document.getElementById('datetime');
    if (datetimeElement && currentDate) {
        datetimeElement.textContent = formatDateTime(currentDate);
    }
}

function updateStarCount() {
    const countElement = document.getElementById('starCount');
    if (countElement) {
        countElement.textContent = visibleStars.length;
    }
}

function updateRenderedStarCount(count) {
    const countElement = document.getElementById('starCount');
    if (countElement) {
        countElement.textContent = `${count}/${visibleStars.length}`;
    }
}

function updateLoadingMessage(message) {
    const messageElement = document.getElementById('loadingMessage');
    if (messageElement) {
        messageElement.textContent = message;
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function showError(message) {
    const overlay = document.getElementById('loadingOverlay');
    const messageElement = document.getElementById('loadingMessage');
    const spinner = document.querySelector('.spinner');
    
    if (spinner) {
        spinner.style.display = 'none';
    }
    
    if (messageElement) {
        messageElement.innerHTML = `<span style="color: #ff6b6b;">❌ ${message}</span>`;
    }
}

async function initApp() {
    console.log('🌟 Initialisation de la Carte du Ciel (Vue POV immersive)...');
    
    try {
        allStars = await loadStarData();
        updateLoadingMessage(`${allStars.length} étoiles chargées. Calcul des positions...`);
        
        const canvas = document.getElementById('skyCanvas');
        if (!canvas) {
            throw new Error('Canvas non trouvé dans le DOM');
        }
        
        canvasController = new CanvasController(canvas, renderSkyMap);
        
        updateVisibleStars();
        
        canvasController.updateUI();
        
        renderSkyMap();
        
        hideLoadingOverlay();
        
        console.log('✅ Application initialisée avec succès !');
        console.log(`📍 Position : Lyon, France (${OBSERVER_CONFIG.latitude}°N, ${OBSERVER_CONFIG.longitude}°E)`);
        console.log(`📅 Date : ${formatDateTime(currentDate)}`);
        console.log(`⭐ Étoiles au-dessus de l'horizon : ${visibleStars.length}`);
        console.log(`🎥 Vue initiale : ${canvasController.camera.getDirectionDescription()}`);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError(error.message);
    }
}

document.addEventListener('DOMContentLoaded', initApp);

// ==========================================================================
// Gestion du survol des étoiles et du popup
// ==========================================================================

/**
 * Obtient le nom d'affichage d'une étoile (avec fallback)
 */
function getStarDisplayName(star) {
    // 1. Nom propre (ex: "Sirius", "Vega")
    if (star.name && star.name.trim()) {
        return star.name.trim();
    }
    
    // 2. Désignation Bayer + constellation (ex: "α Ori")
    if (star.bayer && star.bayer.trim() && star.constellation) {
        return `${star.bayer.trim()} ${star.constellation}`;
    }
    
    // 3. Numéro Hipparcos
    if (star.hip && star.hip.trim()) {
        return `HIP ${star.hip.trim()}`;
    }
    
    // 4. Numéro HD
    if (star.hd && star.hd.trim()) {
        return `HD ${star.hd.trim()}`;
    }
    
    // 5. Fallback avec l'ID
    return `Étoile #${star.id}`;
}

/**
 * Obtient le nom complet de la constellation
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
 */
function findStarAtPosition(x, y, threshold = 15) {
    let closestStar = null;
    let closestDistance = threshold;
    
    for (const projected of projectedStars) {
        const dx = projected.x - x;
        const dy = projected.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Zone de détection basée sur la taille de l'étoile (minimum 10px)
        const detectionRadius = Math.max(projected.size * 2, 10);
        
        if (distance < detectionRadius && distance < closestDistance) {
            closestDistance = distance;
            closestStar = projected.star;
        }
    }
    
    return closestStar;
}

/**
 * Affiche le popup pour une étoile
 */
function showStarPopup(star, x, y) {
    const popup = document.getElementById('starPopup');
    const nameEl = document.getElementById('popupStarName');
    const constellationEl = document.getElementById('popupConstellation');
    
    if (!popup || !nameEl || !constellationEl) return;
    
    // Remplir les informations
    nameEl.textContent = getStarDisplayName(star);
    constellationEl.textContent = getConstellationFullName(star.constellation);
    
    // Positionner le popup (décalé pour ne pas cacher l'étoile)
    const offsetX = 15;
    const offsetY = -10;
    
    // Ajuster si le popup dépasse de l'écran
    let posX = x + offsetX;
    let posY = y + offsetY;
    
    // Mesurer le popup pour ajuster
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
 * Cache le popup
 */
function hideStarPopup() {
    const popup = document.getElementById('starPopup');
    if (popup) {
        popup.classList.add('hidden');
    }
}

/**
 * Met en évidence une constellation
 */
function setHighlightedConstellation(constellationAbbr) {
    if (highlightedConstellation !== constellationAbbr) {
        highlightedConstellation = constellationAbbr;
        renderSkyMap();
    }
}

/**
 * Retire la mise en évidence
 */
function clearHighlightedConstellation() {
    if (highlightedConstellation !== null) {
        highlightedConstellation = null;
        renderSkyMap();
    }
}

// Exposer les fonctions pour le canvas-controller
window.StarHover = {
    findStarAtPosition,
    showStarPopup,
    hideStarPopup,
    setHighlightedConstellation,
    clearHighlightedConstellation,
    getStarDisplayName,
    getConstellationFullName
};
