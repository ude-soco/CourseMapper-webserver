import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ViewMode } from '../../types/user-pkg.types';
import * as UserPkgActions from '../../state/user-pkg.actions';
import * as UserPkgSelectors from '../../state/user-pkg.reducer';

@Component({
  selector: 'app-pkg-filter-controls',
  templateUrl: './filter-controls.component.html',
  styleUrls: ['./filter-controls.component.css']
})
export class PkgFilterControlsComponent {
  // Selectors from store
  viewMode$ = this.store.select(UserPkgSelectors.selectViewMode);
  searchQuery$ = this.store.select(UserPkgSelectors.selectSearchQuery);
  topNConcepts$ = this.store.select(UserPkgSelectors.selectTopNConcepts);
  understandingStatus$ = this.store.select(UserPkgSelectors.selectUnderstandingStatus);

  readonly topNOptions = [
    { label: '15', value: 15 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: 'All', value: 'All' }
  ];
  
  readonly understandingStatusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Understood', value: 'u' },
    { label: 'Not Understood', value: 'dnu' }
  ];

  constructor(private store: Store) {}

  onViewModeChange(mode: ViewMode): void {
    this.store.dispatch(UserPkgActions.setViewMode({ viewMode: mode }));
  }

  onUnderstandingStatusChange(status: 'all' | 'u' | 'dnu'): void {
    this.store.dispatch(UserPkgActions.setUnderstandingStatus({ understandingStatus: status }));
  }

  onSearchQueryChange(query: string): void {
    this.store.dispatch(UserPkgActions.setSearchQuery({ searchQuery: query }));
  }

  onTopNChange(topN: number | 'All'): void {
    // TopN change requires reloading data from backend
    // This will be handled by the parent component which has the userId
    // For now, just update the filter state
    this.store.dispatch(UserPkgActions.setTopNConcepts({ topNConcepts: topN }));
  }
}
