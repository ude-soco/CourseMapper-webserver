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

hasPositiveScores = true; 

generateBarChart() {
  if (!this.barChartCanvas || !this.selectedWord) return;

  const canvas = this.barChartCanvas.nativeElement;
  canvas.width = 300;
  canvas.height = 250;

  const rawScores = this.getSimilarityScoresAlignedToFixedYaxis(this.selectedWord);
  const originalLabels = this.conceptsNames;

  // Filter out negative scores and corresponding labels/colors
  const filteredData: number[] = [];
  const filteredLabels: string[] = [];
  const filteredColors: string[] = [];

  rawScores.forEach((score, i) => {
    if (score > 0) {
      filteredData.push(score * 100); // scale to percentage
      filteredLabels.push(
        originalLabels[i].length > 17
          ? originalLabels[i].slice(0, 17) + '…'
          : originalLabels[i]
      );
      filteredColors.push(this.conceptColors[i] || 'red');
    }
  });

  // Determine whether to show chart or message
  this.hasPositiveScores = filteredData.length > 0;

  // Show/hide canvas
  canvas.style.display = this.hasPositiveScores ? 'block' : 'none';

  // Optional: if all negative, you can show a message in the container
  const container = canvas.parentElement;
  if (!this.hasPositiveScores && container) {
    container.querySelector('.no-bars-msg')?.remove();
    const msg = document.createElement('div');
    msg.className = 'no-bars-msg';
    msg.style.textAlign = 'center';
    msg.style.padding = '20px';
    msg.style.fontSize = '14px';
    msg.innerText = `This keyphrase '${this.selectedWord}' is not at all similar to the concept(s) used in generating recommendations.`;
    container.appendChild(msg);
    // destroy chart if exists
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    return;
  } else if (container) {
    container.querySelector('.no-bars-msg')?.remove();
  }

  if (this.chart) {
    this.chart.data.labels = filteredLabels;
    this.chart.data.datasets[0].data = filteredData;
    this.chart.data.datasets[0].backgroundColor = filteredColors;
    this.chart.update('none');
    return;
  }

  this.chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: filteredLabels,
      datasets: [
        {
          label: 'Similarity Score (%)',
          data: filteredData,
          backgroundColor: filteredColors,
          borderWidth: 1,
          barThickness: 20,
          categoryPercentage: 0.4,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: false,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      interaction: { mode: 'nearest', intersect: true },
      scales: {
        x: { beginAtZero: true, min: 0, max: 100, title: { display: true, text: 'Similarity Score (%)', font: { weight: 'bold', size: 14 } }, ticks: { stepSize: 20 }, grid: { display: false } },
        y: { grid: { display: false }, title: { display: true, text: 'Concepts', font: { weight: 'bold', size: 14 } } },
      },
      plugins: {
        tooltip: {
          enabled: true,
          callbacks: {
            title: (tooltipItems) => filteredLabels[tooltipItems[0].dataIndex],
            label: (tooltipItem) => (tooltipItem.raw as number).toFixed(2) + '%',
          },
        },
        datalabels: {
          anchor: 'end',
          align: 'right',
          formatter: (value) => (value as number).toFixed(2) + '%',
          color: '#000',
          font: { weight: 'bold' },
        },
        legend: { display: false },
      },
    },
    plugins: [ChartDataLabels],
  });
}

}
