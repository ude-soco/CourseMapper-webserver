import { TestBed } from '@angular/core/testing';

import { MaterialKgOrderedService } from './material-kg-ordered.service';

describe('MaterialKgOrderedService', () => {
  let service: MaterialKgOrderedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaterialKgOrderedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
