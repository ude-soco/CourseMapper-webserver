import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UserServiceService } from 'src/app/services/user-service.service';

@Component({
  selector: 'app-request-email-validation',
  templateUrl: './request-email-validation.component.html',
  styleUrls: ['./request-email-validation.component.css']
})
export class RequestEmailValidationComponent {
  token!: string;
  requestFailed = false;
  errorMessage = '';
  constructor(     private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private router: Router, private userService: UserServiceService, private messageService: MessageService){

  }


  ngOnInit() {

    this.activatedRoute.params.subscribe(value=>
      {
    this.token=value['token'];
    console.log(" this.token",  this.token)
    
      })
      this.userService
      .emailVerification(this.token)
      .subscribe({
        next: (data) => {
          console.log( data.message,)
          if (data.message=='Email verified successfully') {
            this.requestFailed = false;
            this.showInfo('Email verified successfully ');
            this.router.navigate(['login'] );
          }
    
        },
        error: (err) => {
          this.errorMessage = err.error.message;
          this.requestFailed = true;
          console.log("this.errorMessage", this.errorMessage)
          if(this.errorMessage== "Invalid or already verified")
          {
            this.showError('Invalid or already verified');
            this.router.navigate(['login'] );
          }
            else if (this.errorMessage== "Reset link is expired!")
            {
              this.showError('Reset link is expired!');
              this.router.navigate(['signup'] );
            }
        },
      });
    
    
    }
    showInfo(msg) {
      this.messageService.add({
        severity: 'info',
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
