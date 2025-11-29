/**
 * ==========================================================================
 * Easter Eggs - Module secret 🥚
 * ==========================================================================
 * 
 * Chut... c'est un secret ! 🤫
 */

class EasterEggs {
    constructor() {
        // Buffer pour détecter les séquences de touches
        this.keyBuffer = '';
        this.maxBufferLength = 20;
        
        // Konami Code : ↑↑↓↓←→←→BA
        this.konamiCode = 'ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba';
        this.konamiBuffer = '';
        
        // Mots secrets
        this.secretWords = {
            'brainrot': () => this.triggerBrainrot(),
            'skibidi': () => this.triggerSkibidi(),
            'sigma': () => this.triggerSigma(),
            'ohio': () => this.triggerOhio()
        };
        
        // État des easter eggs
        this.isEasterEggActive = false;
        
        // Créer le conteneur d'easter eggs
        this.createEasterEggContainer();
        
        // Écouter les touches
        this.initKeyListener();
        
        console.log('🥚 Easter eggs loaded... but you didn\'t see anything 👀');
    }
    
    /**
     * Crée le conteneur HTML pour les easter eggs
     */
    createEasterEggContainer() {
        // Container principal (invisible par défaut)
        this.container = document.createElement('div');
        this.container.id = 'easter-egg-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Image de l'easter egg
        this.easterImage = document.createElement('img');
        this.easterImage.id = 'easter-egg-image';
        this.easterImage.style.cssText = `
            max-width: 80%;
            max-height: 80%;
            object-fit: contain;
            transform: scale(0);
            transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.5));
        `;
        
        // Texte de l'easter egg
        this.easterText = document.createElement('div');
        this.easterText.id = 'easter-egg-text';
        this.easterText.style.cssText = `
            position: absolute;
            bottom: 15%;
            font-size: 2rem;
            font-weight: bold;
            color: #fff;
            text-shadow: 0 0 20px #ff00ff, 0 0 40px #00ffff;
            opacity: 0;
            transition: opacity 0.3s ease;
            font-family: 'Comic Sans MS', cursive, sans-serif;
        `;
        
        this.container.appendChild(this.easterImage);
        this.container.appendChild(this.easterText);
        document.body.appendChild(this.container);
        
        // Style pour les animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0) rotate(0); }
                25% { transform: translateX(-10px) rotate(-5deg); }
                75% { transform: translateX(10px) rotate(5deg); }
            }
            @keyframes rainbow {
                0% { filter: hue-rotate(0deg) drop-shadow(0 0 30px rgba(255, 0, 0, 0.8)); }
                33% { filter: hue-rotate(120deg) drop-shadow(0 0 30px rgba(0, 255, 0, 0.8)); }
                66% { filter: hue-rotate(240deg) drop-shadow(0 0 30px rgba(0, 0, 255, 0.8)); }
                100% { filter: hue-rotate(360deg) drop-shadow(0 0 30px rgba(255, 0, 0, 0.8)); }
            }
            @keyframes spin {
                from { transform: scale(1) rotate(0deg); }
                to { transform: scale(1) rotate(360deg); }
            }
            @keyframes bounce {
                0%, 100% { transform: scale(1) translateY(0); }
                50% { transform: scale(1.1) translateY(-20px); }
            }
            @keyframes glitch {
                0% { transform: scale(1) translate(0); filter: hue-rotate(0deg); }
                20% { transform: scale(1.02) translate(-5px, 5px); filter: hue-rotate(90deg); }
                40% { transform: scale(0.98) translate(5px, -5px); filter: hue-rotate(180deg); }
                60% { transform: scale(1.01) translate(-3px, -3px); filter: hue-rotate(270deg); }
                80% { transform: scale(0.99) translate(3px, 3px); filter: hue-rotate(360deg); }
                100% { transform: scale(1) translate(0); filter: hue-rotate(0deg); }
            }
            .easter-shake { animation: shake 0.5s ease-in-out infinite; }
            .easter-rainbow { animation: rainbow 2s linear infinite; }
            .easter-spin { animation: spin 1s linear infinite; }
            .easter-bounce { animation: bounce 0.6s ease-in-out infinite; }
            .easter-glitch { animation: glitch 0.3s ease-in-out infinite; }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Initialise l'écouteur de touches
     */
    initKeyListener() {
        document.addEventListener('keydown', (e) => {
            // Ignorer si on est dans un input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Buffer pour le Konami Code (touches spéciales)
            if (e.key.startsWith('Arrow') || e.key === 'a' || e.key === 'b') {
                this.konamiBuffer += e.key;
                if (this.konamiBuffer.length > this.konamiCode.length) {
                    this.konamiBuffer = this.konamiBuffer.slice(-this.konamiCode.length);
                }
                if (this.konamiBuffer === this.konamiCode) {
                    this.triggerKonami();
                    this.konamiBuffer = '';
                }
            }
            
            // Buffer pour les mots secrets (lettres uniquement)
            if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
                this.keyBuffer += e.key.toLowerCase();
                if (this.keyBuffer.length > this.maxBufferLength) {
                    this.keyBuffer = this.keyBuffer.slice(-this.maxBufferLength);
                }
                
                // Vérifier les mots secrets
                for (const [word, callback] of Object.entries(this.secretWords)) {
                    if (this.keyBuffer.endsWith(word)) {
                        callback();
                        this.keyBuffer = '';
                        break;
                    }
                }
            }
        });
    }
    

    
    /**
     * Affiche un easter egg
     */
    showEasterEgg(imageSrc, text, animation, duration = 3000) {
        if (this.isEasterEggActive) return;
        this.isEasterEggActive = true;
        
        // Configurer l'image
        this.easterImage.src = imageSrc;
        this.easterImage.className = '';
        
        // Configurer le texte
        this.easterText.textContent = text;
        
        // Afficher le container
        this.container.style.opacity = '1';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        
        // Animer l'apparition
        setTimeout(() => {
            this.easterImage.style.transform = 'scale(1)';
            this.easterImage.classList.add(animation);
            this.easterText.style.opacity = '1';
        }, 100);
        
        // Cacher après un délai
        setTimeout(() => {
            this.hideEasterEgg();
        }, duration);
    }
    
    /**
     * Cache l'easter egg
     */
    hideEasterEgg() {
        this.easterImage.style.transform = 'scale(0)';
        this.easterText.style.opacity = '0';
        this.container.style.opacity = '0';
        this.container.style.backgroundColor = 'transparent';
        
        setTimeout(() => {
            this.easterImage.className = '';
            this.isEasterEggActive = false;
        }, 500);
    }
    
    // ========================================================================
    // Easter Eggs Triggers
    // ========================================================================
    
    /**
     * 🧠 BRAINROT - Tape "brainrot"
     */
    triggerBrainrot() {
        console.log('🧠 BRAINROT ACTIVATED!');
        this.showEasterEgg(
            '../shared/assets/stars.png',
            '🧠 BRAINROT MODE ACTIVATED 🧠',
            'easter-glitch',
            4000
        );
        
        // Effet sonore (optionnel - commenté car pas de fichier audio)
        // this.playSound('brainrot.mp3');
    }
    
    /**
     * ☀️ Konami Code - ↑↑↓↓←→←→BA
     */
    triggerKonami() {
        console.log('🎮 KONAMI CODE ACTIVATED!');
        this.showEasterEgg(
            '../shared/assets/sun.png',
            '☀️ +30 LIVES ☀️',
            'easter-spin',
            4000
        );
    }
    
    /**
     * 🗿 SIGMA - Tape "sigma"
     */
    triggerSigma() {
        console.log('🗿 SIGMA ACTIVATED!');
        this.showEasterEgg(
            '../shared/assets/sun.png',
            '🗿 SIGMA GRINDSET 🗿',
            'easter-bounce',
            3000
        );
    }
    
    /**
     * 🌽 SKIBIDI - Tape "skibidi"
     */
    triggerSkibidi() {
        console.log('🚽 SKIBIDI ACTIVATED!');
        this.showEasterEgg(
            '../shared/assets/stars.png',
            '🚽 SKIBIDI BOP BOP YES YES 🚽',
            'easter-shake',
            3500
        );
    }
    
    /**
     * 🌽 OHIO - Tape "ohio"
     */
    triggerOhio() {
        console.log('🌽 OHIO ACTIVATED!');
        
        // Effet spécial : inverser les couleurs du canvas temporairement
        const canvas = document.getElementById('skyCanvas');
        if (canvas) {
            canvas.style.filter = 'invert(1) hue-rotate(180deg)';
            setTimeout(() => {
                canvas.style.filter = '';
            }, 3000);
        }
        
        this.showEasterEgg(
            '../shared/assets/sun.png',
            '🌽 ONLY IN OHIO 🌽',
            'easter-rainbow',
            3000
        );
    }
    
    /**
     * 🎮 Menu secret - 7 clics sur le titre
     */
    triggerSecretMenu() {
        console.log('🎮 SECRET MENU DISCOVERED!');
        
        // Afficher tous les easter eggs disponibles
        const secretInfo = document.createElement('div');
        secretInfo.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #4a90d9;
            border-radius: 15px;
            padding: 30px;
            z-index: 10000;
            color: white;
            font-family: 'Courier New', monospace;
            text-align: center;
            box-shadow: 0 0 30px rgba(74, 144, 217, 0.5);
        `;
        secretInfo.innerHTML = `
            <h2 style="color: #4a90d9; margin-bottom: 20px;">🥚 SECRET MENU 🥚</h2>
            <p style="margin: 10px 0;">Type <span style="color: #ff6b6b;">brainrot</span> → 🧠 Brainrot mode</p>
            <p style="margin: 10px 0;">Type <span style="color: #ff6b6b;">skibidi</span> → 🚽 Skibidi mode</p>
            <p style="margin: 10px 0;">Type <span style="color: #ff6b6b;">sigma</span> → 🗿 Sigma mode</p>
            <p style="margin: 10px 0;">Type <span style="color: #ff6b6b;">ohio</span> → 🌽 Ohio mode</p>
            <p style="margin: 10px 0;">Press <span style="color: #ff6b6b;">↑↑↓↓←→←→BA</span> → 🎮 Konami</p>
            <p style="margin-top: 20px; font-size: 0.8em; color: #888;">Click anywhere to close</p>
        `;
        
        document.body.appendChild(secretInfo);
        
        // Fermer au clic
        const closeMenu = () => {
            secretInfo.remove();
            document.removeEventListener('click', closeMenu);
        };
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }
}

// Initialiser les easter eggs quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    // Petit délai pour s'assurer que tout est chargé
    setTimeout(() => {
        window.easterEggs = new EasterEggs();
    }, 1000);
});
