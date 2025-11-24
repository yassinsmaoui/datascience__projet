# 📊 Visualisation Interactive - Répartition des Retraités au Maroc 2022

Une visualisation web interactive utilisant D3.js pour afficher la distribution géographique des retraités du Régime de Pensions Civiles (RPC) au Maroc en 2022.

## 🎯 Fonctionnalités

### Carte Interactive
- **Carte du Maroc** avec TopoJSON des régions
- **Cercles proportionnels** : taille basée sur le nombre de retraités
- **Projection Mercator** adaptée au Maroc
- **Tooltip élégant** affichant les détails au survol
- **Légende** pour l'échelle des cercles

### Histogramme Synchronisé
- **Barres interactives** représentant chaque région
- **Tri dynamique** : par ordre alphabétique ou par valeur
- **Synchronisation bidirectionnelle** avec la carte
- **Valeurs affichées** au-dessus des barres

### Graphique Circulaire Adaptatif
- **Donut chart** affichant la répartition masculin/féminin
- **S'adapte dynamiquement** à la région sélectionnée
- **Animations fluides** lors des changements
- **Légende interactive** avec détails complets
- **Message de placeholder** quand aucune région n'est sélectionnée

### Interactions
- **Survol** : surbrillance et affichage du tooltip
- **Clic sur la carte** → sélection de la région + mise en évidence dans l'histogramme + mise à jour du graphique circulaire
- **Clic sur l'histogramme** → sélection de la région + mise en évidence sur la carte + mise à jour du graphique circulaire
- **Graphique circulaire** : affiche la répartition masculin/féminin pour la région sélectionnée
- **Animations D3** : transitions fluides et élégantes
- **Design responsive** : s'adapte à toutes les tailles d'écran

## 📁 Structure du Projet

```
datascience_projet/
├── index.html                              # Page principale
├── app.js                                  # Script D3.js avec toute la logique
├── styles.css                              # Styles CSS complets
├── data.json                               # Données converties depuis Excel
├── convert_excel.js                        # Script de conversion Excel → JSON
├── repartition-retraites-par-region_2022.xlsx  # Fichier Excel source
└── README.md                               # Documentation
```

## 🚀 Installation et Utilisation

### Prérequis
- Node.js installé sur votre machine
- Navigateur web moderne (Chrome, Firefox, Edge, Safari)

### Étape 1 : Convertir les données Excel

```bash
# Installer les dépendances (si nécessaire)
npm install xlsx

# Convertir le fichier Excel en JSON
node convert_excel.js
```

Cela génère le fichier `data.json` avec les données formatées.

### Étape 2 : Lancer le serveur local

```bash
# Option 1 : Avec Python
python -m http.server 8000

# Option 2 : Avec Node.js
npx http-server -p 8000
```

### Étape 3 : Ouvrir dans le navigateur

Ouvrez votre navigateur et accédez à :
```
http://localhost:8000
```

## 💡 Utilisation

### Boutons de Contrôle

- **Trier par valeur** : Réorganise l'histogramme par ordre décroissant/alphabétique
- **Réinitialiser la sélection** : Désélectionne toutes les régions

### Interactions

1. **Survolez une région** sur la carte ou une barre dans l'histogramme pour voir les détails
2. **Cliquez sur une région** pour la sélectionner (synchronisation carte ↔ histogramme)
3. **Cliquez à nouveau** pour désélectionner

### Données Affichées

Pour chaque région, le tooltip affiche :
- **Nom de la région**
- **Total de retraités**
- **Nombre masculin**
- **Nombre féminin**
- **Pourcentage féminin**

Le graphique circulaire affiche :
- **Répartition visuelle** masculin (bleu) / féminin (rouge)
- **Pourcentages** sur chaque secteur
- **Valeurs absolues** dans la légende
- **Total au centre** du donut chart

## 🎨 Technologies Utilisées

- **D3.js v7** : Visualisation de données
- **TopoJSON** : Format de données géographiques
- **Vanilla JavaScript** : Logique applicative
- **CSS3** : Styles et animations
- **HTML5** : Structure de la page

## 📊 Sources des Données

- **Fichier Excel** : `repartition-retraites-par-region_2022.xlsx`
- **Carte du Maroc** : [morocco-map](https://cdn.jsdelivr.net/npm/morocco-map/data/regions.json) (TopoJSON)
- **Année** : 2022
- **Source** : Régime de Pensions Civiles (RPC)

## 🔧 Personnalisation

### Modifier les Couleurs

Dans `styles.css`, modifiez les variables :

```css
.region {
  fill: #3498db;  /* Couleur des régions */
}

.bubble {
  fill: rgba(231, 76, 60, 0.6);  /* Couleur des cercles */
}
```

### Ajuster les Dimensions

Dans `app.js`, modifiez les constantes :

```javascript
const width = 900;   // Largeur de la carte
const height = 900;  // Hauteur de la carte
const histogramWidth = 500;   // Largeur de l'histogramme
const histogramHeight = 800;  // Hauteur de l'histogramme
```

### Changer l'Échelle des Cercles

Dans `app.js`, modifiez la fonction `radiusScale` :

```javascript
const radiusScale = d3.scaleSqrt()
  .domain([0, d3.max(mergedData, d => d.total)])
  .range([0, 50]);  // [rayon min, rayon max]
```

## 📱 Responsive Design

La visualisation s'adapte automatiquement aux différentes tailles d'écran :

- **Desktop** (> 1200px) : Carte et histogramme côte à côte
- **Tablette** (768px - 1200px) : Carte au-dessus de l'histogramme
- **Mobile** (< 768px) : Layout vertical optimisé

## 🐛 Dépannage

### Erreur CORS
Si vous obtenez une erreur CORS, assurez-vous d'utiliser un serveur HTTP local (pas d'ouverture directe du fichier).

### Données non affichées
Vérifiez que le fichier `data.json` existe et est correctement formaté :
```bash
node convert_excel.js
```

### Problèmes de chargement
Ouvrez la console du navigateur (F12) pour voir les messages d'erreur détaillés.

## 📈 Statistiques des Données (2022)

- **Nombre total de régions** : 12 (+ 1 ligne TOTAL exclue)
- **Total des retraités** : 331 151
- **Région avec le plus de retraités** : Rabat-Salé-Kénitra (86 331)
- **Région avec le moins de retraités** : Dakhla-Oued Ed Dahab (368)

## 🤝 Contribution

Pour améliorer ce projet :

1. Fork le repository
2. Créez une branche (`git checkout -b feature/amelioration`)
3. Committez vos changements (`git commit -am 'Ajout de fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Créez une Pull Request

## 📄 Licence

Ce projet est open source et disponible sous licence MIT.

## 👨‍💻 Auteur

Créé avec ❤️ pour la visualisation de données au Maroc.

## 🙏 Remerciements

- [D3.js](https://d3js.org/) pour la bibliothèque de visualisation
- [morocco-map](https://github.com/DevloperMM/morocco-map) pour les données géographiques
- La communauté open source

---

**Bon usage ! 🚀**
