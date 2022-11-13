import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'filter123' })
export class FilterPipe implements PipeTransform {
  constructor() {}
  transform(notificationItems: any[], filteredString: any) {
    if (filteredString == undefined) return notificationItems;

    return notificationItems.filter(function (item) {
      return item.extraMessage
        .toLowerCase()
        .includes(filteredString.toLowerCase());
    });
  }
}
