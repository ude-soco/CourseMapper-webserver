import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoAnnotationSummaryComponent } from './video-annotation-summary.component';

describe('VideoAnnotationSummaryComponent', () => {
  let component: VideoAnnotationSummaryComponent;
  let fixture: ComponentFixture<VideoAnnotationSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoAnnotationSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoAnnotationSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
