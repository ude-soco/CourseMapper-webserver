import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';
import {DomSanitizer,SafeHtml} from '@angular/platform-browser';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VideoElementModel } from '../models/video-element.model';
import { Material } from 'src/app/models/Material';
import { MessageService } from 'primeng/api';
import { ResourcesPagination } from 'src/app/models/croForm';
import { ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
@Component({
  selector: 'app-card-video-textual',
  templateUrl: './card-video-textual.component.html',
  styleUrls: ['./card-video-textual.component.css'],
})


export class CardVideoComponentTextual {
  

  constructor(
    private sanitizer: DomSanitizer,
    private messageService: MessageService,
    private materialsRecommenderService: MaterialsRecommenderService,
  ) {}

  @ViewChild('textualSimilarityPopover', { static: false }) textualSimilarityPopover!: OverlayPanel;
  selectedKeyphrase: string | null = null;
  textualSimilarityInfo: string[] = [];
  

  DESCRIPTION_MAX_LENGTH = 450;
  isActive = false;
  showModal = false;
  selectedConcepts: string[] = [];

  @Input()
  public videoElement: VideoElementModel;
  @Input() public concepts: { name: string }[] = [];
  // @Input() public notUnderstoodConcepts: string[];
  @Output() onClick: EventEmitter<any> = new EventEmitter();
  @Output() onWatchVideo: EventEmitter<any> = new EventEmitter();
  @Input() userId: string;
  @Input() TabSaved: boolean = false;

  isDescriptionFullDisplayed = false;

  isBookmarkFill = false;
  videoDescription = "";
  saveOrRemoveParams = {"user_id": "", "rid": "", "status": false};
  saveOrRemoveStatus = false;
  @Input() resultTabType: string = "";
  @Output() resourceRemovedEvent = new EventEmitter<string>(); // take rid

  @Input() public conceptColors!: string[];
  public notUnderstoodConceptsNames: string[]= [];
  isWhyExpanded: boolean = false;

  @Input() keyphrasesImportanceTuple: any[] = [];

  @Input() keyphrases_dnu_similarity_score: any[];

  @Input() currentMaterial?: Material;
  @Input() resourcesPagination: ResourcesPagination
  @Output() keyphraseClicked = new EventEmitter<{ keyphrase: string, clientX: number, clientY: number }>();
  abstractParts: { text: string, isKeyphrase: boolean, keyphraseMeta?: any }[] = [];
  abstractPartsTruncated: { text: string; isKeyphrase: boolean; keyphraseMeta?: any }[] = [];
  coloredBandData = {
    document_dnu_similarity_colorband: {} as { [key: string]: number },
    tags: [] as { text: string; color: string }[]
  };


  ngOnInit(): void {
    console.log(this.videoElement);
    this.notUnderstoodConceptsNames = this.concepts?.map(dnu => dnu.name) ?? [];

    this.coloredBandData = {
      document_dnu_similarity_colorband: this.concepts.reduce((acc, concept, i) => {
        acc[concept.name] = this.videoElement.document_dnu_similarity[concept.name] || 0;
        return acc;
      }, {}),
      tags: this.concepts.map((concept, index) => ({
        text: concept.name,
        color: this.conceptColors[index] || '#cccccc'
      }))
    };

     if (this.videoElement?.description && this.videoElement?.keyphrases) {
      this.generateParts(
      this.videoElement.description,
      this.videoElement.keyphrases,
      this.videoElement.keyphrases_dnu_similarity_score
      );
      this.abstractPartsTruncated = this.truncateParts(this.abstractParts, this.DESCRIPTION_MAX_LENGTH);
    }
  }
  
  public readVideo(videoElement: any): void {
    console.log('card video');
    this.videoElement = videoElement;
    this.onClick.emit(this.videoElement.id);
    this.isActive = !this.isActive;
    this.showModal = !this.showModal;
    this.onWatchVideo.emit(videoElement);

    this.showLabelMoreDescription();
  }

  ngOnChanges() {
    this.saveOrRemoveParams.status = this.videoElement?.is_bookmarked_fill;
    this.saveOrRemoveParams.user_id = this.userId;
    this.saveOrRemoveParams.rid = this.videoElement?.rid;
    
    if (this.videoElement?.description && this.videoElement?.keyphrases) {
      this.generateParts(
      this.videoElement.description,
      this.videoElement.keyphrases,
      this.videoElement.keyphrases_dnu_similarity_score
      );
      this.abstractPartsTruncated = this.truncateParts(this.abstractParts, this.DESCRIPTION_MAX_LENGTH);
    }
  }

  showLabelMoreDescription() {
    if (this.videoElement?.description.length > 0 ) {
    }
  }

  showDescriptionFull() {
    this.isDescriptionFullDisplayed = this.isDescriptionFullDisplayed === true ? false : true;
  }

  addToBookmark() {    
    this.videoElement.is_bookmarked_fill = this.videoElement?.is_bookmarked_fill === true ? false : true;
    this.saveOrRemoveParams.status = this.videoElement?.is_bookmarked_fill;

    this.SaveOrRemoveUserResource(this.saveOrRemoveParams);
    this.onResourceRemovedEvent();
  }

  saveOrRemoveBookmark() {
    // detail: 'Open your Bookmark List to find this video'
    if (this.videoElement.is_bookmarked_fill === true) {
      if (this.saveOrRemoveStatus === true) {
        this.messageService.add({ key: 'resource_bookmark_video', severity: 'success', summary: '', detail: 'Video saved successfully'});
      }
    } else {
      if (this.saveOrRemoveStatus === false) {
        this.messageService.add({key: 'resource_bookmark_video', severity: 'info', summary: '', detail: 'Video removed from saved'});
      }
    }
  }

  SaveOrRemoveUserResource(params) {
    this.materialsRecommenderService.SaveOrRemoveUserResource(params)
      .subscribe({
        next: (data: any) => {
          if (data["msg"] == "saved") {
            this.saveOrRemoveStatus = true;
            this.videoElement.is_bookmarked_fill = true;
          } else {
            this.saveOrRemoveStatus = false;
            this.videoElement.is_bookmarked_fill = false;
          }
          this.saveOrRemoveBookmark();
        },
        error: (err) => {
          console.log(err);
          this.saveOrRemoveStatus = false;
          this.videoElement.is_bookmarked_fill = false;
        },
      }
    );
  }

  onResourceRemovedEvent() {
    if (this.videoElement.is_bookmarked_fill === false && this.resultTabType === "saved") { // this.isBookmarkFill === false 
      this.resourceRemovedEvent.emit(this.videoElement.rid);
    }
  }

  padStringToLength(str) {
    const targetLength = 30;
  
    if (str.length < targetLength) {
      // Pad the string with spaces until it reaches the target length
      return str.padEnd(targetLength, ' ');
    } else {
      // Return the string as is if it's already 50 characters or longer
      return str;
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

 


  showPopup(keyphrase: string, clientX: number, clientY: number) {
      this.keyphraseClicked.emit({ keyphrase, clientX, clientY });
    }

   toggleWhy() {
      this.isWhyExpanded = !this.isWhyExpanded;
}

  getFormattedSimilarityText(concept: string, score: number): string {
  const percent = (score * 100).toFixed(0);
  return `This video is <strong>${percent}%</strong> similar to <strong>“${concept}”</strong>`;
}

//selectedKeyphrase: string = '';
//textualSimilarityInfo: string[] = [];
//popupVisible: boolean = false;

  showTextualSimilarityPopover(keyphrase: string, event: MouseEvent) {
    this.selectedKeyphrase = keyphrase;

    const index = this.videoElement.keyphrases.findIndex(tuple => tuple[0] === keyphrase);
    if (index === -1) {
      console.warn(`Keyphrase "${keyphrase}" not found.`);
      this.textualSimilarityInfo = ['No similarity information found.'];
      return;
    }

    const similarities = this.videoElement.keyphrases_dnu_similarity_score[index];

    this.textualSimilarityInfo = Object.entries(similarities || {}).map(
      ([dnu, score]: [string, number]) =>
        `<strong>${(score * 100).toFixed(0)}%</strong> – <strong>“${dnu}”</strong>`
    );

    this.textualSimilarityPopover.hide();
    setTimeout(() => {
      this.textualSimilarityPopover.show(event);
    }, 50);
  }
  

  getTopKeyphrasesWithSimilarities(limit: number = 10): {
    phrase: string;
    weight: number;
    similarities: { dnu: string, score: number }[];
  }[] {
    const rawTuples: any[] = this.videoElement?.keyphrases || [];
    const similarityScores = this.videoElement?.keyphrases_dnu_similarity_score;

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
}
