import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HTTPOptions } from 'src/app/config/config';
import {
  FavouriteRecommendation,
  RecommendationSource,
} from 'src/app/models/FavouriteRecommendation';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FavouriteRecommendationsService {
  private readonly endpoint = `${environment.API_URL}/user/favorite-recommendations`;
  private readonly favouritesSubject = new BehaviorSubject<
    FavouriteRecommendation[]
  >([]);

  readonly favourites$ = this.favouritesSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getFavouriteRecommendations(): Observable<FavouriteRecommendation[]> {
    return this.http
      .get<FavouriteRecommendation[]>(this.endpoint, HTTPOptions)
      .pipe(
        tap((favourites) => {
          this.favouritesSubject.next(favourites);
        }),
      );
  }

  addFavouriteRecommendation(
    courseId: string,
    source: RecommendationSource,
    name: string,
    teacher: string,
  ): Observable<FavouriteRecommendation[]> {
    return this.http
      .post<
        FavouriteRecommendation[]
      >(this.endpoint, { courseId, source, name, teacher }, HTTPOptions)
      .pipe(
        tap((favourites) => {
          this.favouritesSubject.next(favourites);
        }),
      );
  }

  removeFavouriteRecommendation(
    courseId: string,
    source: RecommendationSource,
    name: string,
  ): Observable<FavouriteRecommendation[]> {
    return this.http
      .delete<FavouriteRecommendation[]>(this.endpoint, {
        ...HTTPOptions,
        body: { courseId, source, name },
      })
      .pipe(
        tap((favourites) => {
          this.favouritesSubject.next(favourites);
        }),
      );
  }
}
