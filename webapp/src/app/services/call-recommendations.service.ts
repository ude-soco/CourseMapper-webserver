import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CallRecommendationsService {
  private recommendationCalled = new Subject<any>();
  private recommendationCalledDone = new Subject<any>();
  private disClicked = new Subject<any>();
  private showRecommendationsClickedSubject= new Subject<any>();
  private showRecommendationsFinishedSubject= new Subject<any>();
  private reqDataSubject= new Subject<any>();

  public reqDataForm:any


  constructor() { }
  recommendationsCalled(){
    this.recommendationCalled.next(true);
  }
  recommendationsObserved():Observable<any>{
    return this.recommendationCalled.asObservable();
  }
  recommendationsCalledDone(){
    this.recommendationCalledDone.next(true);
  }
  recommendationsDoneObserved():Observable<any>{
    return this.recommendationCalledDone.asObservable();
  }
  disabledTabClicked(){
    this.disClicked.next(true)
  }
  disabledTabObserved():Observable<any>{
    return this.disClicked.asObservable()
  }
  showRecommendationsClicked(){
    this.showRecommendationsClickedSubject.next(true)
  }
  showRecommendationsObserved():Observable<any>{
    return this.showRecommendationsClickedSubject.asObservable()
  }
  showRecommendationsFinished(){
    this.showRecommendationsFinishedSubject.next(true)
  }
  showRecommendationsFinishedObserved():Observable<any>{
    return this.showRecommendationsFinishedSubject.asObservable()
  }
  reqDataUpdate(formData:any){
    this.reqDataForm=formData
    this.reqDataSubject.next(true)
  }
  reqDataObserved():Observable<any>{
    return this.reqDataSubject.asObservable()
  }

}
