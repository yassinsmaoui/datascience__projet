// ========================================
// CONFIGURATION ET INITIALISATION
// ========================================

// Dimensions
const width = 900;
const height = 900;
const histogramWidth = 500;
const histogramHeight = 800;
const pieChartSize = 350;
const pieRadius = Math.min(pieChartSize, pieChartSize) / 2 - 30;

// Marges pour l'histogramme
const margin = { top: 40, right: 30, bottom: 120, left: 80 };
const chartWidth = histogramWidth - margin.left - margin.right;
const chartHeight = histogramHeight - margin.top - margin.bottom;

// Variable globale pour stocker les données fusionnées
let mergedData = [];
let selectedRegion = null;
let isSorted = false;

// Échelles de couleur
const colorScale = d3.scaleSequential(d3.interpolateBlues);

// ========================================
// CRÉATION DES CONTENEURS SVG
// ========================================

const mapSvg = d3.select('#map')
  .attr('width', width)
  .attr('height', height);

const histogramSvg = d3.select('#histogram')
  .attr('width', histogramWidth)
  .attr('height', histogramHeight);

const histogramGroup = histogramSvg.append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

const pieChartSvg = d3.select('#pieChart')
  .attr('width', pieChartSize)
  .attr('height', pieChartSize);

const pieChartGroup = pieChartSvg.append('g')
  .attr('transform', `translate(${pieChartSize / 2}, ${pieChartSize / 2})`);

// ========================================
// CRÉATION DU TOOLTIP
// ========================================

const tooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0)
  .style('display', 'none');

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Normalise le nom d'une région pour la correspondance
 */
function normalizeRegionName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[àâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Trouve les données correspondantes pour une région
 */
function findRegionData(regionName, dataArray) {
  const normalized = normalizeRegionName(regionName);
  return dataArray.find(d => {
    const dataNormalized = normalizeRegionName(d.region);
    return dataNormalized === normalized || 
           dataNormalized.includes(normalized) || 
           normalized.includes(dataNormalized);
  });
}

/**
 * Formate un nombre avec des séparateurs de milliers
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Affiche le tooltip
 */
function showTooltip(event, data) {
  tooltip.transition()
    .duration(200)
    .style('opacity', 1)
    .style('display', 'block');

  const tooltipContent = `
    <div class="tooltip-title">${data.region}</div>
    <div class="tooltip-content">
      <div class="tooltip-row">
        <span class="tooltip-label">Total:</span>
        <span class="tooltip-value">${formatNumber(data.total)}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Masculin:</span>
        <span class="tooltip-value">${formatNumber(data.masculin)}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Féminin:</span>
        <span class="tooltip-value">${formatNumber(data.feminin)}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">% Féminin:</span>
        <span class="tooltip-value">${((data.feminin / data.total) * 100).toFixed(1)}%</span>
      </div>
    </div>
  `;

  tooltip.html(tooltipContent)
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 15) + 'px');
}

/**
 * Cache le tooltip
 */
function hideTooltip() {
  tooltip.transition()
    .duration(200)
    .style('opacity', 0)
    .on('end', () => tooltip.style('display', 'none'));
}

// ========================================
// GESTION DES SÉLECTIONS
// ========================================

/**
 * Sélectionne une région (carte + histogramme + graphique circulaire)
 */
function selectRegion(regionData) {
  // Si la même région est cliquée, on désélectionne
  if (selectedRegion === regionData.region) {
    selectedRegion = null;
    deselectAll();
    return;
  }

  selectedRegion = regionData.region;

  // Mise en surbrillance sur la carte
  mapSvg.selectAll('.region')
    .classed('selected', d => {
      const data = findRegionData(d.properties.name, mergedData);
      return data && data.region === regionData.region;
    });

  mapSvg.selectAll('.bubble')
    .classed('selected', d => d.region === regionData.region);

  // Mise en surbrillance dans l'histogramme
  histogramGroup.selectAll('.bar')
    .classed('selected', d => d.region === regionData.region);

  // Mettre à jour le graphique circulaire
  updatePieChart(regionData);
}

/**
 * Désélectionne tout
 */
function deselectAll() {
  selectedRegion = null;
  mapSvg.selectAll('.region, .bubble').classed('selected', false);
  histogramGroup.selectAll('.bar').classed('selected', false);
  updatePieChart(null);
}

// ========================================
// CRÉATION DE LA CARTE
// ========================================

/**
 * Dessine la carte du Maroc avec les cercles proportionnels
 */
function drawMap(geoData, data) {
  // Fusion des données géographiques et des données Excel
  mergedData = geoData.features.map(feature => {
    const regionData = findRegionData(feature.properties.name, data);
    return {
      ...feature,
      region: feature.properties.name,
      total: regionData ? regionData.total : 0,
      masculin: regionData ? regionData.masculin : 0,
      feminin: regionData ? regionData.feminin : 0
    };
  }).filter(d => d.total > 0); // Exclure les régions sans données

  // Projection Mercator adaptée au Maroc
  const projection = d3.geoMercator()
    .fitSize([width, height], geoData);

  const pathGenerator = d3.geoPath().projection(projection);

  // Échelle pour les cercles (rayon basé sur la racine carrée pour une aire proportionnelle)
  const radiusScale = d3.scaleSqrt()
    .domain([0, d3.max(mergedData, d => d.total)])
    .range([0, 50]);

  // Dessiner les régions
  const regions = mapSvg.selectAll('.region')
    .data(geoData.features)
    .enter()
    .append('path')
    .attr('class', 'region')
    .attr('d', pathGenerator)
    .on('mouseover', function(event, d) {
      const regionData = findRegionData(d.properties.name, mergedData);
      if (regionData && regionData.total > 0) {
        d3.select(this).classed('highlighted', true);
        showTooltip(event, regionData);
      }
    })
    .on('mouseout', function() {
      d3.select(this).classed('highlighted', false);
      hideTooltip();
    })
    .on('click', function(event, d) {
      const regionData = findRegionData(d.properties.name, mergedData);
      if (regionData && regionData.total > 0) {
        selectRegion(regionData);
      }
    });

  // Dessiner les cercles proportionnels
  const bubbles = mapSvg.selectAll('.bubble')
    .data(mergedData)
    .enter()
    .append('circle')
    .attr('class', 'bubble')
    .attr('cx', d => {
      const feature = geoData.features.find(f => 
        normalizeRegionName(f.properties.name) === normalizeRegionName(d.region)
      );
      if (feature) {
        const centroid = pathGenerator.centroid(feature);
        return centroid[0];
      }
      return 0;
    })
    .attr('cy', d => {
      const feature = geoData.features.find(f => 
        normalizeRegionName(f.properties.name) === normalizeRegionName(d.region)
      );
      if (feature) {
        const centroid = pathGenerator.centroid(feature);
        return centroid[1];
      }
      return 0;
    })
    .attr('r', 0)
    .on('mouseover', function(event, d) {
      d3.select(this).classed('highlighted', true);
      showTooltip(event, d);
    })
    .on('mouseout', function() {
      d3.select(this).classed('highlighted', false);
      hideTooltip();
    })
    .on('click', function(event, d) {
      selectRegion(d);
    });

  // Animation d'apparition des cercles
  bubbles.transition()
    .duration(1000)
    .delay((d, i) => i * 50)
    .attr('r', d => radiusScale(d.total));

  // Créer la légende
  createLegend(radiusScale);
}

// ========================================
// CRÉATION DE LA LÉGENDE
// ========================================

/**
 * Crée la légende pour les cercles proportionnels
 */
function createLegend(radiusScale) {
  const legendData = [
    { value: 10000, label: '10 000' },
    { value: 50000, label: '50 000' },
    { value: 80000, label: '80 000' }
  ];

  const legend = d3.select('.legend');
  
  legend.html('<div class="legend-title">Nombre de retraités</div>');

  const legendItems = legend.selectAll('.legend-item')
    .data(legendData)
    .enter()
    .append('div')
    .attr('class', 'legend-item');

  legendItems.append('span')
    .attr('class', 'legend-circle')
    .style('width', d => (radiusScale(d.value) * 2) + 'px')
    .style('height', d => (radiusScale(d.value) * 2) + 'px');

  legendItems.append('span')
    .attr('class', 'legend-label')
    .text(d => d.label);
}

// ========================================
// CRÉATION DE L'HISTOGRAMME
// ========================================

/**
 * Dessine l'histogramme interactif
 */
function drawHistogram(data) {
  // Nettoyer l'histogramme existant
  histogramGroup.selectAll('*').remove();

  // Filtrer et trier les données
  let chartData = data.filter(d => d.total > 0);
  
  if (isSorted) {
    chartData = chartData.sort((a, b) => b.total - a.total);
  }

  // Échelles
  const xScale = d3.scaleBand()
    .domain(chartData.map(d => d.region))
    .range([0, chartWidth])
    .padding(0.2);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(chartData, d => d.total)])
    .nice()
    .range([chartHeight, 0]);

  // Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale)
    .ticks(8)
    .tickFormat(d => d / 1000 + 'k');

  // Dessiner les barres
  const bars = histogramGroup.selectAll('.bar')
    .data(chartData, d => d.region)
    .join(
      enter => enter.append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.region))
        .attr('y', chartHeight)
        .attr('width', xScale.bandwidth())
        .attr('height', 0)
        .on('mouseover', function(event, d) {
          d3.select(this).classed('highlighted', true);
          
          // Mettre en surbrillance la région sur la carte
          mapSvg.selectAll('.region')
            .classed('highlighted', feature => {
              const regionData = findRegionData(feature.properties.name, mergedData);
              return regionData && regionData.region === d.region;
            });
          
          mapSvg.selectAll('.bubble')
            .classed('highlighted', bubble => bubble.region === d.region);
          
          showTooltip(event, d);
        })
        .on('mouseout', function() {
          d3.select(this).classed('highlighted', false);
          mapSvg.selectAll('.region, .bubble').classed('highlighted', false);
          hideTooltip();
        })
        .on('click', function(event, d) {
          selectRegion(d);
        })
        .call(enter => enter.transition()
          .duration(800)
          .delay((d, i) => i * 50)
          .attr('y', d => yScale(d.total))
          .attr('height', d => chartHeight - yScale(d.total))
        ),
      update => update.call(update => update.transition()
        .duration(500)
        .attr('x', d => xScale(d.region))
        .attr('y', d => yScale(d.total))
        .attr('width', xScale.bandwidth())
        .attr('height', d => chartHeight - yScale(d.total))
      ),
      exit => exit.call(exit => exit.transition()
        .duration(300)
        .attr('y', chartHeight)
        .attr('height', 0)
        .remove()
      )
    );

  // Ajouter les valeurs au-dessus des barres
  histogramGroup.selectAll('.bar-value')
    .data(chartData, d => d.region)
    .join(
      enter => enter.append('text')
        .attr('class', 'bar-value')
        .attr('x', d => xScale(d.region) + xScale.bandwidth() / 2)
        .attr('y', chartHeight)
        .attr('text-anchor', 'middle')
        .text(d => formatNumber(d.total))
        .style('opacity', 0)
        .call(enter => enter.transition()
          .duration(800)
          .delay((d, i) => i * 50)
          .attr('y', d => yScale(d.total) - 5)
          .style('opacity', 1)
        ),
      update => update.call(update => update.transition()
        .duration(500)
        .attr('x', d => xScale(d.region) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.total) - 5)
        .text(d => formatNumber(d.total))
      ),
      exit => exit.call(exit => exit.transition()
        .duration(300)
        .style('opacity', 0)
        .remove()
      )
    );

  // Axe X avec labels inclinés
  histogramGroup.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('class', 'bar-label')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')
    .attr('dx', '-0.8em')
    .attr('dy', '0.15em');

  // Axe Y
  histogramGroup.append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis);

  // Label axe Y
  histogramGroup.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -chartHeight / 2)
    .attr('y', -60)
    .attr('text-anchor', 'middle')
    .text('Nombre de retraités');
}

// ========================================
// CRÉATION DU GRAPHIQUE CIRCULAIRE
// ========================================

/**
 * Crée ou met à jour le graphique circulaire (donut chart)
 * Affiche la répartition masculin/féminin pour la région sélectionnée
 */
function updatePieChart(regionData) {
  // Nettoyer le graphique existant
  pieChartGroup.selectAll('*').remove();

  // Si aucune région n'est sélectionnée, afficher un message
  if (!regionData) {
    pieChartGroup.append('text')
      .attr('class', 'pie-placeholder')
      .attr('text-anchor', 'middle')
      .attr('dy', '0em')
      .style('font-size', '16px')
      .style('fill', '#7f8c8d')
      .style('font-weight', 'bold')
      .text('Sélectionnez une région');
    
    pieChartGroup.append('text')
      .attr('class', 'pie-placeholder')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .style('font-size', '13px')
      .style('fill', '#95a5a6')
      .text('pour voir la répartition');
    
    pieChartGroup.append('text')
      .attr('class', 'pie-placeholder')
      .attr('text-anchor', 'middle')
      .attr('dy', '2.8em')
      .style('font-size', '13px')
      .style('fill', '#95a5a6')
      .text('Masculin/Féminin');
    
    return;
  }

  // Préparer les données pour le graphique circulaire
  const pieData = [
    { category: 'Masculin', value: regionData.masculin, color: '#3498db' },
    { category: 'Féminin', value: regionData.feminin, color: '#e74c3c' }
  ];

  // Créer le générateur de secteurs (arc)
  const pie = d3.pie()
    .value(d => d.value)
    .sort(null);

  const arc = d3.arc()
    .innerRadius(pieRadius * 0.6)  // Donut chart (trou au centre)
    .outerRadius(pieRadius);

  const arcHover = d3.arc()
    .innerRadius(pieRadius * 0.6)
    .outerRadius(pieRadius + 10);

  // Dessiner les secteurs
  const arcs = pieChartGroup.selectAll('.arc')
    .data(pie(pieData))
    .enter()
    .append('g')
    .attr('class', 'arc');

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => d.data.color)
    .attr('stroke', 'white')
    .attr('stroke-width', 3)
    .style('opacity', 0)
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', arcHover)
        .style('opacity', 1);
      
      // Afficher tooltip
      const percentage = ((d.data.value / regionData.total) * 100).toFixed(1);
      tooltip.transition()
        .duration(200)
        .style('opacity', 1)
        .style('display', 'block');
      
      tooltip.html(`
        <div class="tooltip-title">${d.data.category}</div>
        <div class="tooltip-content">
          <div class="tooltip-row">
            <span class="tooltip-label">Nombre:</span>
            <span class="tooltip-value">${formatNumber(d.data.value)}</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Pourcentage:</span>
            <span class="tooltip-value">${percentage}%</span>
          </div>
        </div>
      `)
      .style('left', (event.pageX + 15) + 'px')
      .style('top', (event.pageY - 15) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', arc)
        .style('opacity', 1);
      
      hideTooltip();
    })
    .transition()
    .duration(800)
    .attrTween('d', function(d) {
      const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return function(t) {
        return arc(interpolate(t));
      };
    })
    .style('opacity', 1);

  // Ajouter les labels avec pourcentages
  arcs.append('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .attr('class', 'pie-label')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .style('fill', 'white')
    .style('opacity', 0)
    .text(d => {
      const percentage = ((d.data.value / regionData.total) * 100).toFixed(1);
      return `${percentage}%`;
    })
    .transition()
    .delay(800)
    .duration(400)
    .style('opacity', 1);

  // Ajouter le titre au centre
  pieChartGroup.append('text')
    .attr('class', 'pie-center-text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.5em')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#2c3e50')
    .style('opacity', 0)
    .text(regionData.region.length > 20 ? regionData.region.substring(0, 18) + '...' : regionData.region)
    .transition()
    .delay(600)
    .duration(400)
    .style('opacity', 1);

  pieChartGroup.append('text')
    .attr('class', 'pie-center-text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1em')
    .style('font-size', '24px')
    .style('font-weight', 'bold')
    .style('fill', '#3498db')
    .style('opacity', 0)
    .text(formatNumber(regionData.total))
    .transition()
    .delay(600)
    .duration(400)
    .style('opacity', 1);

  pieChartGroup.append('text')
    .attr('class', 'pie-center-text')
    .attr('text-anchor', 'middle')
    .attr('dy', '2.2em')
    .style('font-size', '12px')
    .style('fill', '#7f8c8d')
    .style('opacity', 0)
    .text('retraités')
    .transition()
    .delay(600)
    .duration(400)
    .style('opacity', 1);

  // Ajouter la légende
  const legend = pieChartGroup.append('g')
    .attr('class', 'pie-legend')
    .attr('transform', `translate(${-pieRadius - 20}, ${pieRadius + 40})`);

  pieData.forEach((d, i) => {
    const legendRow = legend.append('g')
      .attr('transform', `translate(0, ${i * 25})`);

    legendRow.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d.color)
      .attr('rx', 3)
      .style('opacity', 0)
      .transition()
      .delay(800 + i * 100)
      .duration(400)
      .style('opacity', 1);

    legendRow.append('text')
      .attr('x', 22)
      .attr('y', 12)
      .style('font-size', '13px')
      .style('fill', '#2c3e50')
      .style('opacity', 0)
      .text(`${d.category}: ${formatNumber(d.value)}`)
      .transition()
      .delay(800 + i * 100)
      .duration(400)
      .style('opacity', 1);
  });
}

// ========================================
// BOUTONS DE CONTRÔLE
// ========================================

/**
 * Gère le tri de l'histogramme
 */
d3.select('#sortBtn').on('click', function() {
  isSorted = !isSorted;
  const btn = d3.select(this);
  btn.text(isSorted ? 'Ordre alphabétique' : 'Trier par valeur');
  drawHistogram(mergedData);
});

/**
 * Réinitialise la sélection
 */
d3.select('#resetBtn').on('click', function() {
  deselectAll();
});

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================

/**
 * Fonction principale pour charger et initialiser la visualisation
 */
async function init() {
  try {
    // Afficher un indicateur de chargement
    d3.select('.loading').style('display', 'flex');

    // Charger les données en parallèle
    const [geoData, excelData] = await Promise.all([
      d3.json('https://cdn.jsdelivr.net/npm/morocco-map/data/regions.json'),
      d3.json('data.json')
    ]);

    // Convertir TopoJSON en GeoJSON
    const regions = topojson.feature(geoData, geoData.objects.regions);

    // Masquer l'indicateur de chargement
    d3.select('.loading').style('display', 'none');

    // Filtrer le TOTAL des données
    const filteredData = excelData.filter(d => d.region !== 'TOTAL');

    // Dessiner la carte, l'histogramme et le graphique circulaire
    drawMap(regions, filteredData);
    drawHistogram(filteredData);
    updatePieChart(null); // Initialiser avec aucune sélection

    console.log('✓ Visualisation chargée avec succès');
    console.log(`✓ ${filteredData.length} régions affichées`);

  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    d3.select('.loading').html('<p>Erreur lors du chargement des données. Veuillez vérifier la console.</p>');
  }
}

// Lancer l'initialisation au chargement de la page
init();
