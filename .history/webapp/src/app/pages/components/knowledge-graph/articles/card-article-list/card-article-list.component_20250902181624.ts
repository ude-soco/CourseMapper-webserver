import { Component, Input } from '@angular/core';
import { ArticleElementModel } from '../models/article-element.model';
import { ArticleMock } from '../mocks/article.mock';
import { HighlightPipe } from 'src/app/highlight.pipe';
import { Material } from 'src/app/models/Material';
import { ResourcesPagination } from 'src/app/models/croForm';
@Component({
  selector: 'app-card-article-list',
  templateUrl: './card-article-list.component.html',
  styleUrls: ['./card-article-list.component.css'],
})
export class CardArticleListComponent {
  @Input() public articleElements: ArticleElementModel[] = [];
 
  @Input() public concepts: any[];

  public article!: ArticleElementModel;

  @Input() public dnuColors!: string[];
  @Input() userId: string;
  @Input() resultTabType: string = "";

  popupVisible = false;
  popupX = 0;
  popupY = 0;
  selectedKeyphrase: string | null = null;
  selectedArticle: ArticleElementModel | null = null;
  @Input() currentMaterial?: Material;
 @Input() resourcesPagination: ResourcesPagination
 
  onResourceRemovedEvent(rid: string) {
    this.articleElements = this.articleElements.filter(article => article.rid !== rid);
  }
  
  onKeyphraseClicked(article: ArticleElementModel, event: { keyphrase: string, clientX: number, clientY: number }) {
    this.selectedKeyphrase = event.keyphrase;
    this.popupX = event.clientX;
    this.popupY = event.clientY;
    this.selectedArticle = article;
    this.popupVisible = true;
  }
  
  closePopup = () => {
    this.popupVisible = false;
  };
}
