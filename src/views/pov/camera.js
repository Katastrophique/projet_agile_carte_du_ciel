/**
 * Classe Camera pour la projection 3D du ciel en vue POV
 */
class Camera {
    /**
     * @param {number} canvasWidth - Largeur du canvas
     * @param {number} canvasHeight - Hauteur du canvas
     */
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        const isMobilePortrait = canvasWidth < canvasHeight;
        
        this.azimuth = 180;
        this.altitude = isMobilePortrait ? 50 : 30;
        
        this.fov = 90;
        this.minFov = 20;
        this.maxFov = 140;
        
        this.minAltitude = -5;
        this.maxAltitude = 90;
        
        this.defaultAzimuth = 180;
        this.defaultAltitude = isMobilePortrait ? 50 : 30;
        this.defaultFov = 90;
    }
    
    /**
     * Met à jour les dimensions du canvas
     * @param {number} width - Nouvelle largeur
     * @param {number} height - Nouvelle hauteur
     */
    updateDimensions(width, height) {
        this.width = width;
        this.height = height;
    }
    
    /**
     * Projette une étoile depuis les coordonnées horizontales vers l'écran
     * @param {number} starAzimuth - Azimut de l'étoile en degrés
     * @param {number} starAltitude - Altitude de l'étoile en degrés
     * @returns {Object|null} Position projetée {x, y, visible, distanceFromCenter, angularDistance} ou null si hors champ
     */
    project(starAzimuth, starAltitude) {
        const starAzRad = Astronomy.degreesToRadians(starAzimuth);
        const starAltRad = Astronomy.degreesToRadians(starAltitude);
        const camAzRad = Astronomy.degreesToRadians(this.azimuth);
        const camAltRad = Astronomy.degreesToRadians(this.altitude);
        
        const starX = Math.cos(starAltRad) * Math.sin(starAzRad);
        const starY = Math.cos(starAltRad) * Math.cos(starAzRad);
        const starZ = Math.sin(starAltRad);
        
        const camX = Math.cos(camAltRad) * Math.sin(camAzRad);
        const camY = Math.cos(camAltRad) * Math.cos(camAzRad);
        const camZ = Math.sin(camAltRad);
        
        const dotProduct = starX * camX + starY * camY + starZ * camZ;
        
        if (dotProduct <= 0) {
            return null;
        }
        
        const angularDistance = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
        const angularDistanceDeg = Astronomy.radiansToDegrees(angularDistance);
        
        const fovDiagonal = Math.sqrt(Math.pow(this.fov / 2, 2) + Math.pow(this.getVerticalFov() / 2, 2));
        if (angularDistanceDeg > fovDiagonal) {
            return null;
        }
        
        const rightX = Math.cos(camAzRad);
        const rightY = -Math.sin(camAzRad);
        const rightZ = 0;
        
        const upX = -Math.sin(camAltRad) * Math.sin(camAzRad);
        const upY = -Math.sin(camAltRad) * Math.cos(camAzRad);
        const upZ = Math.cos(camAltRad);
        
        const relX = starX - dotProduct * camX;
        const relY = starY - dotProduct * camY;
        const relZ = starZ - dotProduct * camZ;
        
        const screenX = relX * rightX + relY * rightY + relZ * rightZ;
        const screenY = relX * upX + relY * upY + relZ * upZ;
        
        const scale = 1 / dotProduct;
        const projX = screenX * scale;
        const projY = screenY * scale;
        
        const fovRadH = Astronomy.degreesToRadians(this.fov);
        const pixelScale = this.width / (2 * Math.tan(fovRadH / 2));
        
        const x = this.width / 2 + projX * pixelScale;
        const y = this.height / 2 - projY * pixelScale;
        
        const distanceFromCenter = angularDistanceDeg / (this.fov / 2);
        
        return {
            x: x,
            y: y,
            visible: true,
            distanceFromCenter: distanceFromCenter,
            angularDistance: angularDistanceDeg
        };
    }
    
    /**
     * Calcule le champ de vision vertical
     * @returns {number} Champ de vision vertical en degrés
     */
    getVerticalFov() {
        const aspectRatio = this.width / this.height;
        return this.fov / aspectRatio;
    }
    
    /**
     * Fait tourner la caméra
     * @param {number} deltaAz - Variation d'azimut en degrés
     * @param {number} deltaAlt - Variation d'altitude en degrés
     */
    rotate(deltaAz, deltaAlt) {
        this.azimuth = Astronomy.normalizeAngle(this.azimuth + deltaAz);
        
        this.altitude = Math.max(this.minAltitude, 
                                 Math.min(this.maxAltitude, this.altitude + deltaAlt));
    }
    
    /**
     * Effectue un zoom
     * @param {number} factor - Facteur de zoom (1.1 pour zoomer, 0.9 pour dézoomer)
     */
    zoom(factor) {
        const newFov = this.fov * factor;
        this.fov = Math.max(this.minFov, Math.min(this.maxFov, newFov));
    }
    
    /**
     * Définit le champ de vision
     * @param {number} fov - Champ de vision en degrés
     */
    setFov(fov) {
        this.fov = Math.max(this.minFov, Math.min(this.maxFov, fov));
    }
    
    /**
     * Réinitialise la caméra aux valeurs par défaut
     */
    reset() {
        this.azimuth = this.defaultAzimuth;
        this.altitude = this.defaultAltitude;
        this.fov = this.defaultFov;
    }
    
    /**
     * Obtient le nom de la direction actuelle
     * @returns {string} Nom de la direction (Nord, Sud, Est, Ouest, etc.)
     */
    getDirectionName() {
        const directions = [
            { min: 337.5, max: 360, name: "Nord" },
            { min: 0, max: 22.5, name: "Nord" },
            { min: 22.5, max: 67.5, name: "Nord-Est" },
            { min: 67.5, max: 112.5, name: "Est" },
            { min: 112.5, max: 157.5, name: "Sud-Est" },
            { min: 157.5, max: 202.5, name: "Sud" },
            { min: 202.5, max: 247.5, name: "Sud-Ouest" },
            { min: 247.5, max: 292.5, name: "Ouest" },
            { min: 292.5, max: 337.5, name: "Nord-Ouest" }
        ];
        
        for (const dir of directions) {
            if (this.azimuth >= dir.min && this.azimuth < dir.max) {
                return dir.name;
            }
        }
        return "Nord";
    }
    
    /**
     * Obtient la description de la direction avec l'altitude
     * @returns {string} Description de la direction
     */
    getDirectionDescription() {
        return `${this.getDirectionName()} ${Math.round(this.altitude)}°`;
    }
    
    /**
     * Obtient le niveau de zoom actuel
     * @returns {number} Niveau de zoom (1.0 = zoom par défaut)
     */
    getZoomLevel() {
        return this.defaultFov / this.fov;
    }
    
    /**
     * Projette un point cardinal sur l'écran
     * @param {number} cardinalAzimuth - Azimut du point cardinal en degrés
     * @returns {Object|null} Position projetée ou null
     */
    projectCardinalPoint(cardinalAzimuth) {
        return this.project(cardinalAzimuth, 0);
    }
    
    /**
     * Vérifie si l'horizon est visible
     * @returns {boolean} True si l'horizon est visible
     */
    isHorizonVisible() {
        const halfVerticalFov = this.getVerticalFov() / 2;
        return (this.altitude - halfVerticalFov) <= 0;
    }
    
    /**
     * Obtient la position Y de l'horizon sur l'écran
     * @returns {number|null} Position Y de l'horizon ou null si non visible
     */
    getHorizonY() {
        if (!this.isHorizonVisible()) {
            return null;
        }
        
        const verticalFov = this.getVerticalFov();
        
        const normalizedPosition = 0.5 + (this.altitude / verticalFov);
        
        return normalizedPosition * this.height;
    }
    
    /**
     * Obtient l'état actuel de la caméra
     * @returns {Object} État {azimuth, altitude, fov}
     */
    getState() {
        return {
            azimuth: this.azimuth,
            altitude: this.altitude,
            fov: this.fov
        };
    }
    
    /**
     * Restaure l'état de la caméra
     * @param {Object} state - État {azimuth, altitude, fov}
     */
    setState(state) {
        if (state.azimuth !== undefined) this.azimuth = state.azimuth;
        if (state.altitude !== undefined) this.altitude = state.altitude;
        if (state.fov !== undefined) this.fov = state.fov;
    }
}

