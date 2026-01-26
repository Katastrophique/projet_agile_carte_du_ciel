# Documentation Architecture et Données

## Table des matières

1. [Architecture Logicielle](#architecture-logicielle)
2. [Structure des Données](#structure-des-données)
3. [Bonnes Pratiques](#bonnes-pratiques)

---

## Architecture Logicielle

### Vue d'ensemble

L'application **Carte du Ciel** est une application web interactive permettant de visualiser le ciel étoilé en temps réel. Elle est construite en JavaScript vanilla (sans framework) et utilise HTML5 Canvas pour le rendu graphique.

### Architecture générale

L'application suit une architecture modulaire organisée en plusieurs couches :

```
┌─────────────────────────────────────────┐
│         index.html (Point d'entrée)     │
│         - Sélecteur de mode             │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌─────────▼────────┐
│  Vue POV       │    │  Vue Télescope   │
│  (Immersive)   │    │  (Classique)      │
└───────┬────────┘    └─────────┬────────┘
        │                       │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │   Modules Partagés     │
        │  - Astronomy           │
        │  - DataLoader          │
        │  - Constellations      │
        │  - Planets             │
        └───────────────────────┘
```

### Composants principaux

#### 1. **Point d'entrée (`index.html`)**

**Rôle** : Point d'entrée de l'application qui permet de basculer entre les deux modes de visualisation.

**Fonctionnalités** :
- Affichage d'un sélecteur de mode (actuellement désactivé, seul le mode POV est actif)
- Gestion des iframes pour chaque vue
- Interface utilisateur commune (barre supérieure)

**Fichier** : `index.html`

---

#### 2. **Vue POV (Point of View) - Mode Immersif**

**Rôle** : Vue immersive simulant l'observation du ciel comme si l'utilisateur levait la tête vers le ciel.

**Composants** :

- **`POVView`** (`src/views/pov-view.js`)
  - Classe principale gérant la logique de la vue POV
  - Coordonne le chargement des données, le calcul des positions et le rendu
  - Gère les interactions avec les filtres et la date/heure

- **`Camera`** (`src/views/pov/camera.js`)
  - Gère la projection 3D perspective
  - Contrôle l'orientation (azimut, altitude) et le zoom (FOV)
  - Projette les coordonnées horizontales vers les coordonnées écran

- **`CanvasController`** (`src/views/pov/canvas-controller.js`)
  - Gère les interactions utilisateur (souris, tactile)
  - Contrôle le rendu sur le canvas
  - Dessine les étoiles, planètes, constellations, horizon, points cardinaux

- **`app.js`** (`src/views/pov/app.js`)
  - Point d'entrée de la vue POV
  - Initialise l'application et configure les modules

**Fichiers** :
- `src/views/pov/index.html`
- `src/views/pov/app.js`
- `src/views/pov-view.js`
- `src/views/pov/camera.js`
- `src/views/pov/canvas-controller.js`
- `src/views/pov/styles.css`

---

#### 3. **Vue Télescope - Mode Classique**

**Rôle** : Vue avec projection azimutale équidistante (zénith au centre, horizon sur le bord).

**Composants** :

- **`TelescopeView`** (`src/views/telescope-view.js`)
  - Classe principale pour la vue télescope
  - Utilise une projection azimutale différente de la vue POV

**Fichiers** :
- `src/views/telescope-view.js`
- `src/views/telescope/index.html` (si existe)

---

#### 4. **Modules Partagés (`src/shared/` et `src/core/`)**

##### **Astronomy** (`src/shared/astronomy.js`)

**Rôle** : Calculs astronomiques fondamentaux.

**Fonctionnalités principales** :
- Calcul du temps sidéral local (LST)
- Conversion coordonnées équatoriales → horizontales
- Calcul des étoiles visibles
- Calcul de la taille des étoiles selon leur magnitude
- Gestion de la position de l'observateur

**Fonctions clés** :
- `calculateLST(date, longitude)` : Calcule le temps sidéral local
- `equatorialToHorizontal(ra, dec, lst, latitude)` : Conversion équatoriale → horizontale
- `calculateVisibleStars(stars, date)` : Filtre les étoiles visibles au-dessus de l'horizon
- `calculateStarSize(magnitude, zoomLevel)` : Calcule la taille d'affichage d'une étoile

**Configuration** :
```javascript
OBSERVER_CONFIG = {
    latitude: 45.757814,    // Lyon, France
    longitude: 4.832011,
    locationName: "Lyon, France"
}
```

---

##### **DataLoader** (`src/core/data-loader.js`)

**Rôle** : Chargement et parsing des données stellaires depuis le fichier CSV.

**Fonctionnalités** :
- Chargement asynchrone du fichier CSV via `fetch`
- Parsing du CSV avec séparateur personnalisable
- Filtrage par magnitude (par défaut : magnitude < 6)
- Extraction des colonnes pertinentes

**Fonctions principales** :
- `loadStarData(csvPath, onProgress)` : Charge le fichier CSV
- `parseCSV(csvText, magnitudeLimit, separator)` : Parse le contenu CSV

**Configuration** :
```javascript
DATA_CONFIG = {
    csvPath: '../shared/hygdata_v40.csv',
    magnitudeLimit: 6,      // Seules les étoiles de magnitude < 6 sont chargées
    csvSeparator: ';'
}
```

---

##### **Constellations** (`src/shared/constellations.js`)

**Rôle** : Gestion des constellations et de leurs connexions.

**Fonctionnalités** :
- Regroupement des étoiles par constellation
- Calcul des connexions entre étoiles d'une constellation
- Génération de couleurs uniques par constellation
- Préparation des données pour le rendu

**Fonctions principales** :
- `groupStarsByConstellation(stars)` : Regroupe les étoiles par constellation
- `calculateConstellationConnections(stars, maxDistance)` : Calcule les lignes de connexion
- `prepareConstellationsForRendering(visibleStars)` : Prépare les données pour le rendu
- `getConstellationColor(constellationName)` : Génère une couleur unique

---

##### **Planets** (`src/shared/planets.js`)

**Rôle** : Calcul des positions des planètes du système solaire.

**Fonctionnalités** :
- Calcul des positions héliocentriques puis géocentriques
- Conversion en coordonnées équatoriales puis horizontales
- Estimation de la magnitude apparente
- Support de 7 planètes : Mercure, Vénus, Mars, Jupiter, Saturne, Uranus, Neptune

**Fonctions principales** :
- `calculatePlanetPosition(planet, date)` : Calcule la position d'une planète
- `calculateVisiblePlanets(date, latitude, longitude)` : Liste les planètes visibles

---

##### **StarHover** (`src/core/star-hover.js`)

**Rôle** : Gestion du survol et de l'affichage des informations sur les étoiles.

**Fonctionnalités** :
- Détection de l'étoile sous le curseur
- Affichage d'un popup avec les informations de l'étoile
- Formatage des noms d'étoiles (nom propre, Bayer, HIP, HD)
- Traduction des abréviations de constellations en noms complets
- Formatage des coordonnées célestes (RA/Dec)

**Fonctions principales** :
- `findStarAtPosition(x, y, projectedStars, threshold)` : Trouve l'étoile la plus proche
- `showStarPopup(star, x, y)` : Affiche le popup d'information
- `getStarDisplayName(star)` : Obtient le nom d'affichage d'une étoile
- `getConstellationFullName(conAbbr)` : Traduit l'abréviation en nom complet

---

##### **UI Utils** (`src/core/ui-utils.js`)

**Rôle** : Utilitaires pour la gestion de l'interface utilisateur.

**Fonctionnalités** :
- Gestion de l'overlay de chargement
- Affichage des messages d'erreur
- Mise à jour des compteurs d'étoiles
- Mise à jour de l'affichage de la date/heure

---

#### 5. **Composants UI (`src/ui/`)**

##### **Menu Filtre** (`src/ui/menu_filtre.js`)

**Rôle** : Gestion des filtres pour mettre en surbrillance des étoiles selon différents critères.

**Filtres disponibles** :
- **Top 50 Plus Proches** : Les 50 étoiles les plus proches (distance minimale)
- **Top 50 Plus Brillantes** : Les 50 étoiles les plus brillantes (magnitude minimale)
- **Top 50 Plus Chaudes** : Les 50 étoiles les plus chaudes (index de couleur minimal)
- **Top 50 Plus Grosses** : Les 50 étoiles les plus grosses (magnitude absolue)
- **Par Constellation** : Filtre par constellation sélectionnée

**Fonctionnalités** :
- Application/retrait de filtres
- Mise en surbrillance visuelle des étoiles filtrées
- Sélecteur de constellation dynamique

---

##### **DateTime Picker** (`src/ui/datetime_picker.js`)

**Rôle** : Sélecteur de date et heure pour simuler le ciel à un moment donné.

**Fonctionnalités** :
- Modal avec sélection de date et heure
- Mise à jour automatique de la carte du ciel
- Affichage de l'heure actuelle dans le bouton trigger

**Classe** : `DateTimePicker`

---

##### **Location Search** (`src/ui/location_search.js`)

**Rôle** : Recherche et changement de position géographique de l'observateur.

**Fonctionnalités** :
- Recherche de localisation via l'API Photon (OpenStreetMap)
- Suggestions de localisations
- Mise à jour automatique de la position de l'observateur
- Recalcul des positions stellaires selon la nouvelle localisation

**API utilisée** : Photon (https://photon.komoot.io/api/)

---

### Interactions entre composants

#### Flux de données principal

```
1. Chargement initial
   └─> DataLoader.loadStarData()
       └─> parseCSV()
           └─> Filtrage par magnitude
               └─> Retourne allStars[]

2. Calcul des positions visibles
   └─> POVView.updateVisibleStars()
       └─> Astronomy.calculateVisibleStars(allStars, date)
           └─> Pour chaque étoile :
               ├─> calculateLST(date, longitude)
               └─> equatorialToHorizontal(ra, dec, lst, latitude)
                   └─> Filtre altitude > 0
                       └─> Retourne visibleStars[]

3. Préparation des constellations
   └─> Constellations.prepareConstellationsForRendering(visibleStars)
       ├─> groupStarsByConstellation()
       └─> calculateConstellationConnections()
           └─> Retourne constellations[]

4. Rendu
   └─> POVView.render()
       ├─> CanvasController.clearCanvas()
       ├─> CanvasController.drawConstellationLines()
       ├─> Pour chaque étoile visible :
       │   ├─> Camera.project(azimut, altitude)
       │   └─> CanvasController.drawStar()
       └─> renderPlanets()
```

#### Interactions utilisateur

**Souris/Tactile** :
```
CanvasController
  ├─> handleDragStart/Move/End() → Camera.rotate()
  ├─> handleZoom() → Camera.zoom()
  ├─> handleStarHover() → StarHover.findStarAtPosition()
  │                         └─> StarHover.showStarPopup()
  └─> handleReset() → Camera.reset()
```

**Filtres** :
```
Menu Filtre
  └─> applyFilter()
      └─> POVView.setFilteredStars(starIds)
          └─> POVView.render() (avec isFiltered=true)
```

**Date/Heure** :
```
DateTimePicker
  └─> setDate(date)
      └─> POVView.setDate(date)
          └─> updateVisibleStars()
              └─> render()
```

**Localisation** :
```
Location Search
  └─> applyLocation(place)
      └─> POVView.setObserver(lat, lon, name)
          └─> Astronomy.setObserver()
              └─> updateVisibleStars()
                  └─> render()
```

---

### Choix techniques

#### **Framework et librairies**

- **JavaScript Vanilla (ES6+)** : Pas de framework (React, Vue, Angular)
  - **Avantages** : Légèreté, pas de dépendances, contrôle total
  - **Inconvénients** : Plus de code à maintenir, pas de structure imposée

- **HTML5 Canvas** : Rendu graphique 2D
  - **Avantages** : Performances élevées, contrôle pixel par pixel
  - **Alternative considérée** : WebGL (plus complexe, non nécessaire pour ce cas)

- **Pas de gestionnaire d'état global** : État géré localement dans chaque composant
  - **Avantages** : Simplicité, pas de dépendance externe
  - **Inconvénients** : Synchronisation manuelle entre composants

#### **Structure de données**

- **Tableaux JavaScript** : Stockage des étoiles en mémoire
  - **Avantages** : Accès rapide, itération simple
  - **Limitation** : Toutes les données chargées en mémoire (acceptable pour ~110k étoiles)

- **CSV comme format de données** : Fichier `hygdata_v40.csv`
  - **Avantages** : Format standard, facile à remplacer/mettre à jour
  - **Inconvénients** : Parsing nécessaire, pas de validation de schéma

#### **Calculs astronomiques**

- **Algorithme simplifié** : Utilisation de formules astronomiques standards
  - **Temps sidéral** : Calcul basé sur le jour julien
  - **Conversion équatoriale → horizontale** : Formules trigonométriques standard
  - **Planètes** : Éléments orbitaux moyens (approximation, pas de perturbations)

#### **Gestion des événements**

- **Événements natifs du DOM** : Pas de bibliothèque d'événements
  - **Avantages** : Pas de dépendance, performances natives
  - **Gestion** : Écouteurs d'événements directement sur les éléments DOM

#### **Responsive Design**

- **Détection mobile** : `'ontouchstart' in window`
- **Adaptation de la caméra** : Altitude par défaut différente selon l'orientation
- **Gestion tactile** : Support du pinch-to-zoom et du drag

---

## Structure des Données

### Base de données : `hygdata_v40.csv`

#### Source des données

Le fichier `hygdata_v40.csv` provient du **HYG Database v4.0**, qui compile :
- Le catalogue **Hipparcos** (ESA, 1997)
- Le catalogue **Yale Bright Star** (5e édition)
- Le catalogue **Gliese** (étoiles proches)

**Taille** : ~110 000 étoiles
**Format** : CSV avec séparateur `;` (point-virgule)
**Encodage** : UTF-8

---

#### Structure du fichier CSV

##### Colonnes principales utilisées

| Colonne | Type | Description | Utilisation dans l'application |
|---------|------|-------------|-------------------------------|
| `id` | Integer | Identifiant unique | Identifiant de l'étoile |
| `proper` | String | Nom propre de l'étoile | Nom d'affichage principal |
| `ra` | Float | Ascension droite (heures décimales) | Conversion en degrés puis en coordonnées horizontales |
| `dec` | Float | Déclinaison (degrés) | Conversion en coordonnées horizontales |
| `mag` | Float | Magnitude visuelle apparente | Filtrage (mag < 6) et taille d'affichage |
| `ci` | Float | Index de couleur (Color Index) | Calcul de la couleur (actuellement non utilisé, couleur fixe) |
| `con` | String | Abréviation de la constellation | Regroupement et affichage des constellations |
| `dist` | Float | Distance en années-lumière | Filtre "plus proches", calcul magnitude absolue |
| `spect` | String | Type spectral | Information supplémentaire (non affiché actuellement) |
| `bayer` | String | Désignation Bayer | Nom d'affichage si pas de nom propre |
| `hip` | String | Identifiant Hipparcos | Nom d'affichage si pas de nom propre ni Bayer |
| `hd` | String | Identifiant Henry Draper | Nom d'affichage si pas d'autres identifiants |

##### Colonnes disponibles mais non utilisées

- `pmra`, `pmdec` : Mouvement propre (non utilisé, positions fixes)
- `rv` : Vitesse radiale
- `absmag` : Magnitude absolue (calculée si nécessaire)
- `lum` : Luminosité
- `var`, `var_min`, `var_max` : Variabilité (étoiles variables)

---

#### Structure des données en mémoire

Après le parsing, chaque étoile est représentée par un objet JavaScript :

```javascript
{
    id: "1",                    // String (ID du CSV)
    name: "Sirius",             // String | null (nom propre)
    ra: 6.7525,                 // Float (heures décimales)
    dec: -16.7161,              // Float (degrés)
    mag: -1.46,                 // Float (magnitude)
    ci: 0.009,                  // Float (index de couleur)
    constellation: "CMa",       // String | null (abréviation)
    distance: 8.66,             // Float | null (années-lumière)
    spectralType: "A1V",       // String | null
    bayer: "α",                 // String | null
    hip: "32349",               // String | null
    hd: "48915"                 // String | null
}
```

**Après calcul des positions visibles**, l'objet est enrichi :

```javascript
{
    // ... propriétés de base ...
    altitude: 45.2,             // Float (degrés, calculé)
    azimut: 180.5               // Float (degrés, calculé)
}
```

---

### Chargement et filtrage des données

#### Processus de chargement

1. **Chargement du fichier** (`DataLoader.loadStarData()`)
   ```javascript
   const response = await fetch(csvPath);
   const csvText = await response.text();
   ```

2. **Parsing du CSV** (`DataLoader.parseCSV()`)
   - Détection des en-têtes (première ligne)
   - Extraction des indices de colonnes
   - Validation des colonnes essentielles (`ra`, `dec`, `mag`)
   - Parsing ligne par ligne

3. **Filtrage par magnitude**
   ```javascript
   if (mag >= magnitudeLimit) {  // magnitudeLimit = 6 par défaut
       continue;  // Étoile ignorée
   }
   ```
   - Seules les étoiles de magnitude < 6 sont chargées (visibles à l'œil nu)

4. **Construction des objets étoiles**
   - Extraction des valeurs
   - Conversion en types appropriés (parseFloat)
   - Gestion des valeurs manquantes (null)

---

#### Filtrage pour l'affichage

##### Filtrage par visibilité

**Critère** : Étoile au-dessus de l'horizon (altitude > 0)

```javascript
// Dans Astronomy.calculateVisibleStars()
for (const star of stars) {
    const raInDegrees = star.ra * 15;  // Conversion heures → degrés
    const horizontal = equatorialToHorizontal(raInDegrees, star.dec, lst);
    
    if (isStarVisible(horizontal.altitude)) {  // altitude > 0
        visibleStars.push({
            ...star,
            altitude: horizontal.altitude,
            azimut: horizontal.azimut
        });
    }
}
```

**Résultat** : Seules les étoiles visibles depuis la position de l'observateur sont affichées.

---

##### Filtrage par magnitude (déjà fait au chargement)

Les étoiles de magnitude ≥ 6 ne sont pas chargées, donc pas affichées.

---

##### Filtrage par champ de vision (POV uniquement)

**Critère** : Étoile dans le champ de vision de la caméra

```javascript
// Dans Camera.project()
const dotProduct = starX * camX + starY * camY + starZ * camZ;
if (dotProduct <= 0) {
    return null;  // Étoile derrière la caméra
}

const angularDistanceDeg = ...;
const fovDiagonal = Math.sqrt(Math.pow(this.fov / 2, 2) + ...);
if (angularDistanceDeg > fovDiagonal) {
    return null;  // Étoile hors champ
}
```

**Résultat** : Seules les étoiles visibles dans le champ de vision sont rendues.

---

### Transformations des données

#### 1. Conversion des coordonnées

##### Équatoriales → Horizontales

**Étape 1** : Calcul du temps sidéral local (LST)
```javascript
LST = GST + longitude
```

**Étape 2** : Calcul de l'angle horaire (H)
```javascript
H = LST - RA (en degrés)
```

**Étape 3** : Calcul de l'altitude
```javascript
altitude = arcsin(sin(Dec) × sin(Lat) + cos(Dec) × cos(Lat) × cos(H))
```

**Étape 4** : Calcul de l'azimut
```javascript
azimut = arccos((sin(Dec) - sin(Alt) × sin(Lat)) / (cos(Alt) × cos(Lat)))
// Ajustement selon le signe de sin(H)
```

---

#### 2. Projection 3D → 2D (Vue POV)

**Méthode** : Projection perspective avec caméra orientable

**Étapes** :
1. Conversion des coordonnées horizontales en vecteur 3D
2. Calcul du produit scalaire avec la direction de la caméra
3. Projection sur le plan de l'écran
4. Conversion en coordonnées pixels

**Code** : Voir `Camera.project()` dans `src/views/pov/camera.js`

---

#### 3. Calcul de la taille d'affichage

**Formule** :
```javascript
baseSize = 0.5 × 10^((6 - magnitude) / 5)
adjustedSize = baseSize × √(zoomLevel)
size = clamp(adjustedSize, minSize, maxSize)
```

**Paramètres** :
- `baseSize` : 0.5
- `maxSize` : 8
- `minSize` : 0.5

**Résultat** : Les étoiles plus brillantes (magnitude plus faible) sont affichées plus grandes.

---

#### 4. Regroupement par constellation

**Processus** :
1. Regroupement des étoiles par abréviation de constellation
2. Calcul des distances angulaires entre étoiles d'une même constellation
3. Création de connexions entre étoiles proches (distance < 30°)
4. Limitation à 3 connexions maximum par étoile

**Code** : Voir `Constellations.prepareConstellationsForRendering()`

---

#### 5. Calcul des positions planétaires

**Processus** :
1. Calcul de la position héliocentrique (éléments orbitaux moyens)
2. Calcul de la position de la Terre
3. Conversion en coordonnées géocentriques
4. Conversion écliptiques → équatoriales
5. Conversion équatoriales → horizontales (comme pour les étoiles)

**Code** : Voir `Planets.calculatePlanetPosition()`

---

## Bonnes Pratiques

### Conventions de nommage

#### Fichiers

- **Fichiers JavaScript** : `kebab-case.js` (ex: `data-loader.js`, `star-hover.js`)
- **Fichiers HTML** : `kebab-case.html` (ex: `index.html`)
- **Fichiers CSS** : `kebab-case.css` (ex: `styles.css`, `common.css`)

#### Variables et fonctions

- **Variables** : `camelCase` (ex: `visibleStars`, `currentDate`)
- **Fonctions** : `camelCase` (ex: `calculateLST()`, `loadStarData()`)
- **Classes** : `PascalCase` (ex: `POVView`, `Camera`, `DateTimePicker`)
- **Constantes** : `UPPER_SNAKE_CASE` (ex: `OBSERVER_CONFIG`, `DATA_CONFIG`)

#### Modules globaux

- **Exports globaux** : `PascalCase` (ex: `window.Astronomy`, `window.DataLoader`)
- **Cohérence** : Un seul export global par fichier

---

### Architecture des modules

#### Structure recommandée

```javascript
/**
 * Description du module
 */

// Configuration par défaut
const MODULE_CONFIG = {
    // ...
};

// Fonctions utilitaires privées
function privateFunction() {
    // ...
}

// Fonctions publiques
function publicFunction() {
    // ...
}

// Export global
window.ModuleName = {
    publicFunction,
    MODULE_CONFIG
};
```

#### Documentation JSDoc

Toutes les fonctions publiques doivent être documentées :

```javascript
/**
 * Description de la fonction
 * @param {Type} paramName - Description du paramètre
 * @param {Type} [optionalParam] - Paramètre optionnel
 * @returns {Type} Description de la valeur de retour
 * @throws {Error} Description de l'erreur possible
 */
function documentedFunction(paramName, optionalParam) {
    // ...
}
```

---

### Ajout de nouvelles fonctionnalités

#### Ajouter une nouvelle source de données

**Étapes** :

1. **Créer un nouveau module de chargement** (si format différent)
   ```javascript
   // src/core/new-data-loader.js
   async function loadNewData(dataPath) {
       // Chargement et parsing
   }
   
   window.NewDataLoader = { loadNewData };
   ```

2. **Adapter le format aux objets étoiles standard**
   - Utiliser la même structure d'objet que les étoiles
   - Convertir les coordonnées si nécessaire

3. **Intégrer dans la vue**
   ```javascript
   // Dans POVView.init()
   this.newData = await NewDataLoader.loadNewData(path);
   ```

4. **Ajouter le rendu**
   ```javascript
   // Dans POVView.render() ou CanvasController
   this.renderNewData();
   ```

---

#### Ajouter un nouveau filtre

**Étapes** :

1. **Créer la fonction de filtrage** dans `menu_filtre.js`
   ```javascript
   function getTop50NewFilter(stars) {
       // Logique de filtrage
       const filtered = stars.filter(/* critère */);
       return new Set(filtered.slice(0, 50).map(s => String(s.id)));
   }
   ```

2. **Ajouter le cas dans `applyFilter()`**
   ```javascript
   case 'newFilter':
       FilterState.highlightedStarIds = getTop50NewFilter(stars);
       break;
   ```

3. **Ajouter le bouton dans le HTML**
   ```html
   <button class="filter-btn" data-filter="newFilter">
       Nouveau Filtre
   </button>
   ```

---

#### Ajouter un nouveau type d'objet céleste

**Exemple** : Ajouter les satellites artificiels

1. **Créer un module de calcul** (`src/shared/satellites.js`)
   ```javascript
   function calculateSatellitePositions(date, latitude, longitude) {
       // Calcul des positions
       return satellites;
   }
   
   window.Satellites = { calculateSatellitePositions };
   ```

2. **Intégrer dans la vue**
   ```javascript
   // Dans POVView
   updateVisibleSatellites() {
       this.visibleSatellites = Satellites.calculateSatellitePositions(
           this.currentDate,
           Astronomy.OBSERVER_CONFIG.latitude,
           Astronomy.OBSERVER_CONFIG.longitude
       );
   }
   ```

3. **Ajouter le rendu**
   ```javascript
   // Dans CanvasController
   drawSatellite(x, y, satellite) {
       // Dessin du satellite
   }
   ```

4. **Appeler dans le rendu**
   ```javascript
   // Dans POVView.render()
   this.renderSatellites();
   ```

---

### Gestion des erreurs

#### Principes

1. **Validation des entrées** : Toujours valider les paramètres d'entrée
   ```javascript
   if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
       throw new Error('Date invalide');
   }
   ```

2. **Gestion des erreurs de chargement** : Utiliser try/catch pour les opérations asynchrones
   ```javascript
   try {
       const data = await loadData();
   } catch (error) {
       console.error('Erreur:', error);
       UIUtils.showError(error.message);
   }
   ```

3. **Messages d'erreur explicites** : Fournir des messages clairs
   ```javascript
   throw new Error('Colonnes essentielles manquantes dans le CSV (ra, dec, mag)');
   ```

---

### Performance

#### Optimisations actuelles

1. **Filtrage précoce** : Filtrage par magnitude au chargement
2. **Tri des étoiles** : Tri par magnitude pour afficher les plus brillantes en premier
3. **Culling** : Vérification de la visibilité avant le rendu
4. **Limitation des connexions** : Maximum 3 connexions par étoile dans les constellations

#### Recommandations pour l'ajout de fonctionnalités

1. **Éviter les recalculs inutiles** : Mettre en cache les résultats coûteux
   ```javascript
   if (!this._cachedResult || this._cacheInvalid) {
       this._cachedResult = expensiveCalculation();
       this._cacheInvalid = false;
   }
   ```

2. **Utiliser `requestAnimationFrame`** pour les animations
   ```javascript
   function animate() {
       render();
       requestAnimationFrame(animate);
   }
   ```

3. **Limiter le nombre d'objets rendus** : Utiliser le niveau de détail (LOD)
   ```javascript
   if (distanceFromCenter > threshold) {
       // Rendu simplifié
   }
   ```

---

### Tests

#### Structure des tests

Les tests sont dans le dossier `tests/` :
- `astronomy.test.js` : Tests des calculs astronomiques
- `camera.test.js` : Tests de la caméra
- `integration.test.js` : Tests d'intégration

#### Ajouter un nouveau test

1. **Créer un fichier de test** : `tests/new-feature.test.js`
2. **Utiliser le test runner** : `tests/test-runner.js`
3. **Exécuter les tests** : Ouvrir `tests/index.html` dans un navigateur

**Exemple** :
```javascript
runner.test('Nouvelle fonctionnalité - test basique', () => {
    const result = newFunction(input);
    runner.assert(result === expected, 'Le résultat doit être correct');
});
```

---

### Documentation interne

#### Commentaires dans le code

- **Fonctions** : Toujours documenter avec JSDoc
- **Logique complexe** : Ajouter des commentaires explicatifs
- **TODO/FIXME** : Utiliser des commentaires pour les améliorations futures

**Exemple** :
```javascript
/**
 * Calcule la position d'une étoile dans le système de coordonnées horizontales.
 * Utilise les formules standard de conversion équatoriale → horizontale.
 * 
 * @param {number} ra - Ascension droite en degrés
 * @param {number} dec - Déclinaison en degrés
 * @param {number} lst - Temps sidéral local en degrés
 * @param {number} latitude - Latitude de l'observateur en degrés
 * @returns {Object} {altitude, azimut} en degrés
 */
function equatorialToHorizontal(ra, dec, lst, latitude) {
    // Conversion en radians pour les calculs trigonométriques
    const raRad = degreesToRadians(ra);
    // ...
}
```

---

### Versioning et maintenance

#### Gestion des versions de données

- **Nommage des fichiers** : Inclure la version (ex: `hygdata_v40.csv`)
- **Compatibilité** : Vérifier la structure du CSV au chargement
- **Migration** : Prévoir des fonctions de migration si la structure change

#### Mise à jour des données

1. **Remplacer le fichier CSV** : Mettre à jour `hygdata_v40.csv`
2. **Vérifier la compatibilité** : Tester avec les nouvelles données
3. **Adapter le parsing si nécessaire** : Modifier `DataLoader.parseCSV()`

---

### Ressources externes

#### APIs utilisées

- **Photon (OpenStreetMap)** : Recherche de localisations
  - URL : `https://photon.komoot.io/api/`
  - Usage : Recherche de villes/coordonnées

#### Données astronomiques

- **HYG Database** : Catalogue d'étoiles
  - Source : https://github.com/astronexus/HYG-Database
  - Version utilisée : v4.0

---

## Conclusion

Cette documentation fournit une vue d'ensemble complète de l'architecture et de la structure des données de l'application **Carte du Ciel**. Elle sert de référence pour :

- **Comprendre** l'organisation du code
- **Maintenir** et faire évoluer l'application
- **Ajouter** de nouvelles fonctionnalités
- **Intégrer** de nouveaux développeurs

Pour toute question ou clarification, consulter les commentaires dans le code source ou les tests dans le dossier `tests/`.
