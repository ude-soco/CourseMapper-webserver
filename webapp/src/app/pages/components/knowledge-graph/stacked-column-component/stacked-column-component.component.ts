import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale);

@Component({
  selector: 'app-stacked-column-component',
  templateUrl: './stacked-column-component.component.html',
  styleUrls: ['./stacked-column-component.component.css']
})
export class StackedColumnComponentComponent implements AfterViewInit{
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;

  ngAfterViewInit(): void {
    new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: [''],
        datasets: [
          { data: [35], backgroundColor: '#f44336', stack: 'stack1' },
          { data: [25], backgroundColor: '#2196f3', stack: 'stack1' },
          { data: [20], backgroundColor: '#4caf50', stack: 'stack1' },
          { data: [10], backgroundColor: '#ff9800', stack: 'stack1' },
          { data: [10], backgroundColor: '#9c27b0', stack: 'stack1' }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false, stacked: true },
          y: { display: false, stacked: true }
        }
      }
    });
  }
}