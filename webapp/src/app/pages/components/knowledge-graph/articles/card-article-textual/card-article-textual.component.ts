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
        weight: Number((weight * 100).toFixed(2)) 
      };
    });
  }
  
 getTopKeyphrasesWithSimilarities(
  limit: number = 10
): {
  phrase: string;
  weight: number;
  similarities: { dnu?: string; score?: number; message?: string }[];
}[] {
  const rawTuples: any[] = this.article?.keyphrases || [];
  const similarityScores = this.article?.keyphrases_dnu_similarity_score;
 
  if (!rawTuples || !similarityScores) return [];
 
  const keyphrases: [string, number][] = rawTuples.map((tuple: any) => [tuple[0], tuple[1]]);
  const sortedTuples = [...keyphrases].sort((a, b) => b[1] - a[1]);
  const topTuples = sortedTuples.slice(0, limit);
 
  const result: {
    phrase: string;
    weight: number;
    similarities: { dnu?: string; score?: number; message?: string }[];
  }[] = [];
 
  for (let i = 0; i < topTuples.length; i++) {
    const [phrase, weight] = topTuples[i];
    const rawScores = similarityScores[i] || {};
    const entries = Object.entries(rawScores).map(([dnu, score]) => ({
      dnu,
      score: Number(score),
    }));
 
    // ✅ Skip keyphrases that have all similarity scores ≤ 0
    const hasPositive = entries
      .filter((e): e is { dnu: string; score: number } => typeof e.score === "number")
      .some((e) => e.score > 0);
    if (!hasPositive) {
      /* console.warn(`Skipping unrelated keyphrase in WHY explanation: "${phrase}"`); */
      continue; // Skip rendering entirely
    }
 
    // ✅ Only include concepts with positive similarity scores
    const similarities = entries
      .filter(({ score }) => score > 0)
      .map(({ dnu, score }) => ({ dnu, score }));
 
    result.push({
      phrase: this.cleanKeyphrase(phrase),
      weight: Number((weight * 100).toFixed(2)),
      similarities,
    });
  }
 
  return result;
}
    
  ngOnInit() {
    //console.log(this.article); 

   // console.log("document_dnu_similarity_colorband:", this.article.document_dnu_similarity);
    
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
  //  console.log("coloredBandData:", this.coloredBandData);
    
    this.generateParts(
      this.article.abstract,
      this.article.keyphrases,
      this.article.keyphrases_dnu_similarity_score
    );
    this.abstractPartsTruncated = this.truncateParts(this.abstractParts, this.ABSTRACT_MAX_LENGTH);

 //   console.log("DNU Names:", this.notUnderstoodConceptsNames);
 //   console.log("DNU Colors:", this.conceptColors);

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
  // console.log("Original abstract:", text);
  // console.log("Cleaned abstract:", cleanedAbstract);
 
  if (!cleanedAbstract || !keyphrases || keyphrases.length === 0) {
    this.abstractParts = [{ text: cleanedAbstract, isKeyphrase: false }];
    return;
  }
 
  const expandedKeyphrases: { text: string; dnu: string; original: string }[] = [];
 
  keyphrases.forEach((kp, i) => {
    const raw = Array.isArray(kp) ? kp[0] : kp;
    const cleaned = this.cleanKeyphrase(raw);
    const similarityObj = keyphrases_dnu_similarity_score[i];
    const dnu = Object.keys(similarityObj)[0];
 
    // ✅ Skip keyphrases that have all similarity scores ≤ 0
    const hasPositive = Object.values(similarityObj)
      .filter((v): v is number => typeof v === "number")
      .some((v) => v > 0);
    if (!hasPositive) {
      /* console.warn(`Skipping unrelated keyphrase in article abstract: "${cleaned}"`); */
      return;
    }
 
    if (this.isURL(cleaned)) {
      /*   // For debugging: Skip keyphrases that look like URLs
      console.warn(`Skipping URL-like keyphrase: "${cleaned}"`); */
      return;
    }
 
    const variants = this.generateKeyphraseVariants(cleaned);
 
    let foundVariantInAbstract = false;
    variants.forEach((v) => {
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
      console.warn(`⚠️ No match in article abstract for keyphrase: "${cleaned}"`);
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
        tooltip: `<div class="tooltip-content">
          This keyphrase is the most similar to the concept <b>“${match.dnu}”</b>.
          Click on the keyphrase to view more details.
</div>`,
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


showTextualSimilarityPopover(
  part: { text: string; keyphraseMeta?: { originalKeyphrase?: string; sourceIndex?: number; similarityData?: any } },
  event: MouseEvent
) {
  if (!part) {
    return;
  }

  const resolvedMeta = part.keyphraseMeta ?? {};
  const originalKeyphrase = resolvedMeta.originalKeyphrase ?? part.text;
  const normalizedKeyphrase = this.cleanKeyphrase(originalKeyphrase);

  // Prefer the stored index; fall back to searching
  let index = typeof resolvedMeta.sourceIndex === 'number'
    ? resolvedMeta.sourceIndex
    : this.article.keyphrases.findIndex(tuple => {
        const raw = Array.isArray(tuple) ? String(tuple[0]) : String(tuple);
        return this.cleanKeyphrase(raw) === normalizedKeyphrase;
      });

  let similarities = resolvedMeta.similarityData;

  if (!similarities && index >= 0) {
    similarities = this.article.keyphrases_dnu_similarity_score?.[index];
  }

  if (!similarities) {
    console.warn(`Keyphrase "${part.text}" (normalized: "${normalizedKeyphrase}") not found.`);
    return;
  }

  this.selectedKeyphrase = originalKeyphrase;

  const similarityValues = Object.values(similarities) as number[];
  const allNonPositive = similarityValues.every(score => score <= 0);

  let formattedInfo: string[];

  if (allNonPositive) {
    formattedInfo = [
      'This keyphrase is not at all similar to the concept(s) used in generating recommendations.'
    ];
  } else {
    const entries = Object.entries(similarities) as [string, number][];
    formattedInfo = entries
      .filter(([_, score]) => score > 0)
      .map(([dnu, score]) => {
        return `<strong>${(score * 100).toFixed(2)}%</strong> similar to the concept: <strong>“${dnu}”</strong>`;
      });
  }

  this.textualSimilarityInfo = formattedInfo;

  this.textualSimilarityPopover.hide();
  setTimeout(() => this.textualSimilarityPopover.show(event), 50);
}




getFormattedSimilarityText(concept: string, value: number): string {
  const percentage = (value * 100).toFixed(2);
  return `This article is <strong>${percentage}%</strong> similar to <strong>${concept}</strong>.`;
}

get similarityText(): string {
  const score = this.article?.similarity_score ? (this.article.similarity_score * 100).toFixed(2) : '0.00';
  return `This article is overall <strong>${score}%</strong> similar to the concepts used to generate recommendations.`;
}


hidePopup() {
  this.popupVisible = false;
}

    toggleWhy() {
      this.isWhyExpanded = !this.isWhyExpanded;
}


}

