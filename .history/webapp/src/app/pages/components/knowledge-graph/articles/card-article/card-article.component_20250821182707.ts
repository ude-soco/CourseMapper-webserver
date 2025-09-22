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
import { Chart, registerables } from 'chart.js';
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
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
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
  @Input() public dnuColors!: string[];
 
  @Input() public concepts: { name: string }[] = [];

  @Output() onClick: EventEmitter<any> = new EventEmitter();
  @Input() userId: string;

  @Input() keyphrasesImportanceTuple: any[] = [];

  @Input() keyphrases_dnu_similarity_score: any[];

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

   public notUnderstoodConceptsNames: string[]= [];
   isWhyExpanded: boolean = false;
   @Input() resourcesPagination: ResourcesPagination
  
  
  highlightedAbstractHtml!: SafeHtml;
  abstractParts: { text: string, isKeyphrase: boolean, keyphraseMeta?: any }[] = [];
  abstractPartsTruncated: { text: string; isKeyphrase: boolean; keyphraseMeta?: any }[] = [];
  chart: any;
  @Output() keyphraseClicked = new EventEmitter<{ keyphrase: string, clientX: number, clientY: number }>();
  coloredBandData = {
    document_dnu_similarity_colorband: {} as { [key: string]: number },
    tags: [] as { text: string; color: string }[]
  };

    popupVisible = false;
    popupText = '';
    popupX = 0;
    popupY = 0;
    popupPosition: { x: number; y: number } = { x: 0, y: 0 };
    @ViewChild('abstractContainer', { static: true }) abstractContainer!: ElementRef;

/*   coloredBandData = {
    interests_similarity: this.article.document_dnu_similarity,
    tags: [  
      { text: 'AI', color: '#4caf50' },
      { text: 'Biology', color: '#2196f3' },
      { text: 'Psychology', color: '#ff9800' }
    ]
  }; */


  ngOnInit() {
    console.log(this.article); // In your component

/* 
    console.log('Not understood concepts object:', this.notUnderstoodConcepts); */

    console.log("document_dnu_similarity_colorband:", this.article.document_dnu_similarity);
    
    this.notUnderstoodConceptsNames = this.concepts?.map(dnu => dnu.name) ?? [];

    this.coloredBandData = {
      document_dnu_similarity_colorband: this.concepts.reduce((acc, concept, i) => {
        acc[concept.name] = this.article.document_dnu_similarity[concept.name] || 0;
        return acc;
      }, {}),
      tags: this.concepts.map((concept, index) => ({
        text: concept.name,
        color: this.dnuColors[index] || '#cccccc'
      }))
    };
    console.log("coloredBandData:", this.coloredBandData);
    
    this.generateParts(
      this.article.abstract,
      this.article.keyphrases,
      this.article.keyphrases_dnu_similarity_score
    );
    this.abstractPartsTruncated = this.truncateParts(this.abstractParts, this.ABSTRACT_MAX_LENGTH);

    console.log("DNU Names:", this.notUnderstoodConceptsNames);
    console.log("DNU Colors:", this.dnuColors);

  }
  ngAfterViewInit(){
    console.log("coloredBandData:", this.coloredBandData);
  }

  @ViewChild('highlightedAbstract', { static: false }) highlightedAbstractRef!: ElementRef;
  @ViewChild('barChartCanvas', { static: false }) barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('popupDiv', { static: false }) popupDiv!: ElementRef<HTMLDivElement>;

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
  ngAfterViewChecked() {}  

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
 getColorForDnu(dnu: string): string {
  const index = this.notUnderstoodConceptsNames.indexOf(dnu);
  return index !== -1 ? this.dnuColors[index] : 'red';
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

  // 🧼 Clean LaTeX-style formatting from the abstract text
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
        dnu: match.dnu,
        color: this.getColorForDnu(match.dnu)
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


 showPopup(text: string, clientX: number, clientY: number, event: MouseEvent) {
  const containerRect = this.abstractContainer.nativeElement.getBoundingClientRect();

  const offsetX = 10; // adjust as needed
  const offsetY = 10;

  this.popupText = text;
  this.popupPosition = {
    x: clientX - containerRect.left - offsetX,
    y: clientY - containerRect.top - offsetY
  };
  this.popupVisible = true;
}

/*  showPopup(text: string, clientX: number, clientY: number, event: MouseEvent) {
  this.popupText = text;
  this.popupVisible = true;

  // Position the popup a bit below the clicked position
  this.popupX = clientX;
  this.popupY = clientY + 20; // 20px below click Y
} */

/* showPopup(text: string, x: number, y: number, event: MouseEvent) {
  const offsetX = 10; // pixels to shift left
  const offsetY = 10; // pixels to shift up

  this.popupText = text;
  this.popupPosition = {
    x: x - offsetX,
    y: y - offsetY,
  };
  this.popupVisible = true;
} */

hidePopup() {
  this.popupVisible = false;
}
/* showPopup(keyphrase: string, x: number, y: number) {
  this.selectedKeyphrase = keyphrase;
  this.popupPosition = { x, y };
  this.popupVisible = true;
} */
closePopup() {
  this.popupVisible = false;
}
/* showPopup(keyphrase: string, x: number, y: number) {
  console.log('showpup function works !')
  if (x == null || y == null) {
    console.warn('Invalid popup position', x, y);
    return;
  }

  this.selectedKeyphrase = keyphrase;
  this.popupX = 50;  // e.g. 50px from the left
  this.popupY = 100; // e.g. 100px from the top
  this.popupVisible = true;
} */
 
/* THISSSSSS showPopup(keyphrase: string, clientX: number, clientY: number) {
      this.keyphraseClicked.emit({ keyphrase, clientX, clientY });
    } */


/* getFontSize(score: number): number {

      const minSize = 12; // Minimum font size
      const maxSize = 40; // Maximum font size
      const minScore = Math.min(...this.article.keyphrases.map(kp => +kp[0])); // Use + to convert to number
      const maxScore = Math.max(...this.article.keyphrases.map(kp => +kp[1])); // Use + to convert to number

      
      // Normalize the score and map it to a font size between minSize and maxSize
      return minSize + ((score - minScore) / (maxScore - minScore)) * (maxSize - minSize);
    } */

    toggleWhy() {
      this.isWhyExpanded = !this.isWhyExpanded;
}


  /*
 getNotUnderstoodConceptNamesYaxis() {
    this.notUnderstoodConceptsNames = this.concepts?.map(dnu => { 
      return dnu.name;
    }) ?? [];
    
  }

  getSimilarityScoresXaxis(keyphrase: string): number[] {
    // Find the index of the keyphrase in keyphrasesImportanceTuple
    const index = this.keyphrasesImportanceTuple.findIndex(tuple => tuple[0] === keyphrase);
  
    // If keyphrase is not found, return an empty list
    if (index === -1) {
      console.warn(`Keyphrase "${keyphrase}" not found.`);
      return [];
    }
  
    // Retrieve the corresponding similarity scores object from the given index
    const similarityObject = this.keyphrases_dnu_similarity_score[index];
  
    // Initialize an empty array to store similarity scores
    let similarityScoreList: number[] = [];
  
    // Loop through each dictionary in the similarityObject and extract the second value (the similarity score)
    for (let key in similarityObject) {
      if (similarityObject.hasOwnProperty(key)) {
        similarityScoreList.push(similarityObject[key]);  // Add similarity score to the list
      }
    }
    console.log('similaity scores list:',similarityScoreList )

    // Return the list of similarity scores
    return similarityScoreList;
  }

  
  generateBarChart() {
    if (!this.barChartCanvas || !this.selectedKeyphrase) return; // ✨ add this.selectedKeyphrase check
  
    const canvas = this.barChartCanvas.nativeElement;
    canvas.style.width = '300px';
    canvas.style.height = '250px';
  
    const labels = this.getNotUnderstoodConceptNamesYaxis(); // if it's a method or just `this.notUnderstoodConceptsNames`
    const rawData = this.getSimilarityScoresXaxis(this.selectedKeyphrase);
    const scaledData = rawData.map(score => score * 100);
  
    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = scaledData;
      this.chart.update('none');
      return;
    }
  
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.notUnderstoodConceptsNames,
        datasets: [{
          label: 'Similarity Score (%)',
          data: scaledData,
          backgroundColor: [
            '#F06292', '#BA68C8', '#7986CB', '#64B5F6',
            '#4DD0E1', '#4DB6AC', '#81C784', '#DCE775',
            '#FFD54F', '#A1887F'
          ],
          borderWidth: 1,
          barThickness: 20, // Adjust bar height (default is auto)
          categoryPercentage: 0.4  // Controls space between bars
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bar chart
        responsive: false,  // ✅ Prevents Chart.js from resizing it
        maintainAspectRatio: false, // ✅ Keeps the set size
        animation: { duration: 0 },  // ✅ Disable animations for faster updates
        scales: {
          x: {
            beginAtZero: true,
            min: 0,
            max: 100,
            title: { display: true, text: 'Similarity Score (%)',
                     font: { weight: 'bold', size: 14 } // Make x-axis title bold
            },
            ticks: {
              stepSize: 20,
              callback: (value) => Number(value).toFixed(0)
            },
            grid: { display: false } // ✅ Remove vertical grid lines
          },
          y: {
            title: { display: true, text: 'DNU Concepts',
                     font: { weight: 'bold', size: 14 } // Make y-axis title bold
             },
            grid: { display: false }, // ✅ Remove horizontal grid lines
          }
        },
        plugins: {
          datalabels: {
            anchor: 'end',
            align: 'right', // ✅ Aligns text to the right of bars
            formatter: (value) => value.toFixed(2) + '%',
            color: '#000',
            font: { weight: 'bold' }
          }
        }
      },
      plugins: [ChartDataLabels] // ✅ Keep as an array
    });
  }

  getNotUnderstoodConceptNamesYaxis() {
  this.notUnderstoodConceptsNames = this.notUnderstoodConcepts?.map(dnu => { 
    return dnu.name;
  }) ?? [];
  
}

getSimilarityScoresXaxis(keyphrase: string): number[] {
  // Find the index of the keyphrase in keyphrasesImportanceTuple
  const index = this.keyphrasesImportanceTuple.findIndex(tuple => tuple[0] === keyphrase);

  // If keyphrase is not found, return an empty list
  if (index === -1) {
    console.warn(`Keyphrase "${keyphrase}" not found.`);
    return [];
  }

  // Retrieve the corresponding similarity scores object from the given index
  const similarityObject = this.keyphrases_dnu_similarity_score[index];

  // Initialize an empty array to store similarity scores
  let similarityScoreList: number[] = [];

  // Loop through each dictionary in the similarityObject and extract the second value (the similarity score)
  for (let key in similarityObject) {
    if (similarityObject.hasOwnProperty(key)) {
      similarityScoreList.push(similarityObject[key]);  // Add similarity score to the list
    }
  }
  console.log('similaity scores list:',similarityScoreList )

  // Return the list of similarity scores
  return similarityScoreList;
}

  generateBarChart() {
  if (!this.barChartCanvas || !this.selectedKeyphrase) return; // ✨ add this.selectedKeyphrase check

  const canvas = this.barChartCanvas.nativeElement;
  canvas.style.width = '300px';
  canvas.style.height = '250px';

  const labels = this.notUnderstoodConceptsNames;
  const rawData = this.getSimilarityScoresXaxis(this.selectedKeyphrase);
  const scaledData = rawData.map(score => score * 100);

  if (this.chart) {
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = scaledData;
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
        backgroundColor: [
          '#F06292', '#BA68C8', '#7986CB', '#64B5F6',
          '#4DD0E1', '#4DB6AC', '#81C784', '#DCE775',
          '#FFD54F', '#A1887F'
        ],
        borderWidth: 1,
        barThickness: 20, // Adjust bar height (default is auto)
        categoryPercentage: 0.4  // Controls space between bars
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bar chart
      responsive: false,  // ✅ Prevents Chart.js from resizing it
      maintainAspectRatio: false, // ✅ Keeps the set size
      animation: { duration: 0 },  // ✅ Disable animations for faster updates
      scales: {
        x: {
          beginAtZero: true,
          min: 0,
          max: 100,
          title: { display: true, text: 'Similarity Score (%)',
                   font: { weight: 'bold', size: 14 } // Make x-axis title bold
          },
          ticks: {
            stepSize: 20,
            callback: (value) => Number(value).toFixed(0)
          },
          grid: { display: false } // ✅ Remove vertical grid lines
        },
        y: {
          title: { display: true, text: 'DNU Concepts',
                   font: { weight: 'bold', size: 14 } // Make y-axis title bold
           },
          grid: { display: false }, // ✅ Remove horizontal grid lines
        }
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'right', // ✅ Aligns text to the right of bars
          formatter: (value) => value.toFixed(2) + '%',
          color: '#000',
          font: { weight: 'bold' }
        }
      }
    },
    plugins: [ChartDataLabels] // ✅ Keep as an array
  });
}


   ngAfterViewChecked() {
    this.attachClickListeners();
    // Make sure Angular has completed the DOM updates
    this.cdr.detectChanges();
  }

  attachClickListeners() {
    const container = this.highlightedAbstractRef?.nativeElement;
    if (container) {
      const clickableElements = container.querySelectorAll('.clickable-kp');
      clickableElements.forEach((el: HTMLElement) => {
        // Use Renderer2 to add event listener
        this.renderer.listen(el, 'click', (event: MouseEvent) => {
          const keyphrase = el.getAttribute('data-keyphrase');
          const rect = el.getBoundingClientRect();
          console.log('Clicked element position:', rect);
          this.showPopup(keyphrase, rect.left, rect.top);
        });
      });
    }
  }
 
  highlightKeyphrases(text: string, keyphrases: any[],keyphrases_dnu_similarity_score: any[]): SafeHtml {
    console.log("Keyphrases are", keyphrases);
    
    if (!keyphrases || keyphrases.length === 0) {
      return text;
    }
    // Ensure keyphrases are treated as strings
    const normalizedKeyphrases = keyphrases.map(kp => Array.isArray(kp) ? kp[0] : kp);

    this.notUnderstoodConceptsNames = this.notUnderstoodConcepts?.map(dnu=>{ /* console.log("current dnu:",dnu) 
                                                                              return dnu.name;}) ?? [];
    for (let i = 0; i < normalizedKeyphrases.length; i++) {
      const kp = normalizedKeyphrases[i];
      const correspondingDnu = keyphrases_dnu_similarity_score[i] 
                                ? Object.keys(keyphrases_dnu_similarity_score[i])[0] 
                                : undefined;
      console.log(this.notUnderstoodConceptsNames);
      console.log(this.dnuColors);
      
      console.log(index); 
      const index = this.notUnderstoodConceptsNames.indexOf(correspondingDnu);
                                // Get the corresponding color from dnuColors
                                
      const color = index !== -1 ? this.dnuColors[index] : "red"

     text = text.split(kp).join(
        `<span class="highlight-keyphrase " style="color: ${color};">${kp}</span>`
      );  

      text = text.split(kp).join(
        `<span class="highlight-keyphrase clickable-kp" 
                style="color: ${color}; 
                cursor: pointer;" 
                data-keyphrase="${kp}">
           ${kp}
         </span>`
      );
  }
    // Mark the returned HTML as safe
    return this.sanitizer.bypassSecurityTrustHtml(text);
  }
 
  makeKeyphrasesClickable(text: string, keyphrases: any[]): string {
    if (!keyphrases || keyphrases.length === 0) {
      return text;
    }
  
    const normalizedKeyphrases = keyphrases.map(kp => Array.isArray(kp) ? kp[0] : kp);
  
    for (let i = 0; i < normalizedKeyphrases.length; i++) {
      const kp = normalizedKeyphrases[i];
      text = text.split(kp).join(
        `<span class="clickable-keyphrase" data-clickable style="cursor: pointer; text-decoration: underline;" >${kp}</span>`
      );
    }
  
    return text; // Note: now returning plain string
  }
  attachClickHandlers() {
    if (!this.highlightedAbstractRef) 
    {
      console.log('The highlightedAbstractRef not defined');
      return;
    }

    console.log('The highlightedAbstractRef defined');
    const clickableElements = this.highlightedAbstractRef.nativeElement.querySelectorAll('[data-clickable]');

    clickableElements.forEach((el: HTMLElement) => {
      this.renderer.listen(el, 'click', (event: MouseEvent) => {
        const keyword = el.textContent || '';
        this.showPopup(event, keyword);
  
      });
      });
  }


  showPopup(event: MouseEvent, keyword: string) {
    this.popupX = event.clientX + 10;
    this.popupY = event.clientY + 10;
    this.popupKeyword = keyword;
    this.popupVisible = true;
    console.log("Popup should be visible at:", this.popupX, this.popupY, "for", this.popupKeyword);
  }
 */
}


