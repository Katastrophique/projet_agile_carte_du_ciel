class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    describe(suiteName, suiteSetup) {
        const originalTests = [...this.tests];
        this.currentSuite = suiteName;
        suiteSetup();
        this.currentSuite = null;
    }

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

const assert = {
    isTrue(value, message = 'La valeur devrait être vraie') {
        if (value !== true) {
            throw new Error(`${message}. Reçu: ${value}`);
        }
    },

    isFalse(value, message = 'La valeur devrait être fausse') {
        if (value !== false) {
            throw new Error(`${message}. Reçu: ${value}`);
        }
    },

    equals(actual, expected, message = 'Les valeurs devraient être égales') {
        if (actual !== expected) {
            throw new Error(`${message}. Attendu: ${expected}, Reçu: ${actual}`);
        }
    },

    approximately(actual, expected, tolerance = 0.0001, message = 'Les valeurs devraient être approximativement égales') {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(`${message}. Attendu: ${expected} (±${tolerance}), Reçu: ${actual}`);
        }
    },

    inRange(value, min, max, message = 'La valeur devrait être dans l\'intervalle') {
        if (value < min || value > max) {
            throw new Error(`${message}. Attendu: [${min}, ${max}], Reçu: ${value}`);
        }
    },

    isDefined(value, message = 'La valeur devrait être définie') {
        if (value === null || value === undefined) {
            throw new Error(`${message}. Reçu: ${value}`);
        }
    },

    isNull(value, message = 'La valeur devrait être null ou undefined') {
        if (value !== null && value !== undefined) {
            throw new Error(`${message}. Reçu: ${value}`);
        }
    },

    arrayLength(array, length, message = 'Le tableau devrait avoir la bonne longueur') {
        if (!Array.isArray(array)) {
            throw new Error(`${message}. Ce n'est pas un tableau`);
        }
        if (array.length !== length) {
            throw new Error(`${message}. Attendu: ${length}, Reçu: ${array.length}`);
        }
    },

    hasProperty(obj, prop, message = 'L\'objet devrait avoir la propriété') {
        if (!obj || !Object.prototype.hasOwnProperty.call(obj, prop)) {
            throw new Error(`${message}: ${prop}`);
        }
    },

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

window.TestRunner = TestRunner;
window.assert = assert;
