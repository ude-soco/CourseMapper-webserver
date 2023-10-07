import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CytoscapeRoadsComponent } from './cytoscape-roads.component';

describe('CytoscapeRoadsComponent', () => {
  let component: CytoscapeRoadsComponent;
  let fixture: ComponentFixture<CytoscapeRoadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CytoscapeRoadsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CytoscapeRoadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
