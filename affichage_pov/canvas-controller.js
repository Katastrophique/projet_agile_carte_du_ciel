class CanvasController {
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
        
        this.resizeCanvas();
        
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        
        this.initEventListeners();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.camera) {
            this.camera.updateDimensions(this.canvas.width, this.canvas.height);
        }
    }
    
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
    
    handleZoom(event) {
        event.preventDefault();
        
        const zoomFactor = event.deltaY > 0 ? (1 + this.zoomSensitivity) : (1 - this.zoomSensitivity);
        
        this.camera.zoom(zoomFactor);
        
        this.updateUI();
        this.requestRender();
    }
    
    handleDragStart(event) {
        this.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        this.dragStartAzimuth = this.camera.azimuth;
        this.dragStartAltitude = this.camera.altitude;
        
        this.canvas.style.cursor = 'grabbing';
    }
    
    handleDragMove(event) {
        if (!this.isDragging) return;
        
        const deltaX = event.clientX - this.dragStartX;
        const deltaY = event.clientY - this.dragStartY;
        
        const deltaAzimuth = -deltaX * this.rotationSensitivity;
        const deltaAltitude = deltaY * this.rotationSensitivity;
        
        this.camera.azimuth = normalizeAngle(this.dragStartAzimuth + deltaAzimuth);
        this.camera.altitude = Math.max(this.camera.minAltitude, 
                                        Math.min(this.camera.maxAltitude, 
                                                this.dragStartAltitude + deltaAltitude));
        
        this.updateUI();
        this.requestRender();
    }
    
    handleDragEnd(event) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }
    
    getPinchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        
        if (event.touches.length === 2) {
            this.isPinching = true;
            this.isDragging = false;
            this.initialPinchDistance = this.getPinchDistance(event.touches[0], event.touches[1]);
            this.initialPinchFov = this.camera.fov;
        } else if (event.touches.length === 1) {
            this.isDragging = true;
            this.isPinching = false;
            const touch = event.touches[0];
            this.dragStartX = touch.clientX;
            this.dragStartY = touch.clientY;
            this.dragStartAzimuth = this.camera.azimuth;
            this.dragStartAltitude = this.camera.altitude;
        }
    }
    
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
            
            this.camera.azimuth = normalizeAngle(this.dragStartAzimuth + deltaAzimuth);
            this.camera.altitude = Math.max(this.camera.minAltitude, 
                                            Math.min(this.camera.maxAltitude, 
                                                    this.dragStartAltitude + deltaAltitude));
            
            this.updateUI();
            this.requestRender();
        }
    }
    
    handleTouchEnd(event) {
        if (event.touches.length < 2) {
            this.isPinching = false;
        }
        if (event.touches.length === 0) {
            this.isDragging = false;
        }
    }
    
    handleReset(event) {
        event.preventDefault();
        this.camera.reset();
        this.updateUI();
        this.requestRender();
    }
    
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
    
    requestRender() {
        if (this.onRenderNeeded) {
            this.onRenderNeeded();
        }
    }
    
    clearCanvas() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.fillStyle = '#000814';
        ctx.fillRect(0, 0, width, height);
        
        this.drawHorizon();
        
        this.drawCardinalPoints();
    }
    
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
    
    drawStar(x, y, size, color, magnitude, distanceFromCenter, altitude, hasConstellation = false) {
        const ctx = this.ctx;
        
        const perspectiveScale = 1 - (distanceFromCenter * 0.2);
        let adjustedSize = size * Math.max(0.5, perspectiveScale);
        
        let atmosphericDimming = 1;
        if (altitude < 20) {
            atmosphericDimming = 0.5 + (altitude / 20) * 0.5;
        }
        
        const baseOpacity = Math.max(0.3, Math.min(1, (6 - magnitude) / 6));
        const opacity = baseOpacity * atmosphericDimming;
        
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
        
        ctx.beginPath();
        ctx.arc(x, y, adjustedSize, 0, Math.PI * 2);
        ctx.fillStyle = color;
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
        
        if (hasConstellation) {
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, adjustedSize + 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawConstellationLines(constellations) {
        if (!this.camera || !constellations || constellations.length === 0) return;
        
        const ctx = this.ctx;
        const camera = this.camera;
        
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
    
    isPointVisible(x, y, margin = 10) {
        return x >= -margin && 
               x <= this.canvas.width + margin && 
               y >= -margin && 
               y <= this.canvas.height + margin;
    }
    
    getState() {
        return {
            camera: this.camera.getState()
        };
    }
    
    setState(state) {
        if (state.camera) {
            this.camera.setState(state.camera);
            this.updateUI();
            this.requestRender();
        }
    }
}
