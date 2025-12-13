const integrationTests = (runner) => {
    
    runner.test('Intégration - parseCSV parse correctement le format CSV', () => {
        const csvContent = `id;proper;ra;dec;mag;ci;con
1;Sirius;6.752481;-16.716116;-1.46;0.009;CMa
2;Canopus;6.399195;-52.695889;-0.74;0.164;Car
3;Vega;18.615649;38.783692;0.03;0;Lyr`;
        
        const savedConfig = window.APP_CONFIG;
        window.APP_CONFIG = { magnitudeLimit: 6, csvSeparator: ';' };
        
        if (typeof parseCSV === 'function') {
            const stars = parseCSV(csvContent);
            assert.isTrue(stars.length >= 3, 'Devrait parser au moins 3 étoiles');
            
            const sirius = stars.find(s => s.name === 'Sirius');
            assert.isDefined(sirius, 'Sirius devrait être dans la liste');
            assert.approximately(sirius.ra, 6.752481, 0.0001);
            assert.approximately(sirius.dec, -16.716116, 0.0001);
            assert.approximately(sirius.mag, -1.46, 0.01);
        }
        
        if (savedConfig) window.APP_CONFIG = savedConfig;
    });
    
    runner.test('Intégration - parseCSV filtre par magnitude', () => {
        const csvContent = `id;proper;ra;dec;mag;ci;con
1;BrightStar;;6;30;1;0;Ori
2;DimStar;;12;45;7;0;Lyr`;
        
        const savedConfig = window.APP_CONFIG;
        window.APP_CONFIG = { magnitudeLimit: 6, csvSeparator: ';' };
        
        if (typeof parseCSV === 'function') {
            const stars = parseCSV(csvContent);
            const dimStar = stars.find(s => s.name === 'DimStar');
            assert.isNull(dimStar, 'DimStar (mag>6) ne devrait pas être incluse');
        }
        
        if (savedConfig) window.APP_CONFIG = savedConfig;
    });
    
    runner.test('Intégration - Flux complet: coordonnées équatoriales → horizontales → visibilité', () => {
        const date = new Date();
        
        const polarStar = { ra: 2.5, dec: 89, mag: 2 };
        
        const visible = Astronomy.calculateVisibleStars([polarStar], date);
        
        assert.isTrue(visible.length === 1, 'Étoile polaire devrait être visible');
        assert.isTrue(visible[0].altitude > 0, 'Altitude devrait être positive');
    });
    
    runner.test('Intégration - Étoile du pôle Sud non visible depuis Lyon', () => {
        const date = new Date();
        
        const southPolarStar = { ra: 12, dec: -89, mag: 2 };
        
        const visible = Astronomy.calculateVisibleStars([southPolarStar], date);
        
        assert.isTrue(visible.length === 0, 'Étoile du pôle Sud ne devrait pas être visible à Lyon');
    });
    
    runner.test('Intégration - Plusieurs étoiles filtrées correctement', () => {
        const date = new Date();
        
        const stars = [
            { ra: 0, dec: 89, mag: 2 },
            { ra: 6, dec: 60, mag: 1 },
            { ra: 12, dec: -89, mag: 2 },
            { ra: 18, dec: 0, mag: 0 },
        ];
        
        const visible = Astronomy.calculateVisibleStars(stars, date);
        
        assert.isTrue(visible.length >= 1, 'Au moins une étoile devrait être visible');
        const southStar = visible.find(s => s.dec === -89);
        assert.isNull(southStar, 'Étoile du pôle Sud ne devrait pas être visible');
    });
    
    runner.test('Intégration - Projection d\'étoile et vérification des bornes', () => {
        const camera = new Camera(800, 600);
        camera.azimuth = 180;
        camera.altitude = 45;
        camera.fov = 90;
        
        const proj = camera.project(180, 50);
        
        assert.isDefined(proj, 'La projection devrait être définie');
        assert.isTrue(proj.x >= 0 && proj.x <= 800, 'X dans les bornes');
        assert.isTrue(proj.y >= 0 && proj.y <= 600, 'Y dans les bornes');
    });
    
    runner.test('Intégration - Rotation caméra et mise à jour projection', () => {
        const camera = new Camera(800, 600);
        camera.azimuth = 180;
        camera.altitude = 45;
        
        const star = { azimut: 180, altitude: 45 };
        let proj = camera.project(star.azimut, star.altitude);
        assert.isDefined(proj, 'Étoile visible avant rotation');
        
        camera.rotate(180, 0);
        
        proj = camera.project(star.azimut, star.altitude);
        assert.isNull(proj, 'Étoile derrière après rotation de 180°');
    });
    
    runner.test('Intégration - Zoom modifie la taille des étoiles', () => {
        const magnitude = 2;
        
        const sizeZoom1 = Astronomy.calculateStarSize(magnitude, 1);
        const sizeZoom2 = Astronomy.calculateStarSize(magnitude, 2);
        const sizeZoom4 = Astronomy.calculateStarSize(magnitude, 4);
        
        assert.isTrue(sizeZoom2 > sizeZoom1, 'Zoom 2x devrait augmenter la taille');
        assert.isTrue(sizeZoom4 > sizeZoom2, 'Zoom 4x devrait être plus grand que 2x');
    });
    
    runner.test('Intégration - LST augmente avec le temps', () => {
        const date1 = new Date(2024, 5, 15, 12, 0, 0);
        const date2 = new Date(2024, 5, 15, 14, 0, 0);
        
        const lst1 = Astronomy.calculateLST(date1);
        const lst2 = Astronomy.calculateLST(date2);
        
        let diff = lst2 - lst1;
        if (diff < 0) diff += 360;
        
        assert.approximately(diff, 30.14, 1, 'LST devrait augmenter de ~30° en 2h');
    });
    
    runner.test('Intégration - Même étoile, positions différentes à différentes heures', () => {
        const star = { ra: 12, dec: 30, mag: 2 };
        
        const dateAM = new Date(2024, 5, 15, 3, 0, 0);
        const datePM = new Date(2024, 5, 15, 21, 0, 0);
        
        const visibleAM = Astronomy.calculateVisibleStars([star], dateAM);
        const visiblePM = Astronomy.calculateVisibleStars([star], datePM);
        
        if (visibleAM.length > 0 && visiblePM.length > 0) {
            assert.isTrue(
                Math.abs(visibleAM[0].azimut - visiblePM[0].azimut) > 10 ||
                Math.abs(visibleAM[0].altitude - visiblePM[0].altitude) > 10,
                'Positions devraient différer entre matin et soir'
            );
        }
    });
    
    runner.test('Intégration - Gestion des valeurs limites de coordonnées', () => {
        const date = new Date();
        
        const poleNord = Astronomy.equatorialToHorizontal(0, 90, 0, 45);
        assert.isDefined(poleNord);
        assert.isTrue(poleNord.altitude >= 0 && poleNord.altitude <= 90);
        
        const poleSud = Astronomy.equatorialToHorizontal(0, -90, 0, 45);
        assert.isDefined(poleSud);
        assert.isTrue(poleSud.altitude >= -90 && poleSud.altitude <= 0);
    });
    
    runner.test('Intégration - Caméra résiste aux valeurs extrêmes', () => {
        const camera = new Camera(800, 600);
        
        camera.rotate(10000, 0);
        assert.isTrue(camera.azimuth >= 0 && camera.azimuth < 360);
        
        camera.zoom(100);
        assert.equals(camera.fov, camera.maxFov);
        
        camera.zoom(0.001);
        assert.equals(camera.fov, camera.minFov);
    });
    
    runner.test('Intégration - État de la caméra sauvegardé et restauré correctement', () => {
        const camera = new Camera(800, 600);
        camera.azimuth = 123;
        camera.altitude = 67;
        camera.fov = 45;
        
        const state = camera.getState();
        
        camera.reset();
        
        camera.setState(state);
        
        assert.equals(camera.azimuth, 123);
        assert.equals(camera.altitude, 67);
        assert.equals(camera.fov, 45);
    });
    
    runner.test('Intégration - Configuration observateur Lyon cohérente', () => {
        assert.isDefined(Astronomy.OBSERVER_CONFIG);
        assert.isDefined(Astronomy.OBSERVER_CONFIG.latitude);
        assert.isDefined(Astronomy.OBSERVER_CONFIG.longitude);
        
        assert.approximately(Astronomy.OBSERVER_CONFIG.latitude, 45.76, 0.1);
        assert.approximately(Astronomy.OBSERVER_CONFIG.longitude, 4.83, 0.1);
    });
    
    runner.test('Intégration - Pipeline rendu: étoiles visibles ont toutes altitude > 0', () => {
        const date = new Date();
        const stars = [
            { ra: 0, dec: 89, mag: 1 },
            { ra: 6, dec: 45, mag: 2 },
            { ra: 12, dec: 0, mag: 3 },
            { ra: 18, dec: -45, mag: 4 },
        ];
        
        const visible = Astronomy.calculateVisibleStars(stars, date);
        
        for (const star of visible) {
            assert.isTrue(star.altitude > 0, 
                `Étoile visible devrait avoir altitude > 0, reçu: ${star.altitude}`);
        }
    });
    
    runner.test('Intégration - Pipeline rendu: tri par magnitude préserve toutes les étoiles', () => {
        const date = new Date();
        const stars = [
            { ra: 0, dec: 89, mag: 1 },
            { ra: 1, dec: 88, mag: 2 },
            { ra: 2, dec: 87, mag: 0 },
        ];
        
        const visible = Astronomy.calculateVisibleStars(stars, date);
        
        visible.sort((a, b) => b.mag - a.mag);
        
        assert.equals(visible.length, stars.length);
        
        for (let i = 1; i < visible.length; i++) {
            assert.isTrue(visible[i-1].mag >= visible[i].mag, 
                'Tri décroissant par magnitude');
        }
    });
};

window.integrationTests = integrationTests;
