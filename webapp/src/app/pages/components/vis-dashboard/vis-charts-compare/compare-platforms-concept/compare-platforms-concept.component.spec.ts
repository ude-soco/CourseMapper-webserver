import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparePlatformsConceptComponent } from './compare-platforms-concept.component';

describe('ComparePlatformsConceptComponent', () => {
  let component: ComparePlatformsConceptComponent;
  let fixture: ComponentFixture<ComparePlatformsConceptComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ComparePlatformsConceptComponent]
    });
    fixture = TestBed.createComponent(ComparePlatformsConceptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
