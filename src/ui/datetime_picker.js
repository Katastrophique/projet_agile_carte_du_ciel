/**
 * Sélecteur de Date et Heure
 * Permet à l'utilisateur de modifier la date et l'heure pour simuler le ciel à un moment donné
 */

class DateTimePicker {
    constructor() {
        this.currentDate = new Date();
        this.modal = null;
        this.onDateChange = null;
        
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        const trigger = document.createElement('div');
        trigger.className = 'datetime-picker-trigger';
        trigger.innerHTML = `
            <button class="datetime-trigger-btn" id="datetimeTriggerBtn" title="Changer la date et l'heure">
                <span class="trigger-icon">🕐</span>
                <span class="trigger-text">Date/Heure</span>
                <span class="trigger-time" id="triggerTimeDisplay">${this.formatShortTime(this.currentDate)}</span>
            </button>
        `;
        document.body.appendChild(trigger);
        this.triggerBtn = trigger;
        
        const modal = document.createElement('div');
        modal.id = 'datetimePickerModal';
        modal.className = 'datetime-picker-modal';
        modal.innerHTML = `
            <div class="datetime-picker-panel">
                <div class="datetime-picker-header">
                    <h3>Changer la date et l'heure</h3>
                    <button class="datetime-picker-close" aria-label="Fermer">×</button>
                </div>
                
                <div class="datetime-picker-content">
                    <div class="datetime-row">
                        <div class="datetime-field-group">
                            <label for="dateInput">📅 Date</label>
                            <input type="date" id="dateInput" class="datetime-input">
                        </div>
                        <div class="datetime-field-group">
                            <label for="timeInput">🕐 Heure</label>
                            <input type="time" id="timeInput" class="datetime-input" step="60">
                        </div>
                    </div>
                </div>
                
                <div class="datetime-picker-actions">
                    <button class="datetime-btn datetime-btn-secondary" id="cancelDatetime">Annuler</button>
                    <button class="datetime-btn datetime-btn-primary" id="applyDatetime">Appliquer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
    }

    /**
     * Formate l'heure de façon courte pour le bouton
     * @param {Date} date 
     * @returns {string}
     */
    formatShortTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    bindEvents() {
        document.getElementById('datetimeTriggerBtn').addEventListener('click', () => {
            this.open();
        });
        
        this.modal.querySelector('.datetime-picker-close').addEventListener('click', () => this.close());
        document.getElementById('cancelDatetime').addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        document.getElementById('applyDatetime').addEventListener('click', () => this.apply());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('visible')) {
                this.close();
            }
        });
    }


    open() {
        this.updateInputValues(this.currentDate);
        this.modal.classList.add('visible');
        setTimeout(() => {
            document.getElementById('dateInput').focus();
        }, 100);
    }

    close() {
        this.modal.classList.remove('visible');
    }

    /**
     * Met à jour les valeurs des champs de saisie
     * @param {Date} date 
     */
    updateInputValues(date) {
        const dateInput = document.getElementById('dateInput');
        const timeInput = document.getElementById('timeInput');
        
        if (dateInput && timeInput) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dateInput.value = `${year}-${month}-${day}`;
            
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            timeInput.value = `${hours}:${minutes}`;
        }
    }

    /**
     * Récupère la date à partir des champs de saisie
     * @returns {Date}
     */
    getInputDate() {
        const dateInput = document.getElementById('dateInput');
        const timeInput = document.getElementById('timeInput');
        
        if (dateInput.value && timeInput.value) {
            const [year, month, day] = dateInput.value.split('-').map(Number);
            const [hours, minutes] = timeInput.value.split(':').map(Number);
            
            return new Date(year, month - 1, day, hours, minutes, 0);
        }
        
        return new Date();
    }

    apply() {
        const newDate = this.getInputDate();
        this.setDate(newDate);
        this.close();
    }

    /**
     * Définit une nouvelle date et met à jour la carte
     * @param {Date} date 
     */
    setDate(date) {
        this.currentDate = date;
        this.updateDisplay(date);
        if (this.onDateChange) {
            this.onDateChange(date);
        }
        
        if (window.povView && typeof window.povView.setDate === 'function') {
            window.povView.setDate(date);
        }
    }

    /**
     * Met à jour l'affichage de la date
     * @param {Date} date 
     */
    updateDisplay(date) {
        const triggerTime = document.getElementById('triggerTimeDisplay');
        if (triggerTime) {
            triggerTime.textContent = this.formatShortTime(date);
        }
        
        const datetimeElement = document.getElementById('datetime');
        if (datetimeElement && typeof Astronomy !== 'undefined') {
            datetimeElement.textContent = Astronomy.formatDateTime(date);
        }
    }

    getCurrentDate() {
        return this.currentDate;
    }
}

window.DateTimePicker = DateTimePicker;
let dateTimePicker = null;

/**
 * Initialise le sélecteur de date/heure
 */
function initDateTimePicker() {
    if (!dateTimePicker) {
        dateTimePicker = new DateTimePicker();
        window.dateTimePicker = dateTimePicker;
    }
    return dateTimePicker;
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initDateTimePicker();
    }, 500);
});
