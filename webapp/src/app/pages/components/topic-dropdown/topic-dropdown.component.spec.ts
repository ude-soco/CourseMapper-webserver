import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicDropdownComponent } from './topic-dropdown.component';

describe('TopicDropdownComponent', () => {
  let component: TopicDropdownComponent;
  let fixture: ComponentFixture<TopicDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TopicDropdownComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopicDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
