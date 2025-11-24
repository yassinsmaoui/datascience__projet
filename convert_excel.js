// Script pour nettoyer et formatter les données Excel
const XLSX = require('xlsx');
const fs = require('fs');

// Lire le fichier Excel
const workbook = XLSX.readFile('repartition-retraites-par-region_2022.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convertir en JSON brut
const rawData = XLSX.utils.sheet_to_json(worksheet);

// Nettoyer et formater les données
const cleanedData = rawData
  .filter(row => row.__EMPTY_1 && row.__EMPTY_4 && typeof row.__EMPTY_4 === 'number')
  .map(row => ({
    region: row.__EMPTY_1.trim(),
    feminin: row.__EMPTY_2 || 0,
    masculin: row.__EMPTY_3 || 0,
    total: row.__EMPTY_4
  }));

// Sauvegarder dans un fichier JSON
fs.writeFileSync('data.json', JSON.stringify(cleanedData, null, 2), 'utf8');

console.log('✓ Conversion réussie! Fichier data.json créé.');
console.log(`✓ ${cleanedData.length} régions trouvées\n`);
console.log('Aperçu des données:');
cleanedData.forEach(d => {
  console.log(`  ${d.region}: ${d.total} retraités`);
});
