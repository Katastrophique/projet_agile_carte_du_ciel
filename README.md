# 🌟 Carte du Ciel - Lyon

Application web interactive de visualisation du ciel étoilé visible depuis Lyon, France.

## 📋 Description

Cette application propose deux modes de visualisation du ciel nocturne en temps réel :
- **Mode POV (Point of View)** : Vue immersive comme si vous leviez la tête vers le ciel
- **Mode Télescope** : Vue classique avec projection azimutale du ciel complet

Les étoiles visibles à l'œil nu (magnitude < 6) sont affichées et calculées en temps réel pour la position de Lyon.

## ✨ Fonctionnalités

### Communes aux deux modes
- **Affichage en temps réel** : Positions calculées pour la date et l'heure actuelles
- **Filtrage automatique** : Seules les étoiles visibles à l'œil nu et au-dessus de l'horizon sont affichées
- **Interactivité** :
  - 🔍 **Zoom** : Molette de la souris
  - ✋ **Déplacement** : Clic-glisser
  - 🔄 **Réinitialisation** : Double-clic
- **Taille des étoiles** : Proportionnelle à leur luminosité

### Mode Planétarium (immersif)
- Vue panoramique à 360°
- Contrôle de la direction de vue (Nord, Sud, Est, Ouest)
- Effet d'atténuation des étoiles proches de l'horizon
- Indication de la direction de visée en temps réel

### Mode Télescope (classique)
- Projection azimutale équidistante
- Zénith au centre, horizon sur le bord
- Directions cardinales (N, S, E, O) autour du cercle


## 🚀 Démarrage rapide

### Prérequis

- Un navigateur web moderne (Chrome, Firefox, Edge, Safari)
- Un serveur web local (nécessaire pour charger les fichiers)

### Installation

1. Clonez ou téléchargez ce dépôt

2. Lancez un serveur web local dans le dossier du projet :

   **Option 1 - Python :**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option 2 - Node.js :**
   ```bash
   npx http-server -p 8000
   ```

   **Option 3 - Extension VS Code :**
   Utilisez l'extension "Live Server" et cliquez sur "Go Live"

3. Ouvrez votre navigateur à l'adresse `http://localhost:8000`

> ⚠️ **Important** : L'ouverture directe du fichier `index.html` ne fonctionnera pas à cause des restrictions CORS pour le chargement des fichiers CSV.

## 📁 Structure du projet

```
projet_agile_carte_du_ciel/
├── index.html              # Page d'accueil avec sélecteur de mode
├── README.md               # Ce fichier
│
├── shared/                 # Ressources partagées entre les modes
│   ├── astronomy.js        # Calculs astronomiques (LST, coordonnées)
│   ├── easter-eggs.js      # Module des easter eggs
│   ├── hygdata_v40.csv     # Base de données stellaires (~110 000 étoiles)
│   └── assets/             # Images et ressources
│       ├── stars.png
│       └── sun.png
│
├── affichage_pov/          # Mode POV (vue immersive)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── camera.js           # Gestion de la caméra 3D
│   └── canvas-controller.js
│
└── affichage_telescope/    # Mode Télescope (vue classique)
    ├── index.html
    ├── styles.css
    ├── app.js
    └── canvas-controller.js
```

## 🔭 Données astronomiques

Les données proviennent du catalogue **HYG Database v4.0**, qui compile :
- Le catalogue Hipparcos
- Le catalogue Yale Bright Star
- Le catalogue Gliese

### Colonnes principales utilisées :
| Colonne | Description |
|---------|-------------|
| `ra` | Ascension droite (heures décimales, équinoxe J2000.0) |
| `dec` | Déclinaison (degrés, équinoxe J2000.0) |
| `mag` | Magnitude visuelle apparente |
| `proper` | Nom propre de l'étoile (si connu) |
| `con` | Abréviation de la constellation |

## ⚙️ Calculs astronomiques

L'application effectue les calculs suivants (dans `shared/astronomy.js`) :

1. **Temps sidéral local (LST)** : Calculé à partir du temps sidéral de Greenwich et de la longitude de Lyon
2. **Conversion équatoriale → horizontale** :
   - Angle horaire H = LST - RA
   - Altitude = arcsin(sin(Dec)×sin(Lat) + cos(Dec)×cos(Lat)×cos(H))
   - Azimut = arccos((sin(Dec) - sin(Alt)×sin(Lat)) / (cos(Alt)×cos(Lat)))

3. **Projection** :
   - **Mode Planétarium** : Projection perspective avec caméra orientable
   - **Mode Télescope** : Projection azimutale équidistante

## 📍 Configuration

Position d'observation (définie dans `shared/astronomy.js`) :
- **Ville** : Lyon, France
- **Latitude** : 45.757814° N
- **Longitude** : 4.832011° E

## 🛠️ Technologies utilisées

- HTML5 Canvas
- CSS3 (Flexbox, Grid, animations)
- JavaScript ES6+ (vanilla, sans framework)

## 📄 Licence

Projet éducatif - Libre d'utilisation.