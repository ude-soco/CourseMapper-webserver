import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfCommentPanelComponent } from './pdf-comment-panel.component';

describe('PdfCommentPanelComponent', () => {
  let component: PdfCommentPanelComponent;
  let fixture: ComponentFixture<PdfCommentPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfCommentPanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfCommentPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
