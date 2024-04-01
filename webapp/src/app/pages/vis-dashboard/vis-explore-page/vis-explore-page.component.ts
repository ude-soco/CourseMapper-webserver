import { Component } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-vis-explore-page',
  templateUrl: './vis-explore-page.component.html',
  styleUrls: ['./vis-explore-page.component.css']
})
export class VisExplorePageComponent {
  platforms = ['Coursera', 'Future Learn', 'imoox', 'OPEN vhb', 'KI campus', 'on Campus', 'OPEN HPI', 'Udacity', 'edX', 'udemy'];
  selectedPlatform: string | null = ''
  isExploreButtonDisabled : boolean = true


  constructor(private router:Router) {
  }


  exploreCourse() {
    if (this.selectedPlatform) {
      this.router.navigate(['explore-moocs', this.selectedPlatform]);
    }
  }

  updateButtonState() {
    this.isExploreButtonDisabled = !this.selectedPlatform;
  }
}
