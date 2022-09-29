import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationFilterPanelComponent } from './notification-filter-panel.component';

describe('NotificationFilterPanelComponent', () => {
  let component: NotificationFilterPanelComponent;
  let fixture: ComponentFixture<NotificationFilterPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotificationFilterPanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationFilterPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
