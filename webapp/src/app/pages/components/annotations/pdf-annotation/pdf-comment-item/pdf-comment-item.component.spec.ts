import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfCommentItemComponent } from './pdf-comment-item.component';

describe('PdfCommentItemComponent', () => {
  let component: PdfCommentItemComponent;
  let fixture: ComponentFixture<PdfCommentItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfCommentItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfCommentItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
