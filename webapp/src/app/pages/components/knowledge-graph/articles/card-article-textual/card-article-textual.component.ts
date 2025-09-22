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
  selector: 'app-card-article-textual',
  templateUrl: './card-article-textual.component.html',
  styleUrls: ['./card-article-textual.component.css'],
})
export class CardArticleComponentTextual {
  currentPdfPage: number;
  constructor(
    private sanitizer: DomSanitizer,
    private materialsRecommenderService: MaterialsRecommenderService,
    private renderer: Renderer2,

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

  @ViewChild('textualSimilarityPopover', { static: false }) textualSimilarityPopover!: OverlayPanel;
  selectedKeyphrase: string | null = null;
  textualSimilarityInfo: string[] = [];

  @Input() article!: ArticleElementModel;
  @Input() public conceptColors!: string[];
 
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


  get topKeyphrasesTextual(): { phrase: string, weight: number }[] {
    if (!this.keyphrasesImportanceTuple) return [];

    const sorted = [...this.keyphrasesImportanceTuple].sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 10).map(([phrase, weight]) => {
      return {
        phrase: this.cleanKeyphrase(phrase),
        weight: Number((weight * 100).toFixed(1)) 
      };
    });
  }
  ///
  getTopKeyphrasesWithSimilarities(limit: number = 10): {
    phrase: string;
    weight: number;
    similarities: { dnu: string, score: number }[];
  }[] {
    const rawTuples: any[] = this.article?.keyphrases || [];
    const similarityScores = this.article?.keyphrases_dnu_similarity_score;

    if (!rawTuples || !similarityScores) return [];

    const keyphrases: [string, number][] = rawTuples.map((tuple: any) => [tuple[0], tuple[1]]);

    const sortedTuples = [...keyphrases].sort((a, b) => b[1] - a[1]);
    const topTuples = sortedTuples.slice(0, limit);

    return topTuples.map(([phrase, weight]: [string, number], index: number) => {
      const rawScores = similarityScores[index];
      const similarities = Object.entries(rawScores || {}).map(([dnu, score]) => ({ dnu, score: Number(score) }));

      return {
        phrase: this.cleanKeyphrase(phrase),
        weight: Number((weight * 100).toFixed(1)),
        similarities
      };
    });
  }
    /////
    
  ngOnInit() {
    console.log(this.article); // In your component
    ////

    

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
        color: this.conceptColors[index] || '#cccccc'
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
    console.log("DNU Colors:", this.conceptColors);

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
  return index !== -1 ? this.conceptColors[index] : 'red';
  }


escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
}

cleanKeyphrase(kp: string): string {
  return kp
    // --- LaTeX cleanup ---
    .replace(/\\[a-zA-Z]+\s*/g, '')  // remove LaTeX commands like \frac, \alpha, \displaystyle
    .replace(/[{}]/g, '')            // remove LaTeX braces

    // --- General text normalization ---
    .toLowerCase()                   // make case-insensitive
    .replace(/\s+/g, ' ')            // collapse multiple spaces/tabs/newlines into one space
    .trim();                         // remove leading/trailing spaces
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

generateKeyphraseVariants(kp: string): string[] {
  const variants = new Set<string>();

  const base = kp.toLowerCase().trim();

  // normalize multiple spaces
  const collapsed = base.replace(/\s+/g, ' ');
  variants.add(collapsed);

  // hyphen/space variants
  variants.add(collapsed.replace(/\s*-\s*/g, '-'));   // no space hyphen
  variants.add(collapsed.replace(/\s*-\s*/g, ' - ')); // spaced hyphen
  variants.add(collapsed.replace(/\s*-\s*/g, ' '));   // no hyphen

  // diacritic-insensitive variant
  variants.add(collapsed.normalize("NFD").replace(/[\u0300-\u036f]/g, ''));

  // plural form (add s at end of last word)
  const pluralForm = collapsed.replace(/(\b\w+)$/, '$1s');
  variants.add(pluralForm);

  // singular form (if already ends with s, drop it)
  if (collapsed.endsWith('s')) {
    variants.add(collapsed.slice(0, -1));
  }

  return Array.from(variants);
}

generateParts(
  text: string,
  keyphrases: string[],
  keyphrases_dnu_similarity_score: any[]
) {
  this.abstractParts = [];

  const cleanedAbstract = this.cleanTextForLatex(text);
  console.log("🔎 Original abstract:", text);
  console.log("🧹 Cleaned abstract:", cleanedAbstract);

  if (!cleanedAbstract || !keyphrases || keyphrases.length === 0) {
    this.abstractParts = [{ text: cleanedAbstract, isKeyphrase: false }];
    return;
  }

  const expandedKeyphrases: { text: string; dnu: string; original: string }[] = [];

  keyphrases.forEach((kp, i) => {
    const raw = Array.isArray(kp) ? kp[0] : kp;
    const cleaned = this.cleanKeyphrase(raw);
    const dnu = Object.keys(keyphrases_dnu_similarity_score[i])[0];

    const variants = this.generateKeyphraseVariants(cleaned);

    let foundVariantInAbstract = false;
    variants.forEach(v => {
      const regex = new RegExp(`\\b${this.escapeRegex(v)}\\b`, "gi");
      if (regex.test(cleanedAbstract)) {
        foundVariantInAbstract = true;
      }

      expandedKeyphrases.push({
        text: v,
        dnu,
        original: cleaned,
      });
    });

    if (!foundVariantInAbstract) {
      console.warn(`⚠️ No match in video description for keyphrase: "${cleaned}"`);
    }
  });

  const matches: { index: number; length: number; kp: string; dnu: string }[] = [];

  expandedKeyphrases.forEach(({ text: kp, dnu, original }) => {
    if (!kp) return;

    const regex = new RegExp(`\\b${this.escapeRegex(kp)}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(cleanedAbstract)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        kp: original,
        dnu,
      });
    }
  });

  // Sort by position and length
  matches.sort((a, b) => a.index - b.index || b.length - a.length);

  // Filter overlapping matches
  const filteredMatches: typeof matches = [];
  let lastIndex = -1;
  for (const match of matches) {
    if (match.index >= lastIndex) {
      filteredMatches.push(match);
      lastIndex = match.index + match.length;
    }
  }

  // Build abstract parts array
  let currentIndex = 0;
  for (const match of filteredMatches) {
    if (match.index > currentIndex) {
      this.abstractParts.push({
        text: cleanedAbstract.slice(currentIndex, match.index),
        isKeyphrase: false,
      });
    }

    this.abstractParts.push({
      text: cleanedAbstract.slice(match.index, match.index + match.length),
      isKeyphrase: true,
      keyphraseMeta: {
        concept: match.dnu,
        originalKeyphrase: match.kp,
        color: this.getColorForDnu(match.dnu),
        tooltip: `This keyphrase is the most similar to the “${match.dnu}”.`
      },
    });
    

    currentIndex = match.index + match.length;
  }

  // Add remaining non-keyphrase text
  if (currentIndex < cleanedAbstract.length) {
    this.abstractParts.push({
      text: cleanedAbstract.slice(currentIndex),
      isKeyphrase: false,
    });
  }
}


truncateParts(
  parts: { text: string, isKeyphrase: boolean, keyphraseMeta?: any }[],
  maxLength: number
) {
  const result: typeof this.abstractParts = [];
  let count = 0;

  for (const part of parts) {
    const partLength = part.text.length;

    // If adding this part exceeds maxLength
    if (count + partLength > maxLength) {
      if (part.isKeyphrase) {
        // Always include full keyphrase even if it slightly exceeds maxLength
        result.push(part);
      } else {
        // Truncate non-keyphrase text to fit remaining length
        const remaining = maxLength - count;
        if (remaining > 0) {
          result.push({ ...part, text: part.text.slice(0, remaining) });
        }
      }
      break; // Stop after truncating
    }

    // Add part fully
    result.push(part);
    count += partLength;
  }

  return result;
}




/* getSimilarityScoresAlignedToFixedYaxisPopUp(clickedKeyphrase: string): number[] {
  if (!clickedKeyphrase) return [];

  // Find the original keyphrase associated with the clicked variant
  let originalKeyphrase = clickedKeyphrase;

  // Search in abstractParts to get the originalKeyphrase
  const part = this.abstractParts.find(
    p => p.isKeyphrase && p.text === clickedKeyphrase && p.keyphraseMeta?.originalKeyphrase
  );
  if (part?.keyphraseMeta?.originalKeyphrase) {
    originalKeyphrase = part.keyphraseMeta.originalKeyphrase;
  }

  const cleanedKey = this.cleanKeyphrase(originalKeyphrase);

  // Find index in videoElement.keyphrases
  const index = this.videoElement.keyphrases.findIndex(tuple => {
    const candidate = Array.isArray(tuple) ? String(tuple[0]) : String(tuple);
    return this.cleanKeyphrase(candidate) === cleanedKey;
  });

  if (index === -1) {
    console.warn(`Keyphrase "${clickedKeyphrase}" (original: "${originalKeyphrase}") not found in article.keyphrases (after cleaning).`);
    return [];
  }

  const similarityObject = this.videoElement.keyphrases_dnu_similarity_score[index];
  return this.conceptsNames.map(dnu =>
    similarityObject && Object.prototype.hasOwnProperty.call(similarityObject, dnu)
      ? similarityObject[dnu]
      : 0
  );
} */

 


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

showTextualSimilarityPopover(keyphrase: string, event: MouseEvent) {
  this.selectedKeyphrase = keyphrase;

  const index = this.article.keyphrases.findIndex(tuple => tuple[0] === keyphrase);
  if (index === -1) {
    console.warn(`Keyphrase "${keyphrase}" not found.`);
    return;
  }

  const similarities = this.article.keyphrases_dnu_similarity_score[index];
  

  this.textualSimilarityInfo = Object.entries(similarities).map(
    ([dnu, score]: [string, number]) =>
      `<strong>${(score * 100).toFixed(0)}%</strong> - <strong>“${dnu}”</strong>`
  );
  
  this.textualSimilarityPopover.hide(); // Ensure it closes before showing again
  setTimeout(() => {
    this.textualSimilarityPopover.show(event);
  }, 50);
}

getFormattedSimilarityText(concept: string, value: number): string {
  const percentage = (value * 100).toFixed(0);
  return `This article is <strong>${percentage}%</strong> similar to <strong>${concept}</strong>.`;
}

get similarityText(): string {
  const score = this.article?.similarity_score ? (this.article.similarity_score * 100).toFixed(0) : '0';
  return `This article is <strong>${score}%</strong> similar to the concepts used to generate recommendations.`;
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


