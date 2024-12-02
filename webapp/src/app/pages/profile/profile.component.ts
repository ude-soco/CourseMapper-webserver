import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { User } from 'src/app/models/User';
import { MaterilasService } from 'src/app/services/materials.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  accountForm: FormGroup;
  imageUrl: string | null = null;
  loggedInUser: User;
  lastSavedUserData: User | null = null;
  @ViewChild('fileUpload') fileUpload: FileUpload;
  constructor(private fb: FormBuilder,
    private materialService: MaterilasService,
    private userService: UserServiceService,
    private storageService: StorageService,
    private messageService: MessageService,
  ) {
    this.accountForm = this.fb.group({
      firstname: [''],
      lastname: [''],
      email: [''],
      photo: [null]
    });
   }

   ngOnInit(): void { 
     this.userService.getProfile().subscribe(res => {
       this.loggedInUser = res?.data;
       this.imageUrl = this.loggedInUser?.photo;
       this.lastSavedUserData = { ...this.loggedInUser };
      this.accountForm.patchValue({
        firstname: this.loggedInUser?.firstname,
        lastname: this.loggedInUser?.lastname,
        email: this.loggedInUser?.email,
        photo: this.loggedInUser?.photo || null
      });
    });
  }
  


  onFileSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      this.materialService.uploadFile(formData, 'image').subscribe(res => {
        this.imageUrl = `${environment.API_URL}/${res.url}`;
        this.accountForm.patchValue({ photo: this.imageUrl });
       
      })
    };
  }

  saveForm(): void {
    if (this.accountForm.valid) {
      this.userService.updateProfile(this.accountForm.value).subscribe(res => {
        console.log("🚀 ~ ProfileComponent ~ this.userService.updateProfile ~ res:", res)
        this.showInfo("Profile updated successfully!");

        const data = this.storageService.getUser();
        console.log("🚀 ~ ProfileComponent ~ this.userService.getProfile ~ data:", {...data, ...res?.data })
        this.lastSavedUserData = res.data;
        this.storageService.saveUser({...data, ...res?.data, name: res?.data.firstname + ' ' + res?.data?.lastname });

      })
    } else {
      console.log('Form is invalid');
    }
  }

  showInfo(msg) {
    this.messageService.add({
      severity: 'info',
      summary: 'Success',
      detail: msg,
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
  cancel(): void {
    // Reset the form values to the stored original data
    if (this.lastSavedUserData) {
      this.accountForm.patchValue({
        firstname: this.lastSavedUserData.firstname,
        lastname: this.lastSavedUserData.lastname,
        email: this.lastSavedUserData.email,
        // Ensure you also set the photo if needed
        photo: this.lastSavedUserData.photo || null
      });
      this.imageUrl = this.lastSavedUserData.photo; // Restore the imageUrl as well
      
    }
    this.fileUpload.clear();
  }
}