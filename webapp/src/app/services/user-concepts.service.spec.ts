import { TestBed } from '@angular/core/testing';

import { UserConceptsService } from './user-concepts.service';

describe('UserConceptsService', () => {
  let service: UserConceptsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserConceptsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
