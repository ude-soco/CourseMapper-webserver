import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToWebsiteButtonComponent } from './to-website-button.component';

describe('ToWebsiteButtonComponent', () => {
  let component: ToWebsiteButtonComponent;
  let fixture: ComponentFixture<ToWebsiteButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ToWebsiteButtonComponent]
    });
    fixture = TestBed.createComponent(ToWebsiteButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
