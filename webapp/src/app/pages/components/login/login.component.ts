import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { Router } from '@angular/router';
import { UserServiceService } from 'src/app/Services/user-service.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  errorMessage = '';
  loginForm!: FormGroup;
  registerSucess:boolean = false;
  constructor(private userService: UserServiceService,private fb: FormBuilder, private router: Router) { }

  ngOnInit(): void {

    
    this.loginForm = new FormGroup({
    password: new FormControl('', [
    Validators.required,
    Validators.maxLength(20),
    Validators.minLength(6),
  ]),
    
    username: new FormControl('', [
      Validators.required,
      Validators.maxLength(20),
      Validators.minLength(6),
    ]),
    
  });
}
async onSubmit() {
  for (const i in this.loginForm.controls) {
    if (this.loginForm.controls.hasOwnProperty(i)) {
      this.loginForm.controls[i].markAsDirty();
      this.loginForm.controls[i].updateValueAndValidity();
      console.log('step1');
    }
  }

 
  try {
    await this.userService.login(this.loginForm.controls['username'].value, this.loginForm.controls['password'].value);
    this.router.navigate(['/']);
    this.registerSucess=true;
  } catch (err: any) {
    this.errorMessage = err.error.error;
  }
}
reloadPage(): void {
  window.location.reload();
}

goToRegister() {
  this.router.navigate(['signup']);
}
}
