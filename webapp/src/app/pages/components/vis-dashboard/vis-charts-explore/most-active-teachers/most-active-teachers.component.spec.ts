import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MostActiveTeachersComponent } from './most-active-teachers.component';

describe('MostActiveTeachersComponent', () => {
  let component: MostActiveTeachersComponent;
  let fixture: ComponentFixture<MostActiveTeachersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MostActiveTeachersComponent]
    });
    fixture = TestBed.createComponent(MostActiveTeachersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
