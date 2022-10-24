import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTopicComponent } from './add-topic.component';

describe('AddTopicComponent', () => {
  let component: AddTopicComponent;
  let fixture: ComponentFixture<AddTopicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTopicComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTopicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
