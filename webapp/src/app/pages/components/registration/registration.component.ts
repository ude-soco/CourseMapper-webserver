import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { Router } from '@angular/router';
import { UserServiceService } from 'src/app/Services/user-service.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {
  errorMessage = '';
  validateForm!: FormGroup;
  registerSucess:boolean = false;
  constructor(private userService: UserServiceService,private fb: FormBuilder, private router: Router) { }

  ngOnInit(): void {

    
      this.validateForm = new FormGroup({
      email: new FormControl('', [
        Validators.required,
      ]),
      password: new FormControl('', [
      Validators.required,
      Validators.maxLength(20),
      Validators.minLength(6),
    ]),
      checkPassword: new FormControl('', [
        Validators.required,
        Validators.maxLength(20),
        Validators.minLength(6),
        this.confirmationValidator,
      ]),
      username: new FormControl('', [
        Validators.required,
        Validators.maxLength(20),
        Validators.minLength(6),
      ]),
      firstname: new FormControl('', [
        Validators.required,

      ]),
      lastname: new FormControl('', [
        Validators.required,

      ]),
    });
  }

  async onSubmit() {
    for (const i in this.validateForm.controls) {
      if (this.validateForm.controls.hasOwnProperty(i)) {
        this.validateForm.controls[i].markAsDirty();
        this.validateForm.controls[i].updateValueAndValidity();
        console.log('step1');
      }
    }

   
    try {
      await this.userService.register(this.validateForm.controls['firstname'].value, this.validateForm.controls['lastname'].value,this.validateForm.controls['username'].value, this.validateForm.controls['email'].value, this.validateForm.controls['password'].value);
      this.router.navigate(['login']);
      this.registerSucess=true;
    } catch (err: any) {
      this.errorMessage = err.error.error;
    }
  }
  updateConfirmValidator(): void {
    /** wait for refresh value */
    Promise.resolve().then(() => this.validateForm.controls['checkPassword'].updateValueAndValidity());
  }
  confirmationValidator = (control: FormControl): { [s: string]: boolean } => {
    if (!control.value) {
      return { required: true };
    } else if (control.value !== this.validateForm.controls['password'].value) {
      return { confirm: true, error: true };
    }
    return {};
  };

}
