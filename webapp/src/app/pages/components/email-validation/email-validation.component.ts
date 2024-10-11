import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UserServiceService } from 'src/app/services/user-service.service';

@Component({
  selector: 'app-email-validation',
  templateUrl: './email-validation.component.html',
  styleUrls: ['./email-validation.component.css'],
})
export class EmailValidationComponent {
  public login = '/login';
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserServiceService,
    private messageService: MessageService
  ) {}
  token: string | null = null;
  requestFailed = false;
  errorMessage = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'];
    });
  }
  resendVerificationEmail() {
    if (this.token) {
      // Logic to resend the verification email with the token
      this.userService.resendEmailVerification(this.token).subscribe({
        next: (data) => {
          console.log(data.message);
          if (
            data.message == 'A verification link has been sent to your email.'
          ) {
            this.requestFailed = false;
            this.showInfo('A verification link has been sent to your email. ');
          } else if (data.message == 'Email is already verified.') {
            this.requestFailed = false;
            this.showError('Email is already verified. ');
          }
        },
        error: (err) => {
          this.errorMessage = err.error;
          this.requestFailed = true;
          console.log('this.errorMessage', this.errorMessage);
          if (
            this.errorMessage ==
            'Failed to send verification email. Please try again later.'
          ) {
            this.showError(
              'Failed to send verification email. Please try again later.'
            );
          } 
        },
      });
    }
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
