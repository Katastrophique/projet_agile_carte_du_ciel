/**
 * ==========================================================================
 * Canvas Controller - Gestion du canvas interactif
 * ==========================================================================
 * 
 * Ce module gère :
 * - Le zoom avec la molette de la souris
 * - Le déplacement (pan) avec clic + glisser
 * - La transformation des coordonnées monde → écran
 * - La projection azimutale équidistante
 */

class CanvasController {
    /**
     * Crée un nouveau contrôleur de canvas
     * @param {HTMLCanvasElement} canvas - L'élément canvas à contrôler
     * @param {Function} onRenderNeeded - Callback appelé quand un re-rendu est nécessaire
     */
    constructor(canvas, onRenderNeeded) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onRenderNeeded = onRenderNeeded;
        
        // État du zoom et du déplacement
        this.zoomLevel = 1.0;       // Niveau de zoom (0.5x à 10x)
        this.offsetX = 0;            // Décalage horizontal en pixels
        this.offsetY = 0;            // Décalage vertical en pixels
        
        // Limites de zoom
        this.minZoom = 0.5;
        this.maxZoom = 10;
        
        // État du drag (glisser)
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartOffsetX = 0;
        this.dragStartOffsetY = 0;
        
        // État du pinch-to-zoom (mobile)
        this.isPinching = false;
        this.initialPinchDistance = 0;
        this.initialPinchZoom = 1;
        
        // Redimensionner le canvas pour s'adapter à l'écran
        this.resizeCanvas();
        
        // Centre du canvas
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        
        // Rayon du cercle de projection (légèrement inférieur à la moitié de la taille)
        this.projectionRadius = Math.min(canvas.width, canvas.height) / 2 - 20;
        
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
    }
    
    /**
     * Redimensionne le canvas pour s'adapter au conteneur
     */
    resizeCanvas() {
        // Calculer la taille optimale en fonction de l'écran
        const maxWidth = window.innerWidth - 80; // Marges
        const maxHeight = window.innerHeight - 300; // Espace pour header et panel
        const size = Math.min(maxWidth, maxHeight, 800); // Max 800px
        const finalSize = Math.max(size, 300); // Min 300px
        
        this.canvas.width = finalSize;
        this.canvas.height = finalSize;
        
        // Mettre à jour le centre et le rayon de projection
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.projectionRadius = Math.min(this.canvas.width, this.canvas.height) / 2 - 20;
    }
    
    /**
     * Initialise tous les écouteurs d'événements pour l'interactivité
     */
    initEventListeners() {
        // Redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.requestRender();
        });
        
        // Zoom avec la molette
        this.canvas.addEventListener('wheel', (e) => this.handleZoom(e), { passive: false });
        
        // Pan avec clic + glisser
        this.canvas.addEventListener('mousedown', (e) => this.handlePanStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handlePanMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handlePanEnd(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handlePanEnd(e));
        
        // Double-clic pour réinitialiser la vue
        this.canvas.addEventListener('dblclick', (e) => this.resetView(e));
        
        // Support tactile pour les appareils mobiles
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }
    
    /**
     * Gère le zoom avec la molette de la souris
     * @param {WheelEvent} event - Événement de la molette
     */
    handleZoom(event) {
        event.preventDefault();
        
        // Calculer le facteur de zoom
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = this.zoomLevel * zoomFactor;
        
        // Vérifier les limites
        if (newZoom < this.minZoom || newZoom > this.maxZoom) {
            return;
        }
        
        // Position de la souris sur le canvas
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Calculer la position relative au centre avant le zoom
        const relX = mouseX - this.centerX - this.offsetX;
        const relY = mouseY - this.centerY - this.offsetY;
        
        // Appliquer le nouveau zoom
        const oldZoom = this.zoomLevel;
        this.zoomLevel = newZoom;
        
        // Ajuster l'offset pour zoomer vers la position de la souris
        this.offsetX -= relX * (zoomFactor - 1);
        this.offsetY -= relY * (zoomFactor - 1);
        
        // Mettre à jour l'affichage du niveau de zoom
        this.updateZoomDisplay();
        
        // Demander un re-rendu
        this.requestRender();
    }
    
    /**
     * Démarre le déplacement (pan) lors d'un clic
     * @param {MouseEvent} event - Événement de souris
     */
    handlePanStart(event) {
        this.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        this.dragStartOffsetX = this.offsetX;
        this.dragStartOffsetY = this.offsetY;
        
        // Changer le curseur
        this.canvas.style.cursor = 'grabbing';
    }
    
    /**
     * Gère le mouvement pendant le déplacement
     * @param {MouseEvent} event - Événement de souris
     */
    handlePanMove(event) {
        if (!this.isDragging) return;
        
        // Calculer le déplacement
        const deltaX = event.clientX - this.dragStartX;
        const deltaY = event.clientY - this.dragStartY;
        
        // Appliquer le déplacement
        this.offsetX = this.dragStartOffsetX + deltaX;
        this.offsetY = this.dragStartOffsetY + deltaY;
        
        // Demander un re-rendu
        this.requestRender();
    }
    
    /**
     * Termine le déplacement lors du relâchement du clic
     * @param {MouseEvent} event - Événement de souris
     */
    handlePanEnd(event) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }
    
    /**
     * Calcule la distance entre deux points de toucher
     * @param {Touch} touch1 - Premier point de toucher
     * @param {Touch} touch2 - Second point de toucher
     * @returns {number} Distance en pixels
     */
    getPinchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Gère le début d'un toucher (mobile)
     * @param {TouchEvent} event - Événement tactile
     */
    handleTouchStart(event) {
        event.preventDefault();
        
        if (event.touches.length === 2) {
            // Début du pinch-to-zoom
            this.isPinching = true;
            this.isDragging = false;
            this.initialPinchDistance = this.getPinchDistance(event.touches[0], event.touches[1]);
            this.initialPinchZoom = this.zoomLevel;
        } else if (event.touches.length === 1) {
            // Début du déplacement
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
     * Gère le mouvement tactile (mobile)
     * @param {TouchEvent} event - Événement tactile
     */
    handleTouchMove(event) {
        event.preventDefault();
        
        if (event.touches.length === 2 && this.isPinching) {
            // Pinch-to-zoom
            const currentDistance = this.getPinchDistance(event.touches[0], event.touches[1]);
            const scale = currentDistance / this.initialPinchDistance;
            const newZoom = this.initialPinchZoom * scale;
            
            // Appliquer les limites de zoom
            if (newZoom >= this.minZoom && newZoom <= this.maxZoom) {
                this.zoomLevel = newZoom;
                this.updateZoomDisplay();
                this.requestRender();
            }
        } else if (event.touches.length === 1 && this.isDragging && !this.isPinching) {
            // Déplacement
            const touch = event.touches[0];
            const deltaX = touch.clientX - this.dragStartX;
            const deltaY = touch.clientY - this.dragStartY;
            
            this.offsetX = this.dragStartOffsetX + deltaX;
            this.offsetY = this.dragStartOffsetY + deltaY;
            
            this.requestRender();
        }
    }
    
    /**
     * Gère la fin du toucher (mobile)
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
     * Réinitialise la vue (zoom et position)
     * @param {Event} event - Événement (optionnel)
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
     * Met à jour l'affichage du niveau de zoom dans l'interface
     */
    updateZoomDisplay() {
        const zoomDisplay = document.getElementById('zoomLevel');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${this.zoomLevel.toFixed(1)}x`;
        }
    }
    
    /**
     * Demande un re-rendu du canvas
     */
    requestRender() {
        if (this.onRenderNeeded) {
            this.onRenderNeeded();
        }
    }
    
    /**
     * Convertit les coordonnées monde (azimut, altitude) en coordonnées écran (pixels)
     * Utilise une projection azimutale équidistante
     * 
     * Dans cette projection :
     * - Le zénith (altitude = 90°) est au centre
     * - L'horizon (altitude = 0°) est sur le bord du cercle
     * - Le Nord (azimut = 0°) est en haut
     * - L'Est (azimut = 90°) est à droite (inversé car on regarde vers le ciel)
     * 
     * @param {number} azimut - Azimut en degrés (0-360, 0 = Nord)
     * @param {number} altitude - Altitude en degrés (0-90)
     * @returns {Object|null} Coordonnées {x, y} en pixels, ou null si hors écran
     */
    worldToScreen(azimut, altitude) {
        // Si l'altitude est négative, l'étoile est sous l'horizon
        if (altitude < 0) {
            return null;
        }
        
        // Distance angulaire depuis le zénith (90° - altitude)
        // Normalisée pour que le zénith soit au centre et l'horizon au bord
        const zenithDistance = (90 - altitude) / 90;
        
        // Distance radiale en pixels (avec zoom)
        const r = zenithDistance * this.projectionRadius * this.zoomLevel;
        
        // Convertir l'azimut en angle pour le dessin
        // Azimut 0° = Nord = haut de l'écran
        // On soustrait 90° car en maths, 0° est à droite
        // On inverse le signe car l'azimut va dans le sens horaire
        const angleRad = degreesToRadians(azimut - 90);
        
        // Calculer les coordonnées cartésiennes
        // Note : Pour une vue depuis le sol regardant vers le haut,
        // l'Est doit être à gauche (comme quand on regarde le ciel allongé)
        const x = this.centerX + r * Math.cos(angleRad) + this.offsetX;
        const y = this.centerY + r * Math.sin(angleRad) + this.offsetY;
        
        return { x, y };
    }
    
    /**
     * Vérifie si un point est dans la zone visible du canvas
     * @param {number} x - Coordonnée X en pixels
     * @param {number} y - Coordonnée Y en pixels
     * @param {number} margin - Marge supplémentaire
     * @returns {boolean} true si le point est visible
     */
    isPointVisible(x, y, margin = 10) {
        return x >= -margin && 
               x <= this.canvas.width + margin && 
               y >= -margin && 
               y <= this.canvas.height + margin;
    }
    
    /**
     * Efface le canvas et dessine le fond
     */
    clearCanvas() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Fond dégradé radial (ciel nocturne)
        const gradient = ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.projectionRadius
        );
        gradient.addColorStop(0, '#0a0a20');
        gradient.addColorStop(0.7, '#050510');
        gradient.addColorStop(1, '#000005');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Dessiner le cercle de l'horizon
        ctx.beginPath();
        ctx.arc(this.centerX + this.offsetX, this.centerY + this.offsetY, 
                this.projectionRadius * this.zoomLevel, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(74, 144, 217, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Dessiner les cercles d'altitude (tous les 30°)
        this.drawAltitudeCircles();
        
        // Dessiner les lignes d'azimut
        this.drawAzimuthLines();
    }
    
    /**
     * Dessine les cercles d'altitude (guides visuels)
     */
    drawAltitudeCircles() {
        const ctx = this.ctx;
        
        ctx.strokeStyle = 'rgba(74, 144, 217, 0.1)';
        ctx.lineWidth = 1;
        
        // Cercles à 30° et 60° d'altitude
        [30, 60].forEach(alt => {
            const r = ((90 - alt) / 90) * this.projectionRadius * this.zoomLevel;
            ctx.beginPath();
            ctx.arc(this.centerX + this.offsetX, this.centerY + this.offsetY, r, 0, Math.PI * 2);
            ctx.stroke();
        });
    }
    
    /**
     * Dessine les lignes d'azimut (N, E, S, O)
     */
    drawAzimuthLines() {
        const ctx = this.ctx;
        const radius = this.projectionRadius * this.zoomLevel;
        
        ctx.strokeStyle = 'rgba(74, 144, 217, 0.15)';
        ctx.lineWidth = 1;
        
        // Lignes cardinales
        [0, 90, 180, 270].forEach(az => {
            const angleRad = degreesToRadians(az - 90);
            const endX = this.centerX + this.offsetX + radius * Math.cos(angleRad);
            const endY = this.centerY + this.offsetY + radius * Math.sin(angleRad);
            
            ctx.beginPath();
            ctx.moveTo(this.centerX + this.offsetX, this.centerY + this.offsetY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        });
    }
    
    /**
     * Dessine une étoile sur le canvas
     * @param {number} x - Position X en pixels
     * @param {number} y - Position Y en pixels
     * @param {number} size - Taille (rayon) de l'étoile
     * @param {string} color - Couleur de l'étoile
     * @param {number} magnitude - Magnitude pour ajuster l'opacité
     */
    drawStar(x, y, size, color, magnitude) {
        const ctx = this.ctx;
        
        // Calculer l'opacité basée sur la magnitude
        // Étoiles plus brillantes = plus opaques
        const opacity = Math.max(0.4, Math.min(1, (6 - magnitude) / 6));
        
        // Dessiner le halo (lueur autour de l'étoile)
        if (size > 1.5) {
            const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
            glow.addColorStop(0, `rgba(255, 255, 240, ${opacity * 0.3})`);
            glow.addColorStop(1, 'rgba(255, 255, 240, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, size * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Dessiner l'étoile principale
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    /**
     * Obtient l'état actuel du contrôleur (pour la sauvegarde)
     * @returns {Object} État actuel
     */
    getState() {
        return {
            zoomLevel: this.zoomLevel,
            offsetX: this.offsetX,
            offsetY: this.offsetY
        };
    }
    
    /**
     * Restaure un état précédent
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
