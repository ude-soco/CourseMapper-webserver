import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConceptsWordCloudComponent } from './concepts-word-cloud.component';

describe('ConceptsWordCloudComponent', () => {
  let component: ConceptsWordCloudComponent;
  let fixture: ComponentFixture<ConceptsWordCloudComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConceptsWordCloudComponent]
    });
    fixture = TestBed.createComponent(ConceptsWordCloudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
