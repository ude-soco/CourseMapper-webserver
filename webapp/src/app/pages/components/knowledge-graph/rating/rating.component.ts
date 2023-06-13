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

export enum RatingState {
  ZERO_LIKE_ZERO_DISLIKE = 'ZERO_LIKE_ZERO_DISLIKE',

  ZERO_LIKE_ONE_DISLIKE = 'ZERO_LIKE_ONE_DISLIKE',
  ONE_LIKE_ZERO_DISLIKE = 'ONE_LIKE_ZERO_DISLIKE',
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
    // private authenticationService: AuthenticationService,
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
isLiked = false;
userid: any;
isDisliked = false;
userCanLike = true;
selectedConcepts: string[] = [];
zeroLikeZeroDislike = false;
zeroLikeOneDislike = false;
oneLikeZeroDislike = false;
loggedInUser: User;

ngOnInit(): void {
if (this.loggedInUser) {
this.userid = this.loggedInUser.id;
}
}

public toggleOverlay(event: MouseEvent, element: ArticleElementModel | VideoElementModel, op: OverlayPanel): void {
if (this.userCanLike) {
op.toggle(event);
}else{
this.likeElement(element, op);
}
}

public async likeElement(element: ArticleElementModel | VideoElementModel, op: OverlayPanel): Promise<void> {
const result = await this.neo4jService.getRelationship(this.userid, this.element.id);
console.log('neo4jService.getRelationship', result);
if (result.records.length !== 0){
const rating = result.records[0]._fields[0];
console.log('rating', rating);
if (rating === Rating.HELPFUL){
this.oneLikeZeroDislike = true;
this.zeroLikeOneDislike = false;
this.zeroLikeZeroDislike = false;
}else{
this.zeroLikeOneDislike = true;
this.oneLikeZeroDislike = false;
this.zeroLikeZeroDislike = false;
}
}else{
this.zeroLikeZeroDislike = true;
this.oneLikeZeroDislike = false;
this.zeroLikeOneDislike = false;
}

this.element = element;
this.onClick.emit(this.element.id);

if (this.isDisliked) {
this.isLiked = true;
this.isDisliked = false;
} else {
this.isLiked = true;
}

if (this.zeroLikeZeroDislike) {
this.element.helpful_counter++;
await this.rateRecommendedMaterials(Rating.HELPFUL, RatingState.ZERO_LIKE_ZERO_DISLIKE).then(
() => {
this.userCanLike = false;
this.displaySuccessfulMessage();
}
).catch(e => {
console.log(e);
// this.displayErrorMessage(e);
});
} else if (this.zeroLikeOneDislike) {
this.element.helpful_counter++;
this.element.not_helpful_counter--;
await this.rateRecommendedMaterials(Rating.HELPFUL, RatingState.ZERO_LIKE_ONE_DISLIKE).then(
() => {
this.userCanLike = false;
this.displaySuccessfulMessage();
}
).catch(e => {
console.log(e);
// this.displayErrorMessage(e);
});
} else if (this.oneLikeZeroDislike) {
this.element.helpful_counter--;
this.isLiked = false;
await this.rateRecommendedMaterials(Rating.HELPFUL, RatingState.ONE_LIKE_ZERO_DISLIKE).then(
() => {
this.userCanLike = true;
}
).catch(e => {
console.log(e);
// this.displayErrorMessage(e);
});
// TODO: if selectedConcepts is the same, do nothing otherwise send the new set of concepts to the backend
}

op.hide();
}

public async dislikeElement(element: any): Promise<void> {
const result = await this.neo4jService.getRelationship(this.userid, this.element.id);
console.log('neo4jService.getRelationship', result);
if (result.records.length !== 0){
const rating = result.records[0]._fields[0];
if (rating === Rating.HELPFUL){
this.oneLikeZeroDislike = true;
this.zeroLikeOneDislike = false;
this.zeroLikeZeroDislike = false;
}else{
this.zeroLikeOneDislike = true;
this.oneLikeZeroDislike = false;
this.zeroLikeZeroDislike = false;
}
}else{
this.zeroLikeZeroDislike = true;
this.oneLikeZeroDislike = false;
this.zeroLikeOneDislike = false;
}
this.element = element;
this.onClick.emit(this.element.id);

if (this.isLiked) {
this.isLiked = false;
this.isDisliked = true;
} else {
this.isDisliked = true;
}

if (this.zeroLikeZeroDislike) {
this.element.not_helpful_counter++;
await this.rateRecommendedMaterials(Rating.NOT_HELPFUL, RatingState.ZERO_LIKE_ZERO_DISLIKE).then(
() => {this.displaySuccessfulMessage(); }
).catch(e =>  {
console.log(e);
// this.displayErrorMessage(e);
});
} else if (this.oneLikeZeroDislike) {
this.element.not_helpful_counter++;
this.element.helpful_counter--;
await this.rateRecommendedMaterials(Rating.NOT_HELPFUL, RatingState.ONE_LIKE_ZERO_DISLIKE).then(
() => {this.displaySuccessfulMessage(); }
).catch(e =>  {
console.log(e);
// this.displayErrorMessage(e);
});

} else if (this.zeroLikeOneDislike) {
this.element.not_helpful_counter--;
this.isDisliked = false;
await this.rateRecommendedMaterials(Rating.NOT_HELPFUL, RatingState.ZERO_LIKE_ONE_DISLIKE).then(
() => {this.displaySuccessfulMessage(); }
).catch(e =>  {
console.log(e);
// this.displayErrorMessage(e);
});
}
}

displaySuccessfulMessage(): void {
this.messageService.add({key: 'rating', severity: 'success', summary: '', detail: 'Thank You for Your Feedback!'});
}
displayErrorMessage(message: string): void {
this.messageService.add({
key: 'rating',
severity: 'error',
summary: 'INTERNAL SERVER ERROR',
detail: 'Please Try the rating again',
});
}

async rateRecommendedMaterials(rating: Rating, ratingState: RatingState): Promise<void> {
const formData = new FormData();

formData.append('userId', this.userid.toString());
formData.append('rating', rating.toString());
formData.append('resource', JSON.stringify(this.element));
formData.append('concepts', this.selectedConcepts.toString());
formData.append('ratingState', ratingState.toString());
await this.materialsRecommenderService.rateRecommendedMaterials(formData);
}
}
