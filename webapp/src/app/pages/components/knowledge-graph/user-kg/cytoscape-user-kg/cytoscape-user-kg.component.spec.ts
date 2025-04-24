import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CytoscapeUserKgComponent } from './cytoscape-user-kg.component';

describe('CytoscapeUserKgComponent', () => {
  let component: CytoscapeUserKgComponent;
  let fixture: ComponentFixture<CytoscapeUserKgComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CytoscapeUserKgComponent]
    });
    fixture = TestBed.createComponent(CytoscapeUserKgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
