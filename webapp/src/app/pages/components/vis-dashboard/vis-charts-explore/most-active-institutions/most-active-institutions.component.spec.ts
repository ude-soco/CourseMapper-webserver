import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MostActiveInstitutionsComponent } from './most-active-institutions.component';

describe('MostActiveInstitutionsComponent', () => {
  let component: MostActiveInstitutionsComponent;
  let fixture: ComponentFixture<MostActiveInstitutionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MostActiveInstitutionsComponent]
    });
    fixture = TestBed.createComponent(MostActiveInstitutionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
