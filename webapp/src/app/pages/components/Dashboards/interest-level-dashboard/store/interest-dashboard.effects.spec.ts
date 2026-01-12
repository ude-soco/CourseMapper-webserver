import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { InterestDashboardEffects } from './interest-dashboard.effects';

describe('InterestDashboardEffects', () => {
  let actions$: Observable<any>;
  let effects: InterestDashboardEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InterestDashboardEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.inject(InterestDashboardEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
