import { Component, AfterViewInit, ElementRef, ViewChild, Input, NgZone } from '@angular/core';
import * as WordCloud from 'wordcloud';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);

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
  @Input() public conceptColors!: string[];

  selectedWord: string | null = null; 
  chart: any; // Stores the chart instance
  public conceptsNames: string[]= [];

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.conceptsNames = this.concepts?.map(dnu => dnu.name) ?? [];
  }

  ngAfterViewInit() {
    this.generateWordCloud();
  }

  isURL(text: string): boolean {
  const trimmed = text.trim();
  return /^(https?:\/\/|www\.)[^\s]+/i.test(trimmed);
}

  cleanKeyphrase(kp: string): string {
    return kp
      .replace(/\\[a-zA-Z]+\s*/g, '')  
      .replace(/[{}]/g, '')            
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  generateKeyphraseVariants(kp: string): string[] {
    const variants = new Set<string>();
    const base = kp.toLowerCase().trim();
    const collapsed = base.replace(/\s+/g, ' ');
    variants.add(collapsed);
    variants.add(collapsed.replace(/\s*-\s*/g, '-'));
    variants.add(collapsed.replace(/\s*-\s*/g, ' - '));
    variants.add(collapsed.replace(/\s*-\s*/g, ' '));
    variants.add(collapsed.normalize("NFD").replace(/[\u0300-\u036f]/g, ''));
    const pluralForm = collapsed.replace(/(\b\w+)$/, '$1s');
    variants.add(pluralForm);
    if (collapsed.endsWith('s')) variants.add(collapsed.slice(0, -1));
    return Array.from(variants);
  }

  escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  generateWordCloud() {
    if (!this.wordCloudCanvas) return;

    const canvas = this.wordCloudCanvas.nativeElement;
    canvas.width = 300;
    canvas.height = 250;

    const weights = this.keyphrasesImportanceTuple.map(([_, w]) => w);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    const scaleWeight = (w: number, minFont = 10, maxFont = 50) => {
      if (maxWeight === minWeight) return (minFont + maxFont) / 2;
      return ((w - minWeight) / (maxWeight - minWeight)) * (maxFont - minFont) + minFont;
    };

// Build cleaned display list
const displayTuples = this.keyphrasesImportanceTuple
  .map(([phrase, weight]) => {
    const rawPhrase = Array.isArray(phrase) ? phrase[0] : phrase;
    const cleaned = this.cleanKeyphrase(rawPhrase);

    // 🧠 Skip URLs (same logic as in card article component)
    if (this.isURL(cleaned)) {
    /*   //  For debugging:
    console.warn(`Skipping URL-like keyphrase in word cloud: "${cleaned}"`); */
      return null;
    }

    return [cleaned, scaleWeight(weight)]; // scaled font size
  })
  .filter((item): item is [string, number] => !!item); // filter out nulls


    // Map colors by cleaned keyphrase
    const colorMapping = new Map<string, string>();
    for (let i = 0; i < this.keyphrasesImportanceTuple.length; i++) {
      const rawPhrase = Array.isArray(this.keyphrasesImportanceTuple[i][0])
        ? this.keyphrasesImportanceTuple[i][0][0]
        : this.keyphrasesImportanceTuple[i][0];
      const cleaned = this.cleanKeyphrase(rawPhrase);
      const correspondingDnu = this.keyphrases_dnu_similarity_score[i]
        ? Object.keys(this.keyphrases_dnu_similarity_score[i])[0]
        : undefined;
      const index = this.conceptsNames.indexOf(correspondingDnu);
      const color = index !== -1 ? this.conceptColors[index] : 'red';
      colorMapping.set(cleaned, color);
    }

    WordCloud(canvas, {
      list: displayTuples,
      gridSize: 10,
      weightFactor: size => size,
      fontFamily: 'Arial, sans-serif',
      color: (word) => colorMapping.get(word) || 'red',
      rotateRatio: 0,
      rotationSteps: 0,
      backgroundColor: 'white',
      hover: (item) => {
        if (item) {
          const cleanedWord = item[0];
          const originalMatch = this.keyphrasesImportanceTuple.find(([phrase]) => {
            const rawPhrase = Array.isArray(phrase) ? phrase[0][0] ?? phrase[0] : phrase;
            return this.generateKeyphraseVariants(this.cleanKeyphrase(rawPhrase))
                       .includes(cleanedWord);
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

  getSimilarityScoresAlignedToFixedYaxis(keyphrase: string): number[] {
    const cleanedKey = this.cleanKeyphrase(keyphrase);
    const index = this.keyphrasesImportanceTuple.findIndex(tuple => {
      const rawPhrase = Array.isArray(tuple[0]) ? tuple[0][0] : tuple[0];
      return this.generateKeyphraseVariants(this.cleanKeyphrase(rawPhrase))
                 .includes(cleanedKey);
    });

    if (index === -1) {
      /* //  For debugging:
       console.warn(`Keyphrase "${keyphrase}" not found (after cleaning).`); */
      return [];
    }

    const similarityObject = this.keyphrases_dnu_similarity_score[index];
    return this.conceptsNames.map(dnu =>
      similarityObject && Object.prototype.hasOwnProperty.call(similarityObject, dnu)
        ? similarityObject[dnu]
        : 0
    );
  }

  generateBarChart() {
  if (!this.barChartCanvas || !this.selectedWord) return;

  const canvas = this.barChartCanvas.nativeElement;
  canvas.width = 300;
  canvas.height = 250;

  const labels = this.conceptsNames;
  const rawScores = this.getSimilarityScoresAlignedToFixedYaxis(this.selectedWord);

  // Clamp negative scores to 0 and scale to percentage
  const scaledData = rawScores.map(score => Math.max(0, score) * 100);

  const dynamicBarColors = labels.map((label, index) => this.conceptColors[index] || 'red');

  // Truncate long labels
  const maxLabelLength = 17;
  const truncatedLabels = labels.map(label =>
    label.length > maxLabelLength ? label.slice(0, maxLabelLength) + '…' : label
  );

  if (this.chart) {
    this.chart.data.labels = truncatedLabels;
    this.chart.data.datasets[0].data = scaledData;
    this.chart.data.datasets[0].backgroundColor = dynamicBarColors;
    this.chart.update('none');
    return;
  }

  this.chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: truncatedLabels,
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
      interaction: {
        mode: 'nearest',
        intersect: true
      },
      scales: {
        x: {
          beginAtZero: true,
          min: 0,
          max: 100,
          title: { display: true, text: 'Similarity Score (%)', font: { weight: 'bold', size: 14 } },
          ticks: { stepSize: 20 },
          grid: { display: false } // remove vertical grid lines
        },
        y: {
          grid: { display: false }, // remove horizontal grid lines
          title: { display: true, text: 'Concepts', font: { weight: 'bold', size: 14 } }
        }
      },
      plugins: {
        tooltip: {
          enabled: true,
          callbacks: {
            title: (tooltipItems) => labels[tooltipItems[0].dataIndex],
            label: (tooltipItem) => (tooltipItem.raw as number).toFixed(2) + '%'
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'right',
          formatter: (value) => (value as number).toFixed(2) + '%',
          color: '#000',
          font: { weight: 'bold' }
        },
        legend: { display: false }
      }
    },
    plugins: [ChartDataLabels]
  });
}

}
