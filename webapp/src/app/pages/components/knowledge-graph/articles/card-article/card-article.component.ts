import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SecurityContext,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { getCurrentPdfPage } from '../../../annotations/pdf-annotation/state/annotation.reducer';
import { ArticleElementModel } from '../models/article-element.model';
import { OverlayPanel } from 'primeng/overlaypanel';
import { DomSanitizer } from '@angular/platform-browser';
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
  articleDescription = '';
  saveOrRemoveParams = { user_id: '', rid: '', status: this.isBookmarkFill };
  saveOrRemoveStatus = false;
  @Input() resultTabType: string = '';
  @Output() resourceRemovedEvent = new EventEmitter<string>(); // take rid

  @Input() public conceptColors!: string[];
  @Input() public concepts: { name: string }[] = [];
  public conceptsNames: string[] = [];
  isWhyExpanded: boolean = false;
  @Input() resourcesPagination: ResourcesPagination;

  abstractParts: { text: string; isKeyphrase: boolean; keyphraseMeta?: any }[] =
    [];
  abstractPartsTruncated: {
    text: string;
    isKeyphrase: boolean;
    keyphraseMeta?: any;
  }[] = [];

  coloredBandData = {
    document_dnu_similarity_colorband: {} as { [key: string]: number },
    tags: [] as { text: string; color: string }[],
  };

  @Output() keyphraseClicked = new EventEmitter<{
    keyphrase: string;
    clientX: number;
    clientY: number;
  }>();
  selectedKeyphrase: string | null = null;
  @ViewChild('popupBarChartCanvas', { static: false })
  popupBarChartCanvas!: ElementRef<HTMLCanvasElement>;
  popupChart: any; // Chart instance for the popup

  ngOnInit() {
    this.getConceptsNames();

    this.coloredBandData = {
      document_dnu_similarity_colorband: this.concepts.reduce(
        (acc, concept, i) => {
          acc[concept.name] =
            this.article.document_dnu_similarity[concept.name] || 0;
          return acc;
        },
        {}
      ),
      tags: this.concepts.map((concept, index) => ({
        text: concept.name,
        color: this.conceptColors[index] || '#cccccc',
      })),
    };

    this.generateParts(
      this.article.abstract,
      this.article.keyphrases,
      this.article.keyphrases_dnu_similarity_score
    );

    this.abstractPartsTruncated = this.truncateParts(
      this.abstractParts,
      this.ABSTRACT_MAX_LENGTH
    );

    /*   //  For debugging:

    console.log(this.article); 
    console.log("document_dnu_similarity_colorband:", this.article.document_dnu_similarity);
    console.log("coloredBandData:", this.coloredBandData);
    console.log("DNU Names:", this.conceptsNames);
    console.log("DNU Colors:", this.conceptColors); */
  }

  /*   //  For debugging:
  ngAfterViewInit(){
    console.log("coloredBandData:", this.coloredBandData);
  }
 */
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
      this.abstractPartsTruncated = this.truncateParts(
        this.abstractParts,
        this.ABSTRACT_MAX_LENGTH
      );
    }
  }

  getConceptsNames() {
    this.conceptsNames = this.concepts?.map((dnu) => dnu.name) ?? [];
  }

  public openArticle(article: any): void {
    const safeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.article.uri
    );

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
    this.isDescriptionFullDisplayed =
      this.isDescriptionFullDisplayed === true ? false : true;
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
        this.messageService.add({
          key: 'resource_bookmark_article',
          severity: 'success',
          summary: '',
          detail: 'Article saved successfully',
        });
      }
    } else {
      if (this.saveOrRemoveStatus === false) {
        this.messageService.add({
          key: 'resource_bookmark_article',
          severity: 'info',
          summary: '',
          detail: 'Article removed from saved',
        });
      }
    }
  }

  SaveOrRemoveUserResource(params) {
    this.materialsRecommenderService
      .SaveOrRemoveUserResource(params)
      .subscribe({
        next: (data: any) => {
          if (data['msg'] == 'saved') {
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
      });
  }

  onResourceRemovedEvent() {
    if (this.isBookmarkFill === false && this.resultTabType === 'saved') {
      this.resourceRemovedEvent.emit(this.article.rid);
    }
  }
  getColorForConcept(concept: string): string {
    const index = this.conceptsNames.indexOf(concept);
    return index !== -1 ? this.conceptColors[index] : 'red';
  }

  isURL(text: string): boolean {
    const trimmed = text.trim();

    // Only treat it as a URL if it starts with http/https/www
    // Ignore any trailing stuff like " ▷SECURE"
    return /^(https?:\/\/|www\.)[^\s]+/i.test(trimmed);
  }

  escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
  }

  cleanKeyphrase(kp: string): string {
    return (
      kp
        // --- LaTeX cleanup ---
        .replace(/\\[a-zA-Z]+\s*/g, '') // remove LaTeX commands like \frac, \alpha, \displaystyle
        .replace(/[{}]/g, '') // remove LaTeX braces

        .replace(/\s*([|<>=()\-+])\s*/g, '$1') // remove spaces around math symbols
        // --- General text normalization ---
        .toLowerCase() // make case-insensitive
        .replace(/\s+/g, ' ') // collapse multiple spaces/tabs/newlines into one space
        .trim()
    ); // remove leading/trailing spaces
  }

  cleanTextForLatex(text: string): string {
    return (
      text
        // --- Remove invisible Unicode math characters (like ⁡ U+2061) ---
        .replace(/[\u200B-\u200F\u2060-\u206F]/g, '')

        // Remove paired patterns like: "F {\displaystyle F}" => "F"
        .replace(/\b([A-Za-z])\s*\{\s*\\[a-zA-Z]+\s*\1\s*\}/g, '$1')

        // Remove full LaTeX blocks like: {\command ...}
        .replace(/\{\s*\\[a-zA-Z]+\s*[^{}]*?\}/g, '')

        // Remove standalone LaTeX commands like \displaystyle
        .replace(/\\[a-zA-Z]+\s*/g, '')

        // Remove stray braces
        .replace(/[{}]/g, '')

        // Remove spaces around math symbols
        .replace(/\s*([|<>=()\-+])\s*/g, '$1')

        // Collapse multiple spaces
        .replace(/\s{2,}/g, ' ')

        .trim()
    );
  }

  generateKeyphraseVariants(kp: string): string[] {
    const variants = new Set<string>();

    const base = kp.toLowerCase().trim();

    // normalize multiple spaces
    const collapsed = base.replace(/\s+/g, ' ');
    variants.add(collapsed);

    // hyphen/space variants
    variants.add(collapsed.replace(/\s*-\s*/g, '-')); // no space hyphen
    variants.add(collapsed.replace(/\s*-\s*/g, ' - ')); // spaced hyphen
    variants.add(collapsed.replace(/\s*-\s*/g, ' ')); // no hyphen

    // diacritic-insensitive variant
    variants.add(collapsed.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

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
  /* //  For debugging:     
  console.log(' Original abstract:', text);
  console.log(' Cleaned abstract:', cleanedAbstract); */

  if (!cleanedAbstract || !keyphrases || keyphrases.length === 0) {
    this.abstractParts = [{ text: cleanedAbstract, isKeyphrase: false }];
    return;
  }

  const expandedKeyphrases: {
    text: string;
    dnu: string;
    original: string;
  }[] = [];

  keyphrases.forEach((kp, i) => {
    const raw = Array.isArray(kp) ? kp[0] : kp;
    const cleaned = this.cleanKeyphrase(raw);
    const dnu = Object.keys(keyphrases_dnu_similarity_score[i])[0];

    // ✅ Skip keyphrases that have no positive similarity scores
    const similarityObj = keyphrases_dnu_similarity_score[i];
const hasPositive = Object.values(similarityObj)
  .filter((v): v is number => typeof v === 'number')
  .some(v => v > 0);

    if (!hasPositive) {
      /* // For debugging:
      console.warn(`Skipping unrelated keyphrase: "${cleaned}"`);
      */
      return;
    }

    if (this.isURL(cleaned)) {
      /* // For debugging: Skip keyphrases that look like URLs
      console.warn(`Skipping URL-like keyphrase: "${cleaned}"`); */
      return;
    }

    const variants = this.generateKeyphraseVariants(cleaned);

    let foundVariantInAbstract = false;
    variants.forEach((v) => {
      const regex = new RegExp(this.escapeRegex(v), 'gi');
      if (regex.test(cleanedAbstract)) {
        foundVariantInAbstract = true;
      }

      expandedKeyphrases.push({
        text: v,
        dnu,
        original: cleaned,
      });
    });

    /* //  For debugging:
    if (!foundVariantInAbstract) {
      console.warn(`⚠️ No match in abstract for keyphrase: "${cleaned}"`);
    } */
  });

  const matches: {
    index: number;
    length: number;
    kp: string;
    dnu: string;
  }[] = [];

  expandedKeyphrases.forEach(({ text: kp, dnu, original }) => {
    if (!kp) return;

    let regex: RegExp;

    if (kp.length <= 3) {
      // For very short keyphrases like "a", "an", "x", use word boundaries & Use custom boundary to avoid including parentheses
      regex = new RegExp(`(?<!\\w)${this.escapeRegex(kp)}(?!\\w)`, 'gi');
    } else {
      regex = new RegExp(this.escapeRegex(kp), 'gi');
    }

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

  matches.sort((a, b) => a.index - b.index || b.length - a.length);

  const filteredMatches: typeof matches = [];
  let lastIndex = -1;
  for (const match of matches) {
    if (match.index >= lastIndex) {
      filteredMatches.push(match);
      lastIndex = match.index + match.length;
    }
  }

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
        color: this.getColorForConcept(match.dnu),
      },
    });

    currentIndex = match.index + match.length;
  }

  if (currentIndex < cleanedAbstract.length) {
    this.abstractParts.push({
      text: cleanedAbstract.slice(currentIndex),
      isKeyphrase: false,
    });
  }
}

  truncateParts(
    parts: { text: string; isKeyphrase: boolean; keyphraseMeta?: any }[],
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

  getSimilarityScoresAlignedToFixedYaxisPopUp(
    clickedKeyphrase: string
  ): number[] {
    if (!clickedKeyphrase) return [];

    // Find the original keyphrase associated with the clicked variant
    let originalKeyphrase = clickedKeyphrase;

    // Search in abstractParts to get the originalKeyphrase
    const part = this.abstractParts.find(
      (p) =>
        p.isKeyphrase &&
        p.text === clickedKeyphrase &&
        p.keyphraseMeta?.originalKeyphrase
    );
    if (part?.keyphraseMeta?.originalKeyphrase) {
      originalKeyphrase = part.keyphraseMeta.originalKeyphrase;
    }

    const cleanedKey = this.cleanKeyphrase(originalKeyphrase);

    // Find index in article.keyphrases
    const index = this.article.keyphrases.findIndex((tuple) => {
      const candidate = Array.isArray(tuple) ? String(tuple[0]) : String(tuple);
      return this.cleanKeyphrase(candidate) === cleanedKey;
    });

    if (index === -1) {
      /* // For debugging:
      console.warn(
        `Keyphrase "${clickedKeyphrase}" (original: "${originalKeyphrase}") not found in article.keyphrases (after cleaning).`
      ); */
      return [];
    }

    const similarityObject =
      this.article.keyphrases_dnu_similarity_score[index];
    return this.conceptsNames.map((dnu) =>
      similarityObject &&
      Object.prototype.hasOwnProperty.call(similarityObject, dnu)
        ? similarityObject[dnu]
        : 0
    );
  }

 hasPositiveScores = true; 
 
 generatePopupBarChart() {
   if (!this.popupBarChartCanvas || !this.selectedKeyphrase) return;
 
   const canvas = this.popupBarChartCanvas.nativeElement;
 
   const rawScores = this.getSimilarityScoresAlignedToFixedYaxisPopUp(this.selectedKeyphrase);
   const originalLabels = this.conceptsNames;
 
   // Filter out negative scores and corresponding labels
   const filteredData: number[] = [];
   const filteredLabels: string[] = [];
   const filteredColors: string[] = [];
 
   rawScores.forEach((score, i) => {
     if (score > 0) {
       filteredData.push(score * 100);
       filteredLabels.push(
         originalLabels[i].length > 20
           ? originalLabels[i].slice(0, 20) + '…'
           : originalLabels[i]
       );
       filteredColors.push(this.conceptColors[i] || 'red');
     }
   });
 
   // Determine whether to show chart or message
   this.hasPositiveScores = filteredData.length > 0;
 
   if (!this.hasPositiveScores) {
     // Destroy existing chart if any
     if (this.popupChart) {
       this.popupChart.destroy();
       this.popupChart = null;
     }
     return; // message will be shown via template
   }
 
   if (this.popupChart) {
     this.popupChart.data.labels = filteredLabels;
     this.popupChart.data.datasets[0].data = filteredData;
     this.popupChart.data.datasets[0].backgroundColor = filteredColors;
     this.popupChart.update('none');
     return;
   }
 
   this.popupChart = new Chart(canvas, {
     type: 'bar',
     data: {
       labels: filteredLabels,
       datasets: [{
         label: 'Similarity Score (%)',
         data: filteredData,
         backgroundColor: filteredColors,
         borderWidth: 1,
         barThickness: 20,
         categoryPercentage: 0.8,
       }],
     },
     options: {
       indexAxis: 'y',
       responsive: false,
       maintainAspectRatio: true,
       animation: { duration: 0 },
       interaction: { mode: 'nearest', intersect: true },
       scales: {
         x: {
           beginAtZero: true,
           min: 0,
           max: 100,
           title: { display: true, text: 'Similarity Score (%)', font: { weight: 'bold', size: 14 } },
           ticks: { stepSize: 20 },
           grid: { display: false },
         },
         y: {
           grid: { display: false },
           title: { display: true, text: 'Concepts', font: { weight: 'bold', size: 14 } },
         },
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

  lastTarget: EventTarget | null = null;

  openKeyphrasePopover(
    popover: OverlayPanel,
    event: MouseEvent,
    part: { text: string }
  ) {
    const target = event.currentTarget || event.target;

    if (this.lastTarget === target) {
      popover.toggle(event);
    } else {
      this.selectedKeyphrase = part.text;
      this.keyphraseClicked.emit({
        keyphrase: part.text,
        clientX: event.clientX,
        clientY: event.clientY,
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
