import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparePlatformsTeachersComponent } from './compare-platforms-teachers.component';

describe('ComparePlatformsTeachersComponent', () => {
  let component: ComparePlatformsTeachersComponent;
  let fixture: ComponentFixture<ComparePlatformsTeachersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ComparePlatformsTeachersComponent]
    });
    fixture = TestBed.createComponent(ComparePlatformsTeachersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
