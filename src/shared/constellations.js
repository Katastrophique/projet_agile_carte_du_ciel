function calculateAngularDistance(star1, star2) {
    const az1 = star1.azimut * Math.PI / 180;
    const alt1 = star1.altitude * Math.PI / 180;
    const az2 = star2.azimut * Math.PI / 180;
    const alt2 = star2.altitude * Math.PI / 180;
    
    const cosD = Math.sin(alt1) * Math.sin(alt2) + 
                 Math.cos(alt1) * Math.cos(alt2) * Math.cos(az1 - az2);
    
    const cosDClamped = Math.max(-1, Math.min(1, cosD));
    const distanceRad = Math.acos(cosDClamped);
    
    return distanceRad * 180 / Math.PI;
}

function groupStarsByConstellation(stars) {
    const constellations = {};
    
    for (const star of stars) {
        if (!star.constellation || star.constellation.trim() === '') {
            continue;
        }
        
        const conName = star.constellation.trim();
        
        if (!constellations[conName]) {
            constellations[conName] = [];
        }
        
        constellations[conName].push(star);
    }
    
    return constellations;
}

function calculateConstellationConnections(stars, maxDistance = 30) {
    if (stars.length < 2) {
        return [];
    }
    
    const connections = [];
    const distances = [];
    
    for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
            const distance = calculateAngularDistance(stars[i], stars[j]);
            if (distance <= maxDistance) {
                distances.push({
                    star1: stars[i],
                    star2: stars[j],
                    distance: distance
                });
            }
        }
    }
    
    distances.sort((a, b) => a.distance - b.distance);
    
    const connectedStars = new Set();
    const maxConnectionsPerStar = 3;
    
    for (const connection of distances) {
        const star1Id = connection.star1.id || connection.star1.name || '';
        const star2Id = connection.star2.id || connection.star2.name || '';
        
        const star1Connections = connections.filter(c => 
            (c.star1.id || c.star1.name || '') === star1Id || 
            (c.star2.id || c.star2.name || '') === star1Id
        ).length;
        
        const star2Connections = connections.filter(c => 
            (c.star1.id || c.star1.name || '') === star2Id || 
            (c.star2.id || c.star2.name || '') === star2Id
        ).length;
        
        if (star1Connections < maxConnectionsPerStar && star2Connections < maxConnectionsPerStar) {
            connections.push(connection);
            connectedStars.add(star1Id);
            connectedStars.add(star2Id);
        }
    }
    
    return connections;
}

function prepareConstellationsForRendering(visibleStars) {
    const constellationsMap = groupStarsByConstellation(visibleStars);
    
    const constellations = [];
    
    for (const [conName, stars] of Object.entries(constellationsMap)) {
        if (stars.length < 2) {
            continue;
        }
        
        const connections = calculateConstellationConnections(stars);
        
        if (connections.length > 0) {
            constellations.push({
                name: conName,
                stars: stars,
                connections: connections
            });
        }
    }
    
    return constellations;
}

function getConstellationColor(constellationName) {
    let hash = 0;
    for (let i = 0; i < constellationName.length; i++) {
        hash = constellationName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    const saturation = 60 + (hash % 20);
    const lightness = 70 + (hash % 10);
    
    return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.4)`;
}

window.Constellations = {
    groupStarsByConstellation,
    calculateConstellationConnections,
    prepareConstellationsForRendering,
    getConstellationColor,
    calculateAngularDistance
};

