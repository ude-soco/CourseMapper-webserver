import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CytoscapeRecommendedComponent } from './cytoscape-recommended.component';

describe('CytoscapeRecommendedComponent', () => {
  let component: CytoscapeRecommendedComponent;
  let fixture: ComponentFixture<CytoscapeRecommendedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CytoscapeRecommendedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CytoscapeRecommendedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
