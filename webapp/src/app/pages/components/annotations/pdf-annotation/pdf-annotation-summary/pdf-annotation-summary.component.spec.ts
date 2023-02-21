import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfAnnotationSummaryComponent } from './pdf-annotation-summary.component';

describe('PdfAnnotationSummaryComponent', () => {
  let component: PdfAnnotationSummaryComponent;
  let fixture: ComponentFixture<PdfAnnotationSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfAnnotationSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfAnnotationSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
