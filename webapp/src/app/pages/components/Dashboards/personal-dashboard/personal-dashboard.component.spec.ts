import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalDashboardComponent } from './personal-dashboard.component';

describe('PersonalDashboardComponent', () => {
  let component: PersonalDashboardComponent;
  let fixture: ComponentFixture<PersonalDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PersonalDashboardComponent]
    });
    fixture = TestBed.createComponent(PersonalDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
