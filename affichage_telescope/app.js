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
        spect: headers.indexOf('spect')
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
            spectralType: values[columnIndices.spect] || null
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
    if (!canvasController) return;
    
    canvasController.clearCanvas();
    
    canvasController.drawConstellationLines(constellations);
    
    const starsWithConstellation = new Set();
    for (const constellation of constellations) {
        for (const star of constellation.stars) {
            const key = `${star.ra.toFixed(4)}_${star.dec.toFixed(4)}_${star.mag.toFixed(2)}`;
            starsWithConstellation.add(key);
        }
    }
    
    let renderedCount = 0;
    
    for (const star of visibleStars) {
        const screenPos = canvasController.worldToScreen(star.azimut, star.altitude);
        
        if (!screenPos) continue;
        
        if (!canvasController.isPointVisible(screenPos.x, screenPos.y)) {
            continue;
        }
        
        const size = calculateStarSize(star.mag, canvasController.zoomLevel);
        
        const color = getStarColor(star.ci);
        
        const starKey = `${star.ra.toFixed(4)}_${star.dec.toFixed(4)}_${star.mag.toFixed(2)}`;
        const hasConstellation = starsWithConstellation.has(starKey);
        
        canvasController.drawStar(screenPos.x, screenPos.y, size, color, star.mag, hasConstellation);
        renderedCount++;
    }
    
    drawCardinalIndicators();
}

function drawCardinalIndicators() {
    const ctx = canvasController.ctx;
    const radius = canvasController.projectionRadius * canvasController.zoomLevel + 15;
    
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4a90d9';
    
    const directions = [
        { label: 'N', azimut: 0 },
        { label: 'E', azimut: 90 },
        { label: 'S', azimut: 180 },
        { label: 'O', azimut: 270 }
    ];
    
    for (const dir of directions) {
        const angleRad = degreesToRadians(dir.azimut - 90);
        const x = canvasController.centerX + canvasController.offsetX + radius * Math.cos(angleRad);
        const y = canvasController.centerY + canvasController.offsetY + radius * Math.sin(angleRad);
        
        if (canvasController.isPointVisible(x, y, 30)) {
            ctx.fillText(dir.label, x, y);
        }
    }
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
        countElement.textContent = `${visibleStars.length} étoiles`;
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
    console.log('🌟 Initialisation de la Carte du Ciel...');
    
    try {
        allStars = await loadStarData();
        updateLoadingMessage(`${allStars.length} étoiles chargées. Calcul des positions...`);
        
        const canvas = document.getElementById('skyCanvas');
        if (!canvas) {
            throw new Error('Canvas non trouvé dans le DOM');
        }
        
        canvasController = new CanvasController(canvas, renderSkyMap);
        
        updateVisibleStars();
        
        renderSkyMap();
        
        hideLoadingOverlay();
        
        console.log('✅ Application initialisée avec succès !');
        console.log(`📍 Position : Lyon, France (${OBSERVER_CONFIG.latitude}°N, ${OBSERVER_CONFIG.longitude}°E)`);
        console.log(`📅 Date : ${formatDateTime(currentDate)}`);
        console.log(`⭐ Étoiles visibles : ${visibleStars.length}`);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError(error.message);
    }
}

document.addEventListener('DOMContentLoaded', initApp);
