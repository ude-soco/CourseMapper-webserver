import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfCreateAnnotationComponent } from './pdf-create-annotation.component';

describe('PdfCreateAnnotationComponent', () => {
  let component: PdfCreateAnnotationComponent;
  let fixture: ComponentFixture<PdfCreateAnnotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfCreateAnnotationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfCreateAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
