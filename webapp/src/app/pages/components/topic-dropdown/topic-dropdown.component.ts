import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-topic-dropdown',
  templateUrl: './topic-dropdown.component.html',
  styleUrls: ['./topic-dropdown.component.css'],
})
export class TopicDropdownComponent implements OnInit {
  constructor() {}

  courseData = [
    {
      topic: 'Frontend Techonologies',
      channels: [
        { id: 1, name: 'Angular' },
        { id: 2, name: 'React' },
        { id: 3, name: 'Vue' },
      ],
    },
  ];

  ngOnInit(): void {}

  showMenu() {
    console.log('showMenu');
  }
}
