/**
 * Classe de gestion des easter eggs
 */
class EasterEggs {
    /**
     * Constructeur de la classe EasterEggs
     */
    constructor() {
        this.keyBuffer = '';
        this.maxBufferLength = 20;
        
        this.konamiCode = 'ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba';
        this.konamiBuffer = '';
        
        this.secretWords = {
            'brainrot': () => this.triggerBrainrot(),
            'skibidi': () => this.triggerSkibidi(),
            'sigma': () => this.triggerSigma(),
            'ohio': () => this.triggerOhio()
        };
        
        this.isEasterEggActive = false;
        
        this.createEasterEggContainer();
        
        this.initKeyListener();
    }
    
    /**
     * Crée le conteneur DOM pour les easter eggs
     */
    createEasterEggContainer() {
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
     * Initialise l'écouteur de touches pour détecter les easter eggs
     */
    initKeyListener() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
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
            
            if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
                this.keyBuffer += e.key.toLowerCase();
                if (this.keyBuffer.length > this.maxBufferLength) {
                    this.keyBuffer = this.keyBuffer.slice(-this.maxBufferLength);
                }
                
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
     * @param {string} imageSrc - Chemin vers l'image
     * @param {string} text - Texte à afficher
     * @param {string} animation - Classe d'animation CSS
     * @param {number} [duration=3000] - Durée d'affichage en ms
     */
    showEasterEgg(imageSrc, text, animation, duration = 3000) {
        if (this.isEasterEggActive) return;
        this.isEasterEggActive = true;
        
        this.easterImage.src = imageSrc;
        this.easterImage.className = '';
        
        this.easterText.textContent = text;
        
        this.container.style.opacity = '1';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        
        setTimeout(() => {
            this.easterImage.style.transform = 'scale(1)';
            this.easterImage.classList.add(animation);
            this.easterText.style.opacity = '1';
        }, 100);
        
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
    
    /**
     * Déclenche l'easter egg "brainrot"
     */
    triggerBrainrot() {
        this.showEasterEgg(
            'assets/stars.png',
            '🧠 BRAINROT MODE ACTIVATED 🧠',
            'easter-glitch',
            4000
        );
    }
    
    /**
     * Déclenche l'easter egg "Konami Code"
     */
    triggerKonami() {
        this.showEasterEgg(
            'assets/sun.png',
            '☀️ +30 LIVES ☀️',
            'easter-spin',
            4000
        );
    }
    
    /**
     * Déclenche l'easter egg "sigma"
     */
    triggerSigma() {
        this.showEasterEgg(
            'assets/sun.png',
            '🗿 SIGMA GRINDSET 🗿',
            'easter-bounce',
            3000
        );
    }
    
    /**
     * Déclenche l'easter egg "skibidi"
     */
    triggerSkibidi() {
        this.showEasterEgg(
            'assets/stars.png',
            '🚽 SKIBIDI BOP BOP YES YES 🚽',
            'easter-shake',
            3500
        );
    }
    
    /**
     * Déclenche l'easter egg "ohio"
     */
    triggerOhio() {
        const canvas = document.getElementById('skyCanvas');
        if (canvas) {
            canvas.style.filter = 'invert(1) hue-rotate(180deg)';
            setTimeout(() => {
                canvas.style.filter = '';
            }, 3000);
        }
        
        this.showEasterEgg(
            'assets/sun.png',
            '🌽 ONLY IN OHIO 🌽',
            'easter-rainbow',
            3000
        );
    }
    
    /**
     * Affiche le menu secret
     */
    triggerSecretMenu() {
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
        
        const closeMenu = () => {
            secretInfo.remove();
            document.removeEventListener('click', closeMenu);
        };
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.easterEggs = new EasterEggs();
    }, 1000);
});

