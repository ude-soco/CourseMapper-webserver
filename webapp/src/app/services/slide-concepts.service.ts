import { getCurrentMaterial } from './../pages/components/materials/state/materials.reducer';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HTTPOptions } from '../config/config';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { getCurrentPdfPage } from '../pages/components/annotations/pdf-annotation/state/annotation.reducer';
import { State } from 'src/app/state/app.reducer';
@Injectable({
  providedIn: 'root',
})
export class SlideConceptsService {
  apiURL = environment.API_URL;
  public allConcepts = new Subject<any[]>();
  public newConcepts = new Subject<any[]>();
  public didNotUnderstandConcepts = new Subject<any[]>();
  public understoodConcepts = new Subject<any[]>();
  public didNotUnderstandAllConceptsSubject = new Subject<any[]>();

  public didNotUnderstandAllConcepts = [];
  public commonDidNotUnderstandConcepts = [];
  public commonUnderstoodConcepts = [];
  public commonNewConcepts = [];

  currentMaterial: any;
  currentPdfPage: number;
  subscriptions: Subscription = new Subscription(); // Manage subscriptions
  constructor(private http: HttpClient, private store: Store<State>) {
    this.newConcepts = new Subject();
    this.didNotUnderstandConcepts = new Subject();
    this.understoodConcepts = new Subject();
    // Subscribe to get material Data from store
    this.subscriptions.add(
      this.store.select(getCurrentMaterial).subscribe((material) => {
        if (material) {
          this.currentMaterial = material;
        }
      })
    );

    // Subscribe to get the current PDF page from store
    this.subscriptions.add(
      this.store.select(getCurrentPdfPage).subscribe((page) => {
        this.currentPdfPage = page;
      })
    );
  }

  setAllConcepts(list: string[]) {
    this.allConcepts.next(list);
    // console.log(list)
  }
  setNewConcepts(list: string[]) {
    this.commonNewConcepts = list;
    this.newConcepts.next(list);
    // console.log('setNewConcepts(list): ', list);
  }
  updateNewConcepts(concept: any) {
    if (
      this.commonNewConcepts.some(
        (e) => e.cid.toString() === concept.cid.toString()
      )
    ) {
    } else {
      this.commonNewConcepts.push(concept);
      if (
        this.commonDidNotUnderstandConcepts.some(
          (e) => e.cid.toString() === concept.cid.toString()
        )
      ) {
        this.commonDidNotUnderstandConcepts.some((node, index) => {
          if (node.cid.toString() === concept.cid.toString()) {
            this.commonDidNotUnderstandConcepts.splice(index, 1);
          }
        });
      } else if (
        this.commonUnderstoodConcepts.some(
          (e) => e.cid.toString() === concept.cid.toString()
        )
      ) {
        this.commonUnderstoodConcepts.some((node, index) => {
          if (node.cid.toString() === concept.cid.toString()) {
            this.commonUnderstoodConcepts.splice(index, 1);
          }
        });
      }
    }
    this.setNewConcepts(this.commonNewConcepts);
    this.setDidNotUnderstandConcepts(this.commonDidNotUnderstandConcepts);
    this.setUnderstoodConcepts(this.commonUnderstoodConcepts);
    const data = {
      concept: concept,
      materialId: this.currentMaterial._id,
      courseId: this.currentMaterial.courseId,
      currentPdfPage: this.currentPdfPage,
    };
    this.logMarkConceptAsNew(data).subscribe();
    // console.log('updateNewConcepts(concept): ', concept);
  }

  setDidNotUnderstandConcepts(list: string[]) {
    this.commonDidNotUnderstandConcepts = list;
    this.didNotUnderstandConcepts.next(list);
    // console.log('setDidNotUnderstandConcepts(list): ', list);
  }
  setAllNotUnderstoodConcepts(list: string[]) {
    this.didNotUnderstandAllConcepts = list;
    this.didNotUnderstandAllConceptsSubject.next(list);
    // console.log('setAllNotUnderstoodConcepts(slide)', list);
  }
  allNotunderstoodObserved(): Observable<any> {
    return this.didNotUnderstandAllConceptsSubject.asObservable();
  }
  updateDidNotUnderstandConcepts(concept: any) {
    if (
      this.commonDidNotUnderstandConcepts.some(
        (e) => e.cid.toString() === concept.cid.toString()
      )
    ) {
    } else {
      this.commonDidNotUnderstandConcepts.push(concept);
      if (
        this.commonNewConcepts.some(
          (e) => e.cid.toString() === concept.cid.toString()
        )
      ) {
        this.commonNewConcepts.some((node, index) => {
          if (node.cid.toString() === concept.cid.toString()) {
            this.commonNewConcepts.splice(index, 1);
          }
        });
      } else if (
        this.commonUnderstoodConcepts.some(
          (e) => e.cid.toString() === concept.cid.toString()
        )
      ) {
        this.commonUnderstoodConcepts.some((node, index) => {
          if (node.cid.toString() === concept.cid.toString()) {
            this.commonUnderstoodConcepts.splice(index, 1);
          }
        });
      }
    }
    this.setNewConcepts(this.commonNewConcepts);
    this.setDidNotUnderstandConcepts(this.commonDidNotUnderstandConcepts);
    this.setUnderstoodConcepts(this.commonUnderstoodConcepts);
    const data = {
      concept: concept,
      materialId: this.currentMaterial._id,
      courseId: this.currentMaterial.courseId,
      currentPdfPage: this.currentPdfPage,
    };
    this.logMarkConceptAsNotUnderstood(data).subscribe();
    // console.log('updateDidNotUnderstandConcepts(concept): ', concept);
  }
  setUnderstoodConcepts(list: string[]) {
    this.commonUnderstoodConcepts = list;
    this.understoodConcepts.next(list);
    // console.log('setUnderstoodConcepts(list): ', list);
  }
  updateUnderstoodConcepts(concept: any) {
    if (
      this.commonUnderstoodConcepts.some(
        (e) => e.cid.toString() === concept.cid.toString()
      )
    ) {
    } else {
      this.commonUnderstoodConcepts.push(concept);
      if (
        this.commonNewConcepts.some(
          (e) => e.cid.toString() === concept.cid.toString()
        )
      ) {
        this.commonNewConcepts.some((node, index) => {
          if (node.cid.toString() === concept.cid.toString()) {
            this.commonNewConcepts.splice(index, 1);
          }
        });
      } else if (
        this.commonDidNotUnderstandConcepts.some(
          (e) => e.cid.toString() === concept.cid.toString()
        )
      ) {
        this.commonDidNotUnderstandConcepts.some((node, index) => {
          if (node.cid.toString() === concept.cid.toString()) {
            this.commonDidNotUnderstandConcepts.splice(index, 1);
          }
        });
      }
    }
    this.setNewConcepts(this.commonNewConcepts);
    this.setDidNotUnderstandConcepts(this.commonDidNotUnderstandConcepts);
    this.setUnderstoodConcepts(this.commonUnderstoodConcepts);
    const data = {
      concept: concept,
      materialId: this.currentMaterial._id,
      courseId: this.currentMaterial.courseId,
      currentPdfPage: this.currentPdfPage,
    };
    this.logMarkConceptAsUnderstood(data).subscribe();
    // console.log('updateUnderstoodConcepts(concept): ', concept);
  }
  logMarkConceptAsNew(data: any): Observable<any> {
    console.log('data: ', data);
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/concepts/${data.concept.id}/mark-new`,
      data
    );
  }
  logMarkConceptAsUnderstood(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/concepts/${data.concept.id}/mark-understood`,
      data
    );
  }
  logMarkConceptAsNotUnderstood(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/concepts/${data.concept.id}/mark-not-understood`,
      data
    );
  }
  logViewMainConcepts(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/main-concepts/log`,
      data
    );
  }
  logViewMoreConcepts(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/main-concepts/log-view-more`,
      data
    );
  }
  logViewLessConcepts(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/main-concepts/log-view-less`,
      data
    );
  }
  logViewConcept(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/concepts/${data.concept.id}/log-view`,
      data
    );
  }
  logViewExplanation(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/concepts/${data.node_id}/view-explanation`,
      data
    );
  }
  logViewFullWikiArticle(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/recommended-concepts/${data.node_id}/view-full-wiki`,
      data
    );
  }
  logViewFullArticleMainConcept(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/main-concepts/${data.node_id}/view-full-wiki`,
      data
    );
  }
}
