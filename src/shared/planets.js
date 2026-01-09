/**
 * Module de calcul des positions des planètes du système solaire
 * Utilise des éléments orbitaux moyens simplifiés pour calculer les positions
 */

/**
 * Données des planètes avec leurs éléments orbitaux
 * Les couleurs et symboles sont choisis pour être distincts des étoiles
 */
const PLANETS_DATA = {
    mercury: {
        name: 'Mercure',
        symbol: '☿',
        color: '#B5B5B5',
        size: 6,
        orbital: {
            a: 0.38709927,
            e: 0.20563593,
            i: 7.00497902,
            L: 252.25032350,
            longPeri: 77.45779628,
            longNode: 48.33076593,
            aRate: 0.00000037,
            eRate: 0.00001906,
            iRate: -0.00594749,
            LRate: 149472.67411175,
            longPeriRate: 0.16047689,
            longNodeRate: -0.12534081
        }
    },
    venus: {
        name: 'Vénus',
        symbol: '♀',
        color: '#FFEFD5',
        size: 8,
        orbital: {
            a: 0.72333566,
            e: 0.00677672,
            i: 3.39467605,
            L: 181.97909950,
            longPeri: 131.60246718,
            longNode: 76.67984255,
            aRate: 0.00000390,
            eRate: -0.00004107,
            iRate: -0.00078890,
            LRate: 58517.81538729,
            longPeriRate: 0.00268329,
            longNodeRate: -0.27769418
        }
    },
    mars: {
        name: 'Mars',
        symbol: '♂',
        color: '#CD5C5C',
        size: 7,
        orbital: {
            a: 1.52371034,
            e: 0.09339410,
            i: 1.84969142,
            L: -4.55343205,
            longPeri: -23.94362959,
            longNode: 49.55953891,
            aRate: 0.00001847,
            eRate: 0.00007882,
            iRate: -0.00813131,
            LRate: 19140.30268499,
            longPeriRate: 0.44441088,
            longNodeRate: -0.29257343
        }
    },
    jupiter: {
        name: 'Jupiter',
        symbol: '♃',
        color: '#DEB887',
        size: 10,
        orbital: {
            a: 5.20288700,
            e: 0.04838624,
            i: 1.30439695,
            L: 34.39644051,
            longPeri: 14.72847983,
            longNode: 100.47390909,
            aRate: -0.00011607,
            eRate: -0.00013253,
            iRate: -0.00183714,
            LRate: 3034.74612775,
            longPeriRate: 0.21252668,
            longNodeRate: 0.20469106
        }
    },
    saturn: {
        name: 'Saturne',
        symbol: '♄',
        color: '#F4C542',
        size: 9,
        orbital: {
            a: 9.53667594,
            e: 0.05386179,
            i: 2.48599187,
            L: 49.95424423,
            longPeri: 92.59887831,
            longNode: 113.66242448,
            aRate: -0.00125060,
            eRate: -0.00050991,
            iRate: 0.00193609,
            LRate: 1222.49362201,
            longPeriRate: -0.41897216,
            longNodeRate: -0.28867794
        }
    },
    uranus: {
        name: 'Uranus',
        symbol: '♅',
        color: '#AFEEEE',
        size: 8,
        orbital: {
            a: 19.18916464,
            e: 0.04725744,
            i: 0.77263783,
            L: 313.23810451,
            longPeri: 170.95427630,
            longNode: 74.01692503,
            aRate: -0.00196176,
            eRate: -0.00004397,
            iRate: -0.00242939,
            LRate: 428.48202785,
            longPeriRate: 0.40805281,
            longNodeRate: 0.04240589
        }
    },
    neptune: {
        name: 'Neptune',
        symbol: '♆',
        color: '#4169E1',
        size: 8,
        orbital: {
            a: 30.06992276,
            e: 0.00859048,
            i: 1.77004347,
            L: -55.12002969,
            longPeri: 44.96476227,
            longNode: 131.78422574,
            aRate: 0.00026291,
            eRate: 0.00005105,
            iRate: 0.00035372,
            LRate: 218.45945325,
            longPeriRate: -0.32241464,
            longNodeRate: -0.00508664
        }
    }
};

/**
 * Calcule le jour julien à partir d'une date
 * @param {Date} date - Date JavaScript
 * @returns {number} Jour julien
 */
function dateToJulianDay(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();
    
    const dayFraction = (hour + minute / 60 + second / 3600) / 24;
    
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
 * Calcule les siècles juliens depuis J2000
 * @param {Date} date - Date JavaScript
 * @returns {number} Siècles juliens depuis J2000
 */
function getJulianCenturies(date) {
    const JD = dateToJulianDay(date);
    return (JD - 2451545.0) / 36525;
}

/**
 * Normalise un angle entre 0 et 360 degrés
 * @param {number} angle - Angle en degrés
 * @returns {number} Angle normalisé
 */
function normalizeAngle(angle) {
    angle = angle % 360;
    if (angle < 0) angle += 360;
    return angle;
}

/**
 * Convertit des degrés en radians
 * @param {number} degrees - Angle en degrés
 * @returns {number} Angle en radians
 */
function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Convertit des radians en degrés
 * @param {number} radians - Angle en radians
 * @returns {number} Angle en degrés
 */
function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}

/**
 * Résout l'équation de Kepler pour obtenir l'anomalie excentrique
 * @param {number} M - Anomalie moyenne (radians)
 * @param {number} e - Excentricité
 * @returns {number} Anomalie excentrique (radians)
 */
function solveKepler(M, e) {
    let E = M;
    for (let i = 0; i < 10; i++) {
        E = M + e * Math.sin(E);
    }
    return E;
}

/**
 * Calcule la position héliocentrique d'une planète
 * @param {Object} planet - Données de la planète
 * @param {Date} date - Date d'observation
 * @returns {Object} Position héliocentrique {x, y, z} en UA
 */
function calculateHeliocentricPosition(planet, date) {
    const T = getJulianCenturies(date);
    const orb = planet.orbital;
    
    const a = orb.a + orb.aRate * T;
    const e = orb.e + orb.eRate * T;
    const i = degreesToRadians(orb.i + orb.iRate * T);
    const L = normalizeAngle(orb.L + orb.LRate * T);
    const longPeri = normalizeAngle(orb.longPeri + orb.longPeriRate * T);
    const longNode = normalizeAngle(orb.longNode + orb.longNodeRate * T);
    
    const argPeri = degreesToRadians(longPeri - longNode);
    const node = degreesToRadians(longNode);
    
    const M = degreesToRadians(normalizeAngle(L - longPeri));
    
    const E = solveKepler(M, e);
    
    const xOrbital = a * (Math.cos(E) - e);
    const yOrbital = a * Math.sqrt(1 - e * e) * Math.sin(E);
    
    const cosArgPeri = Math.cos(argPeri);
    const sinArgPeri = Math.sin(argPeri);
    const cosNode = Math.cos(node);
    const sinNode = Math.sin(node);
    const cosI = Math.cos(i);
    const sinI = Math.sin(i);
    
    const x = (cosArgPeri * cosNode - sinArgPeri * sinNode * cosI) * xOrbital +
              (-sinArgPeri * cosNode - cosArgPeri * sinNode * cosI) * yOrbital;
    
    const y = (cosArgPeri * sinNode + sinArgPeri * cosNode * cosI) * xOrbital +
              (-sinArgPeri * sinNode + cosArgPeri * cosNode * cosI) * yOrbital;
    
    const z = (sinArgPeri * sinI) * xOrbital + (cosArgPeri * sinI) * yOrbital;
    
    return { x, y, z };
}

/**
 * Calcule la position héliocentrique de la Terre
 * @param {Date} date - Date d'observation
 * @returns {Object} Position héliocentrique {x, y, z} en UA
 */
function calculateEarthPosition(date) {
    const T = getJulianCenturies(date);
    
    const a = 1.00000261 + 0.00000562 * T;
    const e = 0.01671123 - 0.00004392 * T;
    const i = degreesToRadians(-0.00001531 - 0.01294668 * T);
    const L = normalizeAngle(100.46457166 + 35999.37244981 * T);
    const longPeri = normalizeAngle(102.93768193 + 0.32327364 * T);
    
    const M = degreesToRadians(normalizeAngle(L - longPeri));
    const E = solveKepler(M, e);
    
    const xOrbital = a * (Math.cos(E) - e);
    const yOrbital = a * Math.sqrt(1 - e * e) * Math.sin(E);
    
    const argPeri = degreesToRadians(longPeri);
    
    const x = Math.cos(argPeri) * xOrbital - Math.sin(argPeri) * yOrbital;
    const y = Math.sin(argPeri) * xOrbital + Math.cos(argPeri) * yOrbital;
    const z = Math.sin(i) * yOrbital;
    
    return { x, y, z };
}

/**
 * Convertit des coordonnées écliptiques en équatoriales
 * @param {number} lon - Longitude écliptique (degrés)
 * @param {number} lat - Latitude écliptique (degrés)
 * @returns {Object} Coordonnées équatoriales {ra, dec} en degrés
 */
function eclipticToEquatorial(lon, lat) {
    const eps = degreesToRadians(23.439291);
    
    const lonRad = degreesToRadians(lon);
    const latRad = degreesToRadians(lat);
    
    const sinDec = Math.sin(latRad) * Math.cos(eps) + 
                   Math.cos(latRad) * Math.sin(eps) * Math.sin(lonRad);
    const dec = radiansToDegrees(Math.asin(Math.max(-1, Math.min(1, sinDec))));
    
    const y = Math.sin(lonRad) * Math.cos(eps) - Math.tan(latRad) * Math.sin(eps);
    const x = Math.cos(lonRad);
    let ra = radiansToDegrees(Math.atan2(y, x));
    ra = normalizeAngle(ra);
    
    return { ra, dec };
}

/**
 * Calcule la position géocentrique d'une planète en coordonnées équatoriales
 * @param {Object} planet - Données de la planète
 * @param {Date} date - Date d'observation
 * @returns {Object} Position {ra, dec} en degrés et distance
 */
function calculatePlanetPosition(planet, date) {
    const planetPos = calculateHeliocentricPosition(planet, date);
    
    const earthPos = calculateEarthPosition(date);
    
    const dx = planetPos.x - earthPos.x;
    const dy = planetPos.y - earthPos.y;
    const dz = planetPos.z - earthPos.z;
    
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    const lon = radiansToDegrees(Math.atan2(dy, dx));
    const lat = radiansToDegrees(Math.asin(dz / distance));
    
    const equatorial = eclipticToEquatorial(normalizeAngle(lon), lat);
    
    return {
        ra: equatorial.ra,
        dec: equatorial.dec,
        distance: distance
    };
}

/**
 * Calcule la magnitude apparente approximative d'une planète
 * @param {string} planetKey - Clé de la planète
 * @param {number} distance - Distance à la Terre en UA
 * @returns {number} Magnitude apparente
 */
function estimateMagnitude(planetKey, distance) {
    const baseMagnitudes = {
        mercury: -0.5,
        venus: -4.0,
        mars: -1.5,
        jupiter: -2.5,
        saturn: 0.5,
        uranus: 5.7,
        neptune: 7.8
    };
    
    const baseMag = baseMagnitudes[planetKey] || 0;
    return baseMag + 5 * Math.log10(distance);
}

/**
 * Calcule les positions de toutes les planètes visibles
 * @param {Date} date - Date d'observation
 * @param {number} latitude - Latitude de l'observateur
 * @param {number} longitude - Longitude de l'observateur
 * @returns {Array} Liste des planètes avec leurs positions horizontales
 */
function calculateVisiblePlanets(date, latitude, longitude) {
    const visiblePlanets = [];
    
    const lst = Astronomy.calculateLST(date, longitude);
    
    for (const [key, planet] of Object.entries(PLANETS_DATA)) {
        const position = calculatePlanetPosition(planet, date);
        
        const horizontal = Astronomy.equatorialToHorizontal(
            position.ra,
            position.dec,
            lst,
            latitude
        );
        
        if (horizontal.altitude > 0) {
            const magnitude = estimateMagnitude(key, position.distance);
            
            visiblePlanets.push({
                key: key,
                name: planet.name,
                symbol: planet.symbol,
                color: planet.color,
                size: planet.size,
                ra: position.ra,
                dec: position.dec,
                altitude: horizontal.altitude,
                azimut: horizontal.azimut,
                distance: position.distance,
                magnitude: magnitude,
                isPlanet: true
            });
        }
    }
    
    return visiblePlanets;
}

/**
 * Obtient les données d'une planète par sa clé
 * @param {string} key - Clé de la planète
 * @returns {Object|null} Données de la planète ou null
 */
function getPlanetData(key) {
    return PLANETS_DATA[key] || null;
}

/**
 * Obtient la liste de toutes les planètes
 * @returns {Array} Liste des planètes avec leurs noms et symboles
 */
function getAllPlanets() {
    return Object.entries(PLANETS_DATA).map(([key, planet]) => ({
        key,
        name: planet.name,
        symbol: planet.symbol,
        color: planet.color
    }));
}

// Export global
window.Planets = {
    PLANETS_DATA,
    calculatePlanetPosition,
    calculateVisiblePlanets,
    getPlanetData,
    getAllPlanets
};
