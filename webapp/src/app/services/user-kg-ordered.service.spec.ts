import { TestBed } from '@angular/core/testing';

import { UserKgOrderedService } from './user-kg-ordered.service';

describe('UserKgOrderedService', () => {
  let service: UserKgOrderedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserKgOrderedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
