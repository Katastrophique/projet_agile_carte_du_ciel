/**
 * Vue Télescope - Vue classique avec projection azimutale
 */

/**
 * Classe principale pour la vue Télescope
 */
class TelescopeView {
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
    }

    /**
     * Initialise la vue Télescope
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
        if (!this.canvasController) return;
        
        this.canvasController.clearCanvas();
        
        this.canvasController.drawConstellationLines(this.constellations);
        
        const starsWithConstellation = new Set();
        for (const constellation of this.constellations) {
            for (const star of constellation.stars) {
                const key = `${star.ra.toFixed(4)}_${star.dec.toFixed(4)}_${star.mag.toFixed(2)}`;
                starsWithConstellation.add(key);
            }
        }
        
        let renderedCount = 0;
        
        for (const star of this.visibleStars) {
            const screenPos = this.canvasController.worldToScreen(star.azimut, star.altitude);
            
            if (!screenPos) continue;
            
            if (!this.canvasController.isPointVisible(screenPos.x, screenPos.y)) {
                continue;
            }
            
            const size = Astronomy.calculateStarSize(star.mag, this.canvasController.zoomLevel);
            
            const color = Astronomy.getStarColor(star.ci);
            
            const starKey = `${star.ra.toFixed(4)}_${star.dec.toFixed(4)}_${star.mag.toFixed(2)}`;
            const hasConstellation = starsWithConstellation.has(starKey);
            
            this.canvasController.drawStar(screenPos.x, screenPos.y, size, color, star.mag, hasConstellation);
            renderedCount++;
        }
        
        this.drawCardinalIndicators();
    }

    /**
     * Dessine les indicateurs cardinaux
     */
    drawCardinalIndicators() {
        const ctx = this.canvasController.ctx;
        const radius = this.canvasController.projectionRadius * this.canvasController.zoomLevel + 15;
        
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
            const angleRad = Astronomy.degreesToRadians(dir.azimut - 90);
            const x = this.canvasController.centerX + this.canvasController.offsetX + radius * Math.cos(angleRad);
            const y = this.canvasController.centerY + this.canvasController.offsetY + radius * Math.sin(angleRad);
            
            if (this.canvasController.isPointVisible(x, y, 30)) {
                ctx.fillText(dir.label, x, y);
            }
        }
    }
}

window.TelescopeView = TelescopeView;

