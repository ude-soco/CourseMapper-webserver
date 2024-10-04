import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HTTP_INTERCEPTORS,
  HttpErrorResponse,
} from '@angular/common/http';
import { throwError, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { UserServiceService } from '../services/user-service.service';
import { StorageService } from '../services/storage.service';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private userService: UserServiceService,
    public storageService: StorageService
  ) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    req = req.clone({
      withCredentials: true,
    });

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // // Skip interceptor logic for specific URLs
        // if (this.isExcludedUrl(req.url)) {
        //   //  console.log("Skipping interceptor logic for excluded URL:", req.url);
        //   return throwError(error); // Let the error propagate without redirection
        // }

        if (error.status === 401) {
          // Handle 401 Unauthorized: clear session and redirect to landing page
          console.warn('401 Unauthorized - Redirecting to landing page.');
          this.storageService.clean(); // Clear user session
          this.router.navigate(['/landingPage']); // Redirect to landing page
        }
        return throwError(error);
      })
    );
  }
  // Exclude specific URLs from 401 redirection logic
  private isExcludedUrl(url: string): boolean {
    // Example logic: Exclude /my-courses and /tags API or undefined URLs
    const isMyCourses = url.includes('/my-courses');
    const isTagsWithValidCourseId = /\/courses\/[a-zA-Z0-9]+\/tags/.test(url); // Match alphanumeric course IDs (e.g., 66a8f119b141ea5d126ea35c)
    const isInvalidCourseId = url.includes('/courses/undefined/tags');

    return isMyCourses || isTagsWithValidCourseId || isInvalidCourseId;
  }
}

export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: HttpRequestInterceptor, multi: true },
];
