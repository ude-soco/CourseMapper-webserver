import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { InterestLevelGraphComponent } from './interest-level-graph.component';
import { InterestConcept } from '../../types/interest-level.types';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import * as PkgInterestSelectors from '../../store/pkg-interest/pkg-interest.selectors';

describe('InterestLevelGraphComponent', () => {
  let component: InterestLevelGraphComponent;
  let fixture: ComponentFixture<InterestLevelGraphComponent>;
  let store: MockStore;

  const mockConcepts: InterestConcept[] = [
    {
      conceptId: '1',
      conceptName: 'Algorithm',
      interestScore: 0.85,
    },
    {
      conceptId: '2',
      conceptName: 'Data Structure',
      interestScore: null,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InterestLevelGraphComponent],
      providers: [
        provideMockStore({
          initialState: {},
          selectors: [
            { selector: PkgInterestSelectors.selectFilteredInterestConcepts, value: [] },
            { selector: PkgInterestSelectors.selectTopN, value: 25 },
            { selector: PkgInterestSelectors.selectSearchTerm, value: '' },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(InterestLevelGraphComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize on ngOnInit', () => {
    spyOn(component as any, 'subscribeToStore');
    spyOn(component as any, 'loadUserAndInitialize');

    component.ngOnInit();

    expect((component as any).subscribeToStore).toHaveBeenCalled();
    expect((component as any).loadUserAndInitialize).toHaveBeenCalled();
  });

  it('should destroy cytoscape instance on ngOnDestroy', () => {
    (component as any).cy = { destroy: jasmine.createSpy('destroy') };

    component.ngOnDestroy();

    expect((component as any).cy.destroy).toHaveBeenCalled();
  });

  it('should transform concepts to graph data correctly', () => {
    const userId = 'user123';
    const graphData = (component as any).transformToGraphData(userId, mockConcepts);

    expect(graphData.nodes.length).toBe(3); // 1 user + 2 concepts
    expect(graphData.edges.length).toBe(2);
    
    // Check user node
    expect(graphData.nodes[0].data.type).toBe('user');
    
    // Check concept nodes
    expect(graphData.nodes[1].data.type).toBe('concept');
    expect(graphData.nodes[1].data.conceptName).toBe('Algorithm');
    
    // Check edges
    expect(graphData.edges[0].data.relationshipType).toBe('interested_in');
    expect(graphData.edges[0].data.source).toBe(`user_${userId}`);
  });

  it('should format interest score correctly in edge labels', () => {
    const userId = 'user123';
    const graphData = (component as any).transformToGraphData(userId, mockConcepts);

    // First edge should have formatted score
    expect(graphData.edges[0].data.label).toContain('0,85000');
    
    // Second edge should show null
    expect(graphData.edges[1].data.label).toContain('null');
  });
});
