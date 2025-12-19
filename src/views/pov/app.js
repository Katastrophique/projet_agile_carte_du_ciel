/**
 * Application principale pour la vue POV
 */

const APP_CONFIG = {
    csvPath: '../../shared/hygdata_v40.csv',
    magnitudeLimit: 6,
    csvSeparator: ';',
    updateInterval: null
};

let povView = null;

/**
 * Initialise l'application POV
 */
async function initApp() {
    const canvas = document.getElementById('skyCanvas');
    if (!canvas) {
        UIUtils.showError('Canvas non trouvé dans le DOM');
        return;
    }
    
    povView = new POVView(canvas, APP_CONFIG);
    window.povView = povView;
    await povView.init();
    
    if (typeof window.easterEggs !== 'undefined') {
        window.easterEggs = new EasterEggs();
    }
}

document.addEventListener('DOMContentLoaded', initApp);

const originalStarHover = window.StarHover;

window.StarHover = {
    findStarAtPosition: (x, y) => {
        if (!povView) return null;
        return povView.findStarAtPosition(x, y);
    },
    showStarPopup: (star, x, y) => originalStarHover.showStarPopup(star, x, y),
    hideStarPopup: () => originalStarHover.hideStarPopup(),
    setHighlightedConstellation: (abbr) => {
        if (povView) povView.setHighlightedConstellation(abbr);
    },
    clearHighlightedConstellation: () => {
        if (povView) povView.clearHighlightedConstellation();
    },
    getStarDisplayName: (star) => originalStarHover.getStarDisplayName(star),
    getConstellationFullName: (abbr) => originalStarHover.getConstellationFullName(abbr)
};

