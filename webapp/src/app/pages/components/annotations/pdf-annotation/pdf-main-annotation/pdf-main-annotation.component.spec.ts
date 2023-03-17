import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfMainAnnotationComponent } from './pdf-main-annotation.component';

describe('PdfMainAnnotationComponent', () => {
  let component: PdfMainAnnotationComponent;
  let fixture: ComponentFixture<PdfMainAnnotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfMainAnnotationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfMainAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
