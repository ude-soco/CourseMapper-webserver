import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-compare-charts-page',
  templateUrl: './compare-charts-page.component.html',
  styleUrls: ['./compare-charts-page.component.css']
})
export class CompareChartsPageComponent implements  OnInit{
  selectedPlatforms: string[] = [];


  ngOnInit(): void {
    this.loadSelectedPlatformsFromStorage();
  }

  constructor() {
  }

  loadSelectedPlatformsFromStorage(): void {
    const storedPlatforms = localStorage.getItem('selectedPlatforms');
    if (storedPlatforms) {
    this.selectedPlatforms = JSON.parse(storedPlatforms);
    }
  }
}
