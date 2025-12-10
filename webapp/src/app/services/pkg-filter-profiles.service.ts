import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FilterProfile } from '../pages/components/knowledge-graph/user-pkg/components/advanced-filters-dialog/advanced-filters.types';

@Injectable({
  providedIn: 'root'
})
export class FilterProfilesService {
  constructor(private http: HttpClient) {}

  /**
   * Get all filter profiles for a user
   */
  getFilterProfiles(userId: string): Observable<{ profiles: FilterProfile[] }> {
    return this.http.get<{ profiles: FilterProfile[] }>(
      `${environment.API_URL}/knowledge-graph/pkg-filter-profiles/${userId}`
    );
  }

  /**
   * Create a new filter profile
   */
  createFilterProfile(userId: string, name: string, slideIds: string[]): Observable<{ profile: FilterProfile }> {
    return this.http.post<{ profile: FilterProfile }>(
      `${environment.API_URL}/knowledge-graph/pkg-filter-profiles/${userId}`,
      { name, slideIds }
    );
  }

  /**
   * Update an existing filter profile
   */
  updateFilterProfile(userId: string, profileId: string, name: string, slideIds: string[]): Observable<{ profile: FilterProfile }> {
    return this.http.put<{ profile: FilterProfile }>(
      `${environment.API_URL}/knowledge-graph/pkg-filter-profiles/${userId}/${profileId}`,
      { name, slideIds }
    );
  }

  /**
   * Delete a filter profile
   */
  deleteFilterProfile(userId: string, profileId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.API_URL}/knowledge-graph/pkg-filter-profiles/${userId}/${profileId}`
    );
  }
}
