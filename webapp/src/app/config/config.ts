import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const USER_KEY = 'coursemapper-user';

export const AUTH_API = `${environment.API_URL}/api/auth/`;

export const HTTPOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  // withCredentials: true,
};
