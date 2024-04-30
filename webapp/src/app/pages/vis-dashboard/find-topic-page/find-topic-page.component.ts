import { Component , OnInit} from '@angular/core';
import {Router} from "@angular/router";
@Component({
  selector: 'app-find-topic-page',
  templateUrl: './find-topic-page.component.html',
  styleUrls: ['./find-topic-page.component.css']
})
export class FindTopicPageComponent implements OnInit{
  searchQuery: string = ''
  hasInput: boolean = false

  constructor(private router: Router) {
  }

  ngOnInit(): void {
  }

  search(query:string) {
    this.router.navigate(['find-moocs-by-topic-main'], { queryParams: { query: query } });
  }


  onTextInput(event: string) {
    if (event.length > 0) {
      this.hasInput = true
    } else {
      this.hasInput = false
    }
  }

}
