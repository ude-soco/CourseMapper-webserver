import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CytoscapeSequenceRecommendedComponent } from './cytoscape-sequence-recommended.component';

describe('CytoscapeSequenceRecommendedComponent', () => {
  let component: CytoscapeSequenceRecommendedComponent;
  let fixture: ComponentFixture<CytoscapeSequenceRecommendedComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CytoscapeSequenceRecommendedComponent]
    });
    fixture = TestBed.createComponent(CytoscapeSequenceRecommendedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
