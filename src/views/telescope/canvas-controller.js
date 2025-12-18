/**
 * Contrôleur de canvas pour la vue Télescope
 * Gère les interactions utilisateur et le rendu avec projection azimutale
 */
class CanvasController {
    /**
     * @param {HTMLCanvasElement} canvas - Élément canvas
     * @param {Function} onRenderNeeded - Callback appelé quand un rendu est nécessaire
     */
    constructor(canvas, onRenderNeeded) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onRenderNeeded = onRenderNeeded;
        
        this.zoomLevel = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.minZoom = 0.5;
        this.maxZoom = 10;
        
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartOffsetX = 0;
        this.dragStartOffsetY = 0;
        
        this.isPinching = false;
        this.initialPinchDistance = 0;
        this.initialPinchZoom = 1;
        
        this.resizeCanvas();
        
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        
        this.projectionRadius = Math.min(canvas.width, canvas.height) / 2 - 20;
        
        this.initEventListeners();
    }
    
    /**
     * Redimensionne le canvas selon la taille de la fenêtre
     */
    resizeCanvas() {
        const maxWidth = window.innerWidth - 80;
        const maxHeight = window.innerHeight - 300;
        const size = Math.min(maxWidth, maxHeight, 800);
        const finalSize = Math.max(size, 300);
        
        this.canvas.width = finalSize;
        this.canvas.height = finalSize;
        
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.projectionRadius = Math.min(this.canvas.width, this.canvas.height) / 2 - 20;
    }
    
    /**
     * Initialise tous les écouteurs d'événements
     */
    initEventListeners() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.requestRender();
        });
        
        this.canvas.addEventListener('wheel', (e) => this.handleZoom(e), { passive: false });
        
        this.canvas.addEventListener('mousedown', (e) => this.handlePanStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handlePanMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handlePanEnd(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handlePanEnd(e));
        
        this.canvas.addEventListener('dblclick', (e) => this.resetView(e));
        
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }
    
    /**
     * Gère le zoom avec la molette de la souris
     * @param {WheelEvent} event - Événement de molette
     */
    handleZoom(event) {
        event.preventDefault();
        
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = this.zoomLevel * zoomFactor;
        
        if (newZoom < this.minZoom || newZoom > this.maxZoom) {
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const relX = mouseX - this.centerX - this.offsetX;
        const relY = mouseY - this.centerY - this.offsetY;
        
        const oldZoom = this.zoomLevel;
        this.zoomLevel = newZoom;
        
        this.offsetX -= relX * (zoomFactor - 1);
        this.offsetY -= relY * (zoomFactor - 1);
        
        this.updateZoomDisplay();
        
        this.requestRender();
    }
    
    /**
     * Démarre le pan (déplacement) de la vue
     * @param {MouseEvent} event - Événement de souris
     */
    handlePanStart(event) {
        this.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        this.dragStartOffsetX = this.offsetX;
        this.dragStartOffsetY = this.offsetY;
        
        this.canvas.style.cursor = 'grabbing';
    }
    
    /**
     * Gère le mouvement pendant le pan
     * @param {MouseEvent} event - Événement de souris
     */
    handlePanMove(event) {
        if (!this.isDragging) return;
        
        const deltaX = event.clientX - this.dragStartX;
        const deltaY = event.clientY - this.dragStartY;
        
        this.offsetX = this.dragStartOffsetX + deltaX;
        this.offsetY = this.dragStartOffsetY + deltaY;
        
        this.requestRender();
    }
    
    /**
     * Termine le pan
     * @param {MouseEvent} event - Événement de souris
     */
    handlePanEnd(event) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }
    
    /**
     * Calcule la distance entre deux points de contact
     * @param {Touch} touch1 - Premier point de contact
     * @param {Touch} touch2 - Deuxième point de contact
     * @returns {number} Distance en pixels
     */
    getPinchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Gère le début d'un contact tactile
     * @param {TouchEvent} event - Événement tactile
     */
    handleTouchStart(event) {
        event.preventDefault();
        
        if (event.touches.length === 2) {
            this.isPinching = true;
            this.isDragging = false;
            this.initialPinchDistance = this.getPinchDistance(event.touches[0], event.touches[1]);
            this.initialPinchZoom = this.zoomLevel;
        } else if (event.touches.length === 1) {
            this.isDragging = true;
            this.isPinching = false;
            const touch = event.touches[0];
            this.dragStartX = touch.clientX;
            this.dragStartY = touch.clientY;
            this.dragStartOffsetX = this.offsetX;
            this.dragStartOffsetY = this.offsetY;
        }
    }
    
    /**
     * Gère le mouvement pendant un contact tactile
     * @param {TouchEvent} event - Événement tactile
     */
    handleTouchMove(event) {
        event.preventDefault();
        
        if (event.touches.length === 2 && this.isPinching) {
            const currentDistance = this.getPinchDistance(event.touches[0], event.touches[1]);
            const scale = currentDistance / this.initialPinchDistance;
            const newZoom = this.initialPinchZoom * scale;
            
            if (newZoom >= this.minZoom && newZoom <= this.maxZoom) {
                this.zoomLevel = newZoom;
                this.updateZoomDisplay();
                this.requestRender();
            }
        } else if (event.touches.length === 1 && this.isDragging && !this.isPinching) {
            const touch = event.touches[0];
            const deltaX = touch.clientX - this.dragStartX;
            const deltaY = touch.clientY - this.dragStartY;
            
            this.offsetX = this.dragStartOffsetX + deltaX;
            this.offsetY = this.dragStartOffsetY + deltaY;
            
            this.requestRender();
        }
    }
    
    /**
     * Gère la fin d'un contact tactile
     * @param {TouchEvent} event - Événement tactile
     */
    handleTouchEnd(event) {
        if (event.touches.length < 2) {
            this.isPinching = false;
        }
        if (event.touches.length === 0) {
            this.isDragging = false;
        }
    }
    
    /**
     * Réinitialise la vue
     * @param {Event} event - Événement
     */
    resetView(event) {
        if (event) event.preventDefault();
        
        this.zoomLevel = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.updateZoomDisplay();
        this.requestRender();
    }
    
    /**
     * Met à jour l'affichage du niveau de zoom
     */
    updateZoomDisplay() {
        const zoomDisplay = document.getElementById('zoomLevel');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${this.zoomLevel.toFixed(1)}x`;
        }
    }
    
    /**
     * Demande un nouveau rendu
     */
    requestRender() {
        if (this.onRenderNeeded) {
            this.onRenderNeeded();
        }
    }
    
    /**
     * Convertit des coordonnées horizontales en coordonnées écran
     * @param {number} azimut - Azimut en degrés
     * @param {number} altitude - Altitude en degrés
     * @returns {Object|null} Coordonnées {x, y} ou null si hors champ
     */
    worldToScreen(azimut, altitude) {
        if (altitude < 0) {
            return null;
        }
        
        const zenithDistance = (90 - altitude) / 90;
        
        const r = zenithDistance * this.projectionRadius * this.zoomLevel;
        
        const angleRad = Astronomy.degreesToRadians(azimut - 90);
        
        const x = this.centerX + r * Math.cos(angleRad) + this.offsetX;
        const y = this.centerY + r * Math.sin(angleRad) + this.offsetY;
        
        return { x, y };
    }
    
    /**
     * Vérifie si un point est visible sur le canvas
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @param {number} [margin=10] - Marge en pixels
     * @returns {boolean} True si le point est visible
     */
    isPointVisible(x, y, margin = 10) {
        return x >= -margin && 
               x <= this.canvas.width + margin && 
               y >= -margin && 
               y <= this.canvas.height + margin;
    }
    
    /**
     * Efface le canvas et dessine l'arrière-plan
     */
    clearCanvas() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        const gradient = ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.projectionRadius
        );
        gradient.addColorStop(0, '#0a0a20');
        gradient.addColorStop(0.7, '#050510');
        gradient.addColorStop(1, '#000005');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.beginPath();
        ctx.arc(this.centerX + this.offsetX, this.centerY + this.offsetY, 
                this.projectionRadius * this.zoomLevel, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(74, 144, 217, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        this.drawAltitudeCircles();
        
        this.drawAzimuthLines();
    }
    
    /**
     * Dessine les cercles d'altitude
     */
    drawAltitudeCircles() {
        const ctx = this.ctx;
        
        ctx.strokeStyle = 'rgba(74, 144, 217, 0.1)';
        ctx.lineWidth = 1;
        
        [30, 60].forEach(alt => {
            const r = ((90 - alt) / 90) * this.projectionRadius * this.zoomLevel;
            ctx.beginPath();
            ctx.arc(this.centerX + this.offsetX, this.centerY + this.offsetY, r, 0, Math.PI * 2);
            ctx.stroke();
        });
    }
    
    /**
     * Dessine les lignes d'azimut
     */
    drawAzimuthLines() {
        const ctx = this.ctx;
        const radius = this.projectionRadius * this.zoomLevel;
        
        ctx.strokeStyle = 'rgba(74, 144, 217, 0.15)';
        ctx.lineWidth = 1;
        
        [0, 90, 180, 270].forEach(az => {
            const angleRad = Astronomy.degreesToRadians(az - 90);
            const endX = this.centerX + this.offsetX + radius * Math.cos(angleRad);
            const endY = this.centerY + this.offsetY + radius * Math.sin(angleRad);
            
            ctx.beginPath();
            ctx.moveTo(this.centerX + this.offsetX, this.centerY + this.offsetY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        });
    }
    
    /**
     * Dessine les lignes des constellations
     * @param {Array<Object>} constellations - Liste des constellations
     */
    drawConstellationLines(constellations) {
        if (!constellations || constellations.length === 0) return;
        
        const ctx = this.ctx;
        
        ctx.save();
        ctx.globalAlpha = 0.5;
        
        for (const constellation of constellations) {
            const color = Constellations.getConstellationColor(constellation.name);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            
            for (const connection of constellation.connections) {
                const star1 = connection.star1;
                const star2 = connection.star2;
                
                const screenPos1 = this.worldToScreen(star1.azimut, star1.altitude);
                const screenPos2 = this.worldToScreen(star2.azimut, star2.altitude);
                
                if (!screenPos1 || !screenPos2) {
                    continue;
                }
                
                if (!this.isPointVisible(screenPos1.x, screenPos1.y) && 
                    !this.isPointVisible(screenPos2.x, screenPos2.y)) {
                    continue;
                }
                
                ctx.beginPath();
                ctx.moveTo(screenPos1.x, screenPos1.y);
                ctx.lineTo(screenPos2.x, screenPos2.y);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    /**
     * Dessine une étoile sur le canvas
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @param {number} size - Taille de l'étoile
     * @param {string} color - Couleur de l'étoile
     * @param {number} magnitude - Magnitude de l'étoile
     * @param {boolean} [hasConstellation=false] - Si l'étoile fait partie d'une constellation
     */
    drawStar(x, y, size, color, magnitude, hasConstellation = false) {
        const ctx = this.ctx;
        
        const opacity = Math.max(0.4, Math.min(1, (6 - magnitude) / 6));
        
        if (size > 1.5) {
            const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
            glow.addColorStop(0, `rgba(255, 255, 240, ${opacity * 0.3})`);
            glow.addColorStop(1, 'rgba(255, 255, 240, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, size * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        
        if (hasConstellation) {
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, size + 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    /**
     * Obtient l'état actuel du contrôleur
     * @returns {Object} État du contrôleur
     */
    getState() {
        return {
            zoomLevel: this.zoomLevel,
            offsetX: this.offsetX,
            offsetY: this.offsetY
        };
    }
    
    /**
     * Restaure l'état du contrôleur
     * @param {Object} state - État à restaurer
     */
    setState(state) {
        if (state.zoomLevel !== undefined) this.zoomLevel = state.zoomLevel;
        if (state.offsetX !== undefined) this.offsetX = state.offsetX;
        if (state.offsetY !== undefined) this.offsetY = state.offsetY;
        
        this.updateZoomDisplay();
        this.requestRender();
    }
}

