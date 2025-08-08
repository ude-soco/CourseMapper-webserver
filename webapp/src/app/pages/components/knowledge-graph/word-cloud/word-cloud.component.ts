import { Component, AfterViewInit, ElementRef, ViewChild, Input, NgZone  } from '@angular/core';
import * as WordCloud from 'wordcloud';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);

Chart.register(...registerables);

@Component({
  selector: 'app-word-cloud',
  templateUrl: './word-cloud.component.html',
  styleUrls: ['./word-cloud.component.css']
})
export class WordCloudComponent implements AfterViewInit {
  @ViewChild('wordCloudCanvas', { static: false }) wordCloudCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas', { static: false }) barChartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() keyphrasesImportanceTuple: any[] = [];
  @Input() public concepts: { name: string }[] = [];
  @Input() keyphrases_dnu_similarity_score: any[];
  @Input() public dnuColors!: string[];

  selectedWord: string | null = null; 
  chart: any; // Stores the chart instance
  public notUnderstoodConceptsNames: string[]= [];

  ngOnInit() {
    this.getNotUnderstoodConceptNamesYaxis();

  }

  ngAfterViewInit() {
    this.generateWordCloud();
  }
  constructor(private ngZone: NgZone) {}


cleanKeyphrase(kp: string): string {
  return kp
    .replace(/\\[a-zA-Z]+\s*/g, '')  // Remove LaTeX commands like \displaystyle
    .replace(/[{}]/g, '')            // Remove braces
    .trim();
}
generateWordCloud() {
if (!this.wordCloudCanvas) return;

const canvas = this.wordCloudCanvas.nativeElement;
canvas.width = 300;
canvas.height = 250;
canvas.style.marginTop = '0';
canvas.style.marginBottom = '0';

// Build cleaned display list: [cleanedText, weight]
const displayTuples = this.keyphrasesImportanceTuple.map(([phrase, weight]) => {
const rawPhrase = Array.isArray(phrase) ? phrase[0] : phrase;
const cleaned = this.cleanKeyphrase(rawPhrase);
return [cleaned, weight];
});

// Extract DNU names
this.notUnderstoodConceptsNames = this.concepts?.map(dnu => dnu.name) ?? [];

// Color mapping based on original phrases
const colorMapping = new Map<string, string>();
for (let i = 0; i < this.keyphrasesImportanceTuple.length; i++) {
const rawPhrase = Array.isArray(this.keyphrasesImportanceTuple[i][0])
? this.keyphrasesImportanceTuple[i][0][0]
: this.keyphrasesImportanceTuple[i][0];
const correspondingDnu = this.keyphrases_dnu_similarity_score[i]
  ? Object.keys(this.keyphrases_dnu_similarity_score[i])[0]
  : undefined;

const index = this.notUnderstoodConceptsNames.indexOf(correspondingDnu);
const color = index !== -1 ? this.dnuColors[index] : 'red';
colorMapping.set(this.cleanKeyphrase(rawPhrase), color); // color by cleaned keyphrase
}

WordCloud(canvas, {
list: displayTuples, // use cleaned phrases for display
gridSize: 10,
weightFactor: 150,
fontFamily: 'Arial, sans-serif',
color: (word) => colorMapping.get(word) || 'red',
rotateRatio: 0,
rotationSteps: 0,
backgroundColor: 'white',
hover: (item) => {
if (item) {
const cleanedWord = item[0];
    // Find original uncleaned phrase that maps to this cleaned one
    const originalMatch = this.keyphrasesImportanceTuple.find(([phrase]) => {
      const rawPhrase = Array.isArray(phrase) ? phrase[0] : phrase;
      return this.cleanKeyphrase(rawPhrase) === cleanedWord;
    });

    const originalWord = originalMatch
      ? (Array.isArray(originalMatch[0]) ? originalMatch[0][0] : originalMatch[0])
      : cleanedWord;

    this.ngZone.runOutsideAngular(() => {
      this.selectedWord = originalWord;
      this.generateBarChart();
    });
  }
}
});
}
/* 

  generateWordCloud() {
    if (this.wordCloudCanvas) {
      const canvas = this.wordCloudCanvas.nativeElement;
      canvas.width = 300;  // ✅ Set fixed width
      canvas.height = 250; // ✅ Set fixed height
      canvas.style.marginTop = '0';
      canvas.style.marginBottom = '0';
  
      // Normalize keyphrases
      const normalizedKeyphrases = this.keyphrasesImportanceTuple.map(kp => Array.isArray(kp) ? kp[0] : kp);
  
      // Extract similarity score mapping
      this.notUnderstoodConceptsNames = this.concepts?.map(dnu => dnu.name) ?? [];
  
      // Create color mapping based on similarity score
      const colorMapping = new Map<string, string>();
      for (let i = 0; i < normalizedKeyphrases.length; i++) {
        const kp = normalizedKeyphrases[i];
        const correspondingDnu = this.keyphrases_dnu_similarity_score[i] 
                                  ? Object.keys(this.keyphrases_dnu_similarity_score[i])[0] 
                                  : undefined;
  
        const index = this.notUnderstoodConceptsNames.indexOf(correspondingDnu);
        const color = index !== -1 ? this.dnuColors[index] : "red"; // Default to red if not found
        colorMapping.set(kp, color);
      }
      const cleanedTuples = this.keyphrasesImportanceTuple.map(([phrase, weight]) => {
const rawPhrase = Array.isArray(phrase) ? phrase[0] : phrase;
return [this.cleanKeyphrase(rawPhrase), weight];
});
  
      // Generate the word cloud with the custom colors
      WordCloud(canvas, {
        list: cleanedTuples,
        gridSize: 10,
        weightFactor: 150,
        fontFamily: 'Arial, sans-serif',
        color: (word) => colorMapping.get(word) || 'red',  // Use the color mapping here
        rotateRatio: 0,
        rotationSteps: 0,
        backgroundColor: 'white',
        hover: (item) => { 
          if (item) {
            this.ngZone.runOutsideAngular(() => { 
              this.selectedWord = item[0]; 
              this.generateBarChart();
            });
          }
        }
      });
    }
  } */


  getNotUnderstoodConceptNamesYaxis() {
    this.notUnderstoodConceptsNames = this.concepts?.map(dnu => { 
      return dnu.name;
    }) ?? [];
    
  }

getSimilarityScoresAlignedToFixedYaxis(keyphrase: string): number[] {
  const index = this.keyphrasesImportanceTuple.findIndex(tuple => tuple[0] === keyphrase);
  if (index === -1) {
    console.warn(`Keyphrase "${keyphrase}" not found.`);
    return [];
  }

  const similarityObject = this.keyphrases_dnu_similarity_score[index];

  // Map scores based on fixed Y-axis order
  return this.notUnderstoodConceptsNames.map(dnu => {
    return similarityObject.hasOwnProperty(dnu) ? similarityObject[dnu] : 0;
  });
}


generateBarChart() {
  if (!this.barChartCanvas || !this.selectedWord) return;

  const canvas = this.barChartCanvas.nativeElement;
  canvas.style.width = '300px';
  canvas.style.height = '250px';

  const labels = this.notUnderstoodConceptsNames;
  const rawScores = this.getSimilarityScoresAlignedToFixedYaxis(this.selectedWord);
  const scaledData = rawScores.map(score => score * 100);

  const dynamicBarColors = labels.map(label => {
    const index = this.notUnderstoodConceptsNames.indexOf(label);
    return index !== -1 ? this.dnuColors[index] : 'red';
  });

  if (this.chart) {
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = scaledData;
    this.chart.data.datasets[0].backgroundColor = dynamicBarColors;
    this.chart.update('none');
    return;
  }

  this.chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Similarity Score (%)',
        data: scaledData,
        backgroundColor: dynamicBarColors,
        borderWidth: 1,
        barThickness: 20,
        categoryPercentage: 0.4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: false,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      scales: {
        x: {
          beginAtZero: true,
          min: 0,
          max: 100,
          title: { display: true, text: 'Similarity Score (%)', font: { weight: 'bold', size: 14 } },
          ticks: { stepSize: 20, callback: (value) => Number(value).toFixed(0) },
          grid: { display: false }
        },
        y: {
          title: { display: true, text: 'DNU Concepts', font: { weight: 'bold', size: 14 } },
          grid: { display: false }
        }
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'right',
          formatter: (value) => value.toFixed(2) + '%',
          color: '#000',
          font: { weight: 'bold' }
        },
        legend: {
      display: false  // 🔴 Hide the legend
    },
      }
    },
    plugins: [ChartDataLabels]
  });
}

  
}
