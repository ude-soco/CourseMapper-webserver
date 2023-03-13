import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoDrawingOverlayComponent } from './video-drawing-overlay.component';

describe('VideoDrawingOverlayComponent', () => {
  let component: VideoDrawingOverlayComponent;
  let fixture: ComponentFixture<VideoDrawingOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoDrawingOverlayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoDrawingOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
