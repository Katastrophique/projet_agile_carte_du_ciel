/**
 * Tutoriel Interactif - Carte du Ciel
 * Module de tutoriel guidé pas-à-pas pour découvrir l'application
 * 
 * @author Carte du Ciel Team
 * @version 1.0.0
 */

class Tutorial {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.spotlight = null;
        this.tooltip = null;
        this.welcomeScreen = null;
        this.highlightedElement = null;
        
        // Clé pour le localStorage
        this.STORAGE_KEY = 'carteDuCiel_tutorialCompleted';
        this.DONT_SHOW_KEY = 'carteDuCiel_dontShowTutorial';
        
        // Définition des étapes du tutoriel
        this.steps = [
            {
                id: 'welcome',
                type: 'welcome',
                title: 'Bienvenue dans la Carte du Ciel ! 🌟',
                content: `
                    <p>Découvrez le ciel étoilé comme si vous y étiez !</p>
                    <p>Ce tutoriel vous guidera à travers les principales fonctionnalités de l'application en <strong>moins de 2 minutes</strong>.</p>
                `
            },
            {
                id: 'canvas-navigation',
                target: '#skyCanvas',
                title: 'Navigation dans le ciel',
                content: `
                    <p>Explorez le ciel étoilé de manière intuitive :</p>
                    <div class="icon-text"><span class="emoji">🖱️</span> <strong>Clic + glisser</strong> pour pivoter la vue</div>
                    <div class="icon-text"><span class="emoji">🔍</span> <strong>Molette</strong> pour zoomer/dézoomer</div>
                    <div class="icon-text"><span class="emoji">👆</span> <strong>Double-clic</strong> pour réinitialiser la vue</div>
                    <p>Sur mobile, utilisez vos doigts pour glisser et pincer !</p>
                `,
                position: 'center',
                spotlight: false
            },
            {
                id: 'direction-indicator',
                target: '.direction-indicator',
                title: 'Indicateur de direction',
                content: `
                    <p>Cette boussole vous indique la <span class="highlight">direction cardinale</span> vers laquelle vous regardez actuellement.</p>
                    <p>Pratique pour vous orienter et trouver les constellations !</p>
                `,
                position: 'below-center'
            },
            {
                id: 'filters-panel',
                target: '.filter-list',
                title: 'Menu des filtres',
                content: `
                    <p>Personnalisez votre vue du ciel avec les <span class="highlight">filtres disponibles</span> :</p>
                    <div class="icon-text"><span class="emoji">⭐</span> Top 50 étoiles les plus brillantes</div>
                    <div class="icon-text"><span class="emoji">🔥</span> Étoiles les plus chaudes</div>
                    <div class="icon-text"><span class="emoji">📐</span> Étoiles les plus grosses</div>
                    <div class="icon-text"><span class="emoji">✨</span> Filtrer par constellation</div>
                `,
                position: 'right',
                openPanel: true,
                panelId: 'leftPanel'
            },
            {
                id: 'constellation-select',
                target: '#constellationSelect',
                title: 'Sélection de constellation',
                content: `
                    <p>Choisissez une constellation pour <span class="highlight">mettre en évidence</span> toutes ses étoiles.</p>
                    <p>Les lignes de la constellation seront tracées sur la carte !</p>
                `,
                position: 'right',
                openPanel: true,
                panelId: 'leftPanel'
            },
            {
                id: 'location-search',
                target: '#locationInput',
                title: 'Changez de localisation',
                content: `
                    <p>Tapez le nom d'une ville pour voir le ciel depuis un autre endroit du monde.</p>
                    <p>Le ciel s'adaptera automatiquement à la <span class="highlight">latitude et longitude</span> de votre nouvelle position !</p>
                `,
                position: 'right'
            },
            {
                id: 'datetime',
                target: '#datetime',
                title: 'Date et heure',
                content: `
                    <p>Cliquez sur la date/heure pour voyager dans le temps !</p>
                    <p>Observez le ciel à n'importe quelle <span class="highlight">date passée ou future</span>.</p>
                    <p class="icon-text"><span class="emoji">💡</span> Astuce : Essayez une éclipse ou un événement astronomique !</p>
                `,
                position: 'bottom-left',
                openPanel: true,
                panelId: 'sidePanel'
            },
            {
                id: 'star-hover',
                target: '#skyCanvas',
                title: 'Informations sur les étoiles',
                content: `
                    <p>Passez votre souris sur une étoile pour voir ses informations :</p>
                    <div class="icon-text"><span class="emoji">📛</span> Nom de l'étoile</div>
                    <div class="icon-text"><span class="emoji">✨</span> Constellation d'appartenance</div>
                    <div class="icon-text"><span class="emoji">📍</span> Position dans le ciel</div>
                    <p>Les <span class="highlight">planètes</span> sont aussi visibles avec leur symbole distinctif !</p>
                `,
                position: 'center',
                spotlight: false
            },
            {
                id: 'info-panel',
                target: '#sidePanel .panel-content',
                title: 'Panneau d\'informations',
                content: `
                    <p>Ce panneau affiche des informations complémentaires :</p>
                    <div class="icon-text"><span class="emoji">🌍</span> Votre position (latitude/longitude)</div>
                    <div class="icon-text"><span class="emoji">🎮</span> Rappel des contrôles</div>
                    <div class="icon-text"><span class="emoji">📖</span> Légende de la carte</div>
                `,
                position: 'left',
                openPanel: true,
                panelId: 'sidePanel'
            },
            {
                id: 'footer-stats',
                target: '.footer-stats',
                title: 'Statistiques en temps réel',
                content: `
                    <p>En bas de l'écran, retrouvez les statistiques actuelles :</p>
                    <div class="icon-text"><span class="emoji">⭐</span> Nombre d'étoiles visibles</div>
                    <div class="icon-text"><span class="emoji">🧭</span> Direction cardinale</div>
                    <div class="icon-text"><span class="emoji">🔭</span> Champ de vision (FOV)</div>
                    <div class="icon-text"><span class="emoji">🔍</span> Niveau de zoom</div>
                `,
                position: 'top'
            },
            {
                id: 'complete',
                type: 'complete',
                title: 'Tutoriel terminé ! 🎉',
                content: `
                    <p>Vous êtes maintenant prêt à explorer l'univers !</p>
                    <p>N'hésitez pas à relancer le tutoriel via le bouton <span class="highlight">❓</span> en bas à droite.</p>
                    <p><strong>Bon voyage parmi les étoiles ! 🚀</strong></p>
                `
            }
        ];
        
        this.init();
    }
    
    /**
     * Initialise le tutoriel
     */
    init() {
        this.createDOM();
        this.bindEvents();
        
        // Afficher automatiquement le tutoriel au premier lancement
        if (!this.hasCompletedTutorial() && !this.shouldNotShow()) {
            setTimeout(() => this.showWelcome(), 1500);
        }
    }
    
    /**
     * Crée les éléments DOM du tutoriel
     */
    createDOM() {
        // Conteneur principal de l'overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-modal', 'true');
        this.overlay.setAttribute('aria-label', 'Tutoriel interactif');
        
        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'tutorial-backdrop';
        this.overlay.appendChild(backdrop);
        
        // Spotlight
        this.spotlight = document.createElement('div');
        this.spotlight.className = 'tutorial-spotlight';
        this.overlay.appendChild(this.spotlight);
        
        // Tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tutorial-tooltip';
        this.tooltip.innerHTML = `
            <div class="tutorial-header">
                <span class="tutorial-step-badge">1</span>
                <h3 class="tutorial-title"></h3>
            </div>
            <div class="tutorial-content"></div>
            <div class="tutorial-navigation">
                <div class="tutorial-progress"></div>
                <div class="tutorial-buttons">
                    <button class="tutorial-btn tutorial-btn-secondary" id="tutorialPrev">
                        ← Précédent
                    </button>
                    <button class="tutorial-btn tutorial-btn-primary" id="tutorialNext">
                        Suivant →
                    </button>
                </div>
            </div>
        `;
        this.overlay.appendChild(this.tooltip);
        
        // Écran de bienvenue
        this.welcomeScreen = document.createElement('div');
        this.welcomeScreen.className = 'tutorial-welcome';
        this.welcomeScreen.innerHTML = `
            <div class="tutorial-welcome-icon">🔭</div>
            <h2>Bienvenue dans la Carte du Ciel !</h2>
            <p class="subtitle">Apprenez à utiliser l'application en quelques étapes simples</p>
            <div class="tutorial-features">
                <div class="tutorial-feature">
                    <span class="feature-icon">🌍</span>
                    <span class="feature-text">Navigation immersive</span>
                </div>
                <div class="tutorial-feature">
                    <span class="feature-icon">⭐</span>
                    <span class="feature-text">Filtres intelligents</span>
                </div>
                <div class="tutorial-feature">
                    <span class="feature-icon">📍</span>
                    <span class="feature-text">Localisation personnalisée</span>
                </div>
                <div class="tutorial-feature">
                    <span class="feature-icon">🪐</span>
                    <span class="feature-text">Planètes visibles</span>
                </div>
            </div>
            <div class="tutorial-welcome-buttons">
                <button class="tutorial-btn tutorial-btn-primary" id="startTutorial">
                    🚀 Commencer le tutoriel
                </button>
                <button class="tutorial-btn tutorial-btn-skip" id="skipTutorial">
                    Passer et explorer directement
                </button>
            </div>
            <label class="tutorial-dont-show">
                <input type="checkbox" id="dontShowAgain">
                Ne plus afficher au démarrage
            </label>
        `;
        this.overlay.appendChild(this.welcomeScreen);
        
        // Bouton d'accès au tutoriel
        this.triggerButton = document.createElement('button');
        this.triggerButton.className = 'tutorial-trigger-btn';
        this.triggerButton.setAttribute('aria-label', 'Ouvrir le tutoriel');
        this.triggerButton.setAttribute('title', 'Aide & Tutoriel');
        this.triggerButton.innerHTML = `
            ❓
            <span class="tooltip">Aide & Tutoriel</span>
            ${!this.hasCompletedTutorial() ? '<span class="badge-new">Nouveau</span>' : ''}
        `;
        
        // Ajouter au DOM
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.triggerButton);
    }
    
    /**
     * Lie les événements
     */
    bindEvents() {
        // Bouton trigger
        this.triggerButton.addEventListener('click', () => this.showWelcome());
        
        // Boutons de bienvenue
        this.welcomeScreen.querySelector('#startTutorial').addEventListener('click', () => {
            this.hideWelcome();
            this.start();
        });
        
        this.welcomeScreen.querySelector('#skipTutorial').addEventListener('click', () => {
            this.handleDontShowPreference();
            this.hideWelcome();
            this.close();
        });
        
        // Navigation du tutoriel
        this.tooltip.querySelector('#tutorialPrev').addEventListener('click', () => this.prev());
        this.tooltip.querySelector('#tutorialNext').addEventListener('click', () => this.next());
        
        // Fermer avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.close();
            }
        });
        
        // Clic sur le backdrop pour fermer
        this.overlay.querySelector('.tutorial-backdrop').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.close();
            }
        });
        
        // Redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            if (this.isActive) {
                this.updatePosition();
            }
        });
    }
    
    /**
     * Affiche l'écran de bienvenue
     */
    showWelcome() {
        this.overlay.classList.add('active');
        this.welcomeScreen.classList.add('visible');
        this.tooltip.classList.remove('visible');
        this.spotlight.style.display = 'none';
    }
    
    /**
     * Cache l'écran de bienvenue
     */
    hideWelcome() {
        this.welcomeScreen.classList.remove('visible');
    }
    
    /**
     * Démarre le tutoriel
     */
    start() {
        this.isActive = true;
        this.currentStep = 1; // Skip welcome step
        this.overlay.classList.add('active');
        this.showStep(this.currentStep);
    }
    
    /**
     * Affiche une étape spécifique
     */
    async showStep(index) {
        const step = this.steps[index];
        if (!step) return;
        
        // Cas spécial : écran de fin
        if (step.type === 'complete') {
            this.showComplete();
            return;
        }
        
        // Retirer la surbrillance de l'élément précédent
        this.removeHighlight();
        
        // Cacher temporairement le spotlight pendant la transition
        this.spotlight.style.display = 'none';
        this.tooltip.classList.remove('visible');
        
        // Fermer les panneaux non nécessaires
        if (step.openPanel && step.panelId) {
            // Fermer les autres panneaux sauf celui qu'on veut ouvrir
            const panels = document.querySelectorAll('.side-panel, .side-panel-left');
            panels.forEach(panel => {
                if (panel.id !== step.panelId && !panel.classList.contains('collapsed')) {
                    panel.classList.add('collapsed');
                }
            });
            // Ouvrir le panneau nécessaire et attendre
            await this.openPanel(step.panelId);
        } else {
            // Fermer tous les panneaux
            this.closePanels();
        }
        
        // Petit délai pour laisser le temps aux animations
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Mettre à jour le contenu du tooltip
        this.updateTooltipContent(step, index);
        
        // Positionner le spotlight et le tooltip
        if (step.target && step.spotlight !== false) {
            this.spotlight.style.display = 'block';
            this.spotlight.classList.add('pulse');
            this.positionSpotlight(step.target);
            // Ajouter la surbrillance à l'élément ciblé
            this.addHighlight(step.target);
        } else {
            this.spotlight.style.display = 'none';
        }
        
        this.positionTooltip(step);
        
        // Afficher le tooltip avec animation
        setTimeout(() => {
            this.tooltip.classList.add('visible', 'animate-in');
        }, 100);
        
        // Mettre à jour les indicateurs de progression
        this.updateProgress(index);
        this.updateNavigationButtons(index);
    }
    
    /**
     * Ajoute la classe de surbrillance à un élément
     */
    addHighlight(selector) {
        const target = document.querySelector(selector);
        if (target) {
            target.classList.add('tutorial-highlight');
            this.highlightedElement = target;
        }
    }
    
    /**
     * Retire la surbrillance de tous les éléments
     */
    removeHighlight() {
        if (this.highlightedElement) {
            this.highlightedElement.classList.remove('tutorial-highlight');
            this.highlightedElement = null;
        }
        // Nettoyage de sécurité
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }
    
    /**
     * Met à jour le contenu du tooltip
     */
    updateTooltipContent(step, index) {
        const stepNumber = index;
        const totalSteps = this.steps.length - 2; // Sans welcome et complete
        
        this.tooltip.querySelector('.tutorial-step-badge').textContent = stepNumber;
        this.tooltip.querySelector('.tutorial-title').textContent = step.title;
        this.tooltip.querySelector('.tutorial-content').innerHTML = step.content;
    }
    
    /**
     * Positionne le spotlight sur l'élément cible
     */
    positionSpotlight(selector) {
        const target = document.querySelector(selector);
        if (!target) {
            this.spotlight.style.display = 'none';
            return;
        }
        
        const rect = target.getBoundingClientRect();
        // Padding plus généreux pour mieux encadrer les éléments
        const isSmallElement = rect.width < 200 || rect.height < 50;
        const padding = isSmallElement ? 20 : 18;
        
        this.spotlight.style.top = `${rect.top - padding}px`;
        this.spotlight.style.left = `${rect.left - padding}px`;
        this.spotlight.style.width = `${rect.width + padding * 2}px`;
        this.spotlight.style.height = `${rect.height + padding * 2}px`;
    }
    
    /**
     * Positionne le tooltip par rapport à l'élément cible
     */
    positionTooltip(step) {
        const tooltip = this.tooltip;
        const position = step.position || 'bottom';
        
        // Réinitialiser les classes de flèche
        tooltip.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left', 'arrow-right');
        
        if (!step.target || step.position === 'center') {
            // Position centrale
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }
        
        const target = document.querySelector(step.target);
        if (!target) {
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }
        
        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const margin = 20;
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - margin;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                tooltip.classList.add('arrow-bottom');
                break;
            case 'bottom':
                top = rect.bottom + margin;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                tooltip.classList.add('arrow-top');
                break;
            case 'below-center':
                // Position en dessous de l'élément, centrée sur l'écran
                top = rect.bottom + margin;
                left = (window.innerWidth - tooltipRect.width) / 2;
                tooltip.classList.add('arrow-top');
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - margin;
                tooltip.classList.add('arrow-right');
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + margin;
                tooltip.classList.add('arrow-left');
                break;
            case 'bottom-left':
                top = rect.bottom + margin;
                left = rect.left - tooltipRect.width + rect.width;
                tooltip.classList.add('arrow-top');
                break;
            default:
                top = rect.bottom + margin;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                tooltip.classList.add('arrow-top');
        }
        
        // Ajustements pour rester dans la fenêtre
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (left < 10) left = 10;
        if (left + tooltipRect.width > windowWidth - 10) {
            left = windowWidth - tooltipRect.width - 10;
        }
        if (top < 10) top = 10;
        if (top + tooltipRect.height > windowHeight - 10) {
            top = windowHeight - tooltipRect.height - 10;
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.transform = 'none';
    }
    
    /**
     * Met à jour les points de progression
     */
    updateProgress(currentIndex) {
        const progressContainer = this.tooltip.querySelector('.tutorial-progress');
        const totalSteps = this.steps.length - 2; // Sans welcome et complete
        
        progressContainer.innerHTML = '';
        
        for (let i = 1; i <= totalSteps; i++) {
            const dot = document.createElement('span');
            dot.className = 'tutorial-progress-dot';
            if (i === currentIndex) {
                dot.classList.add('active');
            } else if (i < currentIndex) {
                dot.classList.add('completed');
            }
            progressContainer.appendChild(dot);
        }
    }
    
    /**
     * Met à jour les boutons de navigation
     */
    updateNavigationButtons(index) {
        const prevBtn = this.tooltip.querySelector('#tutorialPrev');
        const nextBtn = this.tooltip.querySelector('#tutorialNext');
        const totalSteps = this.steps.length - 1; // Sans complete
        
        // Bouton précédent
        if (index <= 1) {
            prevBtn.style.visibility = 'hidden';
        } else {
            prevBtn.style.visibility = 'visible';
        }
        
        // Bouton suivant
        if (index >= totalSteps - 1) {
            nextBtn.textContent = 'Terminer ✓';
        } else {
            nextBtn.innerHTML = 'Suivant →';
        }
    }
    
    /**
     * Passe à l'étape suivante
     */
    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        } else {
            this.complete();
        }
    }
    
    /**
     * Revient à l'étape précédente
     */
    prev() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }
    
    /**
     * Affiche l'écran de fin
     */
    showComplete() {
        this.spotlight.style.display = 'none';
        this.closePanels();
        
        this.tooltip.innerHTML = `
            <div class="tutorial-complete">
                <div class="tutorial-complete-icon">🎉</div>
                <h3>Tutoriel terminé !</h3>
                <p>Vous êtes maintenant prêt à explorer l'univers. Bon voyage parmi les étoiles !</p>
                <button class="tutorial-btn tutorial-btn-primary" id="closeTutorial">
                    Commencer l'exploration 🚀
                </button>
            </div>
        `;
        
        this.tooltip.querySelector('#closeTutorial').addEventListener('click', () => {
            this.complete();
        });
        
        this.tooltip.classList.add('visible');
        this.tooltip.style.top = '50%';
        this.tooltip.style.left = '50%';
        this.tooltip.style.transform = 'translate(-50%, -50%)';
    }
    
    /**
     * Termine le tutoriel
     */
    complete() {
        this.markAsCompleted();
        this.close();
        
        // Retirer le badge "Nouveau"
        const badge = this.triggerButton.querySelector('.badge-new');
        if (badge) badge.remove();
    }
    
    /**
     * Ferme le tutoriel
     */
    close() {
        this.isActive = false;
        this.overlay.classList.remove('active');
        this.tooltip.classList.remove('visible');
        this.welcomeScreen.classList.remove('visible');
        this.spotlight.style.display = 'none';
        this.closePanels();
        this.removeHighlight();
        
        // Recréer le tooltip pour la prochaine fois
        setTimeout(() => this.resetTooltip(), 300);
    }
    
    /**
     * Recrée le contenu du tooltip
     */
    resetTooltip() {
        this.tooltip.innerHTML = `
            <div class="tutorial-header">
                <span class="tutorial-step-badge">1</span>
                <h3 class="tutorial-title"></h3>
            </div>
            <div class="tutorial-content"></div>
            <div class="tutorial-navigation">
                <div class="tutorial-progress"></div>
                <div class="tutorial-buttons">
                    <button class="tutorial-btn tutorial-btn-secondary" id="tutorialPrev">
                        ← Précédent
                    </button>
                    <button class="tutorial-btn tutorial-btn-primary" id="tutorialNext">
                        Suivant →
                    </button>
                </div>
            </div>
        `;
        
        // Rebind events
        this.tooltip.querySelector('#tutorialPrev').addEventListener('click', () => this.prev());
        this.tooltip.querySelector('#tutorialNext').addEventListener('click', () => this.next());
    }
    
    /**
     * Ouvre un panneau latéral
     * @returns {Promise} Résolu quand le panneau est ouvert
     */
    openPanel(panelId) {
        return new Promise((resolve) => {
            const panel = document.getElementById(panelId);
            if (panel) {
                // Forcer l'ouverture
                panel.classList.remove('collapsed');
                panel.style.opacity = '1';
                panel.style.visibility = 'visible';
                
                // Aussi essayer de cliquer sur le toggle si nécessaire
                const toggleBtn = document.getElementById(panelId === 'leftPanel' ? 'toggleLeftPanel' : 'togglePanel');
                if (toggleBtn && panel.classList.contains('collapsed')) {
                    toggleBtn.click();
                }
                
                // Attendre l'animation d'ouverture
                setTimeout(resolve, 350);
            } else {
                resolve();
            }
        });
    }
    
    /**
     * Ferme tous les panneaux latéraux
     */
    closePanels() {
        const panels = document.querySelectorAll('.side-panel, .side-panel-left');
        panels.forEach(panel => {
            if (!panel.classList.contains('collapsed')) {
                panel.classList.add('collapsed');
            }
        });
    }
    
    /**
     * Met à jour la position (pour le redimensionnement)
     */
    updatePosition() {
        if (this.currentStep > 0 && this.currentStep < this.steps.length) {
            const step = this.steps[this.currentStep];
            if (step.target && step.spotlight !== false) {
                this.positionSpotlight(step.target);
            }
            this.positionTooltip(step);
        }
    }
    
    /**
     * Gère la préférence "Ne plus afficher"
     */
    handleDontShowPreference() {
        const checkbox = this.welcomeScreen.querySelector('#dontShowAgain');
        if (checkbox && checkbox.checked) {
            localStorage.setItem(this.DONT_SHOW_KEY, 'true');
        }
    }
    
    /**
     * Vérifie si le tutoriel a déjà été complété
     */
    hasCompletedTutorial() {
        return localStorage.getItem(this.STORAGE_KEY) === 'true';
    }
    
    /**
     * Vérifie si l'utilisateur ne veut plus voir le tutoriel
     */
    shouldNotShow() {
        return localStorage.getItem(this.DONT_SHOW_KEY) === 'true';
    }
    
    /**
     * Marque le tutoriel comme complété
     */
    markAsCompleted() {
        localStorage.setItem(this.STORAGE_KEY, 'true');
    }
    
    /**
     * Réinitialise l'état du tutoriel (pour les tests)
     */
    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.DONT_SHOW_KEY);
    }
}

// Initialisation automatique au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que l'application soit chargée
    const initTutorial = () => {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
            // Attendre que le chargement soit terminé
            setTimeout(initTutorial, 500);
            return;
        }
        
        window.tutorial = new Tutorial();
    };
    
    // Délai pour s'assurer que tout est chargé
    setTimeout(initTutorial, 1000);
});

// Export pour utilisation externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tutorial;
}
