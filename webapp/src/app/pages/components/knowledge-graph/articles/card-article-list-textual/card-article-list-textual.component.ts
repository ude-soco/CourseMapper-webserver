import { Component, Input } from '@angular/core';
import { ArticleElementModel } from '../models/article-element.model';
import { Material } from 'src/app/models/Material';
import { ResourcesPagination } from 'src/app/models/croForm';
@Component({
  selector: 'app-card-article-list-textual',
  templateUrl: './card-article-list-textual.component.html',
  styleUrls: ['./card-article-list-textual.component.css'],
})
export class CardArticleListComponentTextual {
  @Input() public articleElements: ArticleElementModel[] = [];
 
  @Input() public concepts: any[];

  public article!: ArticleElementModel;

  @Input() public conceptColors!: string[];
  @Input() userId: string;
  @Input() resultTabType: string = "";

  @Input() currentMaterial?: Material;
  @Input() resourcesPagination: ResourcesPagination;
 
  onResourceRemovedEvent(rid: string) {
    this.articleElements = this.articleElements.filter(article => article.rid !== rid);
  }
  
}
