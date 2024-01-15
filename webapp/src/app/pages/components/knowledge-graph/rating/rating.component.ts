import { Component , EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ArticleElementModel} from '../articles/models/article-element.model';
import {VideoElementModel} from '../videos/models/video-element.model';
import {MessageService} from 'primeng/api';
import {OverlayPanel} from 'primeng/overlaypanel';
import { Neo4jService } from 'src/app/services/neo4j.service';
import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';
import { User } from 'src/app/models/User';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { State, getLoggedInUser } from 'src/app/state/app.reducer';

export enum Rating {
  HELPFUL= 'HELPFUL',
  NOT_HELPFUL= 'NOT_HELPFUL'
}

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css']
})
export class RatingComponent {

  userSubscription: Subscription;

  constructor(private messageService: MessageService,
              private materialsRecommenderService: MaterialsRecommenderService,
              private neo4jService: Neo4jService,
              private store: Store<State>) {
    // get current user
    this.userSubscription = this.store
      .select(getLoggedInUser)
      .subscribe((user) => (this.loggedInUser = user));
  }

  @Input() element: ArticleElementModel | VideoElementModel;
  @Input() notUnderstoodConcepts: any[];
  @Output() onClick: EventEmitter<any> = new EventEmitter();
  userid: any;
  isLiked = false;
  isDisliked = false;
  selectedConcepts: string[] = [];
  loggedInUser: User;

  ngOnInit(): void {
    if (this.loggedInUser) {
      this.userid = this.loggedInUser.id;
    }
  }

  public toggleOverlay(event: MouseEvent, element: ArticleElementModel | VideoElementModel, op: OverlayPanel): void {
    if (!this.isLiked) {
      op.toggle(event);
    }else{
      this.likeElement(element, op);
    }
  }

  public async likeElement(element: ArticleElementModel | VideoElementModel, op: OverlayPanel): Promise<void> {
    try {
      await this.rateRecommendedMaterials(Rating.HELPFUL);
      this.displaySuccessfulMessage();
    } catch (e) {
      console.log(e);
    }
    op.hide();
  }

  public async dislikeElement(element: any): Promise<void> {
    try {
      await this.rateRecommendedMaterials(Rating.NOT_HELPFUL);
      this.displaySuccessfulMessage();
    } catch (e) {
      console.log(e);
    }
  }

  displaySuccessfulMessage(): void {
    this.messageService.add({key: 'rating', severity: 'success', summary: '', detail: 'Thank You for Your Feedback!'});
  }

  displayErrorMessage(message: string): void {
    this.messageService.add({
      key: 'rating',
      severity: 'error',
      summary: message,
      detail: 'Please Try the rating again',
    });
  }

  async rateRecommendedMaterials(rating: Rating): Promise<void> {
    const formData = new FormData();
    formData.append('userId', this.userid.toString());
    formData.append('rating', rating.toString());
    formData.append('resource', JSON.stringify(this.element));
    formData.append('concepts', this.selectedConcepts.toString());

    const result = await this.materialsRecommenderService.rateRecommendedMaterials(formData);
    this.isLiked = result.voted === Rating.HELPFUL;
    this.isDisliked = result.voted === Rating.NOT_HELPFUL;
    this.element.helpful_counter = result.helpful_count;
    this.element.not_helpful_counter = result.not_helpful_count;
  }
}
