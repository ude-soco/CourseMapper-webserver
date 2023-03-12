import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoCreateAnnotationComponent } from './video-create-annotation.component';

describe('VideoCreateAnnotationComponent', () => {
  let component: VideoCreateAnnotationComponent;
  let fixture: ComponentFixture<VideoCreateAnnotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoCreateAnnotationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoCreateAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
