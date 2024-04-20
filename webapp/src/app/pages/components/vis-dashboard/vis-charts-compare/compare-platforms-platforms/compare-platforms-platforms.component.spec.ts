import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparePlatformsPlatformsComponent } from './compare-platforms-platforms.component';

describe('ComparePlatformsPlatformsComponent', () => {
  let component: ComparePlatformsPlatformsComponent;
  let fixture: ComponentFixture<ComparePlatformsPlatformsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ComparePlatformsPlatformsComponent]
    });
    fixture = TestBed.createComponent(ComparePlatformsPlatformsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
