import { Component, Input } from '@angular/core';
import { ArticleElementModel } from '../models/article-element.model';
import { ArticleMock } from '../mocks/article.mock';
import { Material } from 'src/app/models/Material';
@Component({
  selector: 'app-card-article-list',
  templateUrl: './card-article-list.component.html',
  styleUrls: ['./card-article-list.component.css'],
})
export class CardArticleListComponent {
  @Input()
  public articleElements: ArticleElementModel[] = [];
  @Input()
  public notUnderstoodConcepts: string[];
  public article!: ArticleElementModel;
  @Input() currentMaterial?: Material;
}
