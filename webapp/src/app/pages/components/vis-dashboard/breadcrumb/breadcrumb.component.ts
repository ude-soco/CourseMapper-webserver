import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, } from 'rxjs/operators';

interface BreadcrumbItem {
  label: string;
  url: string;
}


@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: { label: string; url: string }[] = [];

  constructor(private router: Router, private route: ActivatedRoute) {

  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.generateBreadcrumbs(this.route.root);
    });
  }

  private generateBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: { label: string; url: string }[] = []): void {
    const routeUrl = route.snapshot.url.map(segment => segment.path).join('/');
    if (routeUrl) {
      url += `/${routeUrl}`;
    }

    const breadcrumbLabel = route.snapshot.data['breadcrumb'];
    if (breadcrumbLabel) {
      breadcrumbs.push({ label: breadcrumbLabel, url });
    }

    if (route.firstChild) {
      this.generateBreadcrumbs(route.firstChild, url, breadcrumbs);
    } else {
      this.breadcrumbs = breadcrumbs;
    }
  }

}
