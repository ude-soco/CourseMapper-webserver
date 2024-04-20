import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparePlatformsInstitutionsComponent } from './compare-platforms-institutions.component';

describe('ComparePlatformsInstitutionsComponent', () => {
  let component: ComparePlatformsInstitutionsComponent;
  let fixture: ComponentFixture<ComparePlatformsInstitutionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ComparePlatformsInstitutionsComponent]
    });
    fixture = TestBed.createComponent(ComparePlatformsInstitutionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
