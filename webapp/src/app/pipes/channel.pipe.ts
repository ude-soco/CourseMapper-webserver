import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'channelPipe' })
export class CustomChannelPipe implements PipeTransform {
  constructor() {}
  transform(channelId: any) {
    console.log('pipe', channelId);
  }
}
