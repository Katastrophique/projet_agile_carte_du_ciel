/**
 * Utilitaires pour la gestion de l'interface utilisateur
 */

/**
 * Met à jour le message de chargement
 * @param {string} message - Message à afficher
 */
function updateLoadingMessage(message) {
    const messageElement = document.getElementById('loadingMessage');
    if (messageElement) {
        messageElement.textContent = message;
    }
}

/**
 * Cache l'overlay de chargement
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Affiche un message d'erreur
 * @param {string} message - Message d'erreur à afficher
 */
function showError(message) {
    const overlay = document.getElementById('loadingOverlay');
    const messageElement = document.getElementById('loadingMessage');
    const spinner = document.querySelector('.spinner');
    
    if (spinner) {
        spinner.style.display = 'none';
    }
    
    if (messageElement) {
        messageElement.innerHTML = `<span style="color: #ff6b6b;">❌ ${message}</span>`;
    }
}

/**
 * Met à jour l'affichage de la date et heure
 * @param {Date} date - Date à afficher
 */
function updateDateTimeDisplay(date) {
    const datetimeElement = document.getElementById('datetime');
    if (datetimeElement && date) {
        datetimeElement.textContent = Astronomy.formatDateTime(date);
    }
}

/**
 * Met à jour le compteur d'étoiles
 * @param {number} count - Nombre d'étoiles
 * @param {number} [rendered] - Nombre d'étoiles rendues (optionnel)
 */
function updateStarCount(count, rendered = null) {
    const countElement = document.getElementById('starCount');
    if (countElement) {
        if (rendered !== null) {
            countElement.textContent = `${rendered}/${count}`;
        } else {
            countElement.textContent = count;
        }
    }
}

window.UIUtils = {
    updateLoadingMessage,
    hideLoadingOverlay,
    showError,
    updateDateTimeDisplay,
    updateStarCount
};

