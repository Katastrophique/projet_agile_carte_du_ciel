/**
 * ==========================================================================
 * Test Runner - Mini framework de tests pour l'application Carte du Ciel
 * ==========================================================================
 */

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    /**
     * Enregistre un test
     * @param {string} name - Nom du test
     * @param {Function} testFn - Fonction de test
     */
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    /**
     * Enregistre un groupe de tests
     * @param {string} suiteName - Nom de la suite
     * @param {Function} suiteSetup - Fonction de configuration de la suite
     */
    describe(suiteName, suiteSetup) {
        const originalTests = [...this.tests];
        this.currentSuite = suiteName;
        suiteSetup();
        this.currentSuite = null;
    }

    /**
     * Exécute tous les tests
     * @returns {Object} Résultats des tests
     */
    async runAll() {
        console.log('🧪 Démarrage des tests...\n');
        this.results = { passed: 0, failed: 0, total: 0 };

        for (const test of this.tests) {
            this.results.total++;
            try {
                await test.testFn();
                this.results.passed++;
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.results.failed++;
                console.error(`❌ ${test.name}`);
                console.error(`   Erreur: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`📊 Résultats: ${this.results.passed}/${this.results.total} tests réussis`);
        if (this.results.failed > 0) {
            console.log(`⚠️  ${this.results.failed} test(s) échoué(s)`);
        } else {
            console.log('🎉 Tous les tests sont passés !');
        }

        return this.results;
    }

    /**
     * Affiche les résultats dans le DOM
     */
    displayResults(containerId = 'testResults') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <h2>Résultats des tests</h2>
            <div class="test-summary">
                <span class="passed">✅ ${this.results.passed} réussis</span>
                <span class="failed">❌ ${this.results.failed} échoués</span>
                <span class="total">📊 Total: ${this.results.total}</span>
            </div>
        `;
    }
}

// Fonctions d'assertion
const assert = {
    /**
     * Vérifie qu'une valeur est vraie
     */
    isTrue(value, message = 'La valeur devrait être vraie') {
        if (value !== true) {
            throw new Error(`${message}. Reçu: ${value}`);
        }
    },

    /**
     * Vérifie qu'une valeur est fausse
     */
    isFalse(value, message = 'La valeur devrait être fausse') {
        if (value !== false) {
            throw new Error(`${message}. Reçu: ${value}`);
        }
    },

    /**
     * Vérifie l'égalité stricte
     */
    equals(actual, expected, message = 'Les valeurs devraient être égales') {
        if (actual !== expected) {
            throw new Error(`${message}. Attendu: ${expected}, Reçu: ${actual}`);
        }
    },

    /**
     * Vérifie l'égalité approximative (pour les flottants)
     */
    approximately(actual, expected, tolerance = 0.0001, message = 'Les valeurs devraient être approximativement égales') {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(`${message}. Attendu: ${expected} (±${tolerance}), Reçu: ${actual}`);
        }
    },

    /**
     * Vérifie qu'une valeur est dans un intervalle
     */
    inRange(value, min, max, message = 'La valeur devrait être dans l\'intervalle') {
        if (value < min || value > max) {
            throw new Error(`${message}. Attendu: [${min}, ${max}], Reçu: ${value}`);
        }
    },

    /**
     * Vérifie qu'une valeur est définie (non null/undefined)
     */
    isDefined(value, message = 'La valeur devrait être définie') {
        if (value === null || value === undefined) {
            throw new Error(`${message}. Reçu: ${value}`);
        }
    },

    /**
     * Vérifie qu'une valeur est null ou undefined
     */
    isNull(value, message = 'La valeur devrait être null ou undefined') {
        if (value !== null && value !== undefined) {
            throw new Error(`${message}. Reçu: ${value}`);
        }
    },

    /**
     * Vérifie qu'un tableau a une longueur spécifique
     */
    arrayLength(array, length, message = 'Le tableau devrait avoir la bonne longueur') {
        if (!Array.isArray(array)) {
            throw new Error(`${message}. Ce n'est pas un tableau`);
        }
        if (array.length !== length) {
            throw new Error(`${message}. Attendu: ${length}, Reçu: ${array.length}`);
        }
    },

    /**
     * Vérifie qu'un objet a une propriété
     */
    hasProperty(obj, prop, message = 'L\'objet devrait avoir la propriété') {
        if (!obj || !Object.prototype.hasOwnProperty.call(obj, prop)) {
            throw new Error(`${message}: ${prop}`);
        }
    },

    /**
     * Vérifie qu'une fonction lève une erreur
     */
    throws(fn, message = 'La fonction devrait lever une erreur') {
        let threw = false;
        try {
            fn();
        } catch (e) {
            threw = true;
        }
        if (!threw) {
            throw new Error(message);
        }
    }
};

// Export global pour utilisation dans le navigateur
window.TestRunner = TestRunner;
window.assert = assert;
