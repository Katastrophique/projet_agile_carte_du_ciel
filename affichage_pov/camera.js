/**
 * ==========================================================================
 * Camera.js - Système de caméra pour vue POV réaliste
 * ==========================================================================
 * 
 * Gère la projection perspective du ciel étoilé comme si l'observateur
 * regardait réellement le ciel depuis le sol.
 * 
 * Caractéristiques :
 * - Projection gnomique modifiée pour vue réaliste
 * - Champ de vision ajustable (FOV)
 * - Rotation en azimut et altitude
 * - Effet de perspective naturel
 */

class Camera {
    /**
     * Crée une nouvelle caméra pour la vue du ciel
     * @param {number} canvasWidth - Largeur du canvas
     * @param {number} canvasHeight - Hauteur du canvas
     */
    constructor(canvasWidth, canvasHeight) {
        // Dimensions du canvas
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // Détecter si on est sur mobile (portrait)
        const isMobilePortrait = canvasWidth < canvasHeight;
        
        // Direction de visée - plus haute sur mobile pour mieux voir le ciel
        this.azimuth = 180;      // Direction horizontale (0=Nord, 90=Est, 180=Sud, 270=Ouest)
        this.altitude = isMobilePortrait ? 50 : 30;  // Plus haut sur mobile
        
        // Champ de vision
        this.fov = 90;           // Champ de vision horizontal en degrés
        this.minFov = 20;        // Zoom maximum (jumelles)
        this.maxFov = 140;       // Zoom minimum (grand angle)
        
        // Limites de rotation
        this.minAltitude = -5;   // Légèrement sous l'horizon pour voir la ligne
        this.maxAltitude = 90;   // Zénith
        
        // Valeurs par défaut pour reset (adaptées au device)
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
     * Projette les coordonnées horizontales d'une étoile (azimut/altitude)
     * vers les coordonnées écran (x, y) avec une projection perspective
     * 
     * @param {number} starAzimuth - Azimut de l'étoile en degrés
     * @param {number} starAltitude - Altitude de l'étoile en degrés
     * @returns {Object|null} {x, y, visible, distanceFromCenter} ou null si hors champ
     */
    project(starAzimuth, starAltitude) {
        // Convertir en radians
        const starAzRad = degreesToRadians(starAzimuth);
        const starAltRad = degreesToRadians(starAltitude);
        const camAzRad = degreesToRadians(this.azimuth);
        const camAltRad = degreesToRadians(this.altitude);
        
        // Convertir les coordonnées sphériques en cartésiennes 3D
        // (système où X=Est, Y=Nord, Z=Zénith)
        const starX = Math.cos(starAltRad) * Math.sin(starAzRad);
        const starY = Math.cos(starAltRad) * Math.cos(starAzRad);
        const starZ = Math.sin(starAltRad);
        
        // Direction de la caméra en cartésien
        const camX = Math.cos(camAltRad) * Math.sin(camAzRad);
        const camY = Math.cos(camAltRad) * Math.cos(camAzRad);
        const camZ = Math.sin(camAltRad);
        
        // Calculer le produit scalaire (cosinus de l'angle entre étoile et direction de vue)
        const dotProduct = starX * camX + starY * camY + starZ * camZ;
        
        // Si l'étoile est derrière la caméra (angle > 90°), elle n'est pas visible
        if (dotProduct <= 0) {
            return null;
        }
        
        // Calculer l'angle entre l'étoile et le centre de vue
        const angularDistance = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
        const angularDistanceDeg = radiansToDegrees(angularDistance);
        
        // Vérifier si l'étoile est dans le champ de vision
        // On utilise la diagonale du FOV pour ne pas couper les coins
        const fovDiagonal = Math.sqrt(Math.pow(this.fov / 2, 2) + Math.pow(this.getVerticalFov() / 2, 2));
        if (angularDistanceDeg > fovDiagonal) {
            return null;
        }
        
        // Projection perspective (gnomique modifiée)
        // Calculer les coordonnées dans le plan de vue
        
        // Construire un repère local autour de la direction de vue
        // Vecteur "droite" de la caméra (perpendiculaire à la direction, horizontal)
        const rightX = Math.cos(camAzRad);
        const rightY = -Math.sin(camAzRad);
        const rightZ = 0;
        
        // Vecteur "haut" de la caméra (perpendiculaire à direction et droite)
        const upX = -Math.sin(camAltRad) * Math.sin(camAzRad);
        const upY = -Math.sin(camAltRad) * Math.cos(camAzRad);
        const upZ = Math.cos(camAltRad);
        
        // Projeter l'étoile sur le plan de vue
        // Vecteur de l'étoile par rapport à la direction de vue
        const relX = starX - dotProduct * camX;
        const relY = starY - dotProduct * camY;
        const relZ = starZ - dotProduct * camZ;
        
        // Composantes dans le repère de la caméra
        const screenX = relX * rightX + relY * rightY + relZ * rightZ;
        const screenY = relX * upX + relY * upY + relZ * upZ;
        
        // Normaliser par la distance (projection gnomique)
        const scale = 1 / dotProduct;
        const projX = screenX * scale;
        const projY = screenY * scale;
        
        // Convertir en coordonnées pixel
        // FOV horizontal → largeur de l'écran
        const fovRadH = degreesToRadians(this.fov);
        const pixelScale = this.width / (2 * Math.tan(fovRadH / 2));
        
        const x = this.width / 2 + projX * pixelScale;
        const y = this.height / 2 - projY * pixelScale; // Y inversé (écran)
        
        // Calculer la distance normalisée depuis le centre (pour effets visuels)
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
     * Calcule le champ de vision vertical basé sur le ratio d'aspect
     * @returns {number} FOV vertical en degrés
     */
    getVerticalFov() {
        const aspectRatio = this.width / this.height;
        return this.fov / aspectRatio;
    }
    
    /**
     * Fait pivoter la caméra (rotation de la direction de vue)
     * @param {number} deltaAz - Changement d'azimut en degrés
     * @param {number} deltaAlt - Changement d'altitude en degrés
     */
    rotate(deltaAz, deltaAlt) {
        // Rotation horizontale (azimut)
        this.azimuth = normalizeAngle(this.azimuth + deltaAz);
        
        // Rotation verticale (altitude) avec limites
        this.altitude = Math.max(this.minAltitude, 
                                 Math.min(this.maxAltitude, this.altitude + deltaAlt));
    }
    
    /**
     * Ajuste le zoom (champ de vision)
     * @param {number} factor - Facteur de zoom (< 1 = zoom in, > 1 = zoom out)
     */
    zoom(factor) {
        const newFov = this.fov * factor;
        this.fov = Math.max(this.minFov, Math.min(this.maxFov, newFov));
    }
    
    /**
     * Définit directement le champ de vision
     * @param {number} fov - Nouveau FOV en degrés
     */
    setFov(fov) {
        this.fov = Math.max(this.minFov, Math.min(this.maxFov, fov));
    }
    
    /**
     * Réinitialise la caméra à sa position par défaut
     */
    reset() {
        this.azimuth = this.defaultAzimuth;
        this.altitude = this.defaultAltitude;
        this.fov = this.defaultFov;
    }
    
    /**
     * Obtient le nom de la direction cardinale actuelle
     * @returns {string} Direction (ex: "Sud", "Nord-Est")
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
     * Obtient une description formatée de la direction actuelle
     * @returns {string} Ex: "Sud 30°"
     */
    getDirectionDescription() {
        return `${this.getDirectionName()} ${Math.round(this.altitude)}°`;
    }
    
    /**
     * Obtient le niveau de zoom relatif (1.0 = normal)
     * @returns {number} Niveau de zoom
     */
    getZoomLevel() {
        return this.defaultFov / this.fov;
    }
    
    /**
     * Calcule la position d'un point cardinal sur l'horizon projeté
     * @param {number} cardinalAzimuth - Azimut du point cardinal (0=N, 90=E, 180=S, 270=O)
     * @returns {Object|null} {x, y, visible} ou null si hors écran
     */
    projectCardinalPoint(cardinalAzimuth) {
        // Projeter le point sur l'horizon (altitude = 0)
        return this.project(cardinalAzimuth, 0);
    }
    
    /**
     * Vérifie si l'horizon est visible dans la vue actuelle
     * @returns {boolean} true si l'horizon est visible
     */
    isHorizonVisible() {
        // L'horizon est visible si l'altitude de la caméra moins la moitié du FOV vertical <= 0
        const halfVerticalFov = this.getVerticalFov() / 2;
        return (this.altitude - halfVerticalFov) <= 0;
    }
    
    /**
     * Calcule la position Y de l'horizon sur l'écran
     * @returns {number|null} Position Y en pixels, ou null si hors écran
     */
    getHorizonY() {
        if (!this.isHorizonVisible()) {
            return null;
        }
        
        // L'horizon est à altitude 0
        // Quand on regarde vers le haut (altitude > 0), l'horizon est EN BAS de l'écran
        // Quand on regarde vers l'horizon (altitude = 0), l'horizon est AU CENTRE
        const verticalFov = this.getVerticalFov();
        
        // Calcul simplifié et robuste : position proportionnelle dans le FOV
        // L'horizon (altitude 0) est à "altitude" degrés en dessous du centre de vue
        // Le bas de l'écran correspond à -verticalFov/2 par rapport au centre
        // Le haut de l'écran correspond à +verticalFov/2 par rapport au centre
        
        // Position normalisée de l'horizon : 
        // Si altitude = 0, horizon au centre (0.5)
        // Si altitude = verticalFov/2, horizon tout en bas (1.0)
        // Si altitude = -verticalFov/2, horizon tout en haut (0.0)
        const normalizedPosition = 0.5 + (this.altitude / verticalFov);
        
        // Convertir en pixels
        return normalizedPosition * this.height;
    }
    
    /**
     * Obtient l'état actuel de la caméra
     * @returns {Object} État sérialisable
     */
    getState() {
        return {
            azimuth: this.azimuth,
            altitude: this.altitude,
            fov: this.fov
        };
    }
    
    /**
     * Restaure un état précédent
     * @param {Object} state - État à restaurer
     */
    setState(state) {
        if (state.azimuth !== undefined) this.azimuth = state.azimuth;
        if (state.altitude !== undefined) this.altitude = state.altitude;
        if (state.fov !== undefined) this.fov = state.fov;
    }
}
