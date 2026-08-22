import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FindByTopicMainComponent } from './find-by-topic-main.component';

describe('FindByTopicMainComponent', () => {
  let component: FindByTopicMainComponent;
  let fixture: ComponentFixture<FindByTopicMainComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FindByTopicMainComponent]
    });
    fixture = TestBed.createComponent(FindByTopicMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
