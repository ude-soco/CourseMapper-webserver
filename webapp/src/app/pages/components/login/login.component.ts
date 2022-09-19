import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserServiceService } from 'src/app/Services/user-service.service';
import { StorageService } from 'src/app/Services/storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  form: any = {
    username: null,
    password: null
  };
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  constructor(private userService: UserServiceService, private storageService: StorageService,private fb: FormBuilder, private router: Router, private route: ActivatedRoute,) { }

  ngOnInit(): void {
    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
     
    }


  }
  onSubmit(): void {
    const { username, password } = this.form;

    this.userService.login(username, password).subscribe({
      // the response from backend
      next: data => {
        this.storageService.saveUser(data);

        this.isLoginFailed = false;
        this.isLoggedIn = true;
       //this.router.navigate(['/Home'], { relativeTo: this.route });
       
        //this.router.navigate(["./Home"]);
        //location.reload();
        this.router.navigate(['./home'])
        .then(() => {
          window.location.reload();
        });
        
      },
      error: err => {
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
      }
    });
  }
  reloadPage(): void {
    window.location.reload();
    this.router.navigate(["./home"]);

  }

}
