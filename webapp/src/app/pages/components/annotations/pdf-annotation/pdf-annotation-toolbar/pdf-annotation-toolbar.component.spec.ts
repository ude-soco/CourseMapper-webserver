import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfAnnotationToolbarComponent } from './pdf-annotation-toolbar.component';

describe('PdfAnnotationToolbarComponent', () => {
  let component: PdfAnnotationToolbarComponent;
  let fixture: ComponentFixture<PdfAnnotationToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfAnnotationToolbarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfAnnotationToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
