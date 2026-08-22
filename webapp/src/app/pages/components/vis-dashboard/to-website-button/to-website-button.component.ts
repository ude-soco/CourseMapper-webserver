import { Component,Input } from '@angular/core';

@Component({
  selector: 'app-to-website-button',
  templateUrl: './to-website-button.component.html',
  styleUrls: ['./to-website-button.component.css']
})
export class ToWebsiteButtonComponent {
  @Input() link: string;

  constructor() { }

}
