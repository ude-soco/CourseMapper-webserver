import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisLandingPageComponent } from './vis-landing-page.component';

describe('VisLandingPageComponent', () => {
  let component: VisLandingPageComponent;
  let fixture: ComponentFixture<VisLandingPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisLandingPageComponent]
    });
    fixture = TestBed.createComponent(VisLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
