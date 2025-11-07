import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeronsalKnowledgeGraphComponent } from './personal-knowledge-graph.component';

describe('PeronsalKnowledgeGraphComponent', () => {
  let component: PeronsalKnowledgeGraphComponent;
  let fixture: ComponentFixture<PeronsalKnowledgeGraphComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PeronsalKnowledgeGraphComponent],
    });
    fixture = TestBed.createComponent(PeronsalKnowledgeGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
