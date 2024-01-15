import { TestBed } from '@angular/core/testing';

import { GraphRenderedService } from './graph-rendered.service';

describe('GraphRenderedService', () => {
  let service: GraphRenderedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphRenderedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
