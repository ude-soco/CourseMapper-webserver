import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IntervalService {
  constructor() {}

  private intervalId: any;

  startInterval(callback: () => void, intervalTime: number): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      return;
    }
    this.intervalId = window.setInterval(callback, intervalTime);
  }

  stopInterval(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
  }
}
