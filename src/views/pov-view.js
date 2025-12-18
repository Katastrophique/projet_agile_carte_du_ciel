/**
 * Vue POV (Point of View) - Vue immersive du ciel
 */

/**
 * Classe principale pour la vue POV
 */
class POVView {
    /**
     * @param {HTMLCanvasElement} canvas - Élément canvas
     * @param {Object} config - Configuration de l'application
     */
    constructor(canvas, config) {
        this.canvas = canvas;
        this.config = config;
        this.allStars = [];
        this.visibleStars = [];
        this.constellations = [];
        this.canvasController = null;
        this.currentDate = null;
        this.projectedStars = [];
        this.highlightedConstellation = null;
        this.filteredStarIds = new Set();
    }

    /**
     * Initialise la vue POV
     * @returns {Promise<void>}
     */
    async init() {
        try {
            this.allStars = await DataLoader.loadStarData(
                this.config.csvPath,
                UIUtils.updateLoadingMessage
            );
            
            UIUtils.updateLoadingMessage(`${this.allStars.length} étoiles chargées. Calcul des positions...`);
            
            if (!this.canvas) {
                throw new Error('Canvas non trouvé dans le DOM');
            }
            
            this.canvasController = new CanvasController(this.canvas, () => this.render());
            
            this.updateVisibleStars();
            this.canvasController.updateUI();
            this.render();
            
            UIUtils.hideLoadingOverlay();
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            UIUtils.showError(error.message);
        }
    }

    /**
     * Met à jour les étoiles visibles selon la date actuelle
     */
    updateVisibleStars() {
        this.currentDate = new Date();
        
        UIUtils.updateDateTimeDisplay(this.currentDate);
        
        this.visibleStars = Astronomy.calculateVisibleStars(this.allStars, this.currentDate);
        
        this.constellations = Constellations.prepareConstellationsForRendering(this.visibleStars);
        
        this.visibleStars.sort((a, b) => b.mag - a.mag);
        
        UIUtils.updateStarCount(this.visibleStars.length);
    }

    /**
     * Rend la carte du ciel
     */
    render() {
        if (!this.canvasController || !this.canvasController.camera) return;
        
        this.canvasController.clearCanvas();
        
        this.canvasController.drawConstellationLines(this.constellations, this.highlightedConstellation);
        
        const camera = this.canvasController.camera;
        let renderedCount = 0;
        this.projectedStars = [];
        
        const starsWithConstellation = new Set();
        for (const constellation of this.constellations) {
            for (const star of constellation.stars) {
                const key = `${star.ra.toFixed(4)}_${star.dec.toFixed(4)}_${star.mag.toFixed(2)}`;
                starsWithConstellation.add(key);
            }
        }
        
        for (const star of this.visibleStars) {
            const projection = camera.project(star.azimut, star.altitude);
            
            if (!projection || !projection.visible) {
                continue;
            }
            
            if (!this.canvasController.isPointVisible(projection.x, projection.y)) {
                continue;
            }
            
            const baseSize = Astronomy.calculateStarSize(star.mag, camera.getZoomLevel());
            
            const color = Astronomy.getStarColor(star.ci);
            
            const starKey = `${star.ra.toFixed(4)}_${star.dec.toFixed(4)}_${star.mag.toFixed(2)}`;
            const hasConstellation = starsWithConstellation.has(starKey);
            
            const isHighlighted = this.highlightedConstellation && 
                                  star.constellation && 
                                  star.constellation.trim() === this.highlightedConstellation;
            
            const isFiltered = this.filteredStarIds.size > 0 && this.filteredStarIds.has(String(star.id));
            
            this.canvasController.drawStar(
                projection.x, 
                projection.y, 
                baseSize, 
                color, 
                star.mag,
                projection.distanceFromCenter,
                star.altitude,
                hasConstellation,
                isHighlighted,
                isFiltered
            );
            
            this.projectedStars.push({
                star: star,
                x: projection.x,
                y: projection.y,
                size: baseSize
            });
            
            renderedCount++;
        }
        
        UIUtils.updateStarCount(this.visibleStars.length, renderedCount);
    }

    /**
     * Met en évidence une constellation
     * @param {string} constellationAbbr - Abréviation de la constellation
     */
    setHighlightedConstellation(constellationAbbr) {
        if (this.highlightedConstellation !== constellationAbbr) {
            this.highlightedConstellation = constellationAbbr;
            this.render();
        }
    }

    /**
     * Retire la mise en évidence
     */
    clearHighlightedConstellation() {
        if (this.highlightedConstellation !== null) {
            this.highlightedConstellation = null;
            this.render();
        }
    }

    /**
     * Définit les étoiles filtrées à mettre en surbrillance
     * @param {Set<string>} starIds - Set des IDs d'étoiles à mettre en surbrillance
     */
    setFilteredStars(starIds) {
        this.filteredStarIds = starIds;
        this.render();
    }

    /**
     * Efface le filtre d'étoiles
     */
    clearFilteredStars() {
        this.filteredStarIds = new Set();
        this.render();
    }

    /**
     * Trouve une étoile à une position donnée
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @returns {Object|null} Étoile trouvée ou null
     */
    findStarAtPosition(x, y) {
        let closestStar = null;
        let closestDistance = 15;
        
        for (const projected of this.projectedStars) {
            const dx = projected.x - x;
            const dy = projected.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const detectionRadius = Math.max(projected.size * 2, 10);
            
            if (distance < detectionRadius && distance < closestDistance) {
                closestDistance = distance;
                closestStar = projected.star;
            }
        }
        
        return closestStar;
    }
}

window.POVView = POVView;

