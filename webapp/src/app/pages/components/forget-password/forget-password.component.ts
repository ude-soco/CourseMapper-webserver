import { Component, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { State, Store } from '@ngrx/store';
import { UserServiceService } from 'src/app/services/user-service.service';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css'],
})
export class ForgetPasswordComponent implements OnInit{
  
  public login = '/login'; 
  public restPasswordRequest = '/restRequest';
  requestFailed = false;
  errorMessage = '';
  resetForm: FormGroup = new FormGroup({
    email: new FormControl(''),
  });

  constructor(private fb: FormBuilder, private router: Router, private userService: UserServiceService,) {}

  ngOnInit(): void {
    this.resetForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,9}$'),
        ],
      ],
    });
  }
  get f(): { [key: string]: AbstractControl } {
   
    return this.resetForm.controls;
  }
  onSubmit(): void {
    this.resetForm.markAllAsTouched(); 
    if(!this.resetForm.valid){
      return ;
      } 
      else {

        this.errorMessage = null;
        const email  =this.resetForm.value.email;
        this.userService
          .forgetPassword( email)
          .subscribe({
            next: (data) => {
           
           
            this.requestFailed = false;
           
             this.router.navigate(['restRequest'] );
            },
            error: (err) => {
              this.errorMessage = err.error.message;
              this.requestFailed = true;
            },
          });
      }
  }
}
