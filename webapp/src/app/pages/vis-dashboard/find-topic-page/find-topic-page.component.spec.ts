import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FindTopicPageComponent } from './find-topic-page.component';

describe('FindTopicPageComponent', () => {
  let component: FindTopicPageComponent;
  let fixture: ComponentFixture<FindTopicPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FindTopicPageComponent]
    });
    fixture = TestBed.createComponent(FindTopicPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
