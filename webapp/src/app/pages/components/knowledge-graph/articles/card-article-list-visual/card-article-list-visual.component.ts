import { Component, Input } from '@angular/core';
import { ArticleElementModel } from '../models/article-element.model';
import { ArticleMock } from '../mocks/article.mock';
import { HighlightPipe } from 'src/app/highlight.pipe';
import { Material } from 'src/app/models/Material';
import { ResourcesPagination } from 'src/app/models/croForm';
@Component({
  selector: 'app-card-article-list-visual',
  templateUrl: './card-article-list-visual.component.html',
  styleUrls: ['./card-article-list-visual.component.css'],
})
export class CardArticleListComponentVisual {
  @Input() public articleElements: ArticleElementModel[] = [];
  @Input() public concepts: any[];

  public article!: ArticleElementModel;
  @Input() public conceptColors!: string[];
  @Input() userId: string;

  @Input() resultTabType: string = "";
  selectedArticle: ArticleElementModel | null = null;
  @Input() currentMaterial?: Material;
  @Input() resourcesPagination: ResourcesPagination
 
  onResourceRemovedEvent(rid: string) {
    this.articleElements = this.articleElements.filter(article => article.rid !== rid);
  }
  
}
