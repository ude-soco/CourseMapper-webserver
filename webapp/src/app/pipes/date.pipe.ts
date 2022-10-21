import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'customDate' })
export class CustomDatePipe implements PipeTransform {
  constructor() {}
  transform(value: string) {
    if (!value) return '';
    let diffMs = new Date().getTime() - new Date(value).getTime(); // milliseconds

    let diffYears = Math.floor(diffMs / 31536000000); // years
    if (diffYears > 0) return (value = diffYears + ' month(s) ago');

    let diffMonths = Math.floor(diffMs / 2721600000); // month
    if (diffMonths > 0) return (value = diffMonths + ' month(s) ago');

    let diffWeeks = Math.floor(diffMs / 604800000); // weeks
    if (diffWeeks > 0) return (value = diffWeeks + ' week(s) ago');

    let diffDays = Math.floor(diffMs / 86400000); // days
    if (diffDays > 0) return (value = diffDays + ' day(s) ago');

    let diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
    if (diffHrs > 0) return (value = diffHrs + ' hour(s) ago');

    let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
    if (diffMins > 0) return (value = diffMins + ' minute(s) ago');

    if (diffMs > 0) return (value = 'few seconds ago');

    return value;
  }
}
