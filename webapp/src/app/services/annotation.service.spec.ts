import { TestBed } from '@angular/core/testing';

import { AnnotationService } from './annotation.service';

describe('AnnotationService', () => {
  let service: AnnotationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnnotationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
