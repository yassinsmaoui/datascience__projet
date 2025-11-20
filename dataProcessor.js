// DataProcessor.js - Module de traitement des données
class DataProcessor {
  constructor() {
    this.rawData = [];
    this.processedData = {};
    this.regionMapping = {
      // Correspondance entre les noms du CSV et les noms de la carte
      'Tanger-Tétouan-Al Hoceïma': ['Tanger-Tetouan-Al Hoceima', 'Tangier-Tetouan-Al Hoceima'],
      'Oriental': ['Oriental', 'L\'Oriental'],
      'Fès-Meknès': ['Fes-Meknes', 'Fès-Meknès', 'Fez-Meknes'],
      'Rabat-Salé-Kénitra': ['Rabat-Sale-Kenitra', 'Rabat-Salé-Kénitra'],
      'Béni Mellal-Khénifra': ['Beni Mellal-Khenifra', 'Béni Mellal-Khénifra'],
      'Casablanca-settat': ['Casablanca-Settat', 'Grand Casablanca'],
      'Marrakech-safi': ['Marrakech-Safi', 'Marrakesh-Safi'],
      'Drâa-Tafilalet': ['Draa-Tafilalet', 'Drâa-Tafilalet'],
      'Souss-Massa': ['Souss-Massa', 'Souss-Massa-Draa'],
      'Régions du Sud': ['Guelmim-Oued Noun', 'Laayoune-Sakia El Hamra', 'Dakhla-Oued Ed-Dahab'],
      'Ensemble': ['Ensemble', 'National']
    };
    this.years = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'];
    
    // Données synthétiques pour les régions manquantes (à des fins de démonstration)
    this.syntheticData = {
      'Fès-Meknès': { National: 12.5, Urbain: 15.2, Rural: 8.3 },
      'Rabat-Salé-Kénitra': { National: 14.8, Urbain: 17.5, Rural: 9.1 },
      'Béni Mellal-Khénifra': { National: 9.2, Urbain: 11.8, Rural: 6.5 },
      'Casablanca-settat': { National: 16.5, Urbain: 18.9, Rural: 10.2 },
      'Marrakech-safi': { National: 11.3, Urbain: 14.6, Rural: 7.8 },
      'Drâa-Tafilalet': { National: 8.7, Urbain: 10.9, Rural: 6.2 },
      'Souss-Massa': { National: 10.5, Urbain: 13.2, Rural: 7.1 },
      'Régions du Sud': { National: 15.8, Urbain: 19.2, Rural: 11.5 }
    };
  }

  // Charger et nettoyer les données CSV
  async loadData(csvPath) {
    try {
      const data = await d3.csv(csvPath);
      
      console.log('Données CSV brutes chargées:', data.length, 'lignes');
      console.log('Première ligne:', data[0]);
      
      // Nettoyer les données (supprimer les lignes vides et en-têtes)
      this.rawData = data.filter(row => {
        const isValid = row.Sexe && row.Région && row.Milieu && 
               row.Sexe !== '' && row.Région !== '' && 
               !row.Sexe.includes('Taux de chômage') &&
               row.Sexe !== 'Sexe'; // Exclure la ligne d'en-tête si présente
        return isValid;
      });

      console.log('Données nettoyées:', this.rawData.length, 'lignes');
      console.log('Premières données:', this.rawData.slice(0, 3));

      this.processData();
      
      console.log('Données traitées:', Object.keys(this.processedData));
      
      return this.processedData;
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      throw error;
    }
  }

  // Structurer les données pour faciliter l'accès
  processData() {
    this.processedData = {};

    this.rawData.forEach(row => {
      const sexe = row.Sexe;
      const region = row['Région'];
      const milieu = row.Milieu;

      if (!this.processedData[sexe]) {
        this.processedData[sexe] = {};
      }

      if (!this.processedData[sexe][region]) {
        this.processedData[sexe][region] = {};
      }

      // Stocker les données par milieu avec les valeurs annuelles
      const yearData = {};
      this.years.forEach(year => {
        const value = row[year];
        // Convertir en nombre, gérer les valeurs manquantes
        yearData[year] = (value && value !== '-') ? parseFloat(value) : null;
      });

      this.processedData[sexe][region][milieu] = yearData;
    });
  }

  // Obtenir le taux de chômage pour une région spécifique
  getRegionData(region, year, sexe, milieu = 'National') {
    try {
      if (!this.processedData[sexe] || !this.processedData[sexe][region]) {
        console.log(`Pas de données CSV pour ${region}, recherche synthétiques...`);
        // Si données manquantes, utiliser les données synthétiques
        if (this.syntheticData[region] && this.syntheticData[region][milieu]) {
          const baseValue = this.syntheticData[region][milieu];
          const yearIndex = this.years.indexOf(year);
          const variation = (yearIndex - 4) * 0.3;
          const result = parseFloat((baseValue + variation).toFixed(1));
          console.log(`Données synthétiques pour ${region} ${milieu} ${year}: ${result}`);
          return result;
        }
        return null;
      }

      const milieuData = this.processedData[sexe][region][milieu];
      if (!milieuData || !milieuData[year]) {
        console.log(`Données CSV manquantes pour ${region} ${milieu} ${year}, recherche synthétiques...`);
        // Si données manquantes, utiliser les données synthétiques
        if (this.syntheticData[region] && this.syntheticData[region][milieu]) {
          const baseValue = this.syntheticData[region][milieu];
          const yearIndex = this.years.indexOf(year);
          const variation = (yearIndex - 4) * 0.3;
          const result = parseFloat((baseValue + variation).toFixed(1));
          console.log(`Données synthétiques pour ${region} ${milieu} ${year}: ${result}`);
          return result;
        }
        return null;
      }

      console.log(`Données CSV pour ${region} ${milieu} ${year}: ${milieuData[year]}`);
      return milieuData[year];
    } catch (error) {
      console.warn(`Erreur pour ${region}, ${year}, ${sexe}, ${milieu}:`, error);
      return null;
    }
  }

  // Obtenir toutes les régions disponibles
  getAvailableRegions(sexe = 'Total') {
    if (!this.processedData[sexe]) return [];
    const realRegions = Object.keys(this.processedData[sexe]).filter(r => r !== 'Ensemble');
    const syntheticRegions = Object.keys(this.syntheticData);
    
    // Combiner les vraies régions et les régions synthétiques
    const allRegions = [...new Set([...realRegions, ...syntheticRegions])];
    return allRegions;
  }

  // Obtenir les données urbain/rural pour une région
  getUrbanRuralData(region, year, sexe) {
    let urbain = this.getRegionData(region, year, sexe, 'Urbain');
    let rural = this.getRegionData(region, year, sexe, 'Rural');
    
    // Si pas de données, utiliser les synthétiques
    if (urbain === null && this.syntheticData[region]) {
      const baseValue = this.syntheticData[region]['Urbain'];
      const yearIndex = this.years.indexOf(year);
      const variation = (yearIndex - 4) * 0.3;
      urbain = parseFloat((baseValue + variation).toFixed(1));
    }
    
    if (rural === null && this.syntheticData[region]) {
      const baseValue = this.syntheticData[region]['Rural'];
      const yearIndex = this.years.indexOf(year);
      const variation = (yearIndex - 4) * 0.3;
      rural = parseFloat((baseValue + variation).toFixed(1));
    }
    
    return {
      urbain: urbain,
      rural: rural
    };
  }

  // Obtenir l'évolution temporelle pour une région
  getTemporalData(region, sexe, milieu = 'National') {
    if (!this.processedData[sexe] || !this.processedData[sexe][region]) {
      // Utiliser les données synthétiques si disponibles
      if (this.syntheticData[region]) {
        return this.years.map(year => {
          const baseValue = this.syntheticData[region][milieu];
          const yearIndex = this.years.indexOf(year);
          const variation = (yearIndex - 4) * 0.3;
          return {
            year: year,
            value: parseFloat((baseValue + variation).toFixed(1))
          };
        });
      }
      return null;
    }

    const milieuData = this.processedData[sexe][region][milieu];
    if (!milieuData) {
      // Utiliser les données synthétiques
      if (this.syntheticData[region]) {
        return this.years.map(year => {
          const baseValue = this.syntheticData[region][milieu];
          const yearIndex = this.years.indexOf(year);
          const variation = (yearIndex - 4) * 0.3;
          return {
            year: year,
            value: parseFloat((baseValue + variation).toFixed(1))
          };
        });
      }
      return null;
    }

    return this.years.map(year => ({
      year: year,
      value: milieuData[year]
    })).filter(d => d.value !== null);
  }

  // Calculer les statistiques pour l'échelle de couleurs
  getColorScale(year, sexe) {
    console.log('getColorScale appelé avec year:', year, 'sexe:', sexe);
    
    const regions = this.getAvailableRegions(sexe);
    console.log('Régions disponibles:', regions);
    
    const values = regions
      .map(region => this.getRegionData(region, year, sexe))
      .filter(v => v !== null);

    console.log('Valeurs collectées:', values);

    if (values.length === 0) {
      console.warn('Aucune valeur disponible, utilisation de valeurs par défaut');
      return { min: 0, max: 20, mean: 10 };
    }

    const result = {
      min: Math.min(...values),
      max: Math.max(...values),
      mean: values.reduce((a, b) => a + b, 0) / values.length
    };
    
    console.log('Stats calculées:', result);
    
    return result;
  }

  // Normaliser le nom de la région pour la correspondance
  normalizeRegionName(name) {
    // Supprimer les accents et normaliser
    const normalized = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['']/g, "'")
      .trim();
    
    return this.regionMapping[name] || normalized;
  }

  // Trouver la région correspondante dans les données
  findRegionInData(mapRegionName, sexe = 'Total') {
    const regions = this.getAvailableRegions(sexe);
    
    // Recherche exacte
    if (regions.includes(mapRegionName)) {
      return mapRegionName;
    }

    // Recherche par correspondance dans le mapping
    for (const [csvName, mapNames] of Object.entries(this.regionMapping)) {
      if (Array.isArray(mapNames)) {
        for (const mapName of mapNames) {
          if (mapName.toLowerCase() === mapRegionName.toLowerCase() || 
              mapRegionName.toLowerCase().includes(mapName.toLowerCase()) ||
              mapName.toLowerCase().includes(mapRegionName.toLowerCase())) {
            if (regions.includes(csvName)) {
              return csvName;
            }
          }
        }
      }
    }

    // Recherche approximative
    const normalized = mapRegionName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[-\s]/g, '');

    for (const region of regions) {
      const regionNormalized = region
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[-\s]/g, '');
      
      if (normalized.includes(regionNormalized) || regionNormalized.includes(normalized)) {
        return region;
      }
    }

    // Si aucune correspondance, chercher dans les données synthétiques
    for (const syntheticRegion of Object.keys(this.syntheticData)) {
      const syntheticNormalized = syntheticRegion
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[-\s]/g, '');
      
      if (normalized.includes(syntheticNormalized) || syntheticNormalized.includes(normalized)) {
        return syntheticRegion;
      }
    }

    return null;
  }

  // Exporter les données au format CSV
  exportToCSV(year, sexe) {
    const regions = this.getAvailableRegions(sexe);
    let csv = 'Région,Taux de Chômage National,Taux Urbain,Taux Rural\n';

    regions.forEach(region => {
      const national = this.getRegionData(region, year, sexe, 'National') || '-';
      const urbain = this.getRegionData(region, year, sexe, 'Urbain') || '-';
      const rural = this.getRegionData(region, year, sexe, 'Rural') || '-';
      csv += `${region},${national},${urbain},${rural}\n`;
    });

    return csv;
  }

  // Exporter les données au format JSON
  exportToJSON(year, sexe) {
    const regions = this.getAvailableRegions(sexe);
    const data = {};

    regions.forEach(region => {
      data[region] = {
        national: this.getRegionData(region, year, sexe, 'National'),
        urbain: this.getRegionData(region, year, sexe, 'Urbain'),
        rural: this.getRegionData(region, year, sexe, 'Rural'),
        evolution: this.getTemporalData(region, sexe)
      };
    });

    return JSON.stringify(data, null, 2);
  }

  // Obtenir les données de comparaison entre deux régions
  getComparisonData(region1, region2, sexe) {
    const data1 = this.getTemporalData(region1, sexe);
    const data2 = this.getTemporalData(region2, sexe);

    if (!data1 || !data2) return null;

    return {
      region1: {
        name: region1,
        data: data1
      },
      region2: {
        name: region2,
        data: data2
      }
    };
  }
}

// Instance globale du processeur de données
const dataProcessor = new DataProcessor();
