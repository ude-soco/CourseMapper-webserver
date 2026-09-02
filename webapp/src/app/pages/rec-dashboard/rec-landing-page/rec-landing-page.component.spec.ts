import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecLandingPageComponent } from './rec-landing-page.component';

describe('RecLandingPageComponent', () => {
  let component: RecLandingPageComponent;
  let fixture: ComponentFixture<RecLandingPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecLandingPageComponent]
    });
    fixture = TestBed.createComponent(RecLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
