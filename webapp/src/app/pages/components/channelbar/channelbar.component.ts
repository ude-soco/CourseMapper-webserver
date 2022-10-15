import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-channelbar',
  templateUrl: './channelbar.component.html',
  styleUrls: ['./channelbar.component.css'],
})
export class ChannelbarComponent implements OnInit {
  subscribed!: boolean;
  subscribeLabel!: string;
  constructor() {
    this.subscribeLabel = 'Subscribe to course';
    this.subscribed = false;
  }

  ngOnInit(): void {}

  showMenu() {
    console.log('showMenu');
  }

  subscribeToCourse(event: any) {
    this.subscribed = !this.subscribed;

    this.subscribeLabel = this.subscribed
      ? 'Subscribed'
      : 'Subscribe to course';

    console.log(event);
  }
}
