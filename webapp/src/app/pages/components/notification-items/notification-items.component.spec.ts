import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationItemsComponent } from './notification-items.component';

describe('NotificationItemsComponent', () => {
  let component: NotificationItemsComponent;
  let fixture: ComponentFixture<NotificationItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotificationItemsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
