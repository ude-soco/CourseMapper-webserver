import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecFilterOptionsComponent } from './rec-filter-options.component';

describe('RecFilterOptionsComponent', () => {
  let component: RecFilterOptionsComponent;
  let fixture: ComponentFixture<RecFilterOptionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecFilterOptionsComponent]
    });
    fixture = TestBed.createComponent(RecFilterOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
