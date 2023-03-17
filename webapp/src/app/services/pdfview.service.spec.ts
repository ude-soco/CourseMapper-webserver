import { TestBed } from '@angular/core/testing';

import { PdfviewService } from './pdfview.service';

describe('PdfviewService', () => {
  let service: PdfviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
