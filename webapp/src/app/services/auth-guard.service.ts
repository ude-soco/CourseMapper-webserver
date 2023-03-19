import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { USER_KEY } from '../config/config';
import { User } from '../models/User';
import { State } from '../state/app.state';
import * as ApplicationActions from 'src/app/state/app.actions'

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate {
  constructor(private router: Router, private store: Store<State>) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (localStorage.getItem(USER_KEY)) {
      const userJson = localStorage.getItem(USER_KEY);
      const user = userJson ? JSON.parse(userJson) as User : null;
      this.store.dispatch(ApplicationActions.setLoggedInUser({loggedInUser: user}));
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
