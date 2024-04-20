import { Component,OnInit } from '@angular/core';
import {Router,ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-vis-compare-page',
  templateUrl: './vis-compare-page.component.html',
  styleUrls: ['./vis-compare-page.component.css']
})
export class VisComparePageComponent implements OnInit{
  platforms = ['Coursera', 'Future Learn', 'imoox', 'OPEN vhb', 'KI campus', 'on Campus', 'OPEN HPI', 'Udacity', 'edX', 'udemy'];
  selectedPlatforms: string[] | null = []

  constructor(private router:Router) {
  }

  ngOnInit(): void {
    }



  updateSelectedPlatforms(event: any): void {
    const platform = event.target.value;
    if (event.target.checked) {
      // Add platform to selectedPlatforms if it's checked
      this.selectedPlatforms.push(platform);
    } else {
      // Remove platform from selectedPlatforms if it's unchecked
      this.selectedPlatforms = this.selectedPlatforms.filter(p => p !== platform);
    }
    this.saveSelectedPlatformsToStorage();

  }


  saveSelectedPlatformsToStorage(): void {
    localStorage.setItem('selectedPlatforms', JSON.stringify(this.selectedPlatforms));
  }


  comparePlatforms() {
    if (this.selectedPlatforms.length> 1) {
      this.router.navigate(['compare-moocs-vis']);
    }
  }


}
