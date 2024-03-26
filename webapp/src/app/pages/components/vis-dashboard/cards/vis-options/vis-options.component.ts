import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-vis-options',
  templateUrl: './vis-options.component.html',
  styleUrls: ['./vis-options.component.css']
})
export class VisOptionsComponent {
@Input() text: string


constructor() {
}


}
