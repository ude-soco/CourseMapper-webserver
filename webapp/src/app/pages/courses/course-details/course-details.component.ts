import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CourseService } from 'src/app/services/course.service';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-course-details',
  templateUrl: './course-details.component.html',
  styleUrls: ['./course-details.component.css']
})
export class CourseDetailsComponent {

  courseID: string;
  users: any;
  course: any;
  loading: boolean = false;
  viewOnly: boolean;
  isBlocked: boolean = false;
  selectedId: string = '';
  editable: boolean = false;
  escapeKey: boolean = false;
  enterKey: boolean = false;
  insertedText: string = '';
  permissions: object = {};
  showModeratorPrivileges = false;
  user = this.storageService.getUser();


  constructor(
    private route: ActivatedRoute,
    protected courseService: CourseService,
    private messageService: MessageService,
    protected router: Router,
    protected storageService: StorageService,
  ) { };

  ngOnInit(): void {
    this.courseID = this.route.parent?.snapshot.paramMap.get('courseID');
    this.viewOnly = this.route.snapshot.data['viewOnly'];

    this.loading = true;
    this.courseService.getCourse(this.courseID).subscribe({
      next: (res: any) => {
        this.course = res.course;
        this.courseService.selectCourse(this.course);
        this.users = res.course.users;

        if (['teacher', 'co_teacher', 'non_editing_teacher'].includes(this.course.role) || this.user.role.name === 'admin') {
          this.showModeratorPrivileges = true;
        };
        // Permissions
        if (this.course.role === 'co_teacher') {
          this.permissions = { ...this.course.co_teacher_permissions };
        } else if (this.course.role === 'non_editing_teacher') {
          this.permissions = { ...this.course.non_editing_teacher_permissions };
        }

      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error.error,
        });
        if (err.status === 403) {
          this.isBlocked = true;
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }



  canAccess(perm: string): boolean {
    const isAdminOrTeacher = this.course.role === 'teacher' || this.user.role.name === 'admin';

    if (isAdminOrTeacher) {
      return true;
    } else if (this.showModeratorPrivileges && this.permissions?.[perm]) {
      return true;
    }
    return false;
  }

  showError(msg) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: msg,
    });
  }

  
  onManageRoles() {
    this.router.navigate([`/course/${this.courseID}/roles`]);
  }

}
