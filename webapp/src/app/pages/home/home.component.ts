import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DatePipe, ConfirmationService],
})
export class HomeComponent implements OnInit, AfterViewInit {
  currentUser: {} | any;
  isloggedin: boolean = false;
  username?: string;
  loggedInUser: User;
  courses: Course[] = [];
  userArray: any = new Array();
  menuItems: MenuItem[] = [];
  createdAt: string;
  firstName: string = '';
  page: 1;
  totalPages: number = 0;
  lastName: string = '';
  courseTriggered: boolean = false;
  sections = ['teaching', 'enrolled'];
  collapsedSections: { [key: string]: boolean } = {};
  showAll: { [key: string]: boolean } = {};
  limit: number = 4;

  queryParams: any;
  //new
  sortFilter: boolean = false;
  rolesFilter: boolean = false;
  selectedRoles: string[] = [];

  coursesNew: string[] = [];
  roles: { label: string; value: string }[] = [
    { label: 'Teacher', value: 'teacher' },
    { label: 'Co-Teacher', value: 'co_teacher' },
    { label: 'Teaching Assistant', value: 'non_editing_teacher' },
    { label: 'student', value: 'user' },
  
   
  ];

  sortByList: { label: string; value: string ; selected: boolean}[] = [
    { label: 'Creator name (A-Z)', value: 'name-a-z' , selected: false},
    { label: 'Creator name (Z-A)', value: 'name-z-a', selected: false },
    { label: 'Creation date (Newest to Oldest)', value: 'creation-new-to-old', selected: false },
    { label: 'Creation date (Oldest to Newest)', value: 'creation-old-to-new' , selected: false},
    { label: 'Enrolled users (Highest to Lowest)', value: 'users-high-to-low' , selected: false},
    { label: 'Enrolled users (Lowest to Highest)', value: 'users-low-to-high' , selected: false},
  ];
  searchText: string = '';
  sortByFilter: string = '';
  private searchSubject: Subject<string> = new Subject<string>();

  
  @ViewChild('scrollAnchor') scrollAnchor: ElementRef;

  //close drop down if clicked outside it
  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event) {
    const targetElement = event.target as HTMLElement;
    const dropdown = document.getElementById('dropdownMenuButton');
    const menu = document.getElementById('dropdownMenu');

    if (
      dropdown &&
      menu &&
      !dropdown.contains(targetElement) &&
      !menu.contains(targetElement)
    ) {
      this.rolesFilter = false;
    }
  }
  getSelectedSortLabel(): string {
    const selectedSort = this.sortByList.find(item => item.value === this.sortByFilter);
    return selectedSort ? selectedSort.label : 'Sort by'; // Default text if no option is selected
  }

  //new
  toggleDropdown(type: any) {
    if (type === 'sort') {
      this.sortFilter = !this.sortFilter;
    }

    if (type === 'roles') {
      this.rolesFilter = !this.rolesFilter;
    }
  }
  //new
  onSearchChange() {
    this.searchSubject.next(this.searchText);
  }

  //new
  searchFunction(searchText: string) {
    this.courseService.setQueryParams({ search: searchText });
  }
  //new
  onRoleChange(role: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedRoles.push(role);
    } else {
      const index = this.selectedRoles.indexOf(role);
      if (index > -1) {
        this.selectedRoles.splice(index, 1);
      }
    }

    this.courseService.setQueryParams({ roles: this.selectedRoles });
  }

  removeSelectedRole(role: string) {
    const index = this.selectedRoles.indexOf(role);
    if (index > -1) {
      this.selectedRoles.splice(index, 1);
    } else {
      this.selectedRoles.push(role);
    }

    this.courseService.setQueryParams({ roles: this.selectedRoles });
  }

  getAbbreviatedRole(role: string): string {
    const abbreviations: { [key: string]: string } = {
      user: 'student',
      teacher: 'Teacher',
      enrolled: 'Enrolled',
      co_teacher: 'Co-Teacher',
      non_editing_teacher: 'Teaching Assistant',
    };
    return abbreviations[role] || role; // Default to the role name if no abbreviation is found
  }
  isChecked(role: string): boolean {
    return this.selectedRoles.includes(role); // Check if role is selected
  }

  //new
   handleSortOptionChange(value: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked; // Get checked state
  
    if (isChecked) {
     
      this.sortByFilter = value;
  
   
      this.sortByList.forEach(item => {
        if (item.value !== value) {
          item.selected = false; 
        } else {
          item.selected = true; 
        }
      });
    } else {
     
      this.sortByFilter = '';
      this.sortByList.forEach(item => {
        if (item.value === value) {
          item.selected = false; // Unmark if unchecked
        }
      });
    }
  
    this.courseService.setQueryParams({ sort: value });
  }

  removeSortChip(): void {
    const previousSortValue = this.sortByFilter; // Store the previous value to clear
    this.sortByFilter = ''; // Clear selected sort option
  
    // Uncheck the corresponding sort option in sortByList
    this.sortByList.forEach(item => {
      if (item.value === previousSortValue) {
        item.selected = false; // Unmark as selected
      }
    });
  
    // Update the courseService with new params if needed
    this.courseService.setQueryParams({ sort: '' }); // Optionally update query params
  }

  isOtherOptionSelected(selectedValue: string): boolean {
    // Check if any other sort option is selected
    return this.sortByFilter !== '' && this.sortByFilter !== selectedValue;
  }

  showAllCourses(role: string): void {
    this.showAll[role] = !this.showAll[role];
  }

  hasCoursesForRole(role: string): boolean {
    if (role === 'enrolled') {
      return this.courses.some((course) => course.role === 'user');
    } else {
      return this.courses.some((course) => course.role !== 'user');
    }
  }
  getCoursesByRole(role: string) {
    const filteredCourses =
      role === 'enrolled'
        ? this.userArray.filter((course) => course.role === 'user')
        : this.userArray.filter((course) => course.role !== 'user');

    return this.showAll[role] ? filteredCourses : filteredCourses;
  }

  getCoursesCount(role: string) {
    const filteredCourses =
      role === 'enrolled'
        ? this.userArray.filter((course) => course.role === 'user')
        : this.userArray.filter((course) => course.role !== 'user');
    return filteredCourses?.length > this.limit;
  }

  onRenameCourse() {}
  onNotificationSettingsClicked($event) {
    /*  this.notificationSettingsPanel.show($event); */
  }
  onViewDashboardClicked(): void {
    this.router.navigate([
      'course',
      this.courseService.getSelectedCourse()._id,
      'dashboard',
    ]);
  }
  copyCourseId() {}
  getMenuItems(courseItem: any): any {
    this.menuItems = [
      { label: 'Manage participants', restrictTo: ['user'], icon: 'pi pi-users', command: () => this.onManageParticipants(courseItem) },
      { label: 'Edit course', restrictTo: ['user', 'co_teacher', 'non_editing_teacher'], icon: 'pi pi-pencil', command: () => this.onRenameCourse() },
      { label: 'View participants', icon: 'pi pi-users', restrictTo: ['teacher', 'co_teacher', 'non_editing_teacher'], command: () => this.onViewParticipants(courseItem) },
      { label: 'Share course ', icon: 'pi pi-copy', title: 'Copy Course URL', command: () => this.copyCourseId() },
      { label: "View course dashboard", icon: "pi pi-chart-bar", styleClass: "contextMenuButton", command: () => this.onViewDashboardClicked() },
      { label: 'Notification Settings', icon: 'pi pi-bell', command: ($event) => this.onNotificationSettingsClicked($event) },
     
     

      { label: 'Unenroll from Course', icon: 'pi pi-user-minus', restrictTo: ['teacher'], command: () => { } },
      { label: 'Delete Course', icon: 'pi pi-trash', restrictTo: ['user'], onlyAccess:'can_delete_course', command: () => this.onDeleteCourse(courseItem) },
      // { label: 'Add Member', icon: 'pi pi-plus', command: () => { } },
      // { label: 'Add Channel', icon: 'pi pi-file-edit', command: () => { } },
      // { label: 'Manage Tags', icon: 'pi pi-tag', command: () => { } },
    ].filter((item) => {
      const roleCheck =
        !item?.restrictTo?.includes(courseItem?.role) ||
        this.currentUser?.role?.name === 'admin';
      const permissionCheck = item?.onlyAccess
        ? this.canAccess(item.onlyAccess, courseItem)
        : true;
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
    private messageService: MessageService
  ) {
    // this.courseService.$pageNumber.subscribe((pageNumber) => {
    //   if (pageNumber === 1) {
    //     return;
    //   }
    //   this.page = pageNumber;
    //   this.getMyCourses(this.page, this.limit);
    // });
  }

  ngOnInit(): void {
    this.currentUser = this.storageService.getUser();
    this.isloggedin = this.storageService.isLoggedIn();
    this.loggedInUser = this.storageService.getUser();

    //search subject
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchText) => {
        this.searchFunction(searchText);
      });

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
    this.courseService.$queryParams.subscribe((queryParams) => {
      this.queryParams = queryParams;
      this.getMyCourses(this.queryParams);
    });
  }

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Check if the current page is less than the total number of pages
          if (this.queryParams.page < this.totalPages) {
            // Update the query params to load the next page
            this.queryParams = {
              page: (this.queryParams.page || 1) + 1,
            };

            // Update the query parameters and trigger the course service to fetch more courses
            this.courseService.setQueryParams(this.queryParams);
          }
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(this.scrollAnchor.nativeElement);
  }



  getFormattedRole(role: string): string {
    switch (role) {
     case 'teacher':
       return 'Teacher';
     case 'user':
       return 'Student';  // Change 'user' to 'Student'
     case 'non_editing_teacher':
       return 'Teaching Assistant';  // Change 'non_editing_teacher' to 'Assistant'
     case 'co_teacher':
       return 'Co-Teacher';  // Keep as is or change as needed
     default:
      return role ? role.replace(/_/g, '-') : 'N/A';
    }
  }

 
  canAccess(perm: string, courseItem: any): boolean {
    const isAdminOrTeacher =
      courseItem?.role === 'teacher' ||
      this.currentUser?.role?.name === 'admin';
    if (isAdminOrTeacher) {
      return true;
    } else if (
      ['co_teacher', 'non_editing_teacher'].includes(courseItem.role)
    ) {
      const permissions =
        courseItem.role === 'co_teacher'
          ? courseItem.co_teacher_permissions
          : courseItem.non_editing_teacher_permissions;
      if (permissions?.[perm]) {
        return true;
      }
      return false;
    }
    return false;
  }
  getRoleClass(role: string): string {
    switch (role) {
      case 'teacher':
        return 'badge-teacher';
      case 'co_teacher':
        return 'badge-co-teacher';
      case 'user':
        return 'badge-student';
      case 'non_editing_teacher':
        return 'badge-teaching-assistant';

      default:
        return 'badge';
    }
  }

  getMyCourses(queryParams: any) {
    this.courseService.fetchCourses(queryParams).subscribe((response: any) => {
      console.log(response.results);
      const courses = response.results;
      this.totalPages = response.pagination.totalPages;

      if (queryParams.page === 1) {
        // Replace the courses list for the first page
        this.courses = courses.map((ele) => {
          return { ...ele, menuItems: this.getMenuItems(ele) };
        });
      } else {
        // Append the new courses to the existing list
        const newCourses = courses.map((ele) => {
          return { ...ele, menuItems: this.getMenuItems(ele) };
        });
        this.courses = [...this.courses, ...newCourses];
      }

      // Handle userArray logic
      this.userArray = []; // Reset the array
      for (let course of this.courses) {
        if (course?.users?.length > 0) {
          this.buildCardInfo(course.users[0].userId, course);
        }
      }
    });

    // Subscribe to course updates only once
    if (this.courseTriggered === false) {
      this.courseService.onUpdateCourses$.subscribe({
        next: (courses1) => {
          this.courseTriggered = true;
          this.ngOnInit(); // Ensure the component reloads or refreshes as needed
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
        isBlocked: course?.isBlocked,
        role: course?.role || 'student',
        menuItems: course?.menuItems,
        totalEnrolled: course?.users?.length,
      };
      this.userArray.push(ingoPush);
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
    this.courseService.deleteCourse({ _id: id }).subscribe((res) => {
      if (res?.errorMsg) {
        this.messageService.add({ severity: 'error', detail: res?.errorMsg });
      } else {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Course has been deleted!',
        });
      }
    });
  }

  onDeleteCourse(item) {
    this.confirmationService.confirm({
      message:
        'Are you sure you want to Delete this course "' + item.name + '"?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: (e) => this.deleteCourse(item._id),
      reject: () => {},
    });
    this.courseService.deleteCourse(item._id);
    // Implement the delete functionality here
  }
}
