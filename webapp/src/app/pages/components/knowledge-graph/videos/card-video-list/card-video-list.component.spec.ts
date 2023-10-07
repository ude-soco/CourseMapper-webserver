import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardVideoListComponent } from './card-video-list.component';

describe('CardVideoListComponent', () => {
  let component: CardVideoListComponent;
  let fixture: ComponentFixture<CardVideoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardVideoListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardVideoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
