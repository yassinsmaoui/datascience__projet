# 📊 Visualisation Interactive du Chômage au Maroc

Application web interactive pour analyser les taux de chômage par région au Maroc (2015-2023).

## 🎯 Fonctionnalités

### Visualisations
- **Carte Choroplèthe**: Coloration des régions selon le taux de chômage
- **Diagramme Circulaire**: Répartition Urbain/Rural par région
- **Histogramme**: Évolution temporelle (2015-2023)

### Interactivité
- ✅ Filtres par année (2015-2023) et sexe (Total, Masculin, Féminin)
- ✅ Synchronisation entre les 3 visualisations
- ✅ Au survol: affichage du taux de chômage
- ✅ Au clic: sélection de région et mise à jour des graphiques
- ✅ Animations fluides entre les états
- ✅ Légende interactive avec échelle de couleurs

### Fonctionnalités Avancées
- 📥 **Export des données** au format CSV
- ⚖️ **Mode Comparaison** entre deux régions
- 🎨 Échelle de couleurs dynamique (vert → rouge)
- 📱 Design responsive

## 🏗️ Structure du Projet

```
datascience_projet/
├── index.html              # Structure HTML principale
├── style.css               # Styles CSS avancés
├── app.js                  # Logique principale de l'application
├── dataProcessor.js        # Module de traitement des données
├── Taux de chomage par sexe et region.csv  # Données source
└── README.md              # Documentation
```

## 🚀 Utilisation

### Démarrage Rapide

1. **Ouvrir le projet**:
   - Option 1: Double-cliquer sur `index.html`
   - Option 2: Utiliser un serveur local (recommandé)

2. **Avec serveur local** (Python):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Puis ouvrir: http://localhost:8000
   ```

3. **Avec serveur local** (Node.js):
   ```bash
   npx http-server -p 8000
   
   # Puis ouvrir: http://localhost:8000
   ```

### Navigation

1. **Sélectionner les filtres**:
   - Choisir une année (2015-2023)
   - Choisir un sexe (Total, Masculin, Féminin)

2. **Interagir avec la carte**:
   - Survoler une région pour voir le taux
   - Cliquer pour sélectionner et mettre à jour les autres visualisations

3. **Exporter les données**:
   - Cliquer sur "📊 Exporter les données"
   - Un fichier CSV sera téléchargé

4. **Comparer des régions**:
   - Cliquer sur "⚖️ Mode Comparaison"
   - Sélectionner deux régions à comparer
   - Visualiser l'évolution comparative

## 📚 Technologies Utilisées

- **D3.js v5.6.0**: Bibliothèque de visualisation
- **TopoJSON v3.0.2**: Format de données géographiques
- **D3-tip**: Tooltips interactifs
- **HTML5/CSS3**: Structure et design
- **JavaScript ES6**: Logique applicative

## 🎨 Échelle de Couleurs

L'échelle de couleurs de la carte choroplèthe représente:
- 🟢 **Vert**: Faible taux de chômage
- 🟡 **Jaune**: Taux moyen
- 🟠 **Orange**: Taux élevé
- 🔴 **Rouge**: Taux très élevé

L'échelle s'ajuste automatiquement selon les données de l'année et du sexe sélectionnés.

## 📊 Sources des Données

- **Fichier CSV**: `Taux de chomage par sexe et region.csv`
- **Carte du Maroc**: [morocco-map](https://cdn.jsdelivr.net/npm/morocco-map/data/regions.json)
- **Période**: 2015-2023
- **Régions**: 12 régions du Maroc

## 🔧 Traitement des Données

Le module `dataProcessor.js` gère:
- Nettoyage des données CSV
- Correspondance entre noms de régions (CSV ↔ Carte)
- Agrégations et filtres
- Gestion des valeurs manquantes
- Export des données

## 🎯 Régions Disponibles

1. Tanger-Tétouan-Al Hoceïma
2. Oriental
3. Fès-Meknès
4. Rabat-Salé-Kénitra
5. Béni Mellal-Khénifra
6. Casablanca-Settat
7. Marrakech-Safi
8. Drâa-Tafilalet
9. Souss-Massa
10. Régions du Sud

## 🐛 Dépannage

### La carte ne s'affiche pas
- Vérifiez votre connexion internet (carte chargée depuis CDN)
- Utilisez un serveur local au lieu d'ouvrir directement le fichier HTML

### Les données ne se chargent pas
- Vérifiez que le fichier CSV est dans le même dossier
- Vérifiez la console du navigateur pour les erreurs

### Problèmes de performance
- Utilisez un navigateur moderne (Chrome, Firefox, Edge)
- Fermez les autres onglets pour libérer de la mémoire

## 📱 Responsive Design

L'application s'adapte automatiquement aux différentes tailles d'écran:
- **Desktop**: Layout 3 colonnes (carte 50% + 2 graphiques 25% chacun)
- **Tablet/Mobile**: Layout 1 colonne empilée

## 🔒 Notes sur les Données

- Certaines régions peuvent avoir des données manquantes (affichées comme `-` dans le CSV)
- Les valeurs manquantes sont représentées en gris sur la carte
- Les calculs excluent automatiquement les valeurs manquantes

## 📝 Licence

Ce projet est à but éducatif et de visualisation des données publiques.

## 👨‍💻 Auteur

Créé avec ❤️ pour l'analyse des données du chômage au Maroc.

---

**Note**: Pour une meilleure expérience, utilisez un serveur local HTTP plutôt que d'ouvrir directement le fichier HTML dans le navigateur.
