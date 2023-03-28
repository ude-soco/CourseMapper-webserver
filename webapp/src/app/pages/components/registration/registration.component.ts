import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { UserServiceService } from 'src/app/services/user-service.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent implements OnInit {
  validateForm: FormGroup = new FormGroup({
    firstname: new FormControl(''),
    username: new FormControl(''),
    email: new FormControl(''),
    password: new FormControl(''),
    checkPassword: new FormControl(''),
    lastname: new FormControl(''),
  });
  isSuccessful = false;
  isSignUpFailed = false;
  errorMessage = '';
  submitted = false;
  errors = null;
  _id: string = '';
  public login="/login"

  constructor(
    private userService: UserServiceService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.validateForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email, Validators.pattern("[^ @]*@[^ @]*")]],
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
        username: [
          '',
          [
            Validators.required,
            Validators.maxLength(20),
            Validators.minLength(4),
          ],
        ],
        firstname: [
          '',
          [
            Validators.required,
            Validators.maxLength(20),
            Validators.minLength(2),
          ],
        ],
        lastname: [
          '',
          [
            Validators.required,
            Validators.maxLength(20),
            Validators.minLength(2),
          ],
        ],
      },
      {
        validator: ConfirmedValidator('password', 'checkPassword'),
      }
    );
  }

  get f(): { [key: string]: AbstractControl } {
    console.log('111');
    console.log(this.validateForm.value);
    return this.validateForm.controls;
  }

  onSubmit(): void {
    this.validateForm.markAllAsTouched(); 
    if(!this.validateForm.valid){
      return ;
      } 
      else {
    console.log('222');
    console.log(this.validateForm.value);
    this.errors = null;
    const { firstname, lastname, username, email, password } =
      this.validateForm.value;

    this.userService
      .register(firstname, lastname, username, email, password)
      .subscribe({
        next: (data) => {
          console.log(data);
          this.isSuccessful = true;
          this.isSignUpFailed = false;
          this.submitted = true;
          this.router.navigate(['login']);
        },
        error: (err) => {
          this.errorMessage = err.error.message;
          this.isSignUpFailed = true;
        },
      });
  }
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
      console.log('not matched')
    } else {
      matchingControl.setErrors(null );
    }
  };
}

