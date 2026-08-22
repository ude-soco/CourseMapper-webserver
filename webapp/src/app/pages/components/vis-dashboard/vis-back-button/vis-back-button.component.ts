import { Component } from '@angular/core';
import { Location } from '@angular/common';


@Component({
  selector: 'app-vis-back-button',
  templateUrl: './vis-back-button.component.html',
  styleUrls: ['./vis-back-button.component.css']
})
export class VisBackButtonComponent {
  constructor(private location: Location) { }

  goBack(): void {
    this.location.back();
  }

}
