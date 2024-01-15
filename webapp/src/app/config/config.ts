import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const USER_KEY = 'coursemapper-user';

export const AUTH_API = `${environment.API_URL}/auth/`;
export const AUTH_API_2 = `${environment.API_URL}/auth/`;

export const HTTPOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  withCredentials: true,
};

// export const HTTPPythonHeader ={
//   headers: new HttpHeaders({"Authorization": `Bearer ${this.jwt}`})
// }
