# 🎯 Guide d'Utilisation - Graphique Circulaire

## Vue d'Ensemble

Le **graphique circulaire** (donut chart) est une nouvelle visualisation interactive qui s'adapte dynamiquement à la région sélectionnée. Il affiche la répartition entre les retraités masculins et féminins.

## 📊 Caractéristiques

### Design
- **Type** : Donut chart (graphique en anneau)
- **Secteurs** : 
  - 🔵 **Bleu** = Masculin
  - 🔴 **Rouge** = Féminin
- **Centre** : Affiche le nom de la région et le total de retraités
- **Légende** : Valeurs absolues pour chaque catégorie

### Animations
- ✨ **Apparition progressive** des secteurs avec animation de rotation
- 🎭 **Effet de survol** : agrandissement du secteur
- 🔄 **Transitions fluides** lors du changement de région
- ⏱️ **Synchronisation** avec les autres visualisations

## 🖱️ Interactions

### Comment l'utiliser ?

1. **État Initial**
   - Le graphique affiche un message : "Sélectionnez une région"
   - Aucune donnée n'est affichée

2. **Sélectionner une Région**
   - **Option 1** : Cliquez sur une région de la carte
   - **Option 2** : Cliquez sur une barre de l'histogramme
   - → Le graphique circulaire se met à jour automatiquement

3. **Consulter les Détails**
   - **Survolez un secteur** : tooltip avec le nombre exact et le pourcentage
   - **Centre du graphique** : nom de la région + total de retraités
   - **Légende** : valeurs absolues pour masculin et féminin

4. **Désélectionner**
   - Cliquez sur le bouton "Réinitialiser la sélection"
   - Ou cliquez à nouveau sur la même région
   - → Le graphique retourne à l'état initial

## 📈 Informations Affichées

### Au Centre (État Sélectionné)
```
Nom de la Région
[Nombre Total]
retraités
```

### Sur les Secteurs
```
[Pourcentage]%
```

### Dans le Tooltip
```
Masculin / Féminin
Nombre: [valeur]
Pourcentage: [%]
```

### Légende
```
■ Masculin: [valeur]
■ Féminin: [valeur]
```

## 🎨 Exemple d'Utilisation

### Scénario : Analyser Casablanca-Settat

1. **Cliquez** sur la région "Casablanca-Settat" sur la carte
2. **Observez** :
   - La région s'illumine en rouge sur la carte
   - La barre correspondante se colore en orange dans l'histogramme
   - Le graphique circulaire se remplit avec :
     - Secteur bleu (masculin) : ~63.4%
     - Secteur rouge (féminin) : ~36.6%
     - Centre : "Casablanca-Settat" + "72 314 retraités"

3. **Survolez** le secteur bleu :
   - Tooltip : "Masculin - Nombre: 45 839 - Pourcentage: 63.4%"
   - Le secteur s'agrandit légèrement

4. **Comparez** avec une autre région :
   - Cliquez sur "Rabat-Salé-Kénitra"
   - Le graphique s'anime et affiche les nouvelles proportions
   - Transition fluide entre les deux états

## 💡 Conseils d'Analyse

### Questions que vous pouvez explorer :

1. **Quelle région a la meilleure parité ?**
   - Regardez où les secteurs sont les plus équilibrés (proches de 50/50)

2. **Où les hommes sont-ils majoritaires ?**
   - Identifiez les régions avec un grand secteur bleu

3. **Tendances régionales**
   - Comparez plusieurs régions successivement
   - Notez les différences de répartition

4. **Cas extrêmes**
   - Quelle région a le ratio le plus déséquilibré ?
   - Utilisez le graphique pour une comparaison visuelle rapide

## 🎯 Cas d'Usage

### Analyse Démographique
- Comprendre la répartition par genre dans chaque région
- Identifier les disparités régionales

### Reporting
- Créer des captures d'écran pour des rapports
- Illustrer visuellement les proportions

### Prise de Décision
- Identifier les régions nécessitant des politiques spécifiques
- Comparer rapidement plusieurs territoires

## 🔧 Personnalisation Technique

Si vous souhaitez modifier le graphique :

### Changer les Couleurs
Dans `app.js`, ligne ~174 :
```javascript
const pieData = [
  { category: 'Masculin', value: regionData.masculin, color: '#3498db' }, // Bleu
  { category: 'Féminin', value: regionData.feminin, color: '#e74c3c' }    // Rouge
];
```

### Ajuster la Taille
Dans `app.js`, ligne ~10 :
```javascript
const pieChartSize = 350;  // Modifiez cette valeur
```

### Modifier le Rayon du Trou
Dans `app.js`, ligne ~181 :
```javascript
.innerRadius(pieRadius * 0.6)  // 0.6 = 60% de trou, augmentez ou diminuez
```

## ❓ FAQ

**Q : Le graphique ne s'affiche pas**
- Vérifiez que vous avez bien sélectionné une région (clic sur carte ou histogramme)

**Q : Les animations sont trop rapides/lentes**
- Modifiez les valeurs de `.duration()` dans `app.js`

**Q : Je veux voir toutes les régions en même temps**
- Cette fonctionnalité montre UNE région à la fois pour plus de clarté
- Utilisez l'histogramme pour une vue d'ensemble

**Q : Peut-on exporter le graphique ?**
- Faites un clic droit sur le graphique → "Enregistrer l'image sous..."
- Ou utilisez un outil de capture d'écran

## 📊 Données Affichées

Toutes les données proviennent du fichier Excel source :
- **Source** : `repartition-retraites-par-region_2022.xlsx`
- **Année** : 2022
- **Organisme** : Régime de Pensions Civiles (RPC)
- **Calculs** : Pourcentages calculés automatiquement

---

**Profitez de cette nouvelle visualisation pour mieux comprendre vos données ! 🎉**
