/**
 * ==========================================================================
 * Canvas Controller - Gestion du canvas interactif (Vue POV)
 * ==========================================================================
 * 
 * Ce module gère :
 * - Le zoom avec la molette (changement de FOV)
 * - La rotation de la caméra (clic + glisser)
 * - Le rendu du ciel en vue POV réaliste
 * - Les effets visuels (horizon, atmosphère)
 */

class CanvasController {
    /**
     * Crée un nouveau contrôleur de canvas pour vue POV
     * @param {HTMLCanvasElement} canvas - L'élément canvas à contrôler
     * @param {Function} onRenderNeeded - Callback appelé quand un re-rendu est nécessaire
     */
    constructor(canvas, onRenderNeeded) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onRenderNeeded = onRenderNeeded;
        
        // Caméra pour la vue POV
        this.camera = null; // Sera initialisée après le resize
        
        // État du drag (rotation de la caméra)
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartAzimuth = 0;
        this.dragStartAltitude = 0;
        
        // Sensibilité des contrôles
        this.rotationSensitivity = 0.3;  // Degrés par pixel de déplacement
        this.zoomSensitivity = 0.1;      // Facteur de zoom par cran de molette
        
        // État du pinch-to-zoom (mobile)
        this.isPinching = false;
        this.initialPinchDistance = 0;
        this.initialPinchFov = 60;
        
        // Initialiser la taille du canvas
        this.resizeCanvas();
        
        // Créer la caméra après le resize
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
    }
    
    /**
     * Redimensionne le canvas pour qu'il occupe tout l'écran
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.camera) {
            this.camera.updateDimensions(this.canvas.width, this.canvas.height);
        }
    }
    
    /**
     * Initialise tous les écouteurs d'événements
     */
    initEventListeners() {
        // Redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.requestRender();
        });
        
        // Zoom avec la molette
        this.canvas.addEventListener('wheel', (e) => this.handleZoom(e), { passive: false });
        
        // Rotation avec clic + glisser
        this.canvas.addEventListener('mousedown', (e) => this.handleDragStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleDragMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleDragEnd(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleDragEnd(e));
        
        // Double-clic pour réinitialiser
        this.canvas.addEventListener('dblclick', (e) => this.handleReset(e));
        
        // Support tactile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Panneau latéral
        const toggleBtn = document.getElementById('togglePanel');
        const sidePanel = document.getElementById('sidePanel');
        if (toggleBtn && sidePanel) {
            toggleBtn.addEventListener('click', () => {
                sidePanel.classList.toggle('collapsed');
            });
        }
    }
    
    /**
     * Gère le zoom avec la molette (changement de FOV)
     */
    handleZoom(event) {
        event.preventDefault();
        
        // Calculer le facteur de zoom
        const zoomFactor = event.deltaY > 0 ? (1 + this.zoomSensitivity) : (1 - this.zoomSensitivity);
        
        // Appliquer le zoom à la caméra
        this.camera.zoom(zoomFactor);
        
        // Mettre à jour l'affichage
        this.updateUI();
        this.requestRender();
    }
    
    /**
     * Démarre la rotation de la caméra (clic)
     */
    handleDragStart(event) {
        this.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        this.dragStartAzimuth = this.camera.azimuth;
        this.dragStartAltitude = this.camera.altitude;
        
        this.canvas.style.cursor = 'grabbing';
    }
    
    /**
     * Gère la rotation pendant le déplacement
     */
    handleDragMove(event) {
        if (!this.isDragging) return;
        
        // Calculer le déplacement en pixels
        const deltaX = event.clientX - this.dragStartX;
        const deltaY = event.clientY - this.dragStartY;
        
        // Convertir en rotation (inverser X pour un mouvement naturel)
        const deltaAzimuth = -deltaX * this.rotationSensitivity;
        const deltaAltitude = deltaY * this.rotationSensitivity;
        
        // Appliquer directement depuis la position de départ
        this.camera.azimuth = normalizeAngle(this.dragStartAzimuth + deltaAzimuth);
        this.camera.altitude = Math.max(this.camera.minAltitude, 
                                        Math.min(this.camera.maxAltitude, 
                                                this.dragStartAltitude + deltaAltitude));
        
        // Mettre à jour
        this.updateUI();
        this.requestRender();
    }
    
    /**
     * Termine la rotation
     */
    handleDragEnd(event) {
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
     */
    handleTouchStart(event) {
        event.preventDefault();
        
        if (event.touches.length === 2) {
            // Début du pinch-to-zoom
            this.isPinching = true;
            this.isDragging = false;
            this.initialPinchDistance = this.getPinchDistance(event.touches[0], event.touches[1]);
            this.initialPinchFov = this.camera.fov;
        } else if (event.touches.length === 1) {
            // Début de la rotation
            this.isDragging = true;
            this.isPinching = false;
            const touch = event.touches[0];
            this.dragStartX = touch.clientX;
            this.dragStartY = touch.clientY;
            this.dragStartAzimuth = this.camera.azimuth;
            this.dragStartAltitude = this.camera.altitude;
        }
    }
    
    /**
     * Gère le mouvement tactile (mobile)
     * Même comportement que la souris : glisser vers le bas = regarder vers le haut
     */
    handleTouchMove(event) {
        event.preventDefault();
        
        if (event.touches.length === 2 && this.isPinching) {
            // Pinch-to-zoom (change le FOV)
            const currentDistance = this.getPinchDistance(event.touches[0], event.touches[1]);
            const scale = this.initialPinchDistance / currentDistance; // Inversé pour un comportement naturel
            const newFov = this.initialPinchFov * scale;
            
            // Appliquer les limites de FOV
            if (newFov >= this.camera.minFov && newFov <= this.camera.maxFov) {
                this.camera.fov = newFov;
                this.updateUI();
                this.requestRender();
            }
        } else if (event.touches.length === 1 && this.isDragging && !this.isPinching) {
            // Rotation de la caméra
            const touch = event.touches[0];
            const deltaX = touch.clientX - this.dragStartX;
            const deltaY = touch.clientY - this.dragStartY;
            
            const deltaAzimuth = -deltaX * this.rotationSensitivity;
            const deltaAltitude = deltaY * this.rotationSensitivity;
            
            this.camera.azimuth = normalizeAngle(this.dragStartAzimuth + deltaAzimuth);
            this.camera.altitude = Math.max(this.camera.minAltitude, 
                                            Math.min(this.camera.maxAltitude, 
                                                    this.dragStartAltitude + deltaAltitude));
            
            this.updateUI();
            this.requestRender();
        }
    }
    
    /**
     * Gère la fin du toucher (mobile)
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
     * Réinitialise la vue (double-clic)
     */
    handleReset(event) {
        event.preventDefault();
        this.camera.reset();
        this.updateUI();
        this.requestRender();
    }
    
    /**
     * Met à jour les éléments de l'interface utilisateur
     */
    updateUI() {
        // Direction
        const directionDisplay = document.getElementById('directionDisplay');
        if (directionDisplay) {
            directionDisplay.textContent = `→ ${this.camera.getDirectionDescription()}`;
        }
        
        const directionName = document.getElementById('directionName');
        if (directionName) {
            directionName.textContent = this.camera.getDirectionName();
        }
        
        // FOV
        const fovDisplay = document.getElementById('fovDisplay');
        if (fovDisplay) {
            fovDisplay.textContent = `${Math.round(this.camera.fov)}°`;
        }
        
        // Zoom
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) {
            zoomLevel.textContent = `${this.camera.getZoomLevel().toFixed(1)}x`;
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
     * Efface le canvas et dessine le fond de ciel
     */
    clearCanvas() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Fond uni sombre (ciel nocturne profond)
        ctx.fillStyle = '#000814';
        ctx.fillRect(0, 0, width, height);
        
        // Dessiner l'horizon si visible
        this.drawHorizon();
        
        // Dessiner les points cardinaux sur l'horizon
        this.drawCardinalPoints();
    }
    
    /**
     * Dessine la ligne d'horizon (désactivé sur mobile en portrait)
     */
    drawHorizon() {
        // Désactiver l'horizon sur mobile (écran en portrait) car le calcul pose problème
        const isMobilePortrait = this.canvas.width < this.canvas.height;
        if (isMobilePortrait) {
            return;
        }
        
        const horizonY = this.camera.getHorizonY();
        
        if (horizonY === null || horizonY > this.canvas.height) {
            return; // Horizon hors écran
        }
        
        const ctx = this.ctx;
        
        // Zone sous l'horizon (sol)
        if (horizonY < this.canvas.height) {
            const groundGradient = ctx.createLinearGradient(0, horizonY, 0, this.canvas.height);
            groundGradient.addColorStop(0, 'rgba(10, 22, 40, 0.3)');
            groundGradient.addColorStop(1, 'rgba(5, 10, 20, 0.8)');
            
            ctx.fillStyle = groundGradient;
            ctx.fillRect(0, horizonY, this.canvas.width, this.canvas.height - horizonY);
        }
        
        // Ligne d'horizon
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(this.canvas.width, horizonY);
        ctx.strokeStyle = 'rgba(74, 144, 217, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Effet de lueur à l'horizon (pollution lumineuse subtile)
        const glowGradient = ctx.createLinearGradient(0, horizonY - 100, 0, horizonY + 20);
        glowGradient.addColorStop(0, 'rgba(74, 144, 217, 0)');
        glowGradient.addColorStop(0.8, 'rgba(74, 144, 217, 0.05)');
        glowGradient.addColorStop(1, 'rgba(74, 144, 217, 0.1)');
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, horizonY - 100, this.canvas.width, 120);
    }
    
    /**
     * Dessine les points cardinaux sur l'horizon
     */
    drawCardinalPoints() {
        const ctx = this.ctx;
        const cardinals = [
            { azimuth: 0, label: 'N' },
            { azimuth: 45, label: 'NE' },
            { azimuth: 90, label: 'E' },
            { azimuth: 135, label: 'SE' },
            { azimuth: 180, label: 'S' },
            { azimuth: 225, label: 'SO' },
            { azimuth: 270, label: 'O' },
            { azimuth: 315, label: 'NO' }
        ];
        
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        for (const cardinal of cardinals) {
            const pos = this.camera.projectCardinalPoint(cardinal.azimuth);
            
            if (pos && pos.visible) {
                // Vérifier si le point est dans l'écran
                if (pos.x >= -20 && pos.x <= this.canvas.width + 20 && 
                    pos.y >= 0 && pos.y <= this.canvas.height + 30) {
                    
                    // Points cardinaux principaux plus visibles
                    const isPrimary = cardinal.label.length === 1;
                    
                    ctx.fillStyle = isPrimary ? 
                        'rgba(74, 144, 217, 0.9)' : 
                        'rgba(74, 144, 217, 0.5)';
                    ctx.font = isPrimary ? 'bold 18px Arial' : '14px Arial';
                    
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = 4;
                    ctx.fillText(cardinal.label, pos.x, pos.y - 10);
                    ctx.shadowBlur = 0;
                }
            }
        }
    }
    
    /**
     * Dessine une étoile sur le canvas avec effets POV
     * @param {number} x - Position X en pixels
     * @param {number} y - Position Y en pixels
     * @param {number} size - Taille de base de l'étoile
     * @param {string} color - Couleur de l'étoile
     * @param {number} magnitude - Magnitude pour l'opacité
     * @param {number} distanceFromCenter - Distance depuis le centre de vue (0-1+)
     * @param {number} altitude - Altitude de l'étoile (pour extinction atmosphérique)
     */
    drawStar(x, y, size, color, magnitude, distanceFromCenter, altitude) {
        const ctx = this.ctx;
        
        // Effet de perspective : étoiles légèrement plus petites vers les bords
        const perspectiveScale = 1 - (distanceFromCenter * 0.2);
        let adjustedSize = size * Math.max(0.5, perspectiveScale);
        
        // Extinction atmosphérique : étoiles plus faibles près de l'horizon
        let atmosphericDimming = 1;
        if (altitude < 20) {
            // Atténuation progressive sous 20° d'altitude
            atmosphericDimming = 0.5 + (altitude / 20) * 0.5;
            // Rougissement (optionnel, simplifié ici)
        }
        
        // Calculer l'opacité
        const baseOpacity = Math.max(0.3, Math.min(1, (6 - magnitude) / 6));
        const opacity = baseOpacity * atmosphericDimming;
        
        // Dessiner le halo pour les étoiles brillantes
        if (size > 1.5 && magnitude < 3) {
            const glowRadius = adjustedSize * 4;
            const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
            glow.addColorStop(0, `rgba(255, 255, 240, ${opacity * 0.4})`);
            glow.addColorStop(0.5, `rgba(255, 255, 240, ${opacity * 0.1})`);
            glow.addColorStop(1, 'rgba(255, 255, 240, 0)');
            
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Dessiner l'étoile
        ctx.beginPath();
        ctx.arc(x, y, adjustedSize, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Point central plus brillant pour les étoiles très brillantes
        if (magnitude < 1) {
            ctx.beginPath();
            ctx.arc(x, y, adjustedSize * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = opacity * 0.8;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    
    /**
     * Vérifie si un point est visible dans l'écran
     */
    isPointVisible(x, y, margin = 10) {
        return x >= -margin && 
               x <= this.canvas.width + margin && 
               y >= -margin && 
               y <= this.canvas.height + margin;
    }
    
    /**
     * Obtient l'état actuel
     */
    getState() {
        return {
            camera: this.camera.getState()
        };
    }
    
    /**
     * Restaure un état
     */
    setState(state) {
        if (state.camera) {
            this.camera.setState(state.camera);
            this.updateUI();
            this.requestRender();
        }
    }
}
