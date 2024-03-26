import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisExplorePageComponent } from './vis-explore-page.component';

describe('VisExplorePageComponent', () => {
  let component: VisExplorePageComponent;
  let fixture: ComponentFixture<VisExplorePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisExplorePageComponent]
    });
    fixture = TestBed.createComponent(VisExplorePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
