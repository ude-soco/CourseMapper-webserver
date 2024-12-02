import { Component, Input, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CourseService } from 'src/app/services/course.service';
import { StorageService } from 'src/app/services/storage.service';
import { getInitials } from 'src/app/_helpers/format';

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
  selectedRoles: { [key: string]: string } = {};


  constructor(
    private route: ActivatedRoute,
    protected courseService: CourseService,
    private messageService: MessageService,
    public storageService: StorageService,
    private confirmationService: ConfirmationService,
    private renderer: Renderer2,
  ) { };


  ngOnInit(): void {
    const user = this.storageService.getUser();
    this.currentUser = this.course?.users.find(e => e?.userId?._id === user?.id)
    this.members = this.course?.users;

    this.members?.forEach(ele => {
      ele.isBlocked = this.isUserBlocked(ele?.userId._id);
      if (['teacher', 'co_teacher', 'non_editing_teacher'].includes(ele.role.name) || this.currentUser?.userId?._id === ele?.userId?._id) {
        ele.isDisabled = true;
      };
      this.selectedRoles[ele.userId._id] = ele.role.name;
    });
  }


  roles = [
    { label: 'Student', value: 'user' },
    { label: 'Co-Teacher', value: 'co_teacher' },
    { label: 'Teaching Assistant', value: 'non_editing_teacher' },
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
   getIntitials(name: string): string {
    if (!name) return "";
    return name.split(" ").map(part => part.charAt(0).toUpperCase()).join(""); // Get first letter from each word
  }
  toggleBlockUser(targetUserId: string, checked: Boolean): void {
    this.isLoading = true;
    this.courseService.ToggleBlockUser(this.course._id, { targetUserId, status: checked }).subscribe(res => {
      this.isLoading = false;
      this.showInfo(res?.success || "User updated!");
      this.course.blockedUsers.push(targetUserId);
    })
  }

  getUserRole(user_id: any): any {
    const user = this.course?.users?.find(user => {
      return user?.userId?._id === user_id
    })
    return user ? user?.role?.name : null;
  }

  private mapRoleToLabel(role: string): string {
    const roleMap = {
      'user': 'Student',
      'co_teacher': 'Co-Teacher',
      'non_editing_teacher': 'Teaching Assistant'
    };
    return roleMap[role] || role; // Return the mapped label or the original if not found
  }
  onRoleChange(event: any, member: any): void {
    const originalRole = this.selectedRoles[member.userId._id];
    const newRoleLabel = this.mapRoleToLabel(event.value);

    this.confirmationService.confirm({
      message: `Are you sure you want to assign "${member?.userId?.username}" the role "${newRoleLabel}" in this course?
      <br />If you continue, an email will be sent to notify them about this role assignment.`,
      header: 'Role Change Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.confirmationService.close();
        this.isLoading = true;
        const data = { user_id: member?.userId._id, role: event.value };
    
        this.courseService.updateUserRole(this.course._id, data).subscribe(
          res => {
            this.isLoading = false;
            this.showInfo(res?.success || 'Role updated successfully!');
            this.selectedRoles[member.userId._id] = event.value;
          },
          error => {
            console.log(error);
            this.isLoading = false;
          }
        );
      },
      reject: () => {
        this.confirmationService.close();
        this.selectedRoles[member.userId._id] = originalRole;
        
        this.members.map(ele => {
          if (ele?.userId?._id === member?.userId._id) {
            ele.role.name = originalRole;
          }
          return { ...ele };
        });     
      }
    });
    setTimeout(() => {

      const rejectButton = document.getElementsByClassName(
        'p-confirm-dialog-reject'
      ) as HTMLCollectionOf<HTMLElement>;
      for (var i = 0; i < rejectButton.length; i++) {
        this.renderer.addClass(rejectButton[i], 'p-button-outlined');
      }
    }, 0);
    
  }
  
  
}
