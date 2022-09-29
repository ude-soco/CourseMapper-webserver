import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentUser: {} | undefined;
  isloggedin: boolean =false;
  username?: string;

  constructor(private storageService: StorageService, private router: Router) { }

  ngOnInit(): void {
    //this.router.navigate(['Home'])
    //this.reloadPage();
    //setTimeout(() => { this.ngOnInit() }, 1000 * 10)
   // this.reloadCurrentRoute();
   //
    this.currentUser = this.storageService.getUser();
    this.isloggedin = this.storageService.isLoggedIn();

    if(this.isloggedin == false)
    { this.router.navigate(['login'])}
    else{
      const user = this.storageService.getUser();


      this.username = user.username;
      //this.router.navigate(['/Home']);
      //this.reloadComponent();
    }
    //window.location.reload();
  }
/*  reloadComponent() {
    let currentUrl = this.router.url;
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
        this.router.onSameUrlNavigation = 'reload';
        this.router.navigate([currentUrl]);
    }*/



}
