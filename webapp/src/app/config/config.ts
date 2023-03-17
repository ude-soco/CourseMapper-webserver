import { HttpHeaders } from '@angular/common/http';
import { environment, environment_2 } from '../../environments/environment';

export const USER_KEY = 'coursemapper-user';

export const AUTH_API = `${environment.apiUrl}/api/auth/`;
export const AUTH_API_2 = `${environment_2.apiUrl}/auth/`;

export const HTTPOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  // withCredentials: true,
};
