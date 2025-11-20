// app.js - Application principale de visualisation
class MoroccoUnemploymentViz {
  constructor() {
    this.width = 800;
    this.height = 600;
    this.selectedRegion = null;
    this.currentYear = '2023';
    this.currentSex = 'Total';
    this.mapData = null;
    
    // Initialiser une échelle de couleurs par défaut
    this.colorScale = d3.scaleSequential()
      .domain([0, 20])
      .interpolator(d3.interpolateRgb('#2ecc71', '#e74c3c'));
    
    this.init();
  }

  async init() {
    try {
      // Afficher le loader
      document.getElementById('loading').classList.remove('hidden');

      console.log('Début du chargement des données...');

      // Charger les données CSV
      await dataProcessor.loadData('Taux de chomage par sexe et region.csv');

      console.log('Données CSV chargées avec succès');

      // Charger la carte du Maroc
      console.log('Chargement de la carte...');
      this.mapData = await d3.json('https://cdn.jsdelivr.net/npm/morocco-map/data/regions.json');

      console.log('Carte chargée avec succès');

      // Initialiser l'échelle de couleurs AVANT la carte
      this.updateColorScale();
      console.log('Échelle de couleurs créée');

      // Initialiser les visualisations
      this.setupMap();
      this.createLegend();
      this.setupEventListeners();

      // Masquer le loader
      document.getElementById('loading').classList.add('hidden');

      // Afficher un message initial
      document.getElementById('selected-region').textContent = 
        'Survolez une région pour voir les statistiques';
      document.getElementById('pie-info').textContent = 'Survolez une région';
      document.getElementById('bar-info').textContent = 'Survolez une région';
      
      // Afficher une visualisation par défaut pour la première région
      const firstRegion = dataProcessor.getAvailableRegions(this.currentSex)[0];
      if (firstRegion) {
        console.log('Affichage initial pour:', firstRegion);
        this.updatePieChart(firstRegion);
        this.updateBarChart(firstRegion);
        document.getElementById('pie-info').innerHTML = 
          `<strong>${firstRegion}</strong> - ${this.currentYear} (exemple)`;
        document.getElementById('bar-info').innerHTML = 
          `<strong>${firstRegion}</strong> - Évolution (exemple)`;
      }
      
      console.log('Initialisation terminée avec succès!');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      console.error('Stack trace:', error.stack);
      document.getElementById('loading').innerHTML = 
        `<div class="error-message">
          <h2>❌ Erreur de chargement</h2>
          <p>${error.message}</p>
          <p>Vérifiez la console pour plus de détails (F12)</p>
          <button onclick="location.reload()">🔄 Recharger</button>
        </div>`;
    }
  }

  setupEventListeners() {
    // Filtres
    d3.select('#year-select').on('change', () => {
      this.currentYear = d3.event.target.value;
      this.updateVisualization();
    });

    d3.select('#sex-select').on('change', () => {
      this.currentSex = d3.event.target.value;
      this.updateVisualization();
    });

    // Export
    d3.select('#export-btn').on('click', () => this.exportData());

    // Comparaison
    d3.select('#compare-btn').on('click', () => this.openComparisonModal());
    d3.select('.close-modal').on('click', () => this.closeComparisonModal());
  }

  setupMap() {
    const svg = d3.select('#map-svg');
    const container = svg.node().parentElement;
    const containerWidth = container.clientWidth - 40;
    
    svg.attr('width', containerWidth).attr('height', this.height);

    const regions = topojson.feature(this.mapData, this.mapData.objects.regions);
    
    const projection = d3.geoMercator().fitSize([containerWidth, this.height], regions);
    const pathGenerator = d3.geoPath().projection(projection);

    // Créer le groupe pour la carte
    const mapGroup = svg.append('g').attr('class', 'map-group');

    // Dessiner les régions
    mapGroup.selectAll('path')
      .data(regions.features)
      .enter()
      .append('path')
      .attr('class', 'region')
      .attr('d', pathGenerator)
      .attr('data-region', d => d.properties.name || d.properties['name:ar'])
      .on('mouseover', (d) => {
        this.handleRegionHover(d);
        this.handleRegionSelect(d); // Mettre à jour les visualisations au survol
      })
      .on('mouseout', () => this.handleRegionOut())
      .on('click', (d) => this.handleRegionClick(d));

    this.updateMapColors();
  }

  updateColorScale() {
    const stats = dataProcessor.getColorScale(this.currentYear, this.currentSex);
    
    console.log('Stats pour échelle de couleurs:', stats);
    
    if (!stats || stats.min === undefined || stats.max === undefined) {
      console.error('Stats invalides, utilisation de valeurs par défaut');
      this.colorScale = d3.scaleSequential()
        .domain([0, 20])
        .interpolator(d3.interpolateRgb('#2ecc71', '#e74c3c'));
      return;
    }
    
    // Créer une échelle de couleurs (vert -> jaune -> orange -> rouge)
    this.colorScale = d3.scaleSequential()
      .domain([stats.min, stats.max])
      .interpolator(d3.interpolateRgb('#2ecc71', '#e74c3c'));
      
    console.log('Échelle de couleurs créée avec domaine:', [stats.min, stats.max]);
  }

  updateMapColors() {
    const svg = d3.select('#map-svg');
    
    svg.selectAll('.region')
      .transition()
      .duration(500)
      .attr('fill', (d) => {
        const regionName = d.properties.name || d.properties['name:ar'];
        const dataRegion = dataProcessor.findRegionInData(regionName, this.currentSex);
        
        console.log('Région carte:', regionName, '-> Région data:', dataRegion);
        
        if (dataRegion) {
          const value = dataProcessor.getRegionData(
            dataRegion, 
            this.currentYear, 
            this.currentSex
          );
          
          console.log('Valeur pour', dataRegion, ':', value);
          
          if (value !== null) {
            return this.colorScale(value);
          }
        }
        return '#cccccc';
      });
  }

  createLegend() {
    const legend = d3.select('#legend');
    legend.html('');

    const stats = dataProcessor.getColorScale(this.currentYear, this.currentSex);
    
    // Créer un gradient SVG pour la légende
    const legendSvg = legend.append('svg')
      .attr('width', 300)
      .attr('height', 60);

    // Définir le gradient
    const defs = legendSvg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#2ecc71');

    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#f39c12');

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#e74c3c');

    // Rectangle avec gradient
    legendSvg.append('rect')
      .attr('x', 50)
      .attr('y', 10)
      .attr('width', 200)
      .attr('height', 20)
      .style('fill', 'url(#legend-gradient)')
      .style('stroke', '#ddd')
      .style('stroke-width', 1);

    // Labels
    legendSvg.append('text')
      .attr('x', 50)
      .attr('y', 45)
      .style('font-size', '12px')
      .style('text-anchor', 'start')
      .text(`${stats.min.toFixed(1)}%`);

    legendSvg.append('text')
      .attr('x', 250)
      .attr('y', 45)
      .style('font-size', '12px')
      .style('text-anchor', 'end')
      .text(`${stats.max.toFixed(1)}%`);

    legendSvg.append('text')
      .attr('x', 150)
      .attr('y', 8)
      .style('font-size', '11px')
      .style('text-anchor', 'middle')
      .style('fill', '#666')
      .text('Taux de chômage');
  }

  handleRegionHover(d) {
    const regionName = d.properties.name || d.properties['name:ar'];
    const dataRegion = dataProcessor.findRegionInData(regionName, this.currentSex);
    
    if (dataRegion) {
      const value = dataProcessor.getRegionData(
        dataRegion, 
        this.currentYear, 
        this.currentSex
      );
      
      if (value !== null) {
        document.getElementById('selected-region').innerHTML = 
          `<strong>${dataRegion}</strong>: ${value.toFixed(1)}%`;
      } else {
        document.getElementById('selected-region').textContent = 
          `${dataRegion}: Données non disponibles`;
      }

      // Mettre en évidence la région survolée
      d3.selectAll('.region').style('opacity', 0.5);
      d3.select(d3.event.target).style('opacity', 1);
    } else {
      document.getElementById('selected-region').textContent = regionName;
    }
  }

  handleRegionOut() {
    // Rétablir l'opacité normale
    d3.selectAll('.region').style('opacity', 1);
    
    if (!this.selectedRegion) {
      document.getElementById('selected-region').textContent = 
        'Survolez une région pour voir les statistiques';
      
      // Réinitialiser les visualisations
      document.getElementById('pie-info').textContent = 'Survolez une région';
      document.getElementById('bar-info').textContent = 'Survolez une région';
      
      d3.select('#pie-svg').selectAll('*').remove();
      d3.select('#bar-svg').selectAll('*').remove();
    }
  }

  handleRegionSelect(d) {
    const regionName = d.properties.name || d.properties['name:ar'];
    const dataRegion = dataProcessor.findRegionInData(regionName, this.currentSex);
    
    console.log('Region sélectionnée:', dataRegion);
    
    if (!dataRegion) {
      console.log('Pas de données pour cette région');
      return;
    }

    // Mettre à jour les visualisations
    console.log('Mise à jour des visualisations pour:', dataRegion);
    this.updatePieChart(dataRegion);
    this.updateBarChart(dataRegion);
  }

  handleRegionClick(d) {
    const regionName = d.properties.name || d.properties['name:ar'];
    const dataRegion = dataProcessor.findRegionInData(regionName, this.currentSex);
    
    if (!dataRegion) {
      alert('Données non disponibles pour cette région');
      return;
    }

    // Mettre à jour la région sélectionnée (pour maintenir fixe)
    this.selectedRegion = dataRegion;

    // Mettre en évidence visuellement avec bordure
    d3.selectAll('.region').classed('selected', false);
    d3.select(d3.event.target).classed('selected', true);

    // Mettre à jour l'info avec style spécial pour la sélection
    const value = dataProcessor.getRegionData(
      dataRegion, 
      this.currentYear, 
      this.currentSex
    );
    
    document.getElementById('selected-region').innerHTML = 
      `<strong style="color: #e74c3c;">📍 Région fixée:</strong> ${dataRegion} (${value ? value.toFixed(1) + '%' : 'N/A'})`;
  }

  updatePieChart(region) {
    console.log('updatePieChart appelé pour:', region);
    
    const svg = d3.select('#pie-svg');
    svg.selectAll('*').remove();

    const urbanRuralData = dataProcessor.getUrbanRuralData(
      region, 
      this.currentYear, 
      this.currentSex
    );

    console.log('Données urbain/rural:', urbanRuralData);

    if (!urbanRuralData.urbain || !urbanRuralData.rural) {
      document.getElementById('pie-info').textContent = 
        'Données urbain/rural non disponibles';
      console.log('Données urbain/rural manquantes');
      return;
    }

    document.getElementById('pie-info').innerHTML = 
      `<strong>${region}</strong> - ${this.currentYear}`;

    const data = [
      { label: 'Urbain', value: urbanRuralData.urbain },
      { label: 'Rural', value: urbanRuralData.rural }
    ];

    console.log('Données pie chart:', data);

    const container = svg.node().parentElement;
    const containerRect = container.getBoundingClientRect();
    let width = containerRect.width - 40;
    let height = 300; // Hauteur fixe pour éviter les problèmes
    
    // Sécurité: dimensions minimales
    if (width < 200 || isNaN(width)) {
      width = 350;
      console.log('Width ajusté à:', width);
    }
    
    const radius = Math.min(width, height) / 2 - 40;

    console.log('Dimensions pie chart - width:', width, 'height:', height, 'radius:', radius);

    if (width <= 0 || height <= 0 || radius <= 0) {
      console.error('Dimensions invalides pour le pie chart!');
      document.getElementById('pie-info').textContent = 'Erreur de dimensions';
      return;
    }

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(['Urbain', 'Rural'])
      .range(['#3498db', '#27ae60']);

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const arcHover = d3.arc()
      .innerRadius(0)
      .outerRadius(radius + 10);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('class', 'pie-slice')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label))
      .on('mouseover', function(d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover);
      })
      .on('mouseout', function(d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc);
      })
      .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });

    // Labels
    arcs.append('text')
      .attr('class', 'pie-label')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-weight', 'bold')
      .text(d => d.data.label)
      .style('opacity', 0)
      .transition()
      .delay(800)
      .duration(400)
      .style('opacity', 1);

    // Pourcentages
    arcs.append('text')
      .attr('class', 'pie-percentage')
      .attr('transform', d => {
        const pos = arc.centroid(d);
        return `translate(${pos[0]}, ${pos[1] + 18})`;
      })
      .attr('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-weight', 'bold')
      .text(d => `${d.data.value.toFixed(1)}%`)
      .style('opacity', 0)
      .transition()
      .delay(800)
      .duration(400)
      .style('opacity', 1);

    // Légende
    const legend = svg.append('g')
      .attr('transform', `translate(20, 20)`);

    data.forEach((d, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendRow.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', color(d.label))
        .attr('rx', 3);

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('font-size', '13px')
        .text(`${d.label}: ${d.value.toFixed(1)}%`);
    });
  }

  updateBarChart(region) {
    console.log('updateBarChart appelé pour:', region);
    
    const svg = d3.select('#bar-svg');
    svg.selectAll('*').remove();

    const temporalData = dataProcessor.getTemporalData(region, this.currentSex);

    console.log('Données temporelles:', temporalData);

    if (!temporalData || temporalData.length === 0) {
      document.getElementById('bar-info').textContent = 
        'Données temporelles non disponibles';
      console.log('Données temporelles manquantes');
      return;
    }

    document.getElementById('bar-info').innerHTML = 
      `<strong>${region}</strong> - Évolution`;

    console.log('Création du bar chart avec', temporalData.length, 'points');

    const container = svg.node().parentElement;
    const containerRect = container.getBoundingClientRect();
    let width = containerRect.width - 40;
    let height = 300; // Hauteur fixe pour éviter les problèmes
    
    // Sécurité: dimensions minimales
    if (width < 200 || isNaN(width)) {
      width = 500;
      console.log('Width ajusté à:', width);
    }
    
    const margin = { top: 20, right: 20, bottom: 60, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    console.log('Dimensions bar chart - width:', width, 'height:', height);
    console.log('Inner dimensions - innerWidth:', innerWidth, 'innerHeight:', innerHeight);

    if (width <= 0 || height <= 0 || innerWidth <= 0 || innerHeight <= 0) {
      console.error('Dimensions invalides pour le bar chart!');
      document.getElementById('bar-info').textContent = 'Erreur de dimensions';
      return;
    }

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Échelles
    const x = d3.scaleBand()
      .domain(temporalData.map(d => d.year))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(temporalData, d => d.value) * 1.1])
      .range([innerHeight, 0]);

    const colorBar = d3.scaleSequential()
      .domain([0, temporalData.length - 1])
      .interpolator(d3.interpolateRgb('#667eea', '#764ba2'));

    // Axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y).ticks(6);

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    g.append('g')
      .attr('class', 'axis')
      .call(yAxis);

    // Label Y
    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .text('Taux de chômage (%)');

    // Barres
    g.selectAll('.bar')
      .data(temporalData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.year))
      .attr('width', x.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', (d, i) => colorBar(i))
      .on('mouseover', function(d) {
        d3.select(this).attr('opacity', 0.7);
        
        // Afficher la valeur
        const xPos = x(d.year) + x.bandwidth() / 2;
        const yPos = y(d.value) - 5;
        
        g.append('text')
          .attr('class', 'bar-value')
          .attr('x', xPos)
          .attr('y', yPos)
          .attr('text-anchor', 'middle')
          .style('font-weight', 'bold')
          .style('fill', '#e74c3c')
          .text(`${d.value.toFixed(1)}%`);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        g.selectAll('.bar-value').remove();
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => y(d.value))
      .attr('height', d => innerHeight - y(d.value));

    // Ligne de tendance
    const line = d3.line()
      .x(d => x(d.year) + x.bandwidth() / 2)
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    const path = g.append('path')
      .datum(temporalData)
      .attr('class', 'trend-line')
      .attr('fill', 'none')
      .attr('stroke', '#e74c3c')
      .attr('stroke-width', 2)
      .attr('d', line);

    const totalLength = path.node().getTotalLength();
    
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .delay(800)
      .attr('stroke-dashoffset', 0);
  }

  updateVisualization() {
    this.updateColorScale();
    this.updateMapColors();
    this.createLegend();

    if (this.selectedRegion) {
      this.updatePieChart(this.selectedRegion);
      this.updateBarChart(this.selectedRegion);
    }
  }

  exportData() {
    const csv = dataProcessor.exportToCSV(this.currentYear, this.currentSex);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `chomage_maroc_${this.currentYear}_${this.currentSex}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openComparisonModal() {
    const modal = document.getElementById('comparison-modal');
    modal.classList.add('active');

    // Remplir les selects avec les régions
    const regions = dataProcessor.getAvailableRegions(this.currentSex);
    
    ['region1-select', 'region2-select'].forEach(id => {
      const select = document.getElementById(id);
      select.innerHTML = '';
      regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        select.appendChild(option);
      });
    });

    // Event listeners
    document.getElementById('region1-select').addEventListener('change', () => this.updateComparison());
    document.getElementById('region2-select').addEventListener('change', () => this.updateComparison());

    this.updateComparison();
  }

  closeComparisonModal() {
    const modal = document.getElementById('comparison-modal');
    modal.classList.remove('active');
  }

  updateComparison() {
    const region1 = document.getElementById('region1-select').value;
    const region2 = document.getElementById('region2-select').value;

    const comparisonData = dataProcessor.getComparisonData(region1, region2, this.currentSex);
    
    if (!comparisonData) return;

    const svg = d3.select('#comparison-svg');
    svg.selectAll('*').remove();

    const width = 900;
    const height = 500;
    const margin = { top: 40, right: 120, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Combiner les données
    const allYears = [...new Set([
      ...comparisonData.region1.data.map(d => d.year),
      ...comparisonData.region2.data.map(d => d.year)
    ])].sort();

    // Échelles
    const x = d3.scalePoint()
      .domain(allYears)
      .range([0, innerWidth]);

    const allValues = [
      ...comparisonData.region1.data.map(d => d.value),
      ...comparisonData.region2.data.map(d => d.value)
    ];

    const y = d3.scaleLinear()
      .domain([0, d3.max(allValues) * 1.1])
      .range([innerHeight, 0]);

    // Axes
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    // Titre
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`Comparaison: ${region1} vs ${region2}`);

    // Lignes
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    const colors = ['#3498db', '#e74c3c'];
    const regions = [comparisonData.region1, comparisonData.region2];

    regions.forEach((region, i) => {
      // Ligne
      g.append('path')
        .datum(region.data)
        .attr('fill', 'none')
        .attr('stroke', colors[i])
        .attr('stroke-width', 3)
        .attr('d', line);

      // Points
      g.selectAll(`.point-${i}`)
        .data(region.data)
        .enter()
        .append('circle')
        .attr('class', `point-${i}`)
        .attr('cx', d => x(d.year))
        .attr('cy', d => y(d.value))
        .attr('r', 5)
        .attr('fill', colors[i])
        .on('mouseover', function(d) {
          d3.select(this).attr('r', 8);
          
          g.append('text')
            .attr('class', 'tooltip-text')
            .attr('x', x(d.year))
            .attr('y', y(d.value) - 10)
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text(`${d.value.toFixed(1)}%`);
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 5);
          g.selectAll('.tooltip-text').remove();
        });
    });

    // Légende
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 100}, ${margin.top})`);

    regions.forEach((region, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendRow.append('line')
        .attr('x1', 0)
        .attr('x2', 30)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', colors[i])
        .attr('stroke-width', 3);

      legendRow.append('text')
        .attr('x', 35)
        .attr('y', 5)
        .style('font-size', '12px')
        .text(region.name);
    });
  }
}

// Initialiser l'application au chargement
document.addEventListener('DOMContentLoaded', () => {
  const app = new MoroccoUnemploymentViz();
});
