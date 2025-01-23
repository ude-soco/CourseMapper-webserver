import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CourseService } from 'src/app/services/course.service';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})



export class PermissionsComponent implements OnInit {

  isLoading: boolean = false;
  courseID: string;
  course: any;
  selectedCourse: any = {};


  permissions = [
    {
      name: 'co_teacher',
      data: [
        {
          role: { title: 'Create permissions', checked: false },
          list: [
            { label: 'Allow member to create channel', name: 'can_create_channel', checked: false },
            { label: 'Allow member to create topic', name: 'can_create_topic', checked: false },
            { label: 'Allow member to create PDF material', name: 'can_upload_pdf_material', checked: false },
            { label: 'Allow member to create video material ', name: 'can_video_topic', checked: false }
          ]
        },
        {
          role: { title: 'Edit permissions', checked: false },
          list: [
            { label: 'Allow member to rename course ', name: 'can_edit_course_name', checked: false },
            { label: 'Allow member to rename course description', name: 'can_edit_course_description', checked: false },
            { label: 'Allow member to rename topics', name: 'can_rename_topics', checked: false },
            { label: 'Allow member to rename channels', name: 'can_rename_channels', checked: false },
      
            { label: 'Allow member to rename PDF materials', name: 'can_rename_pdfs', checked: false },
            { label: 'Allow member to rename video materials', name: 'can_rename_materials', checked: false }
          ]
        },
        {
          role: { title: 'Delete permissions', checked: false },
          list: [
           
            { label: 'Allow member to delete course description', name: 'can_delete_course_description', checked: false },
            { label: 'Allow member to delete topics', name: 'can_delete_topics', checked: false },
            { label: 'Allow member to delete channels', name: 'can_delete_channels', checked: false },
            { label: 'Allow member to delete PDFs material', name: 'can_delete_pdfs', checked: false },
            { label: 'Allow member to delete video material', name: 'can_delete_materials', checked: false }
          ]
        }
      ]
    },
    {
      name: 'non_editing_teacher',
      data: [
        {
          role: { title: 'Create permissions', checked: false },
          list: [
            { label: 'Allow member to create channel', name: 'can_create_channel', checked: false },
            { label: 'Allow member to create topic', name: 'can_create_topic', checked: false },
            { label: 'Allow member to create PDF material', name: 'can_upload_pdf_material', checked: false },
            { label: 'Allow member to create video material', name: 'can_video_topic', checked: false }
          ]
        },
        {
          role: { title: 'Edit permissions', checked: false },
          list: [
            { label: 'Allow member to rename course ', name: 'can_edit_course_name', checked: false },
            { label: 'Allow member to rename course description', name: 'can_edit_course_description', checked: false },
            { label: 'Allow member to rename topics', name: 'can_rename_topics', checked: false },
            { label: 'Allow member to rename channels', name: 'can_rename_channels', checked: false },
           
            { label: 'Allow member to rename PDF materials', name: 'can_rename_pdfs', checked: false },
            { label: 'Allow member to rename video materials', name: 'can_rename_materials', checked: false }
          ]
        },
        {
          role: { title: 'Delete permissions', checked: false },
          list: [
           
            { label: 'Allow member to delete course description', name: 'can_delete_course_description', checked: false },
            { label: 'Allow member to delete topics', name: 'can_delete_topics', checked: false },
            { label: 'Allow member to delete channels', name: 'can_delete_channels', checked: false },
            { label: 'Allow member to delete PDFs material', name: 'can_delete_pdfs', checked: false },
            { label: 'Allow member to delete video material', name: 'can_delete_materials', checked: false },
           
          ]
        }
      ]
    }
  ];

  constructor(
    protected courseService: CourseService,
    private messageService: MessageService,
    private route: ActivatedRoute,
  ) { };

  ngOnInit() {
    this.courseID = this.route.parent?.snapshot.paramMap.get('courseID');

    this.isLoading = true;
    this.courseService.getCourse(this.courseID).subscribe({
      next: (res: any) => {
        this.course = res.course;
        // console.log(this.course.co_teacher_permissions);

        this.updatePermissionsFromBackend('co_teacher', this.course.co_teacher_permissions);
        this.updatePermissionsFromBackend('non_editing_teacher', this.course.non_editing_teacher_permissions);
      },
      error: (err) => {
        console.error('Error fetching course details:', err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });


  };


  // Update permissions based on backend data
  updatePermissionsFromBackend(roleName: string, backendPermissions: any) {
    const role = this.permissions.find(perm => perm.name === roleName);
    if (role) {
      role.data.forEach(group => {
        group.list.forEach(permission => {
          permission.checked = backendPermissions[permission.name] || false;
        });
        group.role.checked = group.list.every(perm => perm.checked === true);
      });
    }
  }


  showInfo(msg: string) {
    this.messageService.add({
      severity: 'info',
      summary: 'Success',
      detail: msg,
    });
  }

  toggleAllPermissions(data: any, event: any) {
    const isChecked = event.checked;
    Object.keys(data.list).forEach(ele => {
      data.list[ele].checked = isChecked;
    });
  }

  uncheckParent(data: any) {
    const isAllSelected = Object.values(data.list).every((e: any) => e.checked === true);
    data.role.checked = isAllSelected;
  }
     
  formatRoleName(role: string): string {
        switch (role) {
          case 'non_editing_teacher':
            return 'Teaching Assistant';
          case 'co_teacher':
            return 'Co-Teacher';
          default:
            return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
      }

  formatPermissionLabel(perm: string): string {
    return perm
      .replace(/_/g, ' ')
      .replace(/can /g, '')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  savePermissions(item: any) {
    this.isLoading = true;

    let formData = {};
    item.data.forEach((item) => {
      item.list.map(ele => {
        formData[ele.name] = ele.checked;
      })
    });

    const data = { permissions: formData, role: item.name };

    this.courseService.updatePermissions(this.courseID, data).subscribe(res => {
      this.isLoading = false;
      this.showInfo(res?.success || "Permissions updated successfully!");
    }, error => {
      console.log(error);
      this.showInfo(error?.error?.error || "Permissions updated successfully!");
      this.isLoading = false;
    });

  }

}
