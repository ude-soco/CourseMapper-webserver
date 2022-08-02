import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  array2 = [
    {
      name: 'AWT',
      description: 'Advanced Web Techonologies',
      notification: 14,
    },
    { name: 'LA', description: 'Learning Analytics', notification: 3 },
    { name: 'IR', description: 'Information Retrieval', notification: 10 },
    { name: 'IM', description: 'Information Mining', notification: 60 },
    { name: 'RS', description: 'Recommender Systems', notification: 99 },
    {
      name: 'NEO',
      description: 'Neuroscience and Organic Computing',
      notification: 20,
    },
  ];

  constructor() {}

  ngOnInit(): void {}
}
