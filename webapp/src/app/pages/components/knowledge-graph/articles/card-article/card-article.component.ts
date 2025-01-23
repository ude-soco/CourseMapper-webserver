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
import { ArticleElementModel } from '../models/article-element.model';
import { OverlayPanel } from 'primeng/overlaypanel';
import { DomSanitizer } from '@angular/platform-browser';
import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';

@Component({
  selector: 'app-card-article',
  templateUrl: './card-article.component.html',
  styleUrls: ['./card-article.component.css'],
})
export class CardArticleComponent {
  constructor(
    private sanitizer: DomSanitizer,
    private materialsRecommenderService: MaterialsRecommenderService
  ) {}

  @Input()
  article!: ArticleElementModel;
  @Input()
  public notUnderstoodConcepts: string[];
  @Output() onClick: EventEmitter<any> = new EventEmitter();

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
    console.log('Article:', this.article);

    // Log the activity
    this.materialsRecommenderService
      .logWikiArticleView({
        articleTitle: article.title,
        articleUrl: article.uri,
      })
      .subscribe({
        next: (response) => {
          console.log(response.message); // Display the received message
        },
        error: (err) => console.error('Error logging article view:', err),
      });
    this.article = article;
    this.onClick.emit(this.article.id);
    this.isActive = !this.isActive;
    window.open(
      this.sanitizer.sanitize(SecurityContext.URL, safeURL),
      '_blank'
    );
  }

  expand(): void {
    this.userCanExpand = !this.userCanExpand;
  }
}
