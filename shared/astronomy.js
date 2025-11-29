/**
 * ==========================================================================
 * Astronomy.js - Module de calculs astronomiques
 * ==========================================================================
 * 
 * Ce module contient toutes les fonctions nécessaires pour :
 * - Calculer le temps sidéral local (LST)
 * - Convertir les coordonnées équatoriales en coordonnées horizontales
 * - Déterminer la visibilité des étoiles depuis une position donnée
 */

// Configuration de la position d'observation (Lyon, France)
const OBSERVER_CONFIG = {
    latitude: 45.757814,      // Latitude en degrés
    longitude: 4.832011,      // Longitude en degrés
    locationName: "Lyon, France"
};

/**
 * Convertit des degrés en radians
 * @param {number} degrees - Angle en degrés
 * @returns {number} Angle en radians
 */
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Convertit des radians en degrés
 * @param {number} radians - Angle en radians
 * @returns {number} Angle en degrés
 */
function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Normalise un angle pour qu'il soit entre 0 et 360 degrés
 * @param {number} angle - Angle en degrés
 * @returns {number} Angle normalisé entre 0 et 360
 */
function normalizeAngle(angle) {
    angle = angle % 360;
    if (angle < 0) {
        angle += 360;
    }
    return angle;
}

/**
 * Calcule le Jour Julien à partir d'une date JavaScript
 * Le Jour Julien est une mesure continue du temps utilisée en astronomie
 * 
 * @param {Date} date - Objet Date JavaScript
 * @returns {number} Jour Julien
 */
function dateToJulianDay(date) {
    // Convertir en UTC pour les calculs astronomiques
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // JavaScript: 0-11, nous voulons 1-12
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();
    
    // Fraction du jour
    const dayFraction = (hour + minute / 60 + second / 3600) / 24;
    
    // Algorithme de calcul du Jour Julien
    let y = year;
    let m = month;
    
    if (month <= 2) {
        y = year - 1;
        m = month + 12;
    }
    
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    
    const JD = Math.floor(365.25 * (y + 4716)) + 
               Math.floor(30.6001 * (m + 1)) + 
               day + dayFraction + B - 1524.5;
    
    return JD;
}

/**
 * Calcule le Temps Sidéral de Greenwich (GST) pour une date donnée
 * Le GST est l'angle horaire du point vernal à Greenwich
 * 
 * @param {Date} date - Date et heure d'observation
 * @returns {number} GST en degrés (0-360)
 */
function calculateGST(date) {
    const JD = dateToJulianDay(date);
    
    // Nombre de siècles juliens depuis J2000.0 (1er janvier 2000 à 12h TT)
    const T = (JD - 2451545.0) / 36525;
    
    // Temps sidéral moyen de Greenwich à 0h UT (en degrés)
    // Formule de l'IAU (International Astronomical Union)
    let GST = 280.46061837 + 
              360.98564736629 * (JD - 2451545.0) + 
              0.000387933 * T * T - 
              T * T * T / 38710000;
    
    // Normaliser entre 0 et 360 degrés
    GST = normalizeAngle(GST);
    
    return GST;
}

/**
 * Calcule le Temps Sidéral Local (LST) pour une longitude donnée
 * LST = GST + longitude (longitude Est positive)
 * 
 * @param {Date} date - Date et heure d'observation
 * @param {number} longitude - Longitude de l'observateur en degrés (Est positif)
 * @returns {number} LST en degrés (0-360)
 */
function calculateLST(date, longitude = OBSERVER_CONFIG.longitude) {
    const GST = calculateGST(date);
    let LST = GST + longitude;
    
    // Normaliser entre 0 et 360 degrés
    LST = normalizeAngle(LST);
    
    return LST;
}

/**
 * Convertit les coordonnées équatoriales (RA, Dec) en coordonnées horizontales (Alt, Az)
 * 
 * Formules utilisées :
 * - Angle horaire (H) = LST - RA
 * - sin(Alt) = sin(Dec) × sin(Lat) + cos(Dec) × cos(Lat) × cos(H)
 * - cos(Az) = (sin(Dec) - sin(Alt) × sin(Lat)) / (cos(Alt) × cos(Lat))
 * 
 * @param {number} ra - Ascension droite en degrés (0-360)
 * @param {number} dec - Déclinaison en degrés (-90 à +90)
 * @param {number} lst - Temps sidéral local en degrés
 * @param {number} latitude - Latitude de l'observateur en degrés
 * @returns {Object} Objet contenant altitude et azimut en degrés
 */
function equatorialToHorizontal(ra, dec, lst, latitude = OBSERVER_CONFIG.latitude) {
    // Convertir en radians pour les calculs trigonométriques
    const raRad = degreesToRadians(ra);
    const decRad = degreesToRadians(dec);
    const latRad = degreesToRadians(latitude);
    const lstRad = degreesToRadians(lst);
    
    // Calculer l'angle horaire (H = LST - RA)
    const H = lstRad - raRad;
    
    // Calculer l'altitude
    // sin(Alt) = sin(Dec) × sin(Lat) + cos(Dec) × cos(Lat) × cos(H)
    const sinAlt = Math.sin(decRad) * Math.sin(latRad) + 
                   Math.cos(decRad) * Math.cos(latRad) * Math.cos(H);
    
    // Limiter sinAlt entre -1 et 1 pour éviter les erreurs d'arrondi
    const sinAltClamped = Math.max(-1, Math.min(1, sinAlt));
    const altRad = Math.asin(sinAltClamped);
    const altitude = radiansToDegrees(altRad);
    
    // Calculer l'azimut
    // cos(Az) = (sin(Dec) - sin(Alt) × sin(Lat)) / (cos(Alt) × cos(Lat))
    const cosAlt = Math.cos(altRad);
    
    // Éviter la division par zéro quand l'étoile est au zénith
    let azimut = 0;
    if (Math.abs(cosAlt) > 0.0001) {
        let cosAz = (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) / 
                    (cosAlt * Math.cos(latRad));
        
        // Limiter cosAz entre -1 et 1
        cosAz = Math.max(-1, Math.min(1, cosAz));
        
        azimut = radiansToDegrees(Math.acos(cosAz));
        
        // Déterminer le quadrant correct de l'azimut
        // Si sin(H) > 0, l'étoile est à l'ouest, donc Az > 180°
        if (Math.sin(H) > 0) {
            azimut = 360 - azimut;
        }
    }
    
    return {
        altitude: altitude,  // Degrés au-dessus de l'horizon (-90 à +90)
        azimut: azimut       // Degrés depuis le Nord, sens horaire (0-360)
    };
}

/**
 * Vérifie si une étoile est visible (au-dessus de l'horizon)
 * 
 * @param {number} altitude - Altitude de l'étoile en degrés
 * @returns {boolean} true si l'étoile est visible (altitude > 0)
 */
function isStarVisible(altitude) {
    return altitude > 0;
}

/**
 * Calcule les positions horizontales pour une liste d'étoiles
 * et filtre celles qui sont visibles
 * 
 * @param {Array} stars - Tableau d'étoiles avec propriétés ra, dec, mag
 * @param {Date} date - Date et heure d'observation
 * @returns {Array} Tableau d'étoiles visibles avec leurs coordonnées horizontales
 */
function calculateVisibleStars(stars, date) {
    const lst = calculateLST(date);
    const visibleStars = [];
    
    for (const star of stars) {
        // Convertir RA de heures en degrés si nécessaire
        // Dans hygdata, ra est déjà en degrés décimaux (0-24 heures converties)
        // En fait, vérifions : ra semble être en heures décimales (0-24)
        // Convertissons en degrés (× 15)
        const raInDegrees = star.ra * 15; // Convertir heures en degrés
        
        const horizontal = equatorialToHorizontal(raInDegrees, star.dec, lst);
        
        if (isStarVisible(horizontal.altitude)) {
            visibleStars.push({
                ...star,
                altitude: horizontal.altitude,
                azimut: horizontal.azimut
            });
        }
    }
    
    return visibleStars;
}

/**
 * Formate la date et l'heure pour l'affichage
 * 
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée en français
 */
function formatDateTime(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    };
    
    return date.toLocaleDateString('fr-FR', options);
}

/**
 * Calcule la taille d'affichage d'une étoile basée sur sa magnitude
 * Les étoiles plus brillantes (magnitude plus basse) sont plus grandes
 * 
 * @param {number} magnitude - Magnitude apparente de l'étoile
 * @param {number} zoomLevel - Niveau de zoom actuel
 * @returns {number} Rayon en pixels pour l'affichage
 */
function calculateStarSize(magnitude, zoomLevel = 1) {
    // Magnitude va de -1.46 (Sirius) à ~6 pour les étoiles visibles à l'œil nu
    // On veut que les étoiles brillantes soient plus grandes
    // Formule : taille = baseSize * 10^((6 - mag) / 2.5) * zoom
    
    const baseSize = 0.5;  // Taille de base en pixels
    const maxSize = 8;     // Taille maximale
    const minSize = 0.5;   // Taille minimale
    
    // Calculer la taille basée sur la magnitude
    // Plus la magnitude est basse, plus l'étoile est brillante
    let size = baseSize * Math.pow(10, (6 - magnitude) / 5);
    
    // Appliquer le zoom
    size *= Math.sqrt(zoomLevel);
    
    // Limiter la taille
    size = Math.max(minSize, Math.min(maxSize, size));
    
    return size;
}

/**
 * Obtient la couleur d'une étoile basée sur son indice de couleur (B-V)
 * Pour cette version, on utilise simplement blanc/jaune
 * 
 * @param {number} colorIndex - Indice de couleur B-V
 * @returns {string} Couleur CSS
 */
function getStarColor(colorIndex) {
    // Version simplifiée : toutes les étoiles en blanc/jaune pâle
    // Les étoiles plus brillantes apparaîtront plus blanches
    return '#FFFEF0';
}

// Exposé global (compatible avec l'usage existant non-modulaire)
window.Astronomy = {
    OBSERVER_CONFIG,
    degreesToRadians,
    radiansToDegrees,
    normalizeAngle,
    dateToJulianDay,
    calculateGST,
    calculateLST,
    equatorialToHorizontal,
    isStarVisible,
    calculateVisibleStars,
    formatDateTime,
    calculateStarSize,
    getStarColor
};
