import { Component } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { StorageService } from './services/storage.service';
import { UserServiceService } from './services/user-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  isLoggedIn = false;
  showAdminBoard = false;
  showModeratorBoard = false;
  username?: string;

  constructor(
    private primengConfig: PrimeNGConfig,
    private storageService: StorageService,
    private userService: UserServiceService
  ) {}

  ngOnInit() {
    this.primengConfig.ripple = true;
    this.isLoggedIn = this.storageService.isLoggedIn();
    console.log("isLoggedIn", this.isLoggedIn)
    if (this.isLoggedIn) {
      const user = this.storageService.getUser();

      this.username = user.username;
    }
    //window.location.reload();
  }

  ngAfterViewChecked(){
    this.isLoggedIn = this.storageService.isLoggedIn();
  }


  logout(): void {
    this.userService.logout().subscribe({
      next: (res) => {
        console.log(res);
        this.storageService.clean();
      },
      error: (err) => {
        console.log(err);
      },
    });

    window.location.reload();
  }
}
