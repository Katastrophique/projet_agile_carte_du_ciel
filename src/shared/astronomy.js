const OBSERVER_CONFIG = {
    latitude: 45.757814,
    longitude: 4.832011,
    locationName: "Lyon, France"
};

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

function normalizeAngle(angle) {
    angle = angle % 360;
    if (angle < 0) {
        angle += 360;
    }
    return angle;
}

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

function calculateGST(date) {
    const JD = dateToJulianDay(date);
    
    const T = (JD - 2451545.0) / 36525;
    
    let GST = 280.46061837 + 
              360.98564736629 * (JD - 2451545.0) + 
              0.000387933 * T * T - 
              T * T * T / 38710000;
    
    GST = normalizeAngle(GST);
    
    return GST;
}

function calculateLST(date, longitude = OBSERVER_CONFIG.longitude) {
    const GST = calculateGST(date);
    let LST = GST + longitude;
    
    LST = normalizeAngle(LST);
    
    return LST;
}

function equatorialToHorizontal(ra, dec, lst, latitude = OBSERVER_CONFIG.latitude) {
    const raRad = degreesToRadians(ra);
    const decRad = degreesToRadians(dec);
    const latRad = degreesToRadians(latitude);
    const lstRad = degreesToRadians(lst);
    
    const H = lstRad - raRad;
    
    const sinAlt = Math.sin(decRad) * Math.sin(latRad) + 
                   Math.cos(decRad) * Math.cos(latRad) * Math.cos(H);
    
    const sinAltClamped = Math.max(-1, Math.min(1, sinAlt));
    const altRad = Math.asin(sinAltClamped);
    const altitude = radiansToDegrees(altRad);
    
    const cosAlt = Math.cos(altRad);
    
    let azimut = 0;
    if (Math.abs(cosAlt) > 0.0001) {
        let cosAz = (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) / 
                    (cosAlt * Math.cos(latRad));
        
        cosAz = Math.max(-1, Math.min(1, cosAz));
        
        azimut = radiansToDegrees(Math.acos(cosAz));
        
        if (Math.sin(H) > 0) {
            azimut = 360 - azimut;
        }
    }
    
    return {
        altitude: altitude,
        azimut: azimut
    };
}

function isStarVisible(altitude) {
    return altitude > 0;
}

function calculateVisibleStars(stars, date) {
    const lst = calculateLST(date);
    const visibleStars = [];
    
    for (const star of stars) {
        const raInDegrees = star.ra * 15;
        
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

function calculateStarSize(magnitude, zoomLevel = 1) {
    const baseSize = 0.5;
    const maxSize = 8;
    const minSize = 0.5;
    
    let size = baseSize * Math.pow(10, (6 - magnitude) / 5);
    
    size *= Math.sqrt(zoomLevel);
    
    size = Math.max(minSize, Math.min(maxSize, size));
    
    return size;
}

function getStarColor(colorIndex) {
    return '#FFFEF0';
}


function setObserver(latitude, longitude, locationName = "") {
    OBSERVER_CONFIG.latitude = latitude;
    OBSERVER_CONFIG.longitude = longitude;
    OBSERVER_CONFIG.locationName = locationName;

    console.log("Observer mis à jour :", { latitude, longitude, locationName });
}


window.Astronomy = {
    OBSERVER_CONFIG,
    setObserver,
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

