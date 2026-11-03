import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-rec-score-match-box',
  templateUrl: './rec-score-match-box.component.html',
  styleUrls: ['./rec-score-match-box.component.css']
})
export class RecScoreMatchBoxComponent {
  @Input() raw_score: number = 0;

  // use score percentage to determine background color: green for high score, yellow for medium score, red for low score
  getScoreBackgroundColor(score: number): string {
    if (score >= 80) {
      return 'green';
    } else if (score >= 50) {
      return 'yellow';
    } else {
      return 'red';
    }
  }
}
