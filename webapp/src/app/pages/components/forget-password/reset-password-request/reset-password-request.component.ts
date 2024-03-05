import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password-request',
  templateUrl: './reset-password-request.component.html',
  styleUrls: ['./reset-password-request.component.css']
})
export class ResetPasswordRequestComponent {
  public resetLink = '/restPassword/:token'; 
  public login = '/login'; 
  constructor(private router: Router) {}

  ngOnInit(): void {
    
  }
  resendLink()
  {
    this.router.navigate(['forgetPassword'] );
  }

}
