import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CourseService } from 'src/app/services/course.service';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-member-table',
  templateUrl: './member-table.component.html',
  styleUrls: ['./member-table.component.css']
})

export class MemberTableComponent {
  @Input() course: any = [];
  @Input() viewOnly: any = [];
  members: any = [];
  isLoading: boolean = false;
  currentUser: any = {};


  constructor(
    private route: ActivatedRoute,
    protected courseService: CourseService,
    private messageService: MessageService,
    public storageService: StorageService,
  ) { };


  ngOnInit(): void {
    const user = this.storageService.getUser();
    this.currentUser = this.course?.users.find(e => e?.userId?._id === user?.id)
    this.members = this.course?.users;

    this.members?.forEach(ele => {
      ele.isBlocked = this.isUserBlocked(ele?.userId._id);
      if (['teacher', 'co_teacher', 'non_editing_teacher'].includes(ele.role.name) || this.currentUser?.userId?._id === ele?.userId?._id) {
        ele.isDisabled = true;
      }
    });
  }


  roles = [
    { label: 'Student', value: 'user' },
    { label: 'Co Teacher', value: 'co_teacher' },
    { label: 'Non Editing Teacher', value: 'non_editing_teacher' },
  ];


  getSeverity(status: boolean): string {
    switch (status) {
      case true:
        return 'danger';
      case false:
        return 'success';
    }
  }

  showInfo(msg) {
    this.messageService.add({
      severity: 'info',
      summary: 'Success',
      detail: msg,
    });
  }

  isUserBlocked(userId: string): boolean {
    if (this.course.blockedUsers.includes(userId) || this.currentUser.userId.blockingUsers.includes(userId)) {
      return true;
    }
    return false;
  }

  canChangeRole(member: any): boolean {
    // check if role is not teacher & user is same as logged-In user
    if (['teacher'].includes(member?.role.name) || this.currentUser?.userId?._id === member?.userId?._id) {
      return true;
    }
    return false;
  }

  toggleBlockUser(targetUserId: string, checked: Boolean): void {
    this.isLoading = true;
    this.courseService.ToggleBlockUser(this.course._id, { targetUserId, status: checked }).subscribe(res => {
      this.isLoading = false;
      this.showInfo(res?.success || "User updated!");
      this.course.blockedUsers.push(targetUserId);
    })
  }



  onRoleChange(event: any, user_id: any): void {
    this.isLoading = true;
    const data = { user_id, role: event.value };

    this.courseService.updateUserRole(this.course._id, data).subscribe(res => {
      this.isLoading = false;
      this.showInfo(res?.success || "Role updated successfully!");
    }, error => {
      console.log(error);
      this.isLoading = false;
    });
  }
}
