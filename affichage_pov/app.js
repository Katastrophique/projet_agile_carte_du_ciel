/**
 * ==========================================================================
 * App.js - Application principale Carte du Ciel (Vue POV immersive)
 * ==========================================================================
 * 
 * Point d'entrée de l'application. Gère :
 * - Le chargement et parsing du fichier CSV
 * - Le filtrage des étoiles (magnitude < 6)
 * - Le calcul des positions et le rendu sur canvas
 * - La mise à jour de l'interface utilisateur
 */

// ============================================================================
// Configuration globale
// ============================================================================

const APP_CONFIG = {
    csvPath: '../shared/hygdata_v40.csv',  // Chemin vers le fichier de données partagé
    magnitudeLimit: 6,                   // Magnitude maximale (visibilité à l'œil nu)
    csvSeparator: ';',                   // Séparateur utilisé dans le CSV
    updateInterval: null                  // Intervalle de mise à jour (null = pas d'auto-update)
};

// ============================================================================
// Variables globales de l'application
// ============================================================================

let allStars = [];              // Toutes les étoiles chargées (mag < 6)
let visibleStars = [];          // Étoiles actuellement visibles au-dessus de l'horizon
let canvasController = null;     // Instance du contrôleur de canvas
let currentDate = null;          // Date et heure d'observation

// ============================================================================
// Fonctions de chargement des données
// ============================================================================

/**
 * Charge et parse le fichier CSV des étoiles
 * @returns {Promise<Array>} Promesse résolvant vers un tableau d'étoiles
 */
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

/**
 * Parse le contenu CSV en tableau d'objets étoiles
 * Filtre directement les étoiles avec magnitude < 6
 * 
 * @param {string} csvText - Contenu du fichier CSV
 * @returns {Array} Tableau d'objets étoiles filtrés
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
        throw new Error('Le fichier CSV est vide ou invalide');
    }
    
    // Parser l'en-tête pour obtenir les indices des colonnes
    const headers = lines[0].split(APP_CONFIG.csvSeparator).map(h => h.trim().toLowerCase());
    
    // Trouver les indices des colonnes nécessaires
    const columnIndices = {
        id: headers.indexOf('id'),
        proper: headers.indexOf('proper'),      // Nom propre de l'étoile
        ra: headers.indexOf('ra'),              // Ascension droite (en heures décimales)
        dec: headers.indexOf('dec'),            // Déclinaison (en degrés)
        mag: headers.indexOf('mag'),            // Magnitude apparente
        ci: headers.indexOf('ci'),              // Indice de couleur
        con: headers.indexOf('con'),            // Constellation
        dist: headers.indexOf('dist'),          // Distance en parsecs
        spect: headers.indexOf('spect')         // Type spectral
    };
    
    // Vérifier que les colonnes essentielles existent
    if (columnIndices.ra === -1 || columnIndices.dec === -1 || columnIndices.mag === -1) {
        throw new Error('Colonnes essentielles manquantes dans le CSV (ra, dec, mag)');
    }
    
    const stars = [];
    let skippedCount = 0;
    
    // Parser chaque ligne (en sautant l'en-tête)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(APP_CONFIG.csvSeparator);
        
        // Extraire les valeurs
        const ra = parseFloat(values[columnIndices.ra]);
        const dec = parseFloat(values[columnIndices.dec]);
        const mag = parseFloat(values[columnIndices.mag]);
        
        // Vérifier la validité des données essentielles
        if (isNaN(ra) || isNaN(dec) || isNaN(mag)) {
            skippedCount++;
            continue;
        }
        
        // Filtrer par magnitude (garder uniquement les étoiles visibles à l'œil nu)
        if (mag >= APP_CONFIG.magnitudeLimit) {
            continue;
        }
        
        // Créer l'objet étoile
        const star = {
            id: values[columnIndices.id] || i.toString(),
            name: values[columnIndices.proper] || null,
            ra: ra,                              // En heures décimales (0-24)
            dec: dec,                            // En degrés (-90 à +90)
            mag: mag,                            // Magnitude apparente
            ci: parseFloat(values[columnIndices.ci]) || 0,  // Indice de couleur
            constellation: values[columnIndices.con] || null,
            distance: parseFloat(values[columnIndices.dist]) || null,
            spectralType: values[columnIndices.spect] || null
        };
        
        stars.push(star);
    }
    
    console.log(`⚠️ ${skippedCount} lignes ignorées (données invalides)`);
    console.log(`✨ ${stars.length} étoiles avec magnitude < ${APP_CONFIG.magnitudeLimit}`);
    
    return stars;
}

// ============================================================================
// Fonctions de calcul et rendu
// ============================================================================

/**
 * Calcule les étoiles visibles pour la date/heure actuelle
 * et les prépare pour le rendu
 */
function updateVisibleStars() {
    currentDate = new Date();
    
    // Mettre à jour l'affichage de la date/heure
    updateDateTimeDisplay();
    
    // Calculer les positions horizontales et filtrer les étoiles visibles
    visibleStars = calculateVisibleStars(allStars, currentDate);
    
    // Trier par magnitude (étoiles les moins brillantes d'abord)
    // pour que les étoiles brillantes soient dessinées par-dessus
    visibleStars.sort((a, b) => b.mag - a.mag);
    
    console.log(`👁️ ${visibleStars.length} étoiles visibles au-dessus de l'horizon`);
    
    // Mettre à jour le compteur
    updateStarCount();
}

/**
 * Effectue le rendu complet de la carte du ciel en vue POV
 */
function renderSkyMap() {
    if (!canvasController || !canvasController.camera) return;
    
    // Effacer et préparer le canvas (fond + horizon)
    canvasController.clearCanvas();
    
    const camera = canvasController.camera;
    let renderedCount = 0;
    
    // Dessiner chaque étoile visible
    for (const star of visibleStars) {
        // Projeter l'étoile avec la caméra
        const projection = camera.project(star.azimut, star.altitude);
        
        // Vérifier si l'étoile est dans le champ de vision
        if (!projection || !projection.visible) {
            continue;
        }
        
        // Vérifier si l'étoile est dans l'écran
        if (!canvasController.isPointVisible(projection.x, projection.y)) {
            continue;
        }
        
        // Calculer la taille de l'étoile (avec effet de perspective)
        const baseSize = calculateStarSize(star.mag, camera.getZoomLevel());
        
        // Obtenir la couleur
        const color = getStarColor(star.ci);
        
        // Dessiner l'étoile avec les effets POV
        canvasController.drawStar(
            projection.x, 
            projection.y, 
            baseSize, 
            color, 
            star.mag,
            projection.distanceFromCenter,
            star.altitude
        );
        
        renderedCount++;
    }
    
    // Mettre à jour le compteur avec les étoiles rendues
    updateRenderedStarCount(renderedCount);
}

// ============================================================================
// Fonctions de mise à jour de l'interface
// ============================================================================

/**
 * Met à jour l'affichage de la date et heure
 */
function updateDateTimeDisplay() {
    const datetimeElement = document.getElementById('datetime');
    if (datetimeElement && currentDate) {
        datetimeElement.textContent = formatDateTime(currentDate);
    }
}

/**
 * Met à jour le compteur d'étoiles visibles (au-dessus de l'horizon)
 */
function updateStarCount() {
    const countElement = document.getElementById('starCount');
    if (countElement) {
        countElement.textContent = visibleStars.length;
    }
}

/**
 * Met à jour le compteur d'étoiles rendues (dans le champ de vision)
 */
function updateRenderedStarCount(count) {
    const countElement = document.getElementById('starCount');
    if (countElement) {
        // Afficher les deux nombres
        countElement.textContent = `${count}/${visibleStars.length}`;
    }
}

/**
 * Met à jour le message de chargement
 * @param {string} message - Message à afficher
 */
function updateLoadingMessage(message) {
    const messageElement = document.getElementById('loadingMessage');
    if (messageElement) {
        messageElement.textContent = message;
    }
}

/**
 * Cache l'overlay de chargement
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Affiche un message d'erreur
 * @param {string} message - Message d'erreur
 */
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

// ============================================================================
// Initialisation de l'application
// ============================================================================

/**
 * Fonction principale d'initialisation
 */
async function initApp() {
    console.log('🌟 Initialisation de la Carte du Ciel (Vue POV immersive)...');
    
    try {
        // Étape 1 : Charger les données
        allStars = await loadStarData();
        updateLoadingMessage(`${allStars.length} étoiles chargées. Calcul des positions...`);
        
        // Étape 2 : Initialiser le canvas
        const canvas = document.getElementById('skyCanvas');
        if (!canvas) {
            throw new Error('Canvas non trouvé dans le DOM');
        }
        
        // Créer le contrôleur de canvas avec callback de rendu
        canvasController = new CanvasController(canvas, renderSkyMap);
        
        // Étape 3 : Calculer les étoiles visibles
        updateVisibleStars();
        
        // Étape 4 : Mettre à jour l'interface
        canvasController.updateUI();
        
        // Étape 5 : Premier rendu
        renderSkyMap();
        
        // Étape 6 : Cacher le loader
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

// ============================================================================
// Démarrage de l'application
// ============================================================================

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', initApp);
