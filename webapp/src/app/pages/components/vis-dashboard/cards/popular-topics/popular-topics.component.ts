import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-popular-topics',
  templateUrl: './popular-topics.component.html',
  styleUrls: ['./popular-topics.component.css']
})
export class PopularTopicsComponent {
  @Input() concept: string;
}
