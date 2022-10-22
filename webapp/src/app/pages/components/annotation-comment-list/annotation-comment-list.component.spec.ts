import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationCommentListComponent } from './annotation-comment-list.component';

describe('AnnotationCommentListComponent', () => {
  let component: AnnotationCommentListComponent;
  let fixture: ComponentFixture<AnnotationCommentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnnotationCommentListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnotationCommentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
