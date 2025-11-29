/**
 * ==========================================================================
 * Tests Unitaires - Module Astronomy.js
 * ==========================================================================
 * 
 * Tests pour valider les calculs astronomiques
 */

const astronomyTests = (runner) => {
    
    // ========================================================================
    // Tests des fonctions de conversion d'angles
    // ========================================================================
    
    runner.test('degreesToRadians - convertit correctement 0°', () => {
        const result = Astronomy.degreesToRadians(0);
        assert.equals(result, 0);
    });
    
    runner.test('degreesToRadians - convertit correctement 180°', () => {
        const result = Astronomy.degreesToRadians(180);
        assert.approximately(result, Math.PI, 0.0001);
    });
    
    runner.test('degreesToRadians - convertit correctement 90°', () => {
        const result = Astronomy.degreesToRadians(90);
        assert.approximately(result, Math.PI / 2, 0.0001);
    });
    
    runner.test('degreesToRadians - convertit correctement 360°', () => {
        const result = Astronomy.degreesToRadians(360);
        assert.approximately(result, 2 * Math.PI, 0.0001);
    });
    
    runner.test('radiansToDegrees - convertit correctement 0 rad', () => {
        const result = Astronomy.radiansToDegrees(0);
        assert.equals(result, 0);
    });
    
    runner.test('radiansToDegrees - convertit correctement π rad', () => {
        const result = Astronomy.radiansToDegrees(Math.PI);
        assert.approximately(result, 180, 0.0001);
    });
    
    runner.test('radiansToDegrees - convertit correctement π/2 rad', () => {
        const result = Astronomy.radiansToDegrees(Math.PI / 2);
        assert.approximately(result, 90, 0.0001);
    });
    
    runner.test('Conversion aller-retour degrés → radians → degrés', () => {
        const original = 45;
        const radians = Astronomy.degreesToRadians(original);
        const back = Astronomy.radiansToDegrees(radians);
        assert.approximately(back, original, 0.0001);
    });
    
    // ========================================================================
    // Tests de normalizeAngle
    // ========================================================================
    
    runner.test('normalizeAngle - angle déjà normalisé (0-360)', () => {
        assert.equals(Astronomy.normalizeAngle(45), 45);
        assert.equals(Astronomy.normalizeAngle(180), 180);
        assert.equals(Astronomy.normalizeAngle(0), 0);
    });
    
    runner.test('normalizeAngle - angle négatif', () => {
        assert.approximately(Astronomy.normalizeAngle(-45), 315, 0.0001);
        assert.approximately(Astronomy.normalizeAngle(-90), 270, 0.0001);
        assert.approximately(Astronomy.normalizeAngle(-180), 180, 0.0001);
    });
    
    runner.test('normalizeAngle - angle supérieur à 360', () => {
        assert.approximately(Astronomy.normalizeAngle(400), 40, 0.0001);
        assert.approximately(Astronomy.normalizeAngle(720), 0, 0.0001);
        assert.approximately(Astronomy.normalizeAngle(450), 90, 0.0001);
    });
    
    runner.test('normalizeAngle - angle très grand', () => {
        const result = Astronomy.normalizeAngle(1000);
        assert.isTrue(result >= 0 && result < 360, 'Le résultat devrait être entre 0 et 360');
    });
    
    // ========================================================================
    // Tests de dateToJulianDay
    // ========================================================================
    
    runner.test('dateToJulianDay - J2000.0 (1er janvier 2000 à 12h TT)', () => {
        // J2000.0 correspond au Jour Julien 2451545.0
        const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
        const jd = Astronomy.dateToJulianDay(j2000);
        assert.approximately(jd, 2451545.0, 0.01);
    });
    
    runner.test('dateToJulianDay - date connue (1er janvier 2020)', () => {
        // Le 1er janvier 2020 à 0h UTC ≈ JD 2458849.5
        const date = new Date(Date.UTC(2020, 0, 1, 0, 0, 0));
        const jd = Astronomy.dateToJulianDay(date);
        assert.approximately(jd, 2458849.5, 0.01);
    });
    
    runner.test('dateToJulianDay - augmentation d\'un jour', () => {
        const date1 = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
        const date2 = new Date(Date.UTC(2024, 5, 16, 12, 0, 0));
        const jd1 = Astronomy.dateToJulianDay(date1);
        const jd2 = Astronomy.dateToJulianDay(date2);
        assert.approximately(jd2 - jd1, 1.0, 0.001, 'Une différence d\'un jour devrait donner JD +1');
    });
    
    // ========================================================================
    // Tests de calculateGST
    // ========================================================================
    
    runner.test('calculateGST - retourne une valeur entre 0 et 360', () => {
        const date = new Date();
        const gst = Astronomy.calculateGST(date);
        assert.isTrue(gst >= 0 && gst < 360, 'GST devrait être entre 0 et 360');
    });
    
    runner.test('calculateGST - varie avec le temps', () => {
        const date1 = new Date(Date.UTC(2024, 5, 15, 0, 0, 0));
        const date2 = new Date(Date.UTC(2024, 5, 15, 6, 0, 0));
        const gst1 = Astronomy.calculateGST(date1);
        const gst2 = Astronomy.calculateGST(date2);
        // En 6 heures, le GST devrait changer d'environ 90° (6h × 15°/h)
        assert.isTrue(gst1 !== gst2, 'GST devrait varier avec le temps');
    });
    
    // ========================================================================
    // Tests de calculateLST
    // ========================================================================
    
    runner.test('calculateLST - retourne une valeur entre 0 et 360', () => {
        const date = new Date();
        const lst = Astronomy.calculateLST(date);
        assert.isTrue(lst >= 0 && lst < 360, 'LST devrait être entre 0 et 360');
    });
    
    runner.test('calculateLST - diffère du GST par la longitude', () => {
        const date = new Date();
        const gst = Astronomy.calculateGST(date);
        const lst = Astronomy.calculateLST(date, 0); // Longitude 0 (Greenwich)
        // À Greenwich, LST = GST
        assert.approximately(lst, gst, 0.01, 'À Greenwich, LST devrait égaler GST');
    });
    
    runner.test('calculateLST - longitude Est augmente LST', () => {
        const date = new Date();
        const lstGreenwich = Astronomy.calculateLST(date, 0);
        const lstEst = Astronomy.calculateLST(date, 15); // 15° Est
        // LST Est devrait être > LST Greenwich (modulo 360)
        const diff = Astronomy.normalizeAngle(lstEst - lstGreenwich);
        assert.approximately(diff, 15, 0.01);
    });
    
    // ========================================================================
    // Tests de equatorialToHorizontal
    // ========================================================================
    
    runner.test('equatorialToHorizontal - retourne altitude et azimut', () => {
        const result = Astronomy.equatorialToHorizontal(0, 45, 0, 45);
        assert.hasProperty(result, 'altitude');
        assert.hasProperty(result, 'azimut');
    });
    
    runner.test('equatorialToHorizontal - altitude entre -90 et 90', () => {
        const result = Astronomy.equatorialToHorizontal(180, 30, 180, 45);
        assert.isTrue(result.altitude >= -90 && result.altitude <= 90, 
            'Altitude devrait être entre -90 et 90');
    });
    
    runner.test('equatorialToHorizontal - azimut entre 0 et 360', () => {
        const result = Astronomy.equatorialToHorizontal(180, 30, 180, 45);
        assert.isTrue(result.azimut >= 0 && result.azimut < 360, 
            'Azimut devrait être entre 0 et 360');
    });
    
    runner.test('equatorialToHorizontal - étoile au méridien sud', () => {
        // Quand LST = RA, l'étoile est sur le méridien
        const ra = 180; // 12h en degrés
        const dec = 0;
        const lst = 180;
        const lat = 45;
        const result = Astronomy.equatorialToHorizontal(ra, dec, lst, lat);
        // L'azimut devrait être proche de 180° (Sud)
        assert.approximately(result.azimut, 180, 5);
    });
    
    runner.test('equatorialToHorizontal - étoile polaire au nord (latitude positive)', () => {
        // Polaris : RA ≈ 2h 30m, Dec ≈ +89°
        const ra = 2.5 * 15; // Convertir heures en degrés
        const dec = 89;
        const lst = 0;
        const lat = 45;
        const result = Astronomy.equatorialToHorizontal(ra, dec, lst, lat);
        // L'altitude devrait être proche de la latitude (car c'est une étoile polaire)
        assert.approximately(result.altitude, lat, 3, 'Altitude de Polaris ≈ latitude');
        // L'azimut devrait être proche du Nord (0° ou 360°)
        const azNormalized = result.azimut < 180 ? result.azimut : 360 - result.azimut;
        assert.isTrue(azNormalized < 10 || azNormalized > 350, 'Polaris devrait être au Nord');
    });
    
    // ========================================================================
    // Tests de isStarVisible
    // ========================================================================
    
    runner.test('isStarVisible - altitude positive = visible', () => {
        assert.isTrue(Astronomy.isStarVisible(45));
        assert.isTrue(Astronomy.isStarVisible(1));
        assert.isTrue(Astronomy.isStarVisible(90));
    });
    
    runner.test('isStarVisible - altitude négative = non visible', () => {
        assert.isFalse(Astronomy.isStarVisible(-1));
        assert.isFalse(Astronomy.isStarVisible(-45));
    });
    
    runner.test('isStarVisible - altitude zéro = non visible (à l\'horizon)', () => {
        assert.isFalse(Astronomy.isStarVisible(0));
    });
    
    // ========================================================================
    // Tests de calculateVisibleStars
    // ========================================================================
    
    runner.test('calculateVisibleStars - filtre les étoiles sous l\'horizon', () => {
        const stars = [
            { ra: 0, dec: 89, mag: 2 },   // Près du pôle Nord - toujours visible en France
            { ra: 12, dec: -89, mag: 2 }  // Près du pôle Sud - jamais visible en France
        ];
        const date = new Date();
        const visible = Astronomy.calculateVisibleStars(stars, date);
        // Au moins l'étoile circumpolaire devrait être visible
        assert.isTrue(visible.length >= 1, 'Au moins une étoile devrait être visible');
    });
    
    runner.test('calculateVisibleStars - ajoute altitude et azimut aux résultats', () => {
        const stars = [
            { ra: 0, dec: 89, mag: 2 }  // Étoile circumpolaire
        ];
        const date = new Date();
        const visible = Astronomy.calculateVisibleStars(stars, date);
        if (visible.length > 0) {
            assert.hasProperty(visible[0], 'altitude');
            assert.hasProperty(visible[0], 'azimut');
        }
    });
    
    // ========================================================================
    // Tests de calculateStarSize
    // ========================================================================
    
    runner.test('calculateStarSize - étoiles brillantes plus grandes', () => {
        const sizeBright = Astronomy.calculateStarSize(-1, 1); // Sirius
        const sizeDim = Astronomy.calculateStarSize(5, 1);      // Étoile faible
        assert.isTrue(sizeBright > sizeDim, 'Étoile brillante devrait être plus grande');
    });
    
    runner.test('calculateStarSize - zoom augmente la taille', () => {
        const sizeNoZoom = Astronomy.calculateStarSize(2, 1);
        const sizeZoom = Astronomy.calculateStarSize(2, 4);
        assert.isTrue(sizeZoom > sizeNoZoom, 'Zoom devrait augmenter la taille');
    });
    
    runner.test('calculateStarSize - retourne une taille positive', () => {
        const size = Astronomy.calculateStarSize(3, 1);
        assert.isTrue(size > 0, 'La taille devrait être positive');
    });
    
    runner.test('calculateStarSize - taille dans les limites', () => {
        const sizeBright = Astronomy.calculateStarSize(-2, 1);
        const sizeDim = Astronomy.calculateStarSize(6, 1);
        assert.isTrue(sizeBright <= 8, 'Taille max = 8');
        assert.isTrue(sizeDim >= 0.5, 'Taille min = 0.5');
    });
    
    // ========================================================================
    // Tests de formatDateTime
    // ========================================================================
    
    runner.test('formatDateTime - retourne une chaîne non vide', () => {
        const date = new Date();
        const formatted = Astronomy.formatDateTime(date);
        assert.isTrue(formatted.length > 0, 'Le format devrait être non vide');
    });
    
    runner.test('formatDateTime - contient la date', () => {
        const date = new Date(2024, 5, 15);
        const formatted = Astronomy.formatDateTime(date);
        assert.isTrue(formatted.includes('2024'), 'Devrait contenir l\'année');
    });
    
    // ========================================================================
    // Tests de getStarColor
    // ========================================================================
    
    runner.test('getStarColor - retourne une couleur valide', () => {
        const color = Astronomy.getStarColor(0);
        assert.isTrue(color.startsWith('#'), 'Devrait être un code couleur hex');
    });
    
    runner.test('getStarColor - fonctionne avec différents indices', () => {
        const color1 = Astronomy.getStarColor(-0.3); // Étoile bleue
        const color2 = Astronomy.getStarColor(1.5);  // Étoile rouge
        assert.isDefined(color1);
        assert.isDefined(color2);
    });
};

// Export pour utilisation dans le navigateur
window.astronomyTests = astronomyTests;
