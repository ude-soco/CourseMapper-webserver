import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SecurityContext, ViewChild} from '@angular/core';
import {ArticleElementModel} from '../models/article-element.model';
import {OverlayPanel} from 'primeng/overlaypanel';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-card-article',
  templateUrl: './card-article.component.html',
  styleUrls: ['./card-article.component.css']
})
export class CardArticleComponent {
  constructor(private sanitizer: DomSanitizer) {}

  @Input()
  article!: ArticleElementModel;
  @Input()
  public notUnderstoodConcepts: string[];
  @Output() onClick: EventEmitter<any> = new EventEmitter();
  @Input() userId: string;

  ABSTRACT_MAX_LENGTH = 600;
  TITLE_MAX_LENGTH = 70;

  isActive = false;
  selectedConcepts: string[] = [];
  userCanExpand = true;

  ngOnInit(): void {}

  public openArticle(article: any): void {
    const safeURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.article.uri);
    this.article = article;
    this.onClick.emit(this.article.id);
    this.isActive = !this.isActive;
    window.open(this.sanitizer.sanitize(SecurityContext.URL, safeURL), '_blank');
  }

  expand(): void {
    this.userCanExpand = !this.userCanExpand;
  }
}
