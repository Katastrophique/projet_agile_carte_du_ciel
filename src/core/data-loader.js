/**
 * Module de chargement et parsing des données stellaires
 */

/**
 * Configuration par défaut pour le chargement des données
 * @type {Object}
 */
const DATA_CONFIG = {
    csvPath: '../shared/hygdata_v40.csv',
    magnitudeLimit: 6,
    csvSeparator: ';'
};

/**
 * Charge les données stellaires depuis le fichier CSV
 * @param {string} [csvPath=DATA_CONFIG.csvPath] - Chemin vers le fichier CSV
 * @param {Function} [onProgress] - Callback appelé avec le message de progression
 * @returns {Promise<Array<Object>>} Liste des étoiles chargées
 * @throws {Error} Si le chargement échoue
 */
async function loadStarData(csvPath = DATA_CONFIG.csvPath, onProgress = null) {
    if (onProgress) onProgress('Chargement du fichier de données...');
    
    try {
        const response = await fetch(csvPath);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const csvText = await response.text();
        if (onProgress) onProgress('Analyse des données stellaires...');
        
        const stars = parseCSV(csvText);
        
        return stars;
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        throw new Error(`Impossible de charger les données: ${error.message}`);
    }
}

/**
 * Parse le contenu CSV et extrait les données stellaires
 * @param {string} csvText - Contenu du fichier CSV
 * @param {number} [magnitudeLimit=DATA_CONFIG.magnitudeLimit] - Limite de magnitude
 * @param {string} [separator=DATA_CONFIG.csvSeparator] - Séparateur CSV
 * @returns {Array<Object>} Liste des étoiles parsées
 * @throws {Error} Si le CSV est invalide
 */
function parseCSV(csvText, magnitudeLimit = DATA_CONFIG.magnitudeLimit, separator = DATA_CONFIG.csvSeparator) {
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
        throw new Error('Le fichier CSV est vide ou invalide');
    }
    
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());
    
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
        
        const values = line.split(separator);
        
        const ra = parseFloat(values[columnIndices.ra]);
        const dec = parseFloat(values[columnIndices.dec]);
        const mag = parseFloat(values[columnIndices.mag]);
        
        if (isNaN(ra) || isNaN(dec) || isNaN(mag)) {
            skippedCount++;
            continue;
        }
        
        if (mag >= magnitudeLimit) {
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
    
    return stars;
}

window.DataLoader = {
    loadStarData,
    parseCSV,
    DATA_CONFIG
};

