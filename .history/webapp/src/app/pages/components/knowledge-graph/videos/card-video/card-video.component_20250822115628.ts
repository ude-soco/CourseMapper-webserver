import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';
import {DomSanitizer,SafeHtml} from '@angular/platform-browser';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VideoElementModel } from '../models/video-element.model';
import { Material } from 'src/app/models/Material';
import { MessageService } from 'primeng/api';
import { ResourcesPagination } from 'src/app/models/croForm';


@Component({
  selector: 'app-card-video',
  templateUrl: './card-video.component.html',
  styleUrls: ['./card-video.component.css'],
})
export class CardVideoComponent {
  constructor(
    private sanitizer: DomSanitizer,
    private messageService: MessageService,
    private materialsRecommenderService: MaterialsRecommenderService,
  ) {}

  DESCRIPTION_MAX_LENGTH = 450;
  isActive = false;
  showModal = false;
  selectedConcepts: string[] = [];

  @Input()
  public videoElement: VideoElementModel;
  @Input() public notUnderstoodConcepts: { name: string }[] = [];
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

  @Input() public dnuColors!: string[];
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
    this.notUnderstoodConceptsNames = this.notUnderstoodConcepts?.map(dnu => dnu.name) ?? [];

    this.coloredBandData = {
      document_dnu_similarity_colorband: this.notUnderstoodConcepts.reduce((acc, concept, i) => {
        acc[concept.name] = this.videoElement.document_dnu_similarity[concept.name] || 0;
        return acc;
      }, {}),
      tags: this.notUnderstoodConcepts.map((concept, index) => ({
        text: concept.name,
        color: this.dnuColors[index] || '#cccccc'
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


  showPopup(keyphrase: string, clientX: number, clientY: number) {
      this.keyphraseClicked.emit({ keyphrase, clientX, clientY });
    }

   toggleWhy() {
      this.isWhyExpanded = !this.isWhyExpanded;
}
}
