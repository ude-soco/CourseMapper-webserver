import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SecurityContext,
  ViewChild, AfterViewInit, Renderer2, ChangeDetectorRef, AfterViewChecked, NgZone   ,
} from '@angular/core';
import { getCurrentPdfPage } from '../../../annotations/pdf-annotation/state/annotation.reducer';
import { ArticleElementModel } from '../models/article-element.model';
import { OverlayPanel } from 'primeng/overlaypanel';
import { DomSanitizer,SafeHtml } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Material } from 'src/app/models/Material';
import { Store } from '@ngrx/store';
import { State } from 'src/app/state/app.reducer';
import { Subscription } from 'rxjs';
import { ResourcesPagination } from 'src/app/models/croForm';

@Component({
  selector: 'app-card-article',
  templateUrl: './card-article.component.html',
  styleUrls: ['./card-article.component.css'],
})
export class CardArticleComponent {
  currentPdfPage: number;
  constructor(
    private sanitizer: DomSanitizer,
    private materialsRecommenderService: MaterialsRecommenderService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private store: Store<State>
  ) {
    // Subscribe to get the current PDF page from store
    this.subscriptions.add(
      this.store.select(getCurrentPdfPage).subscribe((page) => {
        this.currentPdfPage = page;
      })
    );
  }

  @Input() article!: ArticleElementModel;

  @Output() onClick: EventEmitter<any> = new EventEmitter();
  @Input() userId: string;
  @Input() currentMaterial?: Material;
  subscriptions: Subscription = new Subscription(); // Manage subscriptions
  ABSTRACT_MAX_LENGTH = 600;
  TITLE_MAX_LENGTH = 70;

  isActive = false;
  selectedConcepts: string[] = [];
  userCanExpand = true; 

  isDescriptionFullDisplayed = false;
  isBookmarkFill = false;
  articleDescription = "";
  saveOrRemoveParams = {"user_id": "", "rid": "", "status": this.isBookmarkFill};
  saveOrRemoveStatus = false;
  @Input() resultTabType: string = "";
  @Output() resourceRemovedEvent = new EventEmitter<string>(); // take rid

  @Input() public conceptColors!: string[];
  @Input() public concepts: { name: string }[] = [];
  public conceptsNames: string[]= [];
  isWhyExpanded: boolean = false;
  @Input() resourcesPagination: ResourcesPagination
  
 
  abstractParts: { text: string, isKeyphrase: boolean, keyphraseMeta?: any }[] = [];
  abstractPartsTruncated: { text: string; isKeyphrase: boolean; keyphraseMeta?: any }[] = [];

  coloredBandData = {
    document_dnu_similarity_colorband: {} as { [key: string]: number },
    tags: [] as { text: string; color: string }[]
  };

  @Output() keyphraseClicked = new EventEmitter<{ keyphrase: string, clientX: number, clientY: number }>();
  selectedKeyphrase: string | null = null;
  @ViewChild('popupBarChartCanvas', { static: false }) popupBarChartCanvas!: ElementRef<HTMLCanvasElement>;
  popupChart: any; // Chart instance for the popup


  ngOnInit() {
    this.getConceptsNames()

    this.coloredBandData = {
      document_dnu_similarity_colorband: this.concepts.reduce((acc, concept, i) => {
        acc[concept.name] = this.article.document_dnu_similarity[concept.name] || 0;
        return acc;
      }, {}),
      tags: this.concepts.map((concept, index) => ({
        text: concept.name,
        color: this.conceptColors[index] || '#cccccc'
      }))
    };
    
    this.generateParts(
      this.article.abstract,
      this.article.keyphrases,
      this.article.keyphrases_dnu_similarity_score
    );

    this.abstractPartsTruncated = this.truncateParts(this.abstractParts, this.ABSTRACT_MAX_LENGTH);

    console.log(this.article); // In your component
    console.log("document_dnu_similarity_colorband:", this.article.document_dnu_similarity);
    console.log("coloredBandData:", this.coloredBandData);
    console.log("DNU Names:", this.conceptsNames);
    console.log("DNU Colors:", this.conceptColors);

  }

  ngAfterViewInit(){
    console.log("coloredBandData:", this.coloredBandData);
  }

  ngOnChanges() {
    this.isBookmarkFill = this.article?.is_bookmarked_fill;
    this.saveOrRemoveParams.user_id = this.userId;
    this.saveOrRemoveParams.rid = this.article?.rid;
    
    if (this.article?.abstract && this.article?.keyphrases) {
      this.generateParts(
      this.article.abstract,
      this.article.keyphrases,
      this.article.keyphrases_dnu_similarity_score
      );
      this.abstractPartsTruncated = this.truncateParts(this.abstractParts, this.ABSTRACT_MAX_LENGTH);
    }
  }

  getConceptsNames() {
    this.conceptsNames = this.concepts?.map(dnu => dnu.name) ?? [];
    }

  public openArticle(article: any): void {
    const safeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.article.uri );

    const data = {
      materialId: this.currentMaterial!._id,
      resourceId: this.article.id.toString(),
      title: this.article.title,
      abstract: this.article.abstract,
      materialPage: this.currentPdfPage,
    };
    // Log the activity
    this.materialsRecommenderService.logWikiArticleView(data).subscribe();
    this.article = article;
    this.onClick.emit(this.article.id);
    this.isActive = !this.isActive;
    window.open(
      this.sanitizer.sanitize(SecurityContext.URL, safeURL),
      '_blank'
    );
  }

  expand(): void {
    const data = {
      materialId: this.currentMaterial!._id,
      resourceId: this.article.id.toString(),
      title: this.article.title,
      abstract: this.article.abstract,
      materialPage: this.currentPdfPage,
    };
    if (this.userCanExpand) {
      // Log the activity
      this.materialsRecommenderService.logExpandAbstract(data).subscribe();
    } else {
      this.materialsRecommenderService.logCollapseAbstract(data).subscribe();
    }
    this.userCanExpand = !this.userCanExpand;
  }

  showDescriptionFull() {
    this.isDescriptionFullDisplayed = this.isDescriptionFullDisplayed === true ? false : true;
  }

  addToBookmark() {    
    this.isBookmarkFill = this.isBookmarkFill === true ? false : true;
    this.saveOrRemoveParams.status = this.isBookmarkFill;
    this.SaveOrRemoveUserResource(this.saveOrRemoveParams);
    this.onResourceRemovedEvent();
  }

  saveOrRemoveBookmark() {
    // detail: 'Open your Bookmark List to find this article'
    if (this.isBookmarkFill == true) {
      if (this.saveOrRemoveStatus === true) {
        this.messageService.add({ key: 'resource_bookmark_article', severity: 'success', summary: '', detail: 'Article saved successfully'});
      }
    } else {
      if (this.saveOrRemoveStatus === false) {
        this.messageService.add({key: 'resource_bookmark_article', severity: 'info', summary: '', detail: 'Article removed from saved'});
      }
    }
  }

  SaveOrRemoveUserResource(params) {
    this.materialsRecommenderService.SaveOrRemoveUserResource(params)
      .subscribe({
        next: (data: any) => {
          if (data["msg"] == "saved") {
            this.saveOrRemoveStatus = true;
            this.article.is_bookmarked_fill = true;
          } else {
            this.saveOrRemoveStatus = false;
            this.article.is_bookmarked_fill = false;
          }
          this.saveOrRemoveBookmark();
        },
        error: (err) => {
          console.log(err);
          this.saveOrRemoveStatus = false;
          this.article.is_bookmarked_fill = false;
        },
      }
    );
  }

  onResourceRemovedEvent() {
    if (this.isBookmarkFill === false && this.resultTabType === "saved") {
      this.resourceRemovedEvent.emit(this.article.rid);
    }
  } 
 getColorForConcept(concept: string): string {
  const index = this.conceptsNames.indexOf(concept);
  return index !== -1 ? this.conceptColors[index] : 'red';
  }

escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
}

cleanKeyphrase(kp: string): string {
  return kp
    .replace(/\\[a-zA-Z]+\s*/g, '')  // Remove LaTeX commands like \displaystyle
    .replace(/[{}]/g, '')            // Remove braces
    .trim();
}

cleanTextForLatex(text: string): string {
  return text
    // Remove paired patterns like: "F {\displaystyle F}" => "F"
    .replace(/\b([A-Za-z])\s*\{\s*\\[a-zA-Z]+\s*\1\s*\}/g, '$1')

    // Remove full LaTeX blocks like: {\command ...}
    .replace(/\{\s*\\[a-zA-Z]+\s*[^{}]*?\}/g, '')

    // Remove standalone LaTeX commands like \displaystyle
    .replace(/\\[a-zA-Z]+\s*/g, '')

    // Remove stray braces
    .replace(/[{}]/g, '')

    // Collapse multiple spaces
    .replace(/\s{2,}/g, ' ')
    
    .trim();
}

generateParts(text: string, keyphrases: string[], keyphrases_dnu_similarity_score: any[]) {
  this.abstractParts = [];

  // Clean LaTeX-style formatting from the abstract text
  text = this.cleanTextForLatex(text);

  if (!text || !keyphrases || keyphrases.length === 0) {
    this.abstractParts = [{ text, isKeyphrase: false }];
    return;
  }

  const normalizedKeyphrases: { text: string, dnu: string }[] = keyphrases.map((kp, i) => {
    const raw = Array.isArray(kp) ? kp[0] : kp;
    return {
      text: this.cleanKeyphrase(raw),
      dnu: Object.keys(keyphrases_dnu_similarity_score[i])[0]
    };
  });

  const matches: { index: number; length: number; kp: string; dnu: string }[] = [];

  normalizedKeyphrases.forEach(({ text: kp, dnu }) => {
    if (!kp) return;

    const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(kp)}\\b`, 'gi');

    let match: RegExpExecArray | null;
    while ((match = wordBoundaryRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        kp,
        dnu
      });
    }
  });

  // Sort matches to prefer earlier and longer ones
  matches.sort((a, b) => a.index - b.index || b.length - a.length);

  // Filter out overlapping matches
  const filteredMatches: typeof matches = [];
  let lastIndex = -1;
  for (const match of matches) {
    if (match.index >= lastIndex) {
      filteredMatches.push(match);
      lastIndex = match.index + match.length;
    }
  }

  // Build parts array
  let currentIndex = 0;
  for (const match of filteredMatches) {
    if (match.index > currentIndex) {
      this.abstractParts.push({
        text: text.slice(currentIndex, match.index),
        isKeyphrase: false
      });
    }

    this.abstractParts.push({
      text: text.slice(match.index, match.index + match.length),
      isKeyphrase: true,
      keyphraseMeta: {
        concept: match.dnu,
        color: this.getColorForConcept(match.dnu)
      }
    });

    currentIndex = match.index + match.length;
  }

  // Add remaining non-keyphrase text
  if (currentIndex < text.length) {
    this.abstractParts.push({
      text: text.slice(currentIndex),
      isKeyphrase: false
    });
  }
}

truncateParts(parts: { text: string, isKeyphrase: boolean, keyphraseMeta?: any }[], maxLength: number) {
  const result: typeof this.abstractParts = [];
  let count = 0;

  for (const part of parts) {
    const partLength = part.text.length;
    if (count + partLength > maxLength) {
      // Stop before cutting off a keyphrase
      if (!part.isKeyphrase) {
        const remaining = maxLength - count;
        if (remaining > 0) {
          result.push({ ...part, text: part.text.slice(0, remaining) });
        }
      }
      break;
    }

    result.push(part);
    count += partLength;
  }

  return result;
}

  getSimilarityScoresAlignedToFixedYaxisPopUp(keyphrase: string): number[] {
  const index = this.article.keyphrases.findIndex(tuple => tuple[0] === keyphrase);
  if (index === -1) {
    console.warn(`Keyphrase "${keyphrase}" not found.`);
    return [];
  }
  const similarityObject = this.article.keyphrases_dnu_similarity_score[index];
console.log('Similarity object:',this.article.keyphrases_dnu_similarity_score[index]);
  // Map scores based on fixed Y-axis order
  return this.conceptsNames.map(dnu => {
    return similarityObject.hasOwnProperty(dnu) ? similarityObject[dnu] : 0;
  });
}

generatePopupBarChart() {
  if (!this.popupBarChartCanvas || !this.selectedKeyphrase) return;

  const canvas = this.popupBarChartCanvas.nativeElement;
  canvas.style.width = '300px';
  canvas.style.height = '250px';

  const labels = this.conceptsNames;
  const rawScores = this.getSimilarityScoresAlignedToFixedYaxisPopUp(this.selectedKeyphrase);

  console.log('Selected keyphrase:', this.selectedKeyphrase);

console.log('DNU Names:', this.conceptsNames);

console.log('Raw scores:', rawScores);


  const scaledData = rawScores.map(score => score * 100);

  const dynamicBarColors = labels.map(label => {
    const index = this.conceptsNames.indexOf(label);
    return index !== -1 ? this.conceptColors[index] : 'red';
  });

  if (this.popupChart) {
    this.popupChart.data.labels = labels;
    this.popupChart.data.datasets[0].data = scaledData;
    this.popupChart.data.datasets[0].backgroundColor = dynamicBarColors;
    this.popupChart.update('none');
    return;
  }

  this.popupChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Similarity Score (%)',
        data: scaledData,
        backgroundColor: dynamicBarColors,
        borderWidth: 1,
        barThickness: 20,
        categoryPercentage: 0.8
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: false,
      maintainAspectRatio: true,
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
          title: { display: true, text: 'Concepts', font: { weight: 'bold', size: 14 } },
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

lastTarget: EventTarget | null = null;

openKeyphrasePopover(popover: OverlayPanel, event: MouseEvent, part: { text: string }) {
  const target = event.currentTarget || event.target;

  if (this.lastTarget === target) {
    popover.toggle(event);
  } else {
    this.selectedKeyphrase = part.text;
    this.keyphraseClicked.emit({
      keyphrase: part.text,
      clientX: event.clientX,
      clientY: event.clientY
    });

    this.cdr.detectChanges();

    popover.hide();
    setTimeout(() => {
      popover.show(event);
      this.lastTarget = target;

      // Generate the popup bar chart after popover is visible
      this.generatePopupBarChart();
    }, 50);
  }
}
    toggleWhy() {
      this.isWhyExpanded = !this.isWhyExpanded;
}

}


