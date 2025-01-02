import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UserServiceService } from 'src/app/services/user-service.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  isSignUpFailed = false;
  errorMessage = '';
  token!: string;

  resetPassForm: FormGroup = new FormGroup({
    
    password: new FormControl(''),
    checkPassword: new FormControl(''),

  });
  
  constructor(private activatedRoute: ActivatedRoute,  private fb: FormBuilder, private router:Router, private userService: UserServiceService, private messageService: MessageService) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe(value=>
      {
    this.token=value['token'];
    
      })
    this.resetPassForm = this.fb.group(
      {
       
        password: [
          '',
          [
            Validators.required,
            Validators.maxLength(20),
            Validators.minLength(8),
          ],
        ],
        checkPassword: [
          '',
          [
            Validators.required,
            Validators.maxLength(20),
            Validators.minLength(8),
            //     this.passwordMatchingValidatior
          ],
        ],
       
      },
      {
        validator: ConfirmedValidator('password', 'checkPassword'),
      }
    );
}
onSubmit(): void {
  this.resetPassForm.markAllAsTouched(); 
  if(!this.resetPassForm.valid){
    return ;
    } 
    else{
      let resetObj={
        token:this.token,
        password:this.resetPassForm.value.password
      }
     
      const password  = this.resetPassForm.value.password;
      this.userService
        .resetPassword( resetObj )
        .subscribe({
          next: (res) => {
            if ('success' in res) {
              this.showInfo('Password reset successfully ');
              this.router.navigate(['login'] );
            }
          
          },
          error: (err) => {
            this.errorMessage = err.error.message;
            this.showError('Some thing went wrong!');
         
          },
        });
    }

}

showInfo(msg) {
  this.messageService.add({
    severity: 'success',
    summary: 'Success',
    detail: msg,
  });
}

showError(msg) {
  this.messageService.add({
    severity: 'error',
    summary: 'Error',
    detail: msg,
  });
}
}
export default class Validation {}

export function ConfirmedValidator(
  controlName: string,
  matchingControlName: string
) {
  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];
    if (
      matchingControl.errors &&
      !matchingControl.errors['confirmedValidator']
    ) {
      return;
    }
    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ confirmedValidator: true });
      
    } else {
      matchingControl.setErrors(null );
    }
  };
}

