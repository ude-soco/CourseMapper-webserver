import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoAnnotationToolbarComponent } from './video-annotation-toolbar.component';

describe('VideoAnnotationToolbarComponent', () => {
  let component: VideoAnnotationToolbarComponent;
  let fixture: ComponentFixture<VideoAnnotationToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoAnnotationToolbarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoAnnotationToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
