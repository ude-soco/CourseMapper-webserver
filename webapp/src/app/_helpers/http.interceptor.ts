import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HTTP_INTERCEPTORS, HttpErrorResponse  } from '@angular/common/http';
import { throwError , Observable } from 'rxjs';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { UserServiceService } from '../services/user-service.service';
import { StorageService } from '../services/storage.service';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(private router: Router, private userService: UserServiceService,public storageService: StorageService,) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    req = req.clone({
      withCredentials: true,
    });

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // const url = req.url;  // Get the current request URL
        // console.log("url",url)
        if (error.status === 401 ) {
    // Log the user out automatically
    this.storageService.clean();

    // Navigate to the landing page
    this.router.navigate(['/landingPage']);
          // Redirect to the login page
          // this.userService.logout(); // Clear auth state in the service
          // this.router.navigate(['/landingPage']);
          // this.router.navigate(['/login']);



          
        }
        return throwError(error);
      })
    );;

  }
    // Exclude specific URLs from 401 redirection logic
    private isExcludedUrl(url: string): boolean {
      if (url.includes('/my-courses')) {
        return true;
      }
    
      // Exclude any URL with "undefined" in the course ID part of the URL
       // Check if the URL matches the pattern for /courses/{courseId}/tags
  const courseTagsPattern = /\/courses\/\w+\/tags/; // Matches both "undefined" and valid IDs
  if (courseTagsPattern.test(url)) {
    return true; // Exclude all URLs that match this pattern
  }
    
      return false; // Other URLs are not excluded
    }
}

export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: HttpRequestInterceptor, multi: true },
];