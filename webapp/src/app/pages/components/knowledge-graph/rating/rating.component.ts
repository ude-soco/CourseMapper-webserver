import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ArticleElementModel } from '../articles/models/article-element.model';
import { VideoElementModel } from '../videos/models/video-element.model';
import { MessageService } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';
import { Neo4jService } from 'src/app/services/neo4j.service';
import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';
import { User } from 'src/app/models/User';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { State, getLoggedInUser } from 'src/app/state/app.reducer';
import { Material } from 'src/app/models/Material';
import { getCurrentPdfPage } from '../../annotations/pdf-annotation/state/annotation.reducer';
export enum Rating {
  HELPFUL = 'HELPFUL',
  NOT_HELPFUL = 'NOT_HELPFUL',
}

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css'],
})
export class RatingComponent {
  currentPdfPage: number;
  userSubscription: Subscription;
  subscriptions: Subscription = new Subscription(); // Manage subscriptions
  constructor(
    private messageService: MessageService,
    private materialsRecommenderService: MaterialsRecommenderService,
    private neo4jService: Neo4jService,
    private store: Store<State>
  ) {
    // get current user
    this.userSubscription = this.store
      .select(getLoggedInUser)
      .subscribe((user) => (this.loggedInUser = user));

    // Subscribe to get the current PDF page from store
    this.subscriptions.add(
      this.store.select(getCurrentPdfPage).subscribe((page) => {
        this.currentPdfPage = page;
      })
    );
  }

  @Input() element: ArticleElementModel | VideoElementModel;
  @Input() notUnderstoodConcepts: any[];
  @Output() onClick: EventEmitter<any> = new EventEmitter();
  @Input() currentMaterial?: Material;
  userid: any;
  isLiked = false;
  isDisliked = false;
  selectedConcepts: string[] = [];
  selectedConceptCids: string[] = [];
  loggedInUser: User;

  ngOnInit(): void {
    if (this.loggedInUser) {
      this.userid = this.loggedInUser.id;
    }
  }
  private createRatingData() {
    return {
      resourceId: this.element.id,
      title: this.element.title,
      description:
        'abstract' in this.element
          ? this.element.abstract
          : this.element.description_full,
      concepts: this.selectedConcepts,
      materialId: this.currentMaterial._id,
      materialPage: this.currentPdfPage,
    };
  }

  public toggleOverlay(
    event: MouseEvent,
    element: ArticleElementModel | VideoElementModel,
    op: OverlayPanel
  ): void {
    if (!this.isLiked) {
      op.toggle(event);
    }else{
      // this.likeElement(element, op);
      this.rateRecommendedMaterials(Rating.HELPFUL, true);
      this.displayInfofulMessage();
    }
  }

  public async likeElement(
    element: ArticleElementModel | VideoElementModel,
    op: OverlayPanel
  ): Promise<void> {
    try {
      const data = this.createRatingData();
      if ('abstract' in element) {
        // It's an article
        if (!this.isLiked) {
          const response =
            await this.materialsRecommenderService.logMarkAsHelpfulArticle(
              data
            );
        } else {
          const response =
            await this.materialsRecommenderService.logUnmarkAsHelpfulArticle(
              data
            );
        }
      } else if ('description_full' in element) {
        if (!this.isLiked) {
          // It's a video
          const response =
            await this.materialsRecommenderService.logMarkAsHelpfulVideo(data);
        } else {
          const response =
            await this.materialsRecommenderService.logUnmarkAsHelpfulVideo(
              data
            );
        }
      }
      await this.rateRecommendedMaterials(Rating.HELPFUL, false);
      this.displaySuccessfulMessage();
    } catch (e) {
      console.error(e);
    }
    op.hide();
  }

  public async dislikeElement(element: any): Promise<void> {
    try {
      const data = this.createRatingData();
      if ('abstract' in element) {
        // It's an article
        if (!this.isDisliked) {
          const response =
            await this.materialsRecommenderService.logMarkAsNotHelpfulArticle(
              data
            );
        } else {
          const response =
            await this.materialsRecommenderService.logUnmarkAsNotHelpfulArticle(
              data
            );
        }
      } else if ('description_full' in element) {
        // It's a video
        if (!this.isDisliked) {
          const response =
            await this.materialsRecommenderService.logMarkAsNotHelpfulVideo(
              data
            );
        } else {
          const response =
            await this.materialsRecommenderService.logUnmarkAsNotHelpfulVideo(
              data
            );
        }
      }
      
      if (!this.isDisliked) {
        await this.rateRecommendedMaterials(Rating.NOT_HELPFUL, false);
        this.displaySuccessfulMessage();
      } else {
        await this.rateRecommendedMaterials(Rating.NOT_HELPFUL, true);
        this.displayInfofulMessage();
      }
    } catch (e) {
      console.log(e);
    }
  }

  displaySuccessfulMessage(): void {
    this.messageService.add({
      key: 'rating',
      severity: 'success',
      summary: '',
      detail: 'Thank You for Your Feedback!',
    });
  }

  displayErrorMessage(message: string): void {
    this.messageService.add({
      key: 'rating',
      severity: 'error',
      summary: message,
      detail: 'Please Try the rating again',
    });
  }

  onChangeConcept(event, cid: string) {
    this.selectedConceptCids.push(cid);
  }

  async rateRecommendedMaterials(rating: Rating, reset: boolean): Promise<void> {
    const data = {
      user_id: this.userid.toString(),
      value: rating.toString(),
      rid: this.element.rid,
      cids: [...new Set(this.selectedConceptCids)],
      reset: reset
    }

    const result = await this.materialsRecommenderService.rateRecommendedMaterials(data);
    if (!data.reset) {
      this.isLiked = result.voted === Rating.HELPFUL;
      this.isDisliked = result.voted === Rating.NOT_HELPFUL;
    } else {
      this.isLiked = false;
      this.isDisliked = false;
    }
    this.element.helpful_count = result.helpful_count;
    this.element.not_helpful_count = result.not_helpful_count;
  }

  displayInfofulMessage(): void {
    this.messageService.add({key: 'rating', severity: 'info', summary: '', detail: 'You undo your feedback!'});
  }
}
