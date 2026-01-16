/**
 * Contrôleur de canvas pour la vue POV
 * Gère les interactions utilisateur et le rendu
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
        
        this.camera = null;
        
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartAzimuth = 0;
        this.dragStartAltitude = 0;
        
        this.rotationSensitivity = 0.3;
        this.zoomSensitivity = 0.1;
        
        this.isPinching = false;
        this.initialPinchDistance = 0;
        this.initialPinchFov = 60;
        
        this.hoveredStar = null;
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.popupVisible = false;
        
        this.resizeCanvas();
        
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        
        this.initEventListeners();
    }
    
    /**
     * Redimensionne le canvas selon la taille de la fenêtre
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
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.requestRender();
        });
        
        this.canvas.addEventListener('wheel', (e) => this.handleZoom(e), { passive: false });
        
        this.canvas.addEventListener('mousedown', (e) => this.handleDragStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleDragMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleDragEnd(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleDragEnd(e));
        
        this.canvas.addEventListener('dblclick', (e) => this.handleReset(e));
        
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        if (!this.isMobile) {
            this.canvas.addEventListener('mousemove', (e) => this.handleStarHover(e));
        }
        
        const toggleBtn = document.getElementById('togglePanel');
        const sidePanel = document.getElementById('sidePanel');
        if (toggleBtn && sidePanel) {
            toggleBtn.addEventListener('click', () => {
                sidePanel.classList.toggle('collapsed');
            });
        }

        const leftPanel = document.getElementById("leftPanel");
        const toggleLeft = document.getElementById("toggleLeftPanel");

        if (leftPanel && toggleLeft) {
            toggleLeft.addEventListener("click", () => {
                leftPanel.classList.toggle("collapsed");
            });
        }
    }
    
    /**
     * Gère le zoom avec la molette de la souris
     * @param {WheelEvent} event - Événement de molette
     */
    handleZoom(event) {
        event.preventDefault();
        
        const zoomFactor = event.deltaY > 0 ? (1 + this.zoomSensitivity) : (1 - this.zoomSensitivity);
        
        this.camera.zoom(zoomFactor);
        
        this.updateUI();
        this.requestRender();
    }
    
    /**
     * Démarre le glissement de la caméra
     * @param {MouseEvent} event - Événement de souris
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
     * Gère le mouvement pendant le glissement
     * @param {MouseEvent} event - Événement de souris
     */
    handleDragMove(event) {
        if (!this.isDragging) return;
        
        const deltaX = event.clientX - this.dragStartX;
        const deltaY = event.clientY - this.dragStartY;
        
        const deltaAzimuth = -deltaX * this.rotationSensitivity;
        const deltaAltitude = deltaY * this.rotationSensitivity;
        
        this.camera.azimuth = Astronomy.normalizeAngle(this.dragStartAzimuth + deltaAzimuth);
        this.camera.altitude = Math.max(this.camera.minAltitude, 
                                        Math.min(this.camera.maxAltitude, 
                                                this.dragStartAltitude + deltaAltitude));
        
        this.updateUI();
        this.requestRender();
    }
    
    /**
     * Termine le glissement
     * @param {MouseEvent} event - Événement de souris
     */
    handleDragEnd(event) {
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
            this.initialPinchFov = this.camera.fov;
        } else if (event.touches.length === 1) {
            const touch = event.touches[0];
            
            this.touchStartTime = Date.now();
            this.touchStartPos = { x: touch.clientX, y: touch.clientY };
            
            this.isDragging = true;
            this.isPinching = false;
            this.dragStartX = touch.clientX;
            this.dragStartY = touch.clientY;
            this.dragStartAzimuth = this.camera.azimuth;
            this.dragStartAltitude = this.camera.altitude;
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
            const scale = this.initialPinchDistance / currentDistance;
            const newFov = this.initialPinchFov * scale;
            
            if (newFov >= this.camera.minFov && newFov <= this.camera.maxFov) {
                this.camera.fov = newFov;
                this.updateUI();
                this.requestRender();
            }
        } else if (event.touches.length === 1 && this.isDragging && !this.isPinching) {
            const touch = event.touches[0];
            const deltaX = touch.clientX - this.dragStartX;
            const deltaY = touch.clientY - this.dragStartY;
            
            const deltaAzimuth = -deltaX * this.rotationSensitivity;
            const deltaAltitude = deltaY * this.rotationSensitivity;
            
            this.camera.azimuth = Astronomy.normalizeAngle(this.dragStartAzimuth + deltaAzimuth);
            this.camera.altitude = Math.max(this.camera.minAltitude, 
                                            Math.min(this.camera.maxAltitude, 
                                                    this.dragStartAltitude + deltaAltitude));
            
            this.updateUI();
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
            const touchDuration = Date.now() - this.touchStartTime;
            const dx = Math.abs(event.changedTouches[0].clientX - this.touchStartPos.x);
            const dy = Math.abs(event.changedTouches[0].clientY - this.touchStartPos.y);
            const moved = dx > 10 || dy > 10;
            
            if (touchDuration < 300 && !moved) {
                const rect = this.canvas.getBoundingClientRect();
                const x = event.changedTouches[0].clientX - rect.left;
                const y = event.changedTouches[0].clientY - rect.top;
                this.handleStarTap(x, y, event.changedTouches[0].clientX, event.changedTouches[0].clientY);
            }
            
            this.isDragging = false;
        }
    }
    
    /**
     * Réinitialise la vue
     * @param {Event} event - Événement
     */
    handleReset(event) {
        event.preventDefault();
        this.camera.reset();
        this.updateUI();
        this.requestRender();
    }
    
    /**
     * Gère le survol des étoiles (desktop)
     * @param {MouseEvent} event - Événement de souris
     */
    handleStarHover(event) {
        // Ne pas traiter le survol pendant le drag
        if (this.isDragging) {
            this.hideStarInfo();
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (typeof StarHover !== 'undefined') {
            const star = StarHover.findStarAtPosition(x, y);
            
            if (star) {
                if (this.hoveredStar !== star) {
                    this.hoveredStar = star;
                    StarHover.showStarPopup(star, event.clientX, event.clientY);
                    StarHover.setHighlightedConstellation(star.constellation ? star.constellation.trim() : null);
                    this.canvas.style.cursor = 'pointer';
                }
            } else {
                this.hideStarInfo();
            }
        }
    }
    
    /**
     * Gère le tap sur les étoiles (mobile)
     * @param {number} x - Coordonnée X relative au canvas
     * @param {number} y - Coordonnée Y relative au canvas
     * @param {number} clientX - Coordonnée X absolue
     * @param {number} clientY - Coordonnée Y absolue
     * @returns {boolean} True si l'événement a été géré
     */
    handleStarTap(x, y, clientX, clientY) {
        if (typeof StarHover !== 'undefined') {
            const star = StarHover.findStarAtPosition(x, y);
            
            if (star) {
                if (this.hoveredStar !== star || !this.popupVisible) {
                    this.hoveredStar = star;
                    this.popupVisible = true;
                    StarHover.showStarPopup(star, clientX, clientY);
                    StarHover.setHighlightedConstellation(star.constellation ? star.constellation.trim() : null);
                } else {
                    this.hideStarInfo();
                }
                return true;
            } else if (this.popupVisible) {
                this.hideStarInfo();
                return true;
            }
        }
        return false;
    }
    
    /**
     * Cache les informations de l'étoile survolée
     */
    hideStarInfo() {
        if (this.hoveredStar || this.popupVisible) {
            this.hoveredStar = null;
            this.popupVisible = false;
            if (typeof StarHover !== 'undefined') {
                StarHover.hideStarPopup();
                StarHover.clearHighlightedConstellation();
            }
            if (!this.isDragging) {
                this.canvas.style.cursor = 'grab';
            }
        }
    }
    
    /**
     * Met à jour l'interface utilisateur avec les informations de la caméra
     */
    updateUI() {
        const directionDisplay = document.getElementById('directionDisplay');
        if (directionDisplay) {
            directionDisplay.textContent = `→ ${this.camera.getDirectionDescription()}`;
        }
        
        const directionName = document.getElementById('directionName');
        if (directionName) {
            directionName.textContent = this.camera.getDirectionName();
        }
        
        const fovDisplay = document.getElementById('fovDisplay');
        if (fovDisplay) {
            fovDisplay.textContent = `${Math.round(this.camera.fov)}°`;
        }
        
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) {
            zoomLevel.textContent = `${this.camera.getZoomLevel().toFixed(1)}x`;
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
     * Efface le canvas et dessine l'arrière-plan
     */
    clearCanvas() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.fillStyle = '#000814';
        ctx.fillRect(0, 0, width, height);
        
        this.drawHorizon();
        
        this.drawCardinalPoints();
    }
    
    /**
     * Dessine la ligne d'horizon
     */
    drawHorizon() {
        const isMobilePortrait = this.canvas.width < this.canvas.height;
        if (isMobilePortrait) {
            return;
        }
        
        const horizonY = this.camera.getHorizonY();
        
        if (horizonY === null || horizonY > this.canvas.height) {
            return;
        }
        
        const ctx = this.ctx;
        
        if (horizonY < this.canvas.height) {
            const groundGradient = ctx.createLinearGradient(0, horizonY, 0, this.canvas.height);
            groundGradient.addColorStop(0, 'rgba(10, 22, 40, 0.3)');
            groundGradient.addColorStop(1, 'rgba(5, 10, 20, 0.8)');
            
            ctx.fillStyle = groundGradient;
            ctx.fillRect(0, horizonY, this.canvas.width, this.canvas.height - horizonY);
        }
        
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(this.canvas.width, horizonY);
        ctx.strokeStyle = 'rgba(74, 144, 217, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const glowGradient = ctx.createLinearGradient(0, horizonY - 100, 0, horizonY + 20);
        glowGradient.addColorStop(0, 'rgba(74, 144, 217, 0)');
        glowGradient.addColorStop(0.8, 'rgba(74, 144, 217, 0.05)');
        glowGradient.addColorStop(1, 'rgba(74, 144, 217, 0.1)');
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, horizonY - 100, this.canvas.width, 120);
    }
    
    /**
     * Dessine les points cardinaux
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
                if (pos.x >= -20 && pos.x <= this.canvas.width + 20 && 
                    pos.y >= 0 && pos.y <= this.canvas.height + 30) {
                    
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
     * Dessine une étoile sur le canvas
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @param {number} size - Taille de l'étoile
     * @param {string} color - Couleur de l'étoile
     * @param {number} magnitude - Magnitude de l'étoile
     * @param {number} distanceFromCenter - Distance du centre en unités normalisées
     * @param {number} altitude - Altitude de l'étoile en degrés
     * @param {boolean} [hasConstellation=false] - Si l'étoile fait partie d'une constellation
     * @param {boolean} [isHighlighted=false] - Si l'étoile est mise en évidence (survol)
     * @param {boolean} [isFiltered=false] - Si l'étoile est mise en surbrillance par un filtre
     */
    drawStar(x, y, size, color, magnitude, distanceFromCenter, altitude, hasConstellation = false, isHighlighted = false, isFiltered = false) {
        const ctx = this.ctx;
        
        const perspectiveScale = 1 - (distanceFromCenter * 0.2);
        let adjustedSize = size * Math.max(0.5, perspectiveScale);
        
        if (isHighlighted || isFiltered) {
            adjustedSize *= 1.3;
        }
        
        let atmosphericDimming = 1;
        if (altitude < 20) {
            atmosphericDimming = 0.5 + (altitude / 20) * 0.5;
        }
        
        const baseOpacity = Math.max(0.3, Math.min(1, (6 - magnitude) / 6));
        const opacity = (isHighlighted || isFiltered) ? 1 : baseOpacity * atmosphericDimming;
        
        if (isHighlighted) {
            const highlightGlowRadius = adjustedSize * 5;
            const highlightGlow = ctx.createRadialGradient(x, y, 0, x, y, highlightGlowRadius);
            highlightGlow.addColorStop(0, 'rgba(255, 200, 100, 0.6)');
            highlightGlow.addColorStop(0.3, 'rgba(255, 180, 80, 0.3)');
            highlightGlow.addColorStop(0.6, 'rgba(255, 150, 50, 0.1)');
            highlightGlow.addColorStop(1, 'rgba(255, 150, 50, 0)');
            
            ctx.fillStyle = highlightGlow;
            ctx.beginPath();
            ctx.arc(x, y, highlightGlowRadius, 0, Math.PI * 2);
            ctx.fill();
        } else if (isFiltered) {
            const filterGlowRadius = adjustedSize * 4;
            const filterGlow = ctx.createRadialGradient(x, y, 0, x, y, filterGlowRadius);
            filterGlow.addColorStop(0, 'rgba(255, 80, 80, 0.5)');
            filterGlow.addColorStop(0.3, 'rgba(255, 60, 60, 0.25)');
            filterGlow.addColorStop(0.6, 'rgba(255, 50, 50, 0.1)');
            filterGlow.addColorStop(1, 'rgba(255, 50, 50, 0)');
            
            ctx.fillStyle = filterGlow;
            ctx.beginPath();
            ctx.arc(x, y, filterGlowRadius, 0, Math.PI * 2);
            ctx.fill();
        } else if (size > 1.5 && magnitude < 3) {
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
        
        const starColor = isHighlighted ? '#FFD700' : (isFiltered ? '#FF6464' : color);
        
        ctx.beginPath();
        ctx.arc(x, y, adjustedSize, 0, Math.PI * 2);
        ctx.fillStyle = starColor;
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        
        if (magnitude < 1) {
            ctx.beginPath();
            ctx.arc(x, y, adjustedSize * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = opacity * 0.8;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        if (isHighlighted) {
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, adjustedSize + 2, 0, Math.PI * 2);
            ctx.stroke();
        } else if (isFiltered) {
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, adjustedSize + 2, 0, Math.PI * 2);
            ctx.stroke();
        } else if (hasConstellation) {
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, adjustedSize + 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    /**
     * Dessine les lignes des constellations
     * @param {Array<Object>} constellations - Liste des constellations
     * @param {string|null} [highlightedConstellation=null] - Constellation mise en évidence
     */
    drawConstellationLines(constellations, highlightedConstellation = null) {
        if (!this.camera || !constellations || constellations.length === 0) return;
        
        const ctx = this.ctx;
        const camera = this.camera;
        
        ctx.save();
        
        for (const constellation of constellations) {
            const isHighlighted = highlightedConstellation && constellation.name === highlightedConstellation;
            
            if (isHighlighted) {
                ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)';
                ctx.lineWidth = 2;
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            } else {
                const color = Constellations.getConstellationColor(constellation.name);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 3]);
                ctx.globalAlpha = highlightedConstellation ? 0.2 : 0.5; 
            }
            
            for (const connection of constellation.connections) {
                const star1 = connection.star1;
                const star2 = connection.star2;
                
                const proj1 = camera.project(star1.azimut, star1.altitude);
                const proj2 = camera.project(star2.azimut, star2.altitude);
                
                if (!proj1 || !proj1.visible || !proj2 || !proj2.visible) {
                    continue;
                }
                
                if (!this.isPointVisible(proj1.x, proj1.y) && 
                    !this.isPointVisible(proj2.x, proj2.y)) {
                    continue;
                }
                
                ctx.beginPath();
                ctx.moveTo(proj1.x, proj1.y);
                ctx.lineTo(proj2.x, proj2.y);
                ctx.stroke();
            }
        }
        
        ctx.restore();
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
     * Dessine une planète sur le canvas
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @param {Object} planet - Données de la planète
     * @param {number} distanceFromCenter - Distance du centre en unités normalisées
     */
    drawPlanet(x, y, planet, distanceFromCenter) {
        const ctx = this.ctx;
        
        const perspectiveScale = 1 - (distanceFromCenter * 0.15);
        const baseSize = planet.size * Math.max(0.6, perspectiveScale);
        const zoomFactor = Math.sqrt(this.camera.getZoomLevel());
        const adjustedSize = baseSize * zoomFactor;
        
        const outerGlowRadius = adjustedSize * 3;
        const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, outerGlowRadius);
        outerGlow.addColorStop(0, this.hexToRgba(planet.color, 0.4));
        outerGlow.addColorStop(0.4, this.hexToRgba(planet.color, 0.15));
        outerGlow.addColorStop(0.7, this.hexToRgba(planet.color, 0.05));
        outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(x, y, outerGlowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, adjustedSize, 0, Math.PI * 2);
        
        const planetGradient = ctx.createRadialGradient(
            x - adjustedSize * 0.3, 
            y - adjustedSize * 0.3, 
            0, 
            x, y, adjustedSize
        );
        planetGradient.addColorStop(0, this.lightenColor(planet.color, 40));
        planetGradient.addColorStop(0.5, planet.color);
        planetGradient.addColorStop(1, this.darkenColor(planet.color, 30));
        
        ctx.fillStyle = planetGradient;
        ctx.fill();
        
        ctx.strokeStyle = this.lightenColor(planet.color, 20);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        const symbolOffset = adjustedSize + 12;
        ctx.font = `bold ${Math.max(12, adjustedSize)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillStyle = planet.color;
        ctx.fillText(planet.symbol, x, y - symbolOffset);
        
        ctx.font = `${Math.max(10, adjustedSize * 0.8)}px Arial, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(planet.name, x, y + symbolOffset - 4);
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    /**
     * Convertit une couleur hexadécimale en rgba
     * @param {string} hex - Couleur en hexadécimal
     * @param {number} alpha - Opacité
     * @returns {string} Couleur rgba
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    /**
     * Éclaircit une couleur
     * @param {string} hex - Couleur en hexadécimal
     * @param {number} amount - Quantité d'éclaircissement
     * @returns {string} Couleur éclaircie
     */
    lightenColor(hex, amount) {
        const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
        const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
        const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * Assombrit une couleur
     * @param {string} hex - Couleur en hexadécimal
     * @param {number} amount - Quantité d'assombrissement
     * @returns {string} Couleur assombrie
     */
    darkenColor(hex, amount) {
        const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
        const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
        const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Obtient l'état actuel du contrôleur
     * @returns {Object} État du contrôleur
     */
    getState() {
        return {
            camera: this.camera.getState()
        };
    }
    
    /**
     * Restaure l'état du contrôleur
     * @param {Object} state - État à restaurer
     */
    setState(state) {
        if (state.camera) {
            this.camera.setState(state.camera);
            this.updateUI();
            this.requestRender();
        }
    }
}

