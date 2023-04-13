import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoRenderingOverlayComponent } from './video-rendering-overlay.component';

describe('VideoRenderingOverlayComponent', () => {
  let component: VideoRenderingOverlayComponent;
  let fixture: ComponentFixture<VideoRenderingOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoRenderingOverlayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoRenderingOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
