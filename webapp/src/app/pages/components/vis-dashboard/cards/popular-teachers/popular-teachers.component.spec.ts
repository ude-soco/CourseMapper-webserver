import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularTeachersComponent } from './popular-teachers.component';

describe('PopularTeachersComponent', () => {
  let component: PopularTeachersComponent;
  let fixture: ComponentFixture<PopularTeachersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PopularTeachersComponent]
    });
    fixture = TestBed.createComponent(PopularTeachersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
