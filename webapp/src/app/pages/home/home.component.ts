import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { StorageService } from 'src/app/services/storage.service';
import { State } from 'src/app/state/app.reducer';
import * as AppActions from 'src/app/state/app.actions';
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions';
import { CourseService } from 'src/app/services/course.service';
import { Course } from 'src/app/models/Course';
import * as CourseAction from 'src/app/pages/courses/state/course.actions';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import { UserServiceService } from 'src/app/services/user-service.service';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { User } from 'src/app/models/User';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DatePipe, ConfirmationService],
})
export class HomeComponent implements OnInit {
  currentUser: {} | any;
  isloggedin: boolean = false;
  username?: string;
  loggedInUser: User;
  courses: Course[] = [];
  userArray: any = new Array();
  menuItems: MenuItem[] = [];
  createdAt: string;
  firstName: string = '';
  lastName: string = '';
  courseTriggered: boolean = false;
  sections = ['teaching', 'enrolled'];
  collapsedSections: { [key: string]: boolean } = {};
  showAll: { [key: string]: boolean } = {};
  limit: number = 4;


  toggleCollapse(role: string): void {
    this.collapsedSections[role] = !this.collapsedSections[role];
  }
  
  showAllCourses(role: string): void {
    this.showAll[role] = !this.showAll[role];
  }

  
  hasCoursesForRole(role: string): boolean {
    if(role === 'enrolled'){
      return this.courses.some((course) => course.role === 'user');
    }else{
      return this.courses.some((course) => course.role !== 'user');
    }
  }
  
  getCoursesByRole(role: string) {
    const filteredCourses = role === 'enrolled' 
      ? this.userArray.filter((course) => course.role === 'user')
      : this.userArray.filter((course) => course.role !== 'user');
    
    return this.showAll[role] ? filteredCourses : filteredCourses.slice(0, this.limit);
  }

  getCoursesCount(role: string) {
    const filteredCourses = role === 'enrolled' 
    ? this.userArray.filter((course) => course.role === 'user')
    : this.userArray.filter((course) => course.role !== 'user');
    return filteredCourses?.length > this.limit
  }


  getMenuItems(courseItem: any): any {
    this.menuItems = [
     
      { label: 'Manage Participants', restrictTo: ['user'], icon: 'pi pi-users', command: () => this.onManageParticipants(courseItem) },
      { label: 'Rename Course', restrictTo: ['user', 'co_teacher', 'non_editing_teacher'], icon: 'pi pi-cog', command: () => this.onManageParticipants(courseItem) },
      { label: 'View Participants', icon: 'pi pi-eye', restrictTo: ['teacher', 'co_teacher', 'non_editing_teacher'], command: () => this.onViewParticipants(courseItem) },

      { label: 'Unenroll from Course', icon: 'pi pi-user-minus', restrictTo: ['teacher'], command: () => { } },
      { label: 'Delete Course', icon: 'pi pi-trash', restrictTo: ['user'], onlyAccess:'can_delete_course', command: () => this.onDeleteCourse(courseItem) },
      // { label: 'Add Member', icon: 'pi pi-plus', command: () => { } },
      // { label: 'Add Channel', icon: 'pi pi-file-edit', command: () => { } },
      // { label: 'Manage Tags', icon: 'pi pi-tag', command: () => { } },
    ].filter(item => {
      const roleCheck = !item?.restrictTo?.includes(courseItem?.role) || this.currentUser?.role?.name === 'admin'
      const permissionCheck = item?.onlyAccess ? this.canAccess(item.onlyAccess, courseItem) : true;
      return roleCheck && permissionCheck;
    });
    return this.menuItems;
  }

  constructor(
    private storageService: StorageService,
    private router: Router,
    private store: Store<State>,
    private courseService: CourseService,
    private userService: UserServiceService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) { }

  ngOnInit(): void {
    this.currentUser = this.storageService.getUser();
    this.isloggedin = this.storageService.isLoggedIn();
    this.loggedInUser = this.storageService.getUser();


    this.store.dispatch(
      AppActions.toggleCourseSelected({ courseSelected: false })
    );
    this.store.dispatch(CourseActions.setCurrentTopic({ selcetedTopic: null }));
    this.store.dispatch(
      CourseActions.setCurrentCourse({ selcetedCourse: null })
    );
    this.store.dispatch(CourseActions.setCourseId({ courseId: null }));
    this.store.dispatch(
      CourseActions.SetSelectedChannel({ selectedChannel: null })
    );
    this.store.dispatch(
      CourseActions.toggleChannelSelected({ channelSelected: false })
    );

    if (this.isloggedin == false) {
      this.router.navigate(['login']);
    } else {
      const user = this.storageService.getUser();

      this.username = user.username;
    }

    this.getMyCourses();
  }

  getFormattedRole(role: string): string {
    if (role === 'non_editing_teacher') {
      return 'Teaching Assistant';
    }
    return role ? role.replace(/_/g, '-') : 'N/A';
  }

  getBadgeColor(role: string): string {
    switch (role) {
        case 'teacher':
            return '#FF5733';    // Red for teachers
        case 'co_teacher':
            return '#FFC300'; // Yellow for co-teachers
        case 'non_editing_teacher':
            return '#28A745';  // Green for non-editing teachers
        case 'user':
            return '#007BFF';   // Blue for students
        default:
            return '#6c757d';   // Default color
    }
}

  canAccess(perm: string, courseItem: any): boolean {
    const isAdminOrTeacher = courseItem?.role === 'teacher' || this.currentUser?.role?.name === 'admin';
    if (isAdminOrTeacher) {
      return true;
    } else if (['co_teacher', 'non_editing_teacher'].includes(courseItem.role)) {
      const permissions = courseItem.role === 'co_teacher' ? courseItem.co_teacher_permissions : courseItem.non_editing_teacher_permissions
      if (permissions?.[perm]) {
        return true;
      };
      return false;
    }
    return false;
  }


  getMyCourses() {
    this.courseService.fetchCourses().subscribe((courses: any) => {
      this.courses = courses.map(ele => { return { ...ele, menuItems: this.getMenuItems(ele) } });
      this.userArray = []; // Initialize the array
      for (var course of this.courses) {
        if (course?.users?.length > 0) {
          this.buildCardInfo(course.users[0].userId, course);
        }
      }
    });
    if (this.courseTriggered == false) {
      this.courseService.onUpdateCourses$.subscribe({
        next: (courses1) => {
          // this.courses .push(courses1[courses1.length-1]),
          // console.log(this.courses, "before"),

          // console.log(this.courses, "after"),
          (this.courseTriggered = true), this.ngOnInit();
        },
      });
    }
  }
  buildCardInfo(userModeratorID: string, course: Course) {
    this.userArray.length = 0;
    this.userService.GetUserName(userModeratorID).subscribe((user) => {
      this.firstName = user.firstname;
      this.lastName = user.lastname;

      let ingoPush = {
        id: course._id,
        name: course.name,
        shortName: course.shortName,
        createdAt: new Date(course.createdAt),
        firstName: this.firstName,
        lastName: this.lastName,
        moderator: userModeratorID,
        description: course.description,
        role: course?.role|| 'student',
        menuItems: course?.menuItems,
      };
      this.userArray.push(ingoPush);
      console.log(this.userArray); // Log to confirm what is being pushed
    });
  }
  onSelectCourse(selcetedCourse: any) {
    /* this.router.navigate(['course', selcetedCourse.id]); */
    this.courseService.logCourses(selcetedCourse.id).subscribe(() => {
      this.router.navigate(['course', selcetedCourse.id, 'welcome']);
      this.store.dispatch(
        CourseAction.setCurrentCourse({ selcetedCourse: selcetedCourse })
      );
      this.store.dispatch(
        CourseActions.setCourseId({ courseId: selcetedCourse.id })
      );
    });
  }
  onManageParticipants(selcetedCourse: any) {
    this.router.navigate(['course', selcetedCourse._id, 'details']);
  }

  onViewParticipants(selcetedCourse: any) {
    this.router.navigate(['course', selcetedCourse._id, 'view']);
  }


  editCourse() {
    console.log('Edit course');
    // Implement the edit functionality here
  }

  deleteCourse(id): void {
    this.courseService.deleteCourse({ _id: id }).subscribe(res => {
      if (res?.errorMsg) {
        this.messageService.add({ severity: 'error', detail: res?.errorMsg });
      } else {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Course has been deleted!' });
      }
    })
  };


  onDeleteCourse(item) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to Delete this course "' + item.name + '"?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: (e) => this.deleteCourse(item._id),
      reject: () => { },
    });
    this.courseService.deleteCourse(item._id)
    // Implement the delete functionality here
  }
}
