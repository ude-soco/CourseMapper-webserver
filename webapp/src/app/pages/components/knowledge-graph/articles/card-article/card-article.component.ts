import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SecurityContext,
  ViewChild,
} from '@angular/core';
import { getCurrentPdfPage } from '../../../annotations/pdf-annotation/state/annotation.reducer';
import { ArticleElementModel } from '../models/article-element.model';
import { OverlayPanel } from 'primeng/overlaypanel';
import { DomSanitizer } from '@angular/platform-browser';
import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';
import { Material } from 'src/app/models/Material';
import { Store } from '@ngrx/store';
import { State } from 'src/app/state/app.reducer';
import { Subscription } from 'rxjs';
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
    private store: Store<State>
  ) {
    // Subscribe to get the current PDF page from store
    this.subscriptions.add(
      this.store.select(getCurrentPdfPage).subscribe((page) => {
        this.currentPdfPage = page;
      })
    );
  }

  @Input()
  article!: ArticleElementModel;
  @Input()
  public notUnderstoodConcepts: string[];
  @Output() onClick: EventEmitter<any> = new EventEmitter();
  @Input() currentMaterial?: Material;
  subscriptions: Subscription = new Subscription(); // Manage subscriptions
  ABSTRACT_MAX_LENGTH = 600;
  TITLE_MAX_LENGTH = 70;

  isActive = false;
  selectedConcepts: string[] = [];
  userCanExpand = true;

  ngOnInit(): void {}

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
}
