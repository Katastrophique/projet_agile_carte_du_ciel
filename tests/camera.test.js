/**
 * ==========================================================================
 * Tests Unitaires - Module Camera.js
 * ==========================================================================
 * 
 * Tests pour valider le système de caméra POV
 */

const cameraTests = (runner) => {
    
    // Créer une instance de caméra pour les tests
    let camera;
    
    // ========================================================================
    // Tests d'initialisation
    // ========================================================================
    
    runner.test('Camera - constructeur initialise les dimensions', () => {
        camera = new Camera(800, 600);
        assert.equals(camera.width, 800);
        assert.equals(camera.height, 600);
    });
    
    runner.test('Camera - constructeur initialise les valeurs par défaut', () => {
        camera = new Camera(800, 600);
        assert.equals(camera.azimuth, 180, 'Azimut par défaut = 180° (Sud)');
        assert.equals(camera.fov, 90, 'FOV par défaut = 90°');
    });
    
    runner.test('Camera - détecte correctement le mode portrait', () => {
        const cameraPortrait = new Camera(400, 800);
        // En portrait, l'altitude par défaut devrait être plus élevée
        assert.equals(cameraPortrait.altitude, 50);
        
        const cameraLandscape = new Camera(800, 400);
        assert.equals(cameraLandscape.altitude, 30);
    });
    
    // ========================================================================
    // Tests de updateDimensions
    // ========================================================================
    
    runner.test('Camera - updateDimensions met à jour les dimensions', () => {
        camera = new Camera(800, 600);
        camera.updateDimensions(1920, 1080);
        assert.equals(camera.width, 1920);
        assert.equals(camera.height, 1080);
    });
    
    // ========================================================================
    // Tests de projection
    // ========================================================================
    
    runner.test('Camera - project retourne null pour étoile derrière la caméra', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 0; // Regarde vers le Nord
        // Étoile au Sud (azimut 180°) - derrière la caméra
        const result = camera.project(180, 45);
        assert.isNull(result, 'Étoile derrière devrait retourner null');
    });
    
    runner.test('Camera - project retourne coordonnées pour étoile visible', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 180; // Regarde vers le Sud
        camera.altitude = 45;
        // Étoile au Sud, haute dans le ciel
        const result = camera.project(180, 45);
        assert.isDefined(result, 'Étoile visible devrait retourner des coordonnées');
        assert.hasProperty(result, 'x');
        assert.hasProperty(result, 'y');
        assert.hasProperty(result, 'visible');
    });
    
    runner.test('Camera - project - étoile au centre de la vue', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 180;
        camera.altitude = 45;
        // Étoile exactement dans la direction de vue
        const result = camera.project(180, 45);
        assert.isDefined(result);
        // Devrait être proche du centre de l'écran
        assert.approximately(result.x, 400, 50, 'X devrait être proche du centre');
        assert.approximately(result.y, 300, 50, 'Y devrait être proche du centre');
    });
    
    runner.test('Camera - project - distanceFromCenter pour étoile centrée', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 180;
        camera.altitude = 45;
        const result = camera.project(180, 45);
        assert.isDefined(result);
        assert.approximately(result.distanceFromCenter, 0, 0.1, 
            'Distance du centre devrait être ~0 pour étoile centrée');
    });
    
    // ========================================================================
    // Tests de getVerticalFov
    // ========================================================================
    
    runner.test('Camera - getVerticalFov avec aspect ratio 16:9', () => {
        camera = new Camera(1600, 900);
        camera.fov = 90;
        const vFov = camera.getVerticalFov();
        // Avec ratio 16:9, le FOV vertical devrait être ~50.6°
        assert.approximately(vFov, 50.625, 0.1);
    });
    
    runner.test('Camera - getVerticalFov avec aspect ratio 4:3', () => {
        camera = new Camera(800, 600);
        camera.fov = 90;
        const vFov = camera.getVerticalFov();
        // Avec ratio 4:3, le FOV vertical devrait être 67.5°
        assert.approximately(vFov, 67.5, 0.1);
    });
    
    // ========================================================================
    // Tests de rotation
    // ========================================================================
    
    runner.test('Camera - rotate modifie l\'azimut', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 180;
        camera.rotate(45, 0);
        assert.approximately(camera.azimuth, 225, 0.001);
    });
    
    runner.test('Camera - rotate normalise l\'azimut', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 350;
        camera.rotate(20, 0);
        // 350 + 20 = 370 → normalisé à 10
        assert.approximately(camera.azimuth, 10, 0.001);
    });
    
    runner.test('Camera - rotate modifie l\'altitude', () => {
        camera = new Camera(800, 600);
        camera.altitude = 30;
        camera.rotate(0, 15);
        assert.equals(camera.altitude, 45);
    });
    
    runner.test('Camera - rotate respecte les limites d\'altitude', () => {
        camera = new Camera(800, 600);
        camera.altitude = 85;
        camera.rotate(0, 20); // Essayer de dépasser 90°
        assert.equals(camera.altitude, camera.maxAltitude);
        
        camera.altitude = 0;
        camera.rotate(0, -20); // Essayer de descendre sous le minimum
        assert.equals(camera.altitude, camera.minAltitude);
    });
    
    // ========================================================================
    // Tests de zoom
    // ========================================================================
    
    runner.test('Camera - zoom diminue le FOV (zoom in)', () => {
        camera = new Camera(800, 600);
        camera.fov = 90;
        camera.zoom(0.5); // Zoom in
        assert.equals(camera.fov, 45);
    });
    
    runner.test('Camera - zoom augmente le FOV (zoom out)', () => {
        camera = new Camera(800, 600);
        camera.fov = 90;
        camera.zoom(1.5); // Zoom out
        assert.equals(camera.fov, 135);
    });
    
    runner.test('Camera - zoom respecte le FOV minimum', () => {
        camera = new Camera(800, 600);
        camera.fov = 25;
        camera.zoom(0.5);
        assert.equals(camera.fov, camera.minFov);
    });
    
    runner.test('Camera - zoom respecte le FOV maximum', () => {
        camera = new Camera(800, 600);
        camera.fov = 130;
        camera.zoom(1.5);
        assert.equals(camera.fov, camera.maxFov);
    });
    
    runner.test('Camera - setFov définit directement le FOV', () => {
        camera = new Camera(800, 600);
        camera.setFov(60);
        assert.equals(camera.fov, 60);
    });
    
    // ========================================================================
    // Tests de reset
    // ========================================================================
    
    runner.test('Camera - reset restaure les valeurs par défaut', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 45;
        camera.altitude = 70;
        camera.fov = 30;
        
        camera.reset();
        
        assert.equals(camera.azimuth, camera.defaultAzimuth);
        assert.equals(camera.altitude, camera.defaultAltitude);
        assert.equals(camera.fov, camera.defaultFov);
    });
    
    // ========================================================================
    // Tests de getDirectionName
    // ========================================================================
    
    runner.test('Camera - getDirectionName retourne Nord', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 0;
        assert.equals(camera.getDirectionName(), 'Nord');
        
        camera.azimuth = 359;
        assert.equals(camera.getDirectionName(), 'Nord');
    });
    
    runner.test('Camera - getDirectionName retourne Sud', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 180;
        assert.equals(camera.getDirectionName(), 'Sud');
    });
    
    runner.test('Camera - getDirectionName retourne Est', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 90;
        assert.equals(camera.getDirectionName(), 'Est');
    });
    
    runner.test('Camera - getDirectionName retourne Ouest', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 270;
        assert.equals(camera.getDirectionName(), 'Ouest');
    });
    
    runner.test('Camera - getDirectionName retourne directions intermédiaires', () => {
        camera = new Camera(800, 600);
        
        camera.azimuth = 45;
        assert.equals(camera.getDirectionName(), 'Nord-Est');
        
        camera.azimuth = 135;
        assert.equals(camera.getDirectionName(), 'Sud-Est');
        
        camera.azimuth = 225;
        assert.equals(camera.getDirectionName(), 'Sud-Ouest');
        
        camera.azimuth = 315;
        assert.equals(camera.getDirectionName(), 'Nord-Ouest');
    });
    
    // ========================================================================
    // Tests de getDirectionDescription
    // ========================================================================
    
    runner.test('Camera - getDirectionDescription inclut direction et altitude', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 180;
        camera.altitude = 45;
        const desc = camera.getDirectionDescription();
        assert.isTrue(desc.includes('Sud'), 'Devrait inclure la direction');
        assert.isTrue(desc.includes('45'), 'Devrait inclure l\'altitude');
    });
    
    // ========================================================================
    // Tests de getZoomLevel
    // ========================================================================
    
    runner.test('Camera - getZoomLevel retourne 1.0 au FOV par défaut', () => {
        camera = new Camera(800, 600);
        const zoom = camera.getZoomLevel();
        assert.approximately(zoom, 1.0, 0.01);
    });
    
    runner.test('Camera - getZoomLevel > 1 quand FOV < défaut', () => {
        camera = new Camera(800, 600);
        camera.fov = 45;
        const zoom = camera.getZoomLevel();
        assert.equals(zoom, 2.0);
    });
    
    runner.test('Camera - getZoomLevel < 1 quand FOV > défaut', () => {
        camera = new Camera(800, 600);
        camera.fov = 180;
        const zoom = camera.getZoomLevel();
        assert.equals(zoom, 0.5);
    });
    
    // ========================================================================
    // Tests de l'horizon
    // ========================================================================
    
    runner.test('Camera - isHorizonVisible quand on regarde vers le bas', () => {
        camera = new Camera(800, 600);
        camera.altitude = 10; // Regarde proche de l'horizon
        camera.fov = 90;
        assert.isTrue(camera.isHorizonVisible());
    });
    
    runner.test('Camera - isHorizonVisible = false quand on regarde le zénith', () => {
        camera = new Camera(800, 600);
        camera.altitude = 90; // Regarde tout droit vers le haut
        camera.fov = 60;
        assert.isFalse(camera.isHorizonVisible());
    });
    
    runner.test('Camera - getHorizonY retourne valeur quand horizon visible', () => {
        camera = new Camera(800, 600);
        camera.altitude = 20;
        camera.fov = 90;
        const horizonY = camera.getHorizonY();
        assert.isDefined(horizonY);
        assert.isTrue(horizonY >= 0 && horizonY <= camera.height);
    });
    
    // ========================================================================
    // Tests de getState / setState
    // ========================================================================
    
    runner.test('Camera - getState retourne l\'état actuel', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 45;
        camera.altitude = 60;
        camera.fov = 75;
        
        const state = camera.getState();
        
        assert.equals(state.azimuth, 45);
        assert.equals(state.altitude, 60);
        assert.equals(state.fov, 75);
    });
    
    runner.test('Camera - setState restaure un état', () => {
        camera = new Camera(800, 600);
        const savedState = { azimuth: 270, altitude: 55, fov: 60 };
        
        camera.setState(savedState);
        
        assert.equals(camera.azimuth, 270);
        assert.equals(camera.altitude, 55);
        assert.equals(camera.fov, 60);
    });
    
    runner.test('Camera - projectCardinalPoint projette les points cardinaux', () => {
        camera = new Camera(800, 600);
        camera.azimuth = 0; // Regarde vers le Nord
        camera.altitude = 10;
        
        const northPoint = camera.projectCardinalPoint(0);
        // Le Nord devrait être visible et proche du centre horizontal
        assert.isDefined(northPoint);
    });
};

// Export pour utilisation dans le navigateur
window.cameraTests = cameraTests;
