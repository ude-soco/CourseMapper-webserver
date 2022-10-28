import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationCommentPanelComponent } from './annotation-comment-panel.component';

describe('AnnotationCommentPanelComponent', () => {
  let component: AnnotationCommentPanelComponent;
  let fixture: ComponentFixture<AnnotationCommentPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnnotationCommentPanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnotationCommentPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
