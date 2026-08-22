import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-svg-icon-vis',
  templateUrl: './svg-icon-vis.component.html',
  styleUrls: ['./svg-icon-vis.component.css']
})
export class SvgIconVisComponent {
  @Input() src: string;

}
