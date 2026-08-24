import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityCoursePanelsComponent } from './entity-course-panels.component';

describe('EntityCoursePanelsComponent', () => {
  let component: EntityCoursePanelsComponent;
  let fixture: ComponentFixture<EntityCoursePanelsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EntityCoursePanelsComponent]
    });
    fixture = TestBed.createComponent(EntityCoursePanelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
