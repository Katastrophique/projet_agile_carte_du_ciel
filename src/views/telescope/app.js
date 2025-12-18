/**
 * Application principale pour la vue Télescope
 */

const APP_CONFIG = {
    csvPath: '../../shared/hygdata_v40.csv',
    magnitudeLimit: 6,
    csvSeparator: ';',
    updateInterval: null
};

let telescopeView = null;

/**
 * Initialise l'application Télescope
 */
async function initApp() {
    const canvas = document.getElementById('skyCanvas');
    if (!canvas) {
        UIUtils.showError('Canvas non trouvé dans le DOM');
        return;
    }
    
    telescopeView = new TelescopeView(canvas, APP_CONFIG);
    await telescopeView.init();
    
    if (typeof window.easterEggs !== 'undefined') {
        window.easterEggs = new EasterEggs();
    }
}

document.addEventListener('DOMContentLoaded', initApp);

