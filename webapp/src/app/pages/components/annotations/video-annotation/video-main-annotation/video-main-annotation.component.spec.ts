import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoMainAnnotationComponent } from './video-main-annotation.component';

describe('VideoMainAnnotationComponent', () => {
  let component: VideoMainAnnotationComponent;
  let fixture: ComponentFixture<VideoMainAnnotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoMainAnnotationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoMainAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
