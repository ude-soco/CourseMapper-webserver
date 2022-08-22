import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconbuttonComponent } from './iconbutton.component';

describe('IconbuttonComponent', () => {
  let component: IconbuttonComponent;
  let fixture: ComponentFixture<IconbuttonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IconbuttonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconbuttonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
