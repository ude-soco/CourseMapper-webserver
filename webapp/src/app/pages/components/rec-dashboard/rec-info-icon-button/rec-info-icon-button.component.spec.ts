import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecInfoIconButtonComponent } from './rec-info-icon-button.component';

describe('RecInfoIconButtonComponent', () => {
  let component: RecInfoIconButtonComponent;
  let fixture: ComponentFixture<RecInfoIconButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecInfoIconButtonComponent]
    });
    fixture = TestBed.createComponent(RecInfoIconButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
