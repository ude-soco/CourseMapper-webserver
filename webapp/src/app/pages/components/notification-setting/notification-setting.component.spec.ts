import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationSettingComponent } from './notification-setting.component';

describe('NotificationSettingComponent', () => {
  let component: NotificationSettingComponent;
  let fixture: ComponentFixture<NotificationSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotificationSettingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
